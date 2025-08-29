-- Segments: Flexible lead segmentation system
-- This migration adds segments feature for targeted lead management

-- Create segments table
CREATE TABLE segments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rule_json JSONB NOT NULL, -- Rule engine configuration
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_segments_organization ON segments(organization_id);
CREATE INDEX idx_segments_name ON segments(organization_id, name);
CREATE INDEX idx_segments_rule_json ON segments USING gin(rule_json);

-- Enable Row Level Security
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER segments_updated_at
  BEFORE UPDATE ON segments
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RLS Policies for segments table

-- SELECT policy: All organization members can view segments
CREATE POLICY "Members can view segments" ON segments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM memberships
      WHERE profile_id = (select auth.uid())
    )
  );

-- INSERT policy: Only admins can create segments
CREATE POLICY "Only admins can create segments" ON segments
  FOR INSERT WITH CHECK (
    is_org_admin((select auth.uid()), segments.organization_id)
  );

-- UPDATE policy: Only admins can update segments
CREATE POLICY "Only admins can update segments" ON segments
  FOR UPDATE USING (
    is_org_admin((select auth.uid()), segments.organization_id)
  );

-- DELETE policy: Only admins can delete segments
CREATE POLICY "Only admins can delete segments" ON segments
  FOR DELETE USING (
    is_org_admin((select auth.uid()), segments.organization_id)
  );

-- Business Logic Enhancement: Function to validate segment rule structure
CREATE OR REPLACE FUNCTION validate_segment_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- Basic JSON structure validation
  IF NEW.rule_json IS NULL THEN
    RAISE EXCEPTION 'Segment rules cannot be null';
  END IF;

  -- Check if rule_json has required structure
  IF NOT (NEW.rule_json ? 'combinator' OR NEW.rule_json ? 'rules') THEN
    RAISE EXCEPTION 'Segment rules must contain either combinator or rules';
  END IF;

  -- Validate combinator if present
  IF NEW.rule_json ? 'combinator' AND
     NEW.rule_json->>'combinator' NOT IN ('and', 'or') THEN
    RAISE EXCEPTION 'Invalid combinator. Must be "and" or "or"';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for segment rule validation
CREATE TRIGGER validate_segment_rules_trigger
  BEFORE INSERT OR UPDATE ON segments
  FOR EACH ROW EXECUTE FUNCTION validate_segment_rules();