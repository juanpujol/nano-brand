-- Dashboards and favorites data

-- Create 5 dashboards (3 public, 2 private) - nanoids will be auto-generated
WITH org_info AS (SELECT id FROM organizations WHERE name = 'Acme'),
     user_info AS (SELECT id FROM auth.users WHERE email = 'jp2@laiki.co')
INSERT INTO dashboards (
  name,
  description,
  organization_id,
  owner_id,
  is_private,
  period_filter,
  created_at,
  updated_at
) SELECT
  dashboard_name,
  dashboard_description,
  org_info.id,
  user_info.id,
  dashboard_is_private,
  dashboard_period_filter,
  NOW(),
  NOW()
FROM org_info, user_info,
(VALUES 
  ('Sales Overview', 'Monthly sales performance and KPIs for the entire organization', false, '{"type": "relative", "value": "thisMonth"}'::jsonb),
  ('Customer Analytics', 'Customer acquisition, retention, and behavior analysis', false, '{"type": "relative", "value": "last30days"}'::jsonb),
  ('Revenue Trends', 'Quarterly revenue trends and forecasting', false, '{"type": "relative", "value": "lastQuarter"}'::jsonb),
  ('Internal Metrics', 'Sensitive internal performance metrics for leadership team', true, '{"type": "relative", "value": "last7days"}'::jsonb),
  ('Q4 Planning', 'Confidential Q4 strategic planning and budget allocation', true, '{"type": "absolute", "from": "2024-10-01", "to": "2024-12-31"}'::jsonb)
) AS dashboard_data(dashboard_name, dashboard_description, dashboard_is_private, dashboard_period_filter);

-- Create favorite for Juan on the Sales Overview dashboard
INSERT INTO dashboards_favorites (membership_id, dashboard_id, created_at)
SELECT 
  m.id,
  d.id,
  NOW()
FROM memberships m, dashboards d, organizations o, auth.users u
WHERE u.email = 'jp2@laiki.co'
  AND o.name = 'Acme'
  AND m.profile_id = u.id
  AND m.organization_id = o.id
  AND d.name = 'Sales Overview'
  AND d.organization_id = o.id;