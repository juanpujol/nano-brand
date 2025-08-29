-- Authentication and user data
-- Exact copy of jp2@laiki.co user that was created through the app

-- Insert exact copy of auth.users record
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  invited_at,
  confirmation_token,
  confirmation_sent_at,
  recovery_token,
  recovery_sent_at,
  email_change_token_new,
  email_change,
  email_change_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at,
  is_sso_user,
  deleted_at,
  is_anonymous
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '5ea389fd-b35d-4a40-803a-b2b009e80b99'::uuid,
  'authenticated',
  'authenticated',
  'jp2@laiki.co',
  '$2a$10$5eC17oE3IZL2.Ga7zcJF7.z7G90JYNsiL5ooEx7ly/SWvL3vkpu/S',
  '2025-08-24 15:13:25.912733+00'::timestamptz,
  NULL,
  '',
  NULL,
  '',
  '2025-08-24 15:13:25.926543+00'::timestamptz,
  '',
  '',
  NULL,
  '2025-08-24 15:13:36.423912+00'::timestamptz,
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"sub": "5ea389fd-b35d-4a40-803a-b2b009e80b99", "email": "jp2@laiki.co", "display_name": "Jp2", "email_verified": true, "phone_verified": false}'::jsonb,
  NULL,
  '2025-08-24 15:13:25.902773+00'::timestamptz,
  '2025-08-24 15:13:36.43538+00'::timestamptz,
  '',
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL,
  false,
  NULL,
  false
);

-- Insert exact copy of auth.identities record
INSERT INTO auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  '11ceae6c-548b-4f97-9ddb-33f88e203038'::uuid,
  '5ea389fd-b35d-4a40-803a-b2b009e80b99'::uuid,
  '5ea389fd-b35d-4a40-803a-b2b009e80b99',
  '{"sub": "5ea389fd-b35d-4a40-803a-b2b009e80b99", "email": "jp2@laiki.co", "display_name": "Jp2", "email_verified": false, "phone_verified": false}'::jsonb,
  'email',
  '2025-08-24 15:13:25.909202+00'::timestamptz,
  '2025-08-24 15:13:25.909254+00'::timestamptz,
  '2025-08-24 15:13:25.909254+00'::timestamptz
);

-- Insert exact copy of auth.sessions records
INSERT INTO auth.sessions (
  id,
  user_id,
  created_at,
  updated_at,
  factor_id,
  aal,
  not_after,
  refreshed_at,
  user_agent,
  ip,
  tag
) VALUES 
(
  'a7ff1b80-6244-41aa-b601-570b0ff13b97'::uuid,
  '5ea389fd-b35d-4a40-803a-b2b009e80b99'::uuid,
  '2025-08-24 15:13:25.915604+00'::timestamptz,
  '2025-08-24 15:13:25.915604+00'::timestamptz,
  NULL,
  'aal1',
  NULL,
  NULL,
  'node',
  '192.168.65.1'::inet,
  ''
),
(
  '53ada386-7cb3-4606-992c-978c7981c3d6'::uuid,
  '5ea389fd-b35d-4a40-803a-b2b009e80b99'::uuid,
  '2025-08-24 15:13:36.424144+00'::timestamptz,
  '2025-08-24 15:13:36.424144+00'::timestamptz,
  NULL,
  'aal1',
  NULL,
  NULL,
  'node',
  '192.168.65.1'::inet,
  ''
);

-- Insert exact copy of auth.refresh_tokens records
INSERT INTO auth.refresh_tokens (
  instance_id,
  id,
  token,
  user_id,
  revoked,
  created_at,
  updated_at,
  parent,
  session_id
) VALUES 
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  2,
  'dfjpl6tcrjmg',
  '5ea389fd-b35d-4a40-803a-b2b009e80b99',
  false,
  '2025-08-24 15:13:25.916559+00'::timestamptz,
  '2025-08-24 15:13:25.916559+00'::timestamptz,
  '',
  'a7ff1b80-6244-41aa-b601-570b0ff13b97'::uuid
),
(
  '00000000-0000-0000-0000-000000000000'::uuid,
  3,
  'gby5n6xexa4o',
  '5ea389fd-b35d-4a40-803a-b2b009e80b99',
  false,
  '2025-08-24 15:13:36.432834+00'::timestamptz,
  '2025-08-24 15:13:36.432834+00'::timestamptz,
  '',
  '53ada386-7cb3-4606-992c-978c7981c3d6'::uuid
);

-- Insert exact copy of auth.flow_state record
INSERT INTO auth.flow_state (
  id,
  user_id,
  auth_code,
  code_challenge_method,
  code_challenge,
  provider_type,
  provider_access_token,
  provider_refresh_token,
  created_at,
  updated_at,
  authentication_method,
  auth_code_issued_at
) VALUES (
  'ea42acc9-c18e-4ad8-837c-0e5e2542502a'::uuid,
  '5ea389fd-b35d-4a40-803a-b2b009e80b99'::uuid,
  '70fa55c6-950f-4e8a-a5d5-9c968eb5dbc6'::uuid,
  's256',
  'JLX3oUz_5jui0odZ4x-OOEk06xhFrKFz1VyTfNhzC8Q',
  'magiclink',
  NULL,
  NULL,
  '2025-08-24 15:13:25.924965+00'::timestamptz,
  '2025-08-24 15:13:25.924965+00'::timestamptz,
  'magiclink',
  NULL
);

-- Insert auth.mfa_amr_claims for OTP authentication
INSERT INTO auth.mfa_amr_claims (
  session_id,
  created_at,
  updated_at,
  authentication_method,
  id
) VALUES 
(
  'a7ff1b80-6244-41aa-b601-570b0ff13b97'::uuid,
  '2025-08-24 15:13:25.915604+00'::timestamptz,
  '2025-08-24 15:13:25.915604+00'::timestamptz,
  'otp',
  gen_random_uuid()
),
(
  '53ada386-7cb3-4606-992c-978c7981c3d6'::uuid,
  '2025-08-24 15:13:36.424144+00'::timestamptz,
  '2025-08-24 15:13:36.424144+00'::timestamptz,
  'otp',
  gen_random_uuid()
);