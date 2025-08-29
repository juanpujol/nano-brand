-- Segments seed data
-- Create realistic segments for the Acme organization using production-like rule engine configurations

WITH org_info AS (SELECT id FROM organizations WHERE name = 'Acme')
INSERT INTO segments (
  organization_id, name, description, rule_json,
  created_at, updated_at
)
SELECT 
  org_info.id,
  segment_name, segment_description, segment_rule_json::jsonb,
  NOW(), NOW()
FROM org_info,
(VALUES 
  -- 1. Simple segment - High-Value Prospects
  (
    'High-Value Prospects',
    'Leads with excellent fit scores and high interest levels.',
    '{
      "id": "root",
      "combinator": "and",
      "rules": [
        {
          "id": "rule-1753306701554",
          "field": "fit_score",
          "operator": "in",
          "value": ["A", "B"],
          "fieldGroup": "lead"
        },
        {
          "id": "rule-1753318540820", 
          "field": "interest",
          "operator": "greaterThan",
          "value": "70",
          "fieldGroup": "lead"
        }
      ],
      "periodFilter": {
        "timeFilterType": "conversion.any",
        "periodValue": {
          "type": "none"
        }
      }
    }'
  ),
  
  -- 2. Complex segment with nested groups - Marketing Campaigns
  (
    'Marketing Campaign Leads - Complex',
    'Paid campaign leads with high engagement or from target sectors.',
    '{
      "id": "root",
      "combinator": "and",
      "rules": [
        {
          "id": "rule-1754395013222",
          "field": "utm_source",
          "operator": "notEquals",
          "value": "organic",
          "fieldGroup": "lead"
        },
        {
          "id": "group-1754396069867",
          "combinator": "or",
          "rules": [
            {
              "id": "rule-1754396071378",
              "field": "fit_score",
              "operator": "in",
              "value": ["A", "B"],
              "fieldGroup": "lead"
            },
            {
              "id": "rule-1754396071379",
              "field": "custom_fields.setor",
              "operator": "contains",
              "value": "Technology",
              "fieldGroup": "custom_field"
            }
          ]
        }
      ],
      "periodFilter": {
        "timeFilterType": "conversion.any",
        "periodValue": {
          "type": "relative",
          "relativeValue": "last30days"
        }
      }
    }'
  ),
  
  -- 3. Enterprise segment with multiple nested groups
  (
    'Enterprise Multi-Group Segment',
    'Enterprise leads with complex qualification criteria.',
    '{
      "id": "root",
      "combinator": "and",
      "rules": [
        {
          "id": "rule-1753353057016",
          "field": "custom_fields.tamanho_empresa",
          "operator": "in",
          "value": ["500-1000", "1000+", "Enterprise"],
          "fieldGroup": "custom_field"
        },
        {
          "id": "group-1754317447701",
          "combinator": "or",
          "rules": [
            {
              "id": "rule-1754317449309",
              "field": "custom_fields.cargo_nivel",
              "operator": "in",
              "value": ["C-Level", "Director"],
              "fieldGroup": "custom_field"
            },
            {
              "id": "rule-1755865002476",
              "field": "custom_fields.decisor",
              "operator": "equals",
              "value": "true",
              "fieldGroup": "custom_field"
            }
          ]
        },
        {
          "id": "group-1755865002477",
          "combinator": "and",
          "rules": [
            {
              "id": "rule-1755865002478",
              "field": "utm_medium",
              "operator": "equals",
              "value": "cpc",
              "fieldGroup": "lead"
            },
            {
              "id": "rule-1755865002479",
              "field": "interest",
              "operator": "greaterThan",
              "value": "60",
              "fieldGroup": "lead"
            }
          ]
        }
      ],
      "periodFilter": {
        "timeFilterType": "conversion.first",
        "periodValue": {
          "type": "relative",
          "relativeValue": "thisMonth"
        }
      }
    }'
  ),

  -- 4. Simple conversion-based segment
  (
    'Recent Conversions',
    'All leads with recent conversion activity.',
    '{
      "id": "root",
      "combinator": "and", 
      "rules": [
        {
          "id": "rule-1748025132572",
          "field": "email",
          "operator": "isNotEmpty",
          "value": "",
          "fieldGroup": "lead"
        },
        {
          "id": "rule-1748210008704",
          "field": "total_conversions",
          "operator": "greaterThan",
          "value": "0",
          "fieldGroup": "lead"
        }
      ],
      "periodFilter": {
        "timeFilterType": "conversion.any",
        "periodValue": {
          "type": "relative",
          "relativeValue": "last7days"
        }
      }
    }'
  ),

  -- 5. Geographic segment with custom fields
  (
    'Southeast Brazil Tech Companies',
    'Technology companies from São Paulo and Rio de Janeiro.',
    '{
      "id": "root",
      "combinator": "and",
      "rules": [
        {
          "id": "rule-1754954582778",
          "field": "custom_fields.uf",
          "operator": "in",
          "value": ["SP", "RJ"],
          "fieldGroup": "custom_field"
        },
        {
          "id": "rule-1754955090676",
          "field": "custom_fields.setor",
          "operator": "contains",
          "value": "Technology",
          "fieldGroup": "custom_field"
        }
      ],
      "periodFilter": {
        "timeFilterType": "lead.createdAt",
        "periodValue": {
          "type": "none"
        }
      }
    }'
  )
) AS segment_data(
  segment_name, segment_description, segment_rule_json
);