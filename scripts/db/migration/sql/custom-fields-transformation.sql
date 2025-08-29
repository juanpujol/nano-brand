-- Custom Fields Data Transformation
-- Handles the large volume of custom field values (165K+ records)
-- This is separated for performance and memory management

-- Drop existing view if it exists
DROP VIEW IF EXISTS leads_custom_fields_transformed;

-- ============================================================================
-- CUSTOM FIELDS VALUES TRANSFORMATION
-- ============================================================================
-- NOTE: This handles a very large dataset (165,249 records in analysis)
-- The migration runner should process this in batches for performance

CREATE VIEW leads_custom_fields_transformed AS
SELECT
  cf.lead_id,
  $target_org_id as organization_id,
  cf.field_key,
  cf.field_value,
  now() as created_at
FROM leads_custom_fields cf
JOIN leads l ON cf.lead_id = l.id
WHERE cf.company_id = $source_company_id
  AND l.company_id = $source_company_id -- Ensure lead belongs to same company
  AND cf.field_key IS NOT NULL
  AND trim(cf.field_key) != ''
  -- Optional: filter out empty values to reduce dataset size
  AND cf.field_value IS NOT NULL
  AND trim(cf.field_value) != '';

-- Helper view to get custom fields count for progress tracking
CREATE VIEW custom_fields_stats AS
SELECT
  'total_custom_field_values' as stat_name,
  count(*) as stat_value
FROM leads_custom_fields cf
JOIN leads l ON cf.lead_id = l.id
WHERE cf.company_id = $source_company_id
  AND l.company_id = $source_company_id
UNION ALL
SELECT
  'unique_field_keys' as stat_name,
  count(DISTINCT cf.field_key) as stat_value
FROM leads_custom_fields cf  
JOIN leads l ON cf.lead_id = l.id
WHERE cf.company_id = $source_company_id
  AND l.company_id = $source_company_id
UNION ALL
SELECT
  'leads_with_custom_fields' as stat_name,
  count(DISTINCT cf.lead_id) as stat_value
FROM leads_custom_fields cf
JOIN leads l ON cf.lead_id = l.id  
WHERE cf.company_id = $source_company_id
  AND l.company_id = $source_company_id;