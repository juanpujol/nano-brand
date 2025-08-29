-- Leads: Lead and Conversion Management System
-- This migration sets up lead tracking and conversion management

-- Create leads table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Core Contact Info
  name TEXT,
  email TEXT,
  secondary_email TEXT,
  phone TEXT,
  secondary_phone TEXT,
  company TEXT,
  job_title TEXT,

  -- Lead Source & Attribution  
  import_method TEXT DEFAULT 'manual',
  external_id TEXT,
  external_source TEXT, -- 'rd_station', 'hubspot', 'manual', etc.

  -- Simple Scoring
  fit_score TEXT CHECK (fit_score IN ('A', 'B', 'C', 'D', 'F', 'a', 'b', 'c', 'd', 'f')),
  interest INTEGER DEFAULT 0,

  -- Conversion Summary (computed via triggers)
  total_conversions INTEGER DEFAULT 0,
  first_conversion_date TIMESTAMP WITH TIME ZONE,
  last_conversion_date TIMESTAMP WITH TIME ZONE,

  -- First Conversion Attribution
  first_conversion_utm_source TEXT,
  first_conversion_utm_medium TEXT,
  first_conversion_utm_campaign TEXT,
  first_conversion_utm_content TEXT,
  first_conversion_utm_term TEXT,

  -- Last Conversion Attribution
  last_conversion_utm_source TEXT,
  last_conversion_utm_medium TEXT,
  last_conversion_utm_campaign TEXT,
  last_conversion_utm_content TEXT,
  last_conversion_utm_term TEXT,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  CONSTRAINT leads_contact_required CHECK (email IS NOT NULL OR phone IS NOT NULL)
);

-- Create conversions table
CREATE TABLE conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,

  -- Conversion Identity
  name TEXT NOT NULL,
  identifier TEXT, -- Keep for reference but not for uniqueness
  external_id TEXT,
  external_source TEXT, -- 'rd_station', 'hubspot', 'manual', etc.

  -- Conversion Details  
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  value NUMERIC,

  -- Traffic Attribution
  source TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  utm_channel TEXT,

  -- Technical Details
  conversion_url TEXT,
  conversion_domain TEXT,
  device TEXT,
  raw_payload JSONB,

  -- Idempotency Key (computed via trigger)
  idempotency_hash TEXT NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- True uniqueness constraint
  UNIQUE(idempotency_hash)
);

-- Create indexes for performance
CREATE INDEX idx_leads_organization_id ON leads(organization_id);
CREATE INDEX idx_leads_email ON leads(email) WHERE email IS NOT NULL;
CREATE INDEX idx_leads_phone ON leads(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_fit_score ON leads(fit_score) WHERE fit_score IS NOT NULL;
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);
CREATE INDEX idx_leads_external ON leads(external_source, external_id) WHERE external_id IS NOT NULL;

CREATE INDEX idx_conversions_organization_id ON conversions(organization_id);
CREATE INDEX idx_conversions_lead_id ON conversions(lead_id);
CREATE INDEX idx_conversions_date ON conversions(date);
CREATE INDEX idx_conversions_name ON conversions(name);
CREATE INDEX idx_conversions_idempotency_hash ON conversions(idempotency_hash);
CREATE INDEX idx_conversions_lead_date ON conversions(lead_id, date);
CREATE INDEX idx_conversions_external ON conversions(external_source, external_id) WHERE external_id IS NOT NULL;
CREATE INDEX idx_conversions_lead_date_external ON conversions(lead_id, date, external_source, external_id);

