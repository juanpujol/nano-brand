-- Segments Functions: Complex business logic for lead segmentation
-- This migration adds the complex functions for segment lead counting

-- Helper function to parse JSON paths correctly (like reference implementation)
CREATE OR REPLACE FUNCTION parse_json_path(path TEXT) 
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
BEGIN
  -- Convert "custom_fields.cf_funil" to array format for PostgreSQL JSON operations
  RETURN string_to_array(path, '.');
END;
$$;

-- ENHANCED function to count leads matching segment rules with proper field group architecture
CREATE OR REPLACE FUNCTION count_leads_by_segment_rules(
  p_organization_id TEXT,
  p_rule_json JSONB,
  p_time_filter_type TEXT DEFAULT 'lead.createdAt',
  p_period_start DATE DEFAULT NULL,
  p_period_end DATE DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sql TEXT;
  v_where_conditions TEXT := '';
  v_joins TEXT := '';
  v_needs_conversion_join BOOLEAN := FALSE;
  v_needs_custom_fields_join BOOLEAN := FALSE;
  v_count BIGINT;
  v_business_rules JSONB;  -- Business rules without periodFilter
  v_main_conditions TEXT[];
  v_group_condition TEXT;
  v_rule_condition TEXT;
  v_combinator TEXT;
BEGIN
  -- STEP 1: Extract business rules (remove periodFilter if it exists)
  v_business_rules := p_rule_json;
  IF v_business_rules ? 'periodFilter' THEN
    v_business_rules := v_business_rules - 'periodFilter';
  END IF;

  -- STEP 2: Check if we need conversion JOIN based on rules or time filter type
  IF p_time_filter_type IN ('conversion.first', 'conversion.last', 'conversion.any', 'conversion.first_strict', 'conversion.last_strict') THEN
    v_needs_conversion_join := TRUE;
  END IF;
  
  -- Check if any rule uses conversion fields
  IF v_business_rules ? 'rules' THEN
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_business_rules->'rules') r 
      WHERE r->>'fieldGroup' = 'conversion'
    ) THEN
      v_needs_conversion_join := TRUE;
    END IF;
  END IF;

  -- Base query with DISTINCT to avoid duplicates from JOINs
  v_sql := 'SELECT COUNT(DISTINCT l.id) FROM leads l';

  -- Basic organization filter
  v_where_conditions := 'l.organization_id = $1';
  v_combinator := COALESCE(v_business_rules->>'combinator', 'and');

  -- ENHANCED: Use new field group architecture for rule processing
  DECLARE
    v_group_result RECORD;
  BEGIN
    -- Process all rules and groups using the new field group architecture
    SELECT * INTO v_group_result FROM process_rule_group_conditions(v_business_rules, p_organization_id);
    
    -- Update JOIN requirements based on field group analysis
    IF v_group_result.needs_conversion_join THEN
      v_needs_conversion_join := TRUE;
    END IF;
    
    IF v_group_result.needs_custom_fields_join THEN
      v_needs_custom_fields_join := TRUE;  
    END IF;
    
    -- Add the combined conditions
    IF v_group_result.sql_conditions != '' THEN
      v_where_conditions := v_where_conditions || ' AND (' || v_group_result.sql_conditions || ')';
    END IF;
  END;

  -- Add necessary JOINs
  IF v_needs_custom_fields_join THEN
    v_joins := v_joins || ' LEFT JOIN leads_custom_fields lcf ON l.id = lcf.lead_id AND lcf.organization_id = l.organization_id';
  END IF;

  IF v_needs_conversion_join THEN
    v_joins := v_joins || ' LEFT JOIN conversions c ON l.id = c.lead_id';
  END IF;

  -- Add time-based filtering with comprehensive support
  IF p_period_start IS NOT NULL AND p_period_end IS NOT NULL THEN
    CASE p_time_filter_type
      WHEN 'lead.createdAt' THEN
        v_where_conditions := v_where_conditions || ' AND l.created_at::DATE BETWEEN $2 AND $3';
      WHEN 'conversion.first' THEN
        v_where_conditions := v_where_conditions || ' AND l.first_conversion_date::DATE BETWEEN $2 AND $3';
      WHEN 'conversion.last' THEN
        v_where_conditions := v_where_conditions || ' AND l.last_conversion_date::DATE BETWEEN $2 AND $3';
      WHEN 'conversion.any' THEN
        v_where_conditions := v_where_conditions || ' AND c.created_at::DATE BETWEEN $2 AND $3';
      WHEN 'conversion.first_strict' THEN
        v_where_conditions := v_where_conditions || ' AND EXISTS (
          SELECT 1 FROM conversions c_first 
          WHERE c_first.lead_id = l.id 
          AND c_first.created_at::DATE BETWEEN $2 AND $3
          AND c_first.created_at = (
            SELECT MIN(c_min.created_at) 
            FROM conversions c_min 
            WHERE c_min.lead_id = l.id
          )
        )';
      WHEN 'conversion.last_strict' THEN
        v_where_conditions := v_where_conditions || ' AND EXISTS (
          SELECT 1 FROM conversions c_last 
          WHERE c_last.lead_id = l.id 
          AND c_last.created_at::DATE BETWEEN $2 AND $3
          AND c_last.created_at = (
            SELECT MAX(c_max.created_at) 
            FROM conversions c_max 
            WHERE c_max.lead_id = l.id
          )
        )';
      ELSE
        -- Default fallback to lead creation date
        v_where_conditions := v_where_conditions || ' AND l.created_at::DATE BETWEEN $2 AND $3';
    END CASE;
  END IF;

  -- Build final SQL
  v_sql := v_sql || v_joins || ' WHERE ' || v_where_conditions;

  -- Execute query
  IF p_period_start IS NOT NULL AND p_period_end IS NOT NULL THEN
    EXECUTE v_sql INTO v_count USING p_organization_id, p_period_start, p_period_end;
  ELSE
    EXECUTE v_sql INTO v_count USING p_organization_id;
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$;

