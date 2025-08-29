-- Cleanup SQL for Migration Views
-- Removes all transformation views to ensure clean state between runs

-- Drop transformation views
DROP VIEW IF EXISTS organizations_transformed CASCADE;
DROP VIEW IF EXISTS leads_custom_fields_definitions_transformed CASCADE;
DROP VIEW IF EXISTS leads_transformed CASCADE;
DROP VIEW IF EXISTS conversions_transformed CASCADE;
DROP VIEW IF EXISTS segments_transformed CASCADE;
DROP VIEW IF EXISTS leads_custom_fields_transformed CASCADE;
DROP VIEW IF EXISTS migration_validation CASCADE;
DROP VIEW IF EXISTS custom_fields_stats CASCADE;

-- Note: Using CASCADE to handle any dependent views
-- This ensures clean state for repeated migration runs