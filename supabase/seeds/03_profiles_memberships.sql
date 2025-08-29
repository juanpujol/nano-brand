-- Profiles and memberships data

-- Insert exact copy of profiles record (will be created by trigger, but ensuring it exists)
INSERT INTO profiles (
  id,
  email,
  name,
  created_at,
  updated_at
) VALUES (
  '5ea389fd-b35d-4a40-803a-b2b009e80b99'::uuid,
  'jp2@laiki.co',
  'Jp2',
  '2025-08-24 15:13:25.902376+00'::timestamptz,
  '2025-08-24 15:13:25.902376+00'::timestamptz
) ON CONFLICT (id) DO NOTHING;

-- Create admin membership for Juan in Acme
WITH org_info AS (SELECT id FROM organizations WHERE name = 'Acme'),
     user_info AS (SELECT id FROM auth.users WHERE email = 'jp2@laiki.co')
INSERT INTO memberships (organization_id, profile_id, role, created_at) 
SELECT 
  org_info.id,
  user_info.id,
  'admin',
  NOW()
FROM org_info, user_info;