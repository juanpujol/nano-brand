-- Organizations and related data

-- Create Acme organization (nanoid will be auto-generated)
INSERT INTO organizations (name, created_at, updated_at) VALUES (
  'Acme',
  NOW(),
  NOW()
);