-- Add unique constraint to prevent duplicate imports from same source
CREATE UNIQUE INDEX idx_leads_external_unique ON leads(organization_id, external_source, external_id)
  WHERE external_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- Create triggers for updated_at
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Optimized function to generate conversion idempotency hash
CREATE OR REPLACE FUNCTION generate_conversion_idempotency_hash()
RETURNS TRIGGER AS $$
BEGIN
  -- Enhanced: Include payload data to distinguish between different conversion states
  NEW.idempotency_hash := encode(
    sha256(
      (NEW.organization_id || '|' ||
       NEW.lead_id::text || '|' ||
       NEW.name || '|' ||
       COALESCE(NEW.identifier, '') || '|' ||
       (EXTRACT(epoch FROM NEW.date)::bigint / 60)::text || '|' ||  -- Faster than date_trunc
       COALESCE(NEW.raw_payload::text, '{}'))::bytea  -- Include payload to differentiate conversion states
    ),
    'hex'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = '';  -- Security optimization

-- Create trigger to generate idempotency hash on insert/update
CREATE TRIGGER generate_conversion_idempotency_hash
  BEFORE INSERT OR UPDATE ON conversions
  FOR EACH ROW EXECUTE PROCEDURE generate_conversion_idempotency_hash();

-- Production-safe function to update lead conversion summary
-- Handles edge cases gracefully for bulk operations and seed data
-- Enhanced with UTM attribution logic that prioritizes valid data over corrupted data
CREATE OR REPLACE FUNCTION update_lead_conversion_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_lead_id UUID;
  conversion_stats RECORD;
  first_conversion_utm RECORD;
  last_conversion_utm RECORD;
BEGIN
  
  -- Guard clause: if target_lead_id is null, something is wrong
  IF target_lead_id IS NULL THEN
    RAISE WARNING 'update_lead_conversion_summary called with NULL lead_id';
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Determine lead ID from trigger context
  IF TG_OP = 'DELETE' THEN
    target_lead_id := OLD.lead_id;
  ELSE
    target_lead_id := NEW.lead_id;
  END IF;
  
  -- Get conversion count and date ranges
  SELECT 
    COUNT(*) as total,
    MIN(date) as first_date,
    MAX(date) as last_date
  INTO conversion_stats
  FROM conversions
  WHERE lead_id = target_lead_id;
  
  -- Process UTM attribution if conversions exist
  IF conversion_stats.total > 0 THEN
    -- Get first conversion UTM data (unchanged)
    SELECT 
      COALESCE(utm_source, '') as utm_source, 
      COALESCE(utm_medium, '') as utm_medium, 
      COALESCE(utm_campaign, '') as utm_campaign,
      COALESCE(utm_content, '') as utm_content,
      COALESCE(utm_term, '') as utm_term
    INTO first_conversion_utm
    FROM conversions
    WHERE lead_id = target_lead_id
    ORDER BY date ASC
    LIMIT 1;
    
    -- ENHANCED: Get last conversion UTM data - prioritize valid data over chronological order
    SELECT 
      COALESCE(utm_source, '') as utm_source, 
      COALESCE(utm_medium, '') as utm_medium, 
      COALESCE(utm_campaign, '') as utm_campaign,
      COALESCE(utm_content, '') as utm_content,
      COALESCE(utm_term, '') as utm_term
    INTO last_conversion_utm
    FROM conversions
    WHERE lead_id = target_lead_id
      -- PRIORITY 1: Exclude corrupted UTM data (unknown/empty values)
      AND utm_medium IS NOT NULL 
      AND utm_medium != '' 
      AND utm_medium != 'unknown'
      AND utm_medium != '(not set)'
    ORDER BY date DESC  -- Still prefer recent valid data
    LIMIT 1;
    
    -- FALLBACK: If no valid UTM data found, use chronologically last conversion
    IF last_conversion_utm.utm_medium IS NULL OR last_conversion_utm.utm_medium = '' THEN
      SELECT 
        COALESCE(utm_source, '') as utm_source, 
        COALESCE(utm_medium, '') as utm_medium, 
        COALESCE(utm_campaign, '') as utm_campaign,
        COALESCE(utm_content, '') as utm_content,
        COALESCE(utm_term, '') as utm_term
      INTO last_conversion_utm
      FROM conversions
      WHERE lead_id = target_lead_id
      ORDER BY date DESC
      LIMIT 1;
    END IF;
    
  ELSE
    -- No conversions, set defaults
    SELECT NULL as utm_source, NULL as utm_medium, NULL as utm_campaign, NULL as utm_content, NULL as utm_term
    INTO first_conversion_utm;
    SELECT NULL as utm_source, NULL as utm_medium, NULL as utm_campaign, NULL as utm_content, NULL as utm_term
    INTO last_conversion_utm;
  END IF;
  
  -- Update the lead with all computed values
  UPDATE leads SET
    total_conversions = COALESCE(conversion_stats.total, 0),
    first_conversion_date = conversion_stats.first_date,
    last_conversion_date = conversion_stats.last_date,
    -- Update first conversion UTM data (only if not already set)
    first_conversion_utm_source = COALESCE(leads.first_conversion_utm_source, first_conversion_utm.utm_source),
    first_conversion_utm_medium = COALESCE(leads.first_conversion_utm_medium, first_conversion_utm.utm_medium),
    first_conversion_utm_campaign = COALESCE(leads.first_conversion_utm_campaign, first_conversion_utm.utm_campaign),
    first_conversion_utm_content = COALESCE(leads.first_conversion_utm_content, first_conversion_utm.utm_content),
    first_conversion_utm_term = COALESCE(leads.first_conversion_utm_term, first_conversion_utm.utm_term),
    -- Update last conversion UTM data (always overwrite with latest valid data)
    last_conversion_utm_source = last_conversion_utm.utm_source,
    last_conversion_utm_medium = last_conversion_utm.utm_medium,
    last_conversion_utm_campaign = last_conversion_utm.utm_campaign,
    last_conversion_utm_content = last_conversion_utm.utm_content,
    last_conversion_utm_term = last_conversion_utm.utm_term
  WHERE id = target_lead_id;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers to automatically update lead conversion summaries
CREATE TRIGGER update_lead_summary_on_conversion_insert
  AFTER INSERT ON conversions
  FOR EACH ROW EXECUTE PROCEDURE update_lead_conversion_summary();


CREATE TRIGGER update_lead_summary_on_conversion_delete
  AFTER DELETE ON conversions
  FOR EACH ROW EXECUTE PROCEDURE update_lead_conversion_summary();

-- RLS Policies for leads table

-- SELECT policy: Members can view leads in organizations they belong to
CREATE POLICY "Members can view leads" ON leads
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships 
      WHERE profile_id = (select auth.uid())
    )
  );

-- INSERT policy: Members can create leads in organizations they belong to
CREATE POLICY "Members can create leads" ON leads
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM memberships 
      WHERE profile_id = (select auth.uid())
    )
  );

-- UPDATE policy: Members can update leads in organizations they belong to
CREATE POLICY "Members can update leads" ON leads
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM memberships 
      WHERE profile_id = (select auth.uid())
    )
  );

-- DELETE policy: Only admins can delete leads
CREATE POLICY "Only admins can delete leads" ON leads
  FOR DELETE USING (
    is_org_admin((select auth.uid()), leads.organization_id)
  );

-- RLS Policies for conversions table
-- Conversions are immutable, so only SELECT policy is needed

-- SELECT policy: Members can view conversions in organizations they belong to
CREATE POLICY "Members can view conversions" ON conversions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships 
      WHERE profile_id = (select auth.uid())
    )
  );