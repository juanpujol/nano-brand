-- Leads Custom Fields: Flexible field definitions and values for leads
-- This migration adds support for custom fields on leads

-- Create leads custom field definitions table (schema definition)
CREATE TABLE leads_custom_fields_definitions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'text' CHECK (type IN ('text', 'number', 'date', 'boolean')),
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  UNIQUE(organization_id, field_key),
  CONSTRAINT valid_field_key CHECK (field_key ~ '^[a-z][a-z0-9_]*$')
);

-- Create custom field values table (actual data)
CREATE TABLE leads_custom_fields (
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  PRIMARY KEY (lead_id, organization_id, field_key)
);

-- Create indexes for performance
CREATE INDEX idx_leads_custom_fields_definitions_org ON leads_custom_fields_definitions(organization_id);
CREATE INDEX idx_leads_custom_fields_definitions_key ON leads_custom_fields_definitions(field_key);
CREATE INDEX idx_custom_fields_lead ON leads_custom_fields(lead_id);
CREATE INDEX idx_custom_fields_key ON leads_custom_fields(field_key);
CREATE INDEX idx_custom_fields_org ON leads_custom_fields(organization_id);
CREATE INDEX idx_custom_fields_org_key ON leads_custom_fields(organization_id, field_key);

-- Enable Row Level Security
ALTER TABLE leads_custom_fields_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads_custom_fields ENABLE ROW LEVEL SECURITY;

-- Create triggers for updated_at on definitions table
CREATE TRIGGER leads_custom_fields_definitions_updated_at
  BEFORE UPDATE ON leads_custom_fields_definitions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RLS Policies for leads_custom_fields_definitions table

-- SELECT policy: Members can view field definitions in organizations they belong to
CREATE POLICY "Members can view custom field definitions" ON leads_custom_fields_definitions
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM get_user_organizations((select auth.uid())))
  );

-- INSERT policy: Only admins can create field definitions
CREATE POLICY "Only admins can create custom field definitions" ON leads_custom_fields_definitions
  FOR INSERT WITH CHECK (
    is_org_admin((select auth.uid()), leads_custom_fields_definitions.organization_id)
  );

-- UPDATE policy: Only admins can update field definitions
CREATE POLICY "Only admins can update custom field definitions" ON leads_custom_fields_definitions
  FOR UPDATE USING (
    is_org_admin((select auth.uid()), leads_custom_fields_definitions.organization_id)
  );

-- DELETE policy: Only admins can delete field definitions
CREATE POLICY "Only admins can delete custom field definitions" ON leads_custom_fields_definitions
  FOR DELETE USING (
    is_org_admin((select auth.uid()), leads_custom_fields_definitions.organization_id)
  );

-- RLS Policies for leads_custom_fields table

-- SELECT policy: Members can view custom field values in organizations they belong to
CREATE POLICY "Members can view custom field values" ON leads_custom_fields
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM get_user_organizations((select auth.uid())))
  );

-- INSERT policy: Only admins can create custom field values
CREATE POLICY "Only admins can create custom field values" ON leads_custom_fields
  FOR INSERT WITH CHECK (
    is_org_admin((select auth.uid()), leads_custom_fields.organization_id)
  );

-- UPDATE policy: Only admins can update custom field values
CREATE POLICY "Only admins can update custom field values" ON leads_custom_fields
  FOR UPDATE USING (
    is_org_admin((select auth.uid()), leads_custom_fields.organization_id)
  );

-- DELETE policy: Only admins can delete custom field values
CREATE POLICY "Only admins can delete custom field values" ON leads_custom_fields
  FOR DELETE USING (
    is_org_admin((select auth.uid()), leads_custom_fields.organization_id)
  );

-- Create a view for easy querying of custom fields with count
CREATE OR REPLACE VIEW leads_custom_fields_with_count AS
SELECT 
  cfd.id,
  cfd.organization_id,
  cfd.field_key,
  cfd.label,
  cfd.description,
  cfd.type,
  cfd.is_required,
  cfd.created_at,
  cfd.updated_at,
  COUNT(*) FILTER (WHERE cf.lead_id IS NOT NULL) as usage_count
FROM leads_custom_fields_definitions cfd
LEFT JOIN leads_custom_fields cf ON cfd.field_key = cf.field_key AND cfd.organization_id = cf.organization_id
GROUP BY 
  cfd.id,
  cfd.organization_id,
  cfd.field_key,
  cfd.label,
  cfd.description,
  cfd.type,
  cfd.is_required,
  cfd.created_at,
  cfd.updated_at;

-- Business Logic Enhancement: Function to validate field values based on type
CREATE OR REPLACE FUNCTION validate_custom_field_value()
RETURNS TRIGGER AS $$
DECLARE
  field_type TEXT;
  field_required BOOLEAN;
BEGIN
  -- Get field definition
  SELECT type, is_required INTO field_type, field_required
  FROM leads_custom_fields_definitions 
  WHERE organization_id = NEW.organization_id 
    AND field_key = NEW.field_key;
    
  -- Check if field definition exists
  IF field_type IS NULL THEN
    RAISE EXCEPTION 'Custom field "%" does not exist for this organization', NEW.field_key;
  END IF;
  
  -- Check required field validation
  IF field_required AND (NEW.field_value IS NULL OR TRIM(NEW.field_value) = '') THEN
    RAISE EXCEPTION 'Field "%" is required and cannot be empty', NEW.field_key;
  END IF;
  
  -- Type-specific validation
  IF NEW.field_value IS NOT NULL AND TRIM(NEW.field_value) != '' THEN
    CASE field_type
      WHEN 'number' THEN
        -- Validate numeric values
        IF NEW.field_value !~ '^-?\d*\.?\d+$' THEN
          RAISE EXCEPTION 'Field "%" must be a valid number, got: "%"', NEW.field_key, NEW.field_value;
        END IF;
      WHEN 'date' THEN
        -- Validate date format (ISO 8601) with graceful degradation
        IF NEW.field_value !~ '^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})?)?$' THEN
          -- Flag invalid dates but preserve data for review
          NEW.field_value = 'INVALID_DATE: ' || NEW.field_value;
        END IF;
      WHEN 'boolean' THEN
        -- Validate boolean values
        IF LOWER(NEW.field_value) NOT IN ('true', 'false', '1', '0', 'yes', 'no', 'sim', 'não') THEN
          RAISE EXCEPTION 'Field "%" must be a valid boolean (true/false, 1/0, yes/no, sim/não), got: "%"', NEW.field_key, NEW.field_value;
        END IF;
        -- Normalize boolean values to true/false
        IF LOWER(NEW.field_value) IN ('1', 'yes', 'sim') THEN
          NEW.field_value = 'true';
        ELSIF LOWER(NEW.field_value) IN ('0', 'no', 'não') THEN
          NEW.field_value = 'false';
        END IF;
      ELSE
        -- 'text' type and any other type allows any value, no validation needed
        NULL;
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for field value validation
CREATE TRIGGER validate_custom_field_value_trigger
  BEFORE INSERT OR UPDATE ON leads_custom_fields
  FOR EACH ROW EXECUTE FUNCTION validate_custom_field_value();