-- Enhanced helper function to format standard field conditions with isEmpty support
CREATE OR REPLACE FUNCTION format_standard_field_condition(
  field_name TEXT,
  operator TEXT,
  value JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  condition TEXT;
BEGIN
  CASE operator
    WHEN 'equals' THEN
      condition := field_name || ' = ' || quote_literal(value #>> '{}');
    WHEN 'not_equals' THEN
      condition := field_name || ' != ' || quote_literal(value #>> '{}');
    WHEN 'contains' THEN
      condition := field_name || ' ILIKE ' || quote_literal('%' || (value #>> '{}') || '%');
    WHEN 'not_contains' THEN
      condition := field_name || ' NOT ILIKE ' || quote_literal('%' || (value #>> '{}') || '%');
    WHEN 'greater_than' THEN
      condition := field_name || ' > ' || quote_literal(value #>> '{}');
    WHEN 'less_than' THEN
      condition := field_name || ' < ' || quote_literal(value #>> '{}');
    WHEN 'in' THEN
      condition := field_name || ' = ANY(ARRAY[' ||
        (SELECT string_agg(quote_literal(elem #>> '{}'), ',')
         FROM jsonb_array_elements(value) elem) || '])';
    WHEN 'not_in' THEN
      condition := field_name || ' != ALL(ARRAY[' ||
        (SELECT string_agg(quote_literal(elem #>> '{}'), ',')
         FROM jsonb_array_elements(value) elem) || '])';
    WHEN 'is_null' THEN
      condition := field_name || ' IS NULL';
    WHEN 'is_not_null' THEN
      condition := field_name || ' IS NOT NULL';
    WHEN 'isEmpty' THEN
      condition := '(' || field_name || ' IS NULL OR ' || field_name || ' = '''')';
    WHEN 'isNotEmpty' THEN
      condition := '(' || field_name || ' IS NOT NULL AND ' || field_name || ' != '''')';
    ELSE
      condition := 'TRUE'; -- Default fallback
  END CASE;

  RETURN condition;
END;
$$;

-- Enhanced helper function to format custom field conditions with jsonKeyEquals support
CREATE OR REPLACE FUNCTION format_custom_field_condition(
  field_key TEXT,
  operator TEXT,
  value JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  CASE operator
    WHEN 'equals' THEN
      RETURN 'EXISTS (SELECT 1 FROM leads_custom_fields lcf2 WHERE lcf2.lead_id = l.id AND lcf2.field_key = ' ||
             quote_literal(field_key) || ' AND lcf2.field_value = ' || quote_literal(value #>> '{}') || ')';
    WHEN 'contains' THEN
      RETURN 'EXISTS (SELECT 1 FROM leads_custom_fields lcf2 WHERE lcf2.lead_id = l.id AND lcf2.field_key = ' ||
             quote_literal(field_key) || ' AND lcf2.field_value ILIKE ' || quote_literal('%' || (value #>> '{}') || '%') || ')';
    WHEN 'in' THEN
      RETURN 'EXISTS (SELECT 1 FROM leads_custom_fields lcf2 WHERE lcf2.lead_id = l.id AND lcf2.field_key = ' ||
             quote_literal(field_key) || ' AND lcf2.field_value = ANY(ARRAY[' ||
             (SELECT string_agg(quote_literal(elem #>> '{}'), ',')
              FROM jsonb_array_elements(value) elem) || ']))';
    WHEN 'jsonKeyEquals' THEN
      -- Handle JSON key-value matching in conversion raw_payload with proper path parsing
      -- value format: {"key": "custom_fields.cf_funil", "value": "Comercial"}
      DECLARE
        v_path_array TEXT[];
      BEGIN
        -- Use proper path parsing like reference implementation
        v_path_array := parse_json_path(value->>'key');
        RETURN 'EXISTS (SELECT 1 FROM conversions c2 WHERE c2.lead_id = l.id AND c2.raw_payload #>> ' ||
               quote_literal(v_path_array) || ' = ' || quote_literal(value->>'value') || ')';
      END;
    ELSE
      RETURN 'TRUE'; -- Default fallback
  END CASE;
END;
$$;

-- Helper function to format date conditions
CREATE OR REPLACE FUNCTION format_date_condition(
  field_name TEXT,
  operator TEXT,
  value JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  condition TEXT;
  interval_val TEXT;
BEGIN
  interval_val := value #>> '{}';

  CASE operator
    WHEN 'older_than' THEN
      CASE interval_val
        WHEN '30_days' THEN condition := field_name || ' < (NOW() - INTERVAL ''30 days'')';
        WHEN '90_days' THEN condition := field_name || ' < (NOW() - INTERVAL ''90 days'')';
        WHEN '180_days' THEN condition := field_name || ' < (NOW() - INTERVAL ''180 days'')';
        ELSE condition := field_name || ' < NOW()';
      END CASE;
    WHEN 'newer_than' THEN
      CASE interval_val
        WHEN '30_days' THEN condition := field_name || ' > (NOW() - INTERVAL ''30 days'')';
        WHEN '90_days' THEN condition := field_name || ' > (NOW() - INTERVAL ''90 days'')';
        ELSE condition := field_name || ' > NOW()';
      END CASE;
    ELSE
      condition := 'TRUE';
  END CASE;

  RETURN condition;
END;
$$;

-- Helper function to format array field conditions
CREATE OR REPLACE FUNCTION format_array_field_condition(
  field_name TEXT,
  operator TEXT,
  value JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  condition TEXT;
BEGIN
  CASE operator
    WHEN 'contains' THEN
      condition := quote_literal(value #>> '{}') || ' = ANY(' || field_name || ')';
    WHEN 'not_contains' THEN
      condition := quote_literal(value #>> '{}') || ' != ALL(' || field_name || ')';
    WHEN 'in' THEN
      condition := field_name || ' && ARRAY[' ||
        (SELECT string_agg(quote_literal(elem #>> '{}'), ',')
         FROM jsonb_array_elements(value) elem) || ']';
    WHEN 'not_in' THEN
      condition := 'NOT (' || field_name || ' && ARRAY[' ||
        (SELECT string_agg(quote_literal(elem #>> '{}'), ',')
         FROM jsonb_array_elements(value) elem) || '])';
    ELSE
      condition := 'TRUE'; -- Default fallback
  END CASE;

  RETURN condition;
END;
$$;

-- ENHANCED: Field Group Architecture - Process rule groups with proper field group separation
-- Based on reference implementation with explicit field group handling
CREATE OR REPLACE FUNCTION process_rule_group_conditions(
  rule_group JSONB,
  p_organization_id TEXT
)
RETURNS TABLE(sql_conditions TEXT, needs_conversion_join BOOLEAN, needs_custom_fields_join BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  v_conditions TEXT[] := '{}';
  v_needs_conversion_join BOOLEAN := FALSE;
  v_needs_custom_fields_join BOOLEAN := FALSE;
  v_combinator TEXT;
  v_rule JSONB;
  v_group JSONB;
  v_field TEXT;
  v_operator TEXT;
  v_value JSONB;
  v_field_group TEXT;
  v_condition TEXT;
  v_subgroup_result RECORD;
  v_path_array TEXT[];
  v_value_str TEXT;
BEGIN
  v_combinator := COALESCE(rule_group->>'combinator', 'and');

  -- CRITICAL: Process nested groups FIRST for correct precedence (like reference)
  FOR v_group IN SELECT * FROM jsonb_array_elements(COALESCE(rule_group->'groups', '[]'::jsonb))
  LOOP
    -- Recursive call to process subgroup
    SELECT * INTO v_subgroup_result FROM process_rule_group_conditions(v_group, p_organization_id);
    
    -- Aggregate JOIN requirements
    IF v_subgroup_result.needs_conversion_join THEN
      v_needs_conversion_join := TRUE;
    END IF;
    
    IF v_subgroup_result.needs_custom_fields_join THEN
      v_needs_custom_fields_join := TRUE;
    END IF;
    
    -- Add subgroup conditions with parentheses for precedence
    IF v_subgroup_result.sql_conditions != '' THEN
      v_conditions := v_conditions || ('(' || v_subgroup_result.sql_conditions || ')');
    END IF;
  END LOOP;

  -- Process individual rules AFTER groups (like reference)
  FOR v_rule IN SELECT * FROM jsonb_array_elements(COALESCE(rule_group->'rules', '[]'::jsonb))
  LOOP
    v_field := v_rule->>'field';
    v_operator := v_rule->>'operator';
    v_value := v_rule->'value';
    v_field_group := COALESCE(v_rule->>'fieldGroup', 'lead');
    
    v_condition := '';
    
    -- FIELD GROUP ARCHITECTURE (like reference implementation)
    CASE v_field_group
      WHEN 'lead' THEN
        -- Lead table fields processing - Complete operator set
        CASE v_operator
          WHEN 'equals' THEN
            v_condition := 'l.' || v_field || ' = ' || quote_literal(v_value #>> '{}');
          WHEN 'notEquals' THEN
            -- Proper null handling like reference
            v_condition := 'l.' || v_field || ' != ' || quote_literal(v_value #>> '{}') || ' OR l.' || v_field || ' IS NULL';
          WHEN 'contains' THEN
            v_condition := 'l.' || v_field || ' ILIKE ' || quote_literal('%' || (v_value #>> '{}') || '%');
          WHEN 'notContains' THEN
            v_condition := 'l.' || v_field || ' NOT ILIKE ' || quote_literal('%' || (v_value #>> '{}') || '%') || ' OR l.' || v_field || ' IS NULL';
          WHEN 'startsWith' THEN
            v_condition := 'l.' || v_field || ' ILIKE ' || quote_literal((v_value #>> '{}') || '%');
          WHEN 'endsWith' THEN
            v_condition := 'l.' || v_field || ' ILIKE ' || quote_literal('%' || (v_value #>> '{}'));
          WHEN 'isEmpty' THEN
            v_condition := 'l.' || v_field || ' IS NULL OR l.' || v_field || ' = ''''';
          WHEN 'isNotEmpty' THEN
            v_condition := 'l.' || v_field || ' IS NOT NULL AND l.' || v_field || ' != ''''';
          WHEN 'greaterThan' THEN
            v_condition := 'l.' || v_field || ' > ' || quote_literal(v_value #>> '{}');
          WHEN 'lessThan' THEN
            v_condition := 'l.' || v_field || ' < ' || quote_literal(v_value #>> '{}');
          WHEN 'greaterThanOrEqual' THEN
            v_condition := 'l.' || v_field || ' >= ' || quote_literal(v_value #>> '{}');
          WHEN 'lessThanOrEqual' THEN
            v_condition := 'l.' || v_field || ' <= ' || quote_literal(v_value #>> '{}');
          WHEN 'in' THEN
            v_condition := 'l.' || v_field || ' = ANY(ARRAY[' ||
              (SELECT string_agg(quote_literal(elem #>> '{}'), ',')
               FROM jsonb_array_elements(v_value) elem) || '])';
          WHEN 'notIn' THEN
            v_condition := 'l.' || v_field || ' != ALL(ARRAY[' ||
              (SELECT string_agg(quote_literal(elem #>> '{}'), ',')
               FROM jsonb_array_elements(v_value) elem) || ']) OR l.' || v_field || ' IS NULL';
          ELSE
            CONTINUE; -- Skip unknown operators
        END CASE;
        
      WHEN 'conversion' THEN
        v_needs_conversion_join := TRUE;
        
        -- Advanced conversion operators (like reference implementation)
        IF v_operator = 'leadHasConversion' THEN
          -- Check if lead has a specific conversion (no JOIN needed - uses EXISTS)
          v_condition := 'EXISTS (SELECT 1 FROM conversions c_check WHERE c_check.lead_id = l.id AND c_check.organization_id = ' || quote_literal(p_organization_id) || ' AND c_check.name = ' || quote_literal(v_value #>> '{}') || ')';
          v_needs_conversion_join := FALSE; -- Override JOIN requirement
        ELSIF v_operator = 'leadNotHasConversion' THEN
          -- Check if lead does NOT have a specific conversion
          v_condition := 'NOT EXISTS (SELECT 1 FROM conversions c_check WHERE c_check.lead_id = l.id AND c_check.organization_id = ' || quote_literal(p_organization_id) || ' AND c_check.name = ' || quote_literal(v_value #>> '{}') || ')';
          v_needs_conversion_join := FALSE; -- Override JOIN requirement
        ELSIF v_field = 'raw_payload' THEN
          -- JSON payload processing - Support both string and object formats
          DECLARE
            v_json_path_str TEXT;
            v_json_value_str TEXT;
          BEGIN
            -- Handle both data formats: string "path:value" OR object {"key":"path","value":"value"}
            IF jsonb_typeof(v_value) = 'string' THEN
              -- Reference format: "custom_fields.cf_funil:Comercial" (string with colon)
              v_value_str := v_value #>> '{}';
              IF v_value_str LIKE '%:%' THEN
                -- Split on first colon
                v_json_path_str := split_part(v_value_str, ':', 1);
                v_json_value_str := substring(v_value_str from position(':' in v_value_str) + 1);
              ELSE
                -- No colon, use entire string as path (for jsonKeyExists)
                v_json_path_str := v_value_str;
                v_json_value_str := '';
              END IF;
            ELSE
              -- Our object format: {"key": "custom_fields.cf_funil", "value": "Comercial"}
              v_json_path_str := v_value->>'key';
              v_json_value_str := v_value->>'value';
            END IF;
            
            -- Convert path to PostgreSQL array format
            v_path_array := parse_json_path(v_json_path_str);
            
            -- Generate SQL conditions
            CASE v_operator
              WHEN 'jsonKeyEquals' THEN
                v_condition := 'c.raw_payload #>> ' || quote_literal(v_path_array) || ' = ' || quote_literal(v_json_value_str);
              WHEN 'jsonContains' THEN
                v_condition := 'c.raw_payload #>> ' || quote_literal(v_path_array) || ' ILIKE ' || quote_literal('%' || v_json_value_str || '%');
              WHEN 'jsonKeyExists' THEN
                v_condition := 'c.raw_payload #> ' || quote_literal(v_path_array) || ' IS NOT NULL';
              WHEN 'jsonNotEquals' THEN
                v_condition := 'c.raw_payload #>> ' || quote_literal(v_path_array) || ' != ' || quote_literal(v_json_value_str) || ' OR c.raw_payload #>> ' || quote_literal(v_path_array) || ' IS NULL';
              WHEN 'jsonNotContains' THEN
                v_condition := 'c.raw_payload #>> ' || quote_literal(v_path_array) || ' NOT ILIKE ' || quote_literal('%' || v_json_value_str || '%') || ' OR c.raw_payload #>> ' || quote_literal(v_path_array) || ' IS NULL';
              ELSE
                CONTINUE;
            END CASE;
          END;
        ELSE
          -- Regular conversion table fields - Complete operator set
          CASE v_operator
            WHEN 'equals' THEN
              v_condition := 'c.' || v_field || ' = ' || quote_literal(v_value #>> '{}');
            WHEN 'notEquals' THEN
              v_condition := 'c.' || v_field || ' != ' || quote_literal(v_value #>> '{}') || ' OR c.' || v_field || ' IS NULL';
            WHEN 'contains' THEN
              v_condition := 'c.' || v_field || ' ILIKE ' || quote_literal('%' || (v_value #>> '{}') || '%');
            WHEN 'notContains' THEN
              v_condition := 'c.' || v_field || ' NOT ILIKE ' || quote_literal('%' || (v_value #>> '{}') || '%') || ' OR c.' || v_field || ' IS NULL';
            WHEN 'startsWith' THEN
              v_condition := 'c.' || v_field || ' ILIKE ' || quote_literal((v_value #>> '{}') || '%');
            WHEN 'endsWith' THEN
              v_condition := 'c.' || v_field || ' ILIKE ' || quote_literal('%' || (v_value #>> '{}'));
            WHEN 'isEmpty' THEN
              v_condition := 'c.' || v_field || ' IS NULL OR c.' || v_field || ' = ''''';
            WHEN 'isNotEmpty' THEN
              v_condition := 'c.' || v_field || ' IS NOT NULL AND c.' || v_field || ' != ''''';
            WHEN 'greaterThan' THEN
              v_condition := 'c.' || v_field || ' > ' || quote_literal(v_value #>> '{}');
            WHEN 'lessThan' THEN
              v_condition := 'c.' || v_field || ' < ' || quote_literal(v_value #>> '{}');
            WHEN 'greaterThanOrEqual' THEN
              v_condition := 'c.' || v_field || ' >= ' || quote_literal(v_value #>> '{}');
            WHEN 'lessThanOrEqual' THEN
              v_condition := 'c.' || v_field || ' <= ' || quote_literal(v_value #>> '{}');
            ELSE
              CONTINUE;
          END CASE;
        END IF;
        
      WHEN 'custom_field' THEN
        v_needs_custom_fields_join := TRUE;
        -- Complete operator set for custom fields
        CASE v_operator
          WHEN 'equals' THEN
            v_condition := 'EXISTS (SELECT 1 FROM leads_custom_fields lcf_inner WHERE lcf_inner.lead_id = l.id AND lcf_inner.organization_id = ' || quote_literal(p_organization_id) || ' AND lcf_inner.field_key = ' || quote_literal(v_field) || ' AND lcf_inner.field_value = ' || quote_literal(v_value #>> '{}') || ')';
          WHEN 'notEquals' THEN
            v_condition := 'NOT EXISTS (SELECT 1 FROM leads_custom_fields lcf_inner WHERE lcf_inner.lead_id = l.id AND lcf_inner.organization_id = ' || quote_literal(p_organization_id) || ' AND lcf_inner.field_key = ' || quote_literal(v_field) || ' AND lcf_inner.field_value = ' || quote_literal(v_value #>> '{}') || ')';
          WHEN 'contains' THEN
            v_condition := 'EXISTS (SELECT 1 FROM leads_custom_fields lcf_inner WHERE lcf_inner.lead_id = l.id AND lcf_inner.organization_id = ' || quote_literal(p_organization_id) || ' AND lcf_inner.field_key = ' || quote_literal(v_field) || ' AND lcf_inner.field_value ILIKE ' || quote_literal('%' || (v_value #>> '{}') || '%') || ')';
          WHEN 'notContains' THEN
            v_condition := 'NOT EXISTS (SELECT 1 FROM leads_custom_fields lcf_inner WHERE lcf_inner.lead_id = l.id AND lcf_inner.organization_id = ' || quote_literal(p_organization_id) || ' AND lcf_inner.field_key = ' || quote_literal(v_field) || ' AND lcf_inner.field_value ILIKE ' || quote_literal('%' || (v_value #>> '{}') || '%') || ')';
          WHEN 'startsWith' THEN
            v_condition := 'EXISTS (SELECT 1 FROM leads_custom_fields lcf_inner WHERE lcf_inner.lead_id = l.id AND lcf_inner.organization_id = ' || quote_literal(p_organization_id) || ' AND lcf_inner.field_key = ' || quote_literal(v_field) || ' AND lcf_inner.field_value ILIKE ' || quote_literal((v_value #>> '{}') || '%') || ')';
          WHEN 'endsWith' THEN
            v_condition := 'EXISTS (SELECT 1 FROM leads_custom_fields lcf_inner WHERE lcf_inner.lead_id = l.id AND lcf_inner.organization_id = ' || quote_literal(p_organization_id) || ' AND lcf_inner.field_key = ' || quote_literal(v_field) || ' AND lcf_inner.field_value ILIKE ' || quote_literal('%' || (v_value #>> '{}')) || ')';
          WHEN 'isEmpty' THEN
            v_condition := 'NOT EXISTS (SELECT 1 FROM leads_custom_fields lcf_inner WHERE lcf_inner.lead_id = l.id AND lcf_inner.organization_id = ' || quote_literal(p_organization_id) || ' AND lcf_inner.field_key = ' || quote_literal(v_field) || ' AND lcf_inner.field_value IS NOT NULL AND lcf_inner.field_value != '''')';
          WHEN 'isNotEmpty' THEN
            v_condition := 'EXISTS (SELECT 1 FROM leads_custom_fields lcf_inner WHERE lcf_inner.lead_id = l.id AND lcf_inner.organization_id = ' || quote_literal(p_organization_id) || ' AND lcf_inner.field_key = ' || quote_literal(v_field) || ' AND lcf_inner.field_value IS NOT NULL AND lcf_inner.field_value != '''')';
          WHEN 'in' THEN
            v_condition := 'EXISTS (SELECT 1 FROM leads_custom_fields lcf_inner WHERE lcf_inner.lead_id = l.id AND lcf_inner.organization_id = ' || quote_literal(p_organization_id) || ' AND lcf_inner.field_key = ' || quote_literal(v_field) || ' AND lcf_inner.field_value = ANY(ARRAY[' ||
              (SELECT string_agg(quote_literal(elem #>> '{}'), ',')
               FROM jsonb_array_elements(v_value) elem) || ']))';
          WHEN 'notIn' THEN
            v_condition := 'NOT EXISTS (SELECT 1 FROM leads_custom_fields lcf_inner WHERE lcf_inner.lead_id = l.id AND lcf_inner.organization_id = ' || quote_literal(p_organization_id) || ' AND lcf_inner.field_key = ' || quote_literal(v_field) || ' AND lcf_inner.field_value = ANY(ARRAY[' ||
              (SELECT string_agg(quote_literal(elem #>> '{}'), ',')
               FROM jsonb_array_elements(v_value) elem) || ']))';
          ELSE
            CONTINUE;
        END CASE;
        
      ELSE
        CONTINUE; -- Skip unknown field groups
    END CASE;
    
    -- Add condition to list if generated
    IF v_condition != '' THEN
      v_conditions := v_conditions || v_condition;
    END IF;
  END LOOP;

  -- Combine all conditions with proper combinator
  IF array_length(v_conditions, 1) > 0 THEN
    IF v_combinator = 'or' THEN
      sql_conditions := array_to_string(v_conditions, ' OR ');
    ELSE
      sql_conditions := array_to_string(v_conditions, ' AND ');
    END IF;
  ELSE
    sql_conditions := '';
  END IF;

  needs_conversion_join := v_needs_conversion_join;
  needs_custom_fields_join := v_needs_custom_fields_join;

  RETURN QUERY SELECT sql_conditions, needs_conversion_join, needs_custom_fields_join;
END;
$$;

-- ENHANCED function to get leads matching segment rules with proper field group architecture
CREATE OR REPLACE FUNCTION get_leads_by_segment_rules(
  p_organization_id TEXT,
  p_rule_json JSONB,
  p_time_filter_type TEXT DEFAULT 'lead.createdAt',
  p_period_start DATE DEFAULT NULL,
  p_period_end DATE DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_order_by TEXT DEFAULT 'created_at DESC'
)
RETURNS TABLE(
  id UUID,
  organization_id TEXT,
  name TEXT,
  email TEXT,
  secondary_email TEXT,
  phone TEXT,
  secondary_phone TEXT,
  company TEXT,
  job_title TEXT,
  import_method TEXT,
  external_id TEXT,
  external_source TEXT,
  fit_score TEXT,
  interest INTEGER,
  total_conversions INTEGER,
  first_conversion_date TIMESTAMP WITH TIME ZONE,
  last_conversion_date TIMESTAMP WITH TIME ZONE,
  first_conversion_utm_source TEXT,
  first_conversion_utm_medium TEXT,
  first_conversion_utm_campaign TEXT,
  first_conversion_utm_content TEXT,
  first_conversion_utm_term TEXT,
  last_conversion_utm_source TEXT,
  last_conversion_utm_medium TEXT,
  last_conversion_utm_campaign TEXT,
  last_conversion_utm_content TEXT,
  last_conversion_utm_term TEXT,
  tags TEXT[],
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sql TEXT;
  v_where_conditions TEXT := '';
  v_joins TEXT := '';
  v_needs_conversion_join BOOLEAN := FALSE;
  v_needs_custom_fields_join BOOLEAN := FALSE;
  v_business_rules JSONB;  -- Business rules without periodFilter
  v_main_conditions TEXT[];
  v_group_condition TEXT;
  v_rule_condition TEXT;
  v_combinator TEXT;
BEGIN
  -- STEP 1: Extract business rules (remove periodFilter if it exists)
  v_business_rules := p_rule_json;
  IF v_business_rules ? 'periodFilter' THEN
    v_business_rules := v_business_rules - 'periodFilter';
  END IF;

  -- STEP 2: Check if we need conversion JOIN based on rules or time filter type
  IF p_time_filter_type IN ('conversion.first', 'conversion.last', 'conversion.any', 'conversion.first_strict', 'conversion.last_strict') THEN
    v_needs_conversion_join := TRUE;
  END IF;
  
  -- Check if any rule uses conversion fields
  IF v_business_rules ? 'rules' THEN
    IF EXISTS (
      SELECT 1 FROM jsonb_array_elements(v_business_rules->'rules') r 
      WHERE r->>'fieldGroup' = 'conversion'
    ) THEN
      v_needs_conversion_join := TRUE;
    END IF;
  END IF;

  -- Base query to select all lead fields
  v_sql := 'SELECT DISTINCT 
    l.id, l.organization_id, l.name, l.email, l.secondary_email,
    l.phone, l.secondary_phone, l.company, l.job_title, 
    l.import_method, l.external_id, l.external_source,
    l.fit_score, l.interest, l.total_conversions,
    l.first_conversion_date, l.last_conversion_date,
    l.first_conversion_utm_source, l.first_conversion_utm_medium,
    l.first_conversion_utm_campaign, l.first_conversion_utm_content,
    l.first_conversion_utm_term, l.last_conversion_utm_source,
    l.last_conversion_utm_medium, l.last_conversion_utm_campaign,
    l.last_conversion_utm_content, l.last_conversion_utm_term,
    l.tags, l.notes, l.created_at, l.updated_at
  FROM leads l';

  -- Basic organization filter
  v_where_conditions := 'l.organization_id = $1';
  v_combinator := COALESCE(v_business_rules->>'combinator', 'and');

  -- ENHANCED: Use same field group architecture as count function
  DECLARE
    v_group_result RECORD;
  BEGIN
    -- Process all rules and groups using the new field group architecture
    SELECT * INTO v_group_result FROM process_rule_group_conditions(v_business_rules, p_organization_id);
    
    -- Update JOIN requirements based on field group analysis
    IF v_group_result.needs_conversion_join THEN
      v_needs_conversion_join := TRUE;
    END IF;
    
    IF v_group_result.needs_custom_fields_join THEN
      v_needs_custom_fields_join := TRUE;  
    END IF;
    
    -- Add the combined conditions
    IF v_group_result.sql_conditions != '' THEN
      v_where_conditions := v_where_conditions || ' AND (' || v_group_result.sql_conditions || ')';
    END IF;
  END;

  -- Add necessary JOINs
  IF v_needs_custom_fields_join THEN
    v_joins := v_joins || ' LEFT JOIN leads_custom_fields lcf ON l.id = lcf.lead_id AND lcf.organization_id = l.organization_id';
  END IF;

  IF v_needs_conversion_join THEN
    v_joins := v_joins || ' LEFT JOIN conversions c ON l.id = c.lead_id';
  END IF;

  -- Add time-based filtering with comprehensive support
  IF p_period_start IS NOT NULL AND p_period_end IS NOT NULL THEN
    CASE p_time_filter_type
      WHEN 'lead.createdAt' THEN
        v_where_conditions := v_where_conditions || ' AND l.created_at::DATE BETWEEN $2 AND $3';
      WHEN 'conversion.first' THEN
        v_where_conditions := v_where_conditions || ' AND l.first_conversion_date::DATE BETWEEN $2 AND $3';
      WHEN 'conversion.last' THEN
        v_where_conditions := v_where_conditions || ' AND l.last_conversion_date::DATE BETWEEN $2 AND $3';
      WHEN 'conversion.any' THEN
        v_where_conditions := v_where_conditions || ' AND c.created_at::DATE BETWEEN $2 AND $3';
      WHEN 'conversion.first_strict' THEN
        v_where_conditions := v_where_conditions || ' AND EXISTS (
          SELECT 1 FROM conversions c_first 
          WHERE c_first.lead_id = l.id 
          AND c_first.created_at::DATE BETWEEN $2 AND $3
          AND c_first.created_at = (
            SELECT MIN(c_min.created_at) 
            FROM conversions c_min 
            WHERE c_min.lead_id = l.id
          )
        )';
      WHEN 'conversion.last_strict' THEN
        v_where_conditions := v_where_conditions || ' AND EXISTS (
          SELECT 1 FROM conversions c_last 
          WHERE c_last.lead_id = l.id 
          AND c_last.created_at::DATE BETWEEN $2 AND $3
          AND c_last.created_at = (
            SELECT MAX(c_max.created_at) 
            FROM conversions c_max 
            WHERE c_max.lead_id = l.id
          )
        )';
      ELSE
        -- Default fallback to lead creation date
        v_where_conditions := v_where_conditions || ' AND l.created_at::DATE BETWEEN $2 AND $3';
    END CASE;
  END IF;

  -- Build SQL with WHERE clause
  v_sql := v_sql || v_joins || ' WHERE ' || v_where_conditions;

  -- Add ORDER BY with validation
  CASE p_order_by
    WHEN 'created_at DESC' THEN v_sql := v_sql || ' ORDER BY l.created_at DESC';
    WHEN 'created_at ASC' THEN v_sql := v_sql || ' ORDER BY l.created_at ASC';
    WHEN 'updated_at DESC' THEN v_sql := v_sql || ' ORDER BY l.updated_at DESC';
    WHEN 'updated_at ASC' THEN v_sql := v_sql || ' ORDER BY l.updated_at ASC';
    WHEN 'name ASC' THEN v_sql := v_sql || ' ORDER BY l.name ASC';
    WHEN 'name DESC' THEN v_sql := v_sql || ' ORDER BY l.name DESC';
    WHEN 'email ASC' THEN v_sql := v_sql || ' ORDER BY l.email ASC';
    WHEN 'email DESC' THEN v_sql := v_sql || ' ORDER BY l.email DESC';
    ELSE v_sql := v_sql || ' ORDER BY l.created_at DESC';  -- Default
  END CASE;

  -- Add pagination
  IF p_period_start IS NOT NULL AND p_period_end IS NOT NULL THEN
    v_sql := v_sql || ' LIMIT $4 OFFSET $5';
    RETURN QUERY EXECUTE v_sql 
      USING p_organization_id, p_period_start, p_period_end, p_limit, p_offset;
  ELSE
    v_sql := v_sql || ' LIMIT $2 OFFSET $3';
    RETURN QUERY EXECUTE v_sql 
      USING p_organization_id, p_limit, p_offset;
  END IF;
END;
$$;

-- Create a view for segments with real-time lead counts
CREATE OR REPLACE VIEW segments_with_leads_count AS
SELECT
  s.id,
  s.organization_id,
  s.name,
  s.description,
  s.rule_json,
  s.created_at,
  s.updated_at,
  -- Real-time lead count using our improved counting function
  count_leads_by_segment_rules(s.organization_id, s.rule_json) as lead_count
FROM segments s;