# Segment Rules Processing Implementation Comparison

## Executive Summary

This report compares our current segment rules processing implementation with a reference implementation from another application that "works very well". The analysis reveals significant architectural and implementation differences that may explain why our segment is returning 655 leads instead of the expected 13.

## Key Problems Identified

### 1. **JSON Path Processing Inconsistency**

- **Reference**: Uses proper path parsing with `string_to_array(v_json_path, '.')` to convert `"custom_fields.cf_funil"` into PostgreSQL array format `{"custom_fields","cf_funil"}`
- **Our Implementation**: Uses naive string replacement `replace(value->>'key', '.', ',')` which may not handle complex paths correctly

### 2. **Field Group Architecture Mismatch**

- **Reference**: Has explicit `fieldGroup` handling with three distinct types:
  - `'lead'` - Direct lead table fields
  - `'conversion'` - Conversion table fields
  - `'custom_field'` - Custom field processing
- **Our Implementation**: Inconsistent field group handling, mixing conversion JSON processing with custom field logic

### 3. **Conversion Field Processing Logic**

- **Reference**: Separates conversion field processing clearly:
  - Regular conversion fields use `c.field_name`
  - JSON payload uses `c.payload_raw_json #>> array_path`
- **Our Implementation**: Unclear separation between conversion table fields and JSON payload processing

## Detailed Technical Differences

### JSON Key Processing

**Reference Implementation:**

```sql
-- Proper path parsing
SELECT string_to_array(v_json_path, '.') INTO v_path_array;

WHEN 'jsonKeyEquals' THEN
  v_condition := 'c.payload_raw_json #>> ' || quote_literal(v_path_array) || ' = ' || quote_literal(v_json_value);
```

**Our Implementation:**

```sql
WHEN 'jsonKeyEquals' THEN
  -- Handle JSON key-value matching in conversion raw_payload
  -- value format: {"key": "custom_fields.cf_funil", "value": "Comercial"}
  RETURN 'EXISTS (SELECT 1 FROM conversions c2 WHERE c2.lead_id = l.id AND c2.raw_payload #>> ' ||
         quote_literal('{' || replace(value->>'key', '.', ',') || '}') || ' = ' ||
         quote_literal(value->>'value') || ')';
```

**Issue**: Our string replacement approach `replace(value->>'key', '.', ',')` produces `{custom_fields,cf_funil}` but PostgreSQL expects `{"custom_fields","cf_funil"}` format.

### Field Group Architecture

**Reference Implementation:**

```sql
CASE v_field_group
  WHEN 'lead' THEN
    -- Process lead table fields directly
  WHEN 'conversion' THEN
    -- Process conversion fields with proper JSON handling
    IF v_field = 'payload_raw_json' THEN
      -- Special JSON processing
    ELSE
      -- Regular conversion table fields
    END IF
  WHEN 'custom_field' THEN
    -- Dedicated custom field processing
END CASE;
```

**Our Implementation:**

- Mixed field group handling in `process_rule_group` function
- Inconsistent separation between field types
- Custom field logic embedded in format functions rather than being field-group driven

### Group Processing Order

**Reference Implementation:**

```sql
-- CRITICAL: Process nested groups FIRST for correct precedence
FOR v_group IN SELECT * FROM jsonb_array_elements(COALESCE(p_rule_group->'groups', '[]'::jsonb))
LOOP
  -- Process subgroups recursively FIRST
END LOOP;

-- Process individual rules AFTER groups
FOR v_rule IN SELECT * FROM jsonb_array_elements(COALESCE(p_rule_group->'rules', '[]'::jsonb))
LOOP
  -- Process rules after groups
END LOOP;
```

**Our Implementation:**

- Processes rules and groups in potentially incorrect order
- May not guarantee proper precedence for complex nested conditions

## Data Structure Mismatch

### Reference Rule Structure:

```json
{
	"field": "payload_raw_json",
	"operator": "jsonKeyEquals",
	"value": "custom_fields.cf_funil:Comercial", // String format
	"fieldGroup": "conversion"
}
```

### Our Rule Structure:

```json
{
	"field": "raw_payload",
	"operator": "jsonKeyEquals",
	"value": {
		// Object format
		"key": "custom_fields.cf_funil",
		"value": "Comercial"
	},
	"fieldGroup": "conversion"
}
```

**Critical Difference**: The reference expects a string value in `"path:value"` format, while our implementation expects an object with separate `key` and `value` properties.

## Database Schema Differences

### Reference Schema:

- `conversions.payload_raw_json` - JSONB field name
- `conversions.contact_id` - Foreign key to leads
- `leads_custom_fields.company_id` - Organization foreign key

### Our Schema:

- `conversions.raw_payload` - JSONB field name
- `conversions.lead_id` - Foreign key to leads
- `leads_custom_fields.organization_id` - Organization foreign key

## Critical Logic Gaps

### 1. Missing Null Handling

**Reference** includes comprehensive null handling:

```sql
WHEN 'notEquals' THEN
  v_condition := 'l.' || v_field || ' != ' || quote_literal(v_value) || ' OR l.' || v_field || ' IS NULL';
```

**Our Implementation** lacks proper null handling for negative conditions.

### 2. Incomplete Operator Support

**Reference** supports more operators:

- `startsWith`, `endsWith`
- `greaterThanOrEqual`, `lessThanOrEqual`
- `leadHasConversion`, `leadNotHasConversion`

### 3. Company/Organization ID Consistency

**Reference** consistently passes `p_company_id` to all subqueries.
**Our Implementation** may have inconsistent organization filtering.

## Recommendations

### 1. **Immediate Fixes**

1. Fix JSON path processing to use proper PostgreSQL array format
2. Implement consistent field group architecture
3. Add proper null handling for all operators

### 2. **Structural Improvements**

1. Separate field group processing logic clearly
2. Implement proper precedence handling for nested groups
3. Add comprehensive operator support

### 3. **Data Format Alignment**

1. Decide on consistent value format (string vs object)
2. Ensure schema field names match expected patterns
3. Standardize organization/company ID usage

## Test Case for Current Issue

For the problematic segment `6fb09f04-c89b-4efd-a9d6-56bb803eb5b0`:

**Expected behavior**:

- Rule 1: `raw_payload.custom_fields.cf_funil = "Comercial"`
- Group Rule 1: `last_conversion_utm_medium = "cpc"`
- Group Rule 2: `last_conversion_utm_campaign` isEmpty
- **Combined with AND**: Should return ~13 leads

**Current behavior**:

- Only Rule 1 is being processed effectively
- Groups are processed but may have logic errors
- **Result**: Returns 655 leads (likely all leads with cf_funil="Comercial")

## Conclusion

The reference implementation provides a more robust, well-structured approach to segment rule processing with proper field group separation, comprehensive operator support, and correct precedence handling. Our implementation needs significant structural improvements to match the reliability and accuracy of the reference.
