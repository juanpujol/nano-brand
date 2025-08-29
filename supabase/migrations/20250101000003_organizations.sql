-- Organizations: Core Organization Management
-- This migration sets up organizations and membership management

-- Create organizations table (without PSP references initially)
CREATE TABLE organizations (
  id TEXT PRIMARY KEY DEFAULT generate_nanoid(12),
  name TEXT NOT NULL,
  website TEXT,
  logo TEXT,
  email TEXT,
  industry TEXT,
  description TEXT CHECK (char_length(description) <= 140),
  brand_voice TEXT[],
  logo_policy TEXT CHECK (logo_policy IN ('always', 'usually', 'rarely')) DEFAULT 'usually',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create memberships table (many-to-many with roles)
CREATE TABLE memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id TEXT REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, profile_id)
);

-- Create indexes on foreign key columns for better query performance
CREATE INDEX idx_memberships_profile_id ON memberships (profile_id);
CREATE INDEX idx_memberships_organization_id ON memberships (organization_id);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Create triggers for updated_at
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Security Definer function to get user organizations (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_organizations(user_id UUID)
RETURNS TABLE(organization_id TEXT) 
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
AS $$
  SELECT m.organization_id FROM memberships m WHERE m.profile_id = user_id;
$$;

-- Security Definer function to check if user is admin in org (bypasses RLS)
CREATE OR REPLACE FUNCTION is_org_admin(user_id UUID, org_id TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
AS $$
  SELECT EXISTS(SELECT 1 FROM memberships m WHERE m.profile_id = user_id AND m.organization_id = org_id AND m.role = 'admin');
$$;

-- Security Definer function to check if membership can be created (bypasses RLS)
CREATE OR REPLACE FUNCTION can_create_membership(org_id TEXT, user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
AS $$
  SELECT (SELECT COUNT(*) FROM memberships WHERE organization_id = org_id) = 0 OR EXISTS(SELECT 1 FROM memberships WHERE organization_id = org_id AND profile_id = user_id AND role = 'admin');
$$;

-- Function to create organization with admin membership atomically
CREATE OR REPLACE FUNCTION create_organization_with_admin(
  org_name TEXT,
  user_id UUID
) RETURNS TEXT
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  new_org_id TEXT;
BEGIN
  -- Generate org ID
  new_org_id := generate_nanoid(12);
  
  -- Create organization
  INSERT INTO organizations (id, name) 
  VALUES (new_org_id, org_name);
  
  -- Create admin membership
  INSERT INTO memberships (organization_id, profile_id, role)
  VALUES (new_org_id, user_id, 'admin');
  
  RETURN new_org_id;
END;
$$;

-- RLS policies for organizations
-- SELECT: Members can only view organizations they belong to
CREATE POLICY "Members can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM get_user_organizations((select auth.uid())))
  );

-- INSERT: Authenticated users can create organizations
CREATE POLICY "Authenticated users can create organizations" ON organizations
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- UPDATE: Only admins can update organization details
CREATE POLICY "Only admins can update organizations" ON organizations
  FOR UPDATE USING (
    is_org_admin((select auth.uid()), organizations.id)
  );

-- DELETE: Only admins can delete organizations
CREATE POLICY "Only admins can delete organizations" ON organizations
  FOR DELETE USING (
    is_org_admin((select auth.uid()), organizations.id)
  );

-- RLS policies for memberships
-- SELECT: Users can view their own memberships and members in their organizations
CREATE POLICY "Users can view memberships in their organizations" ON memberships
  FOR SELECT USING (
    -- Users can always see their own memberships
    profile_id = (select auth.uid())
    OR
    -- Users can see other memberships in organizations they belong to
    organization_id IN (SELECT organization_id FROM get_user_organizations((select auth.uid())))
  );

-- INSERT: Only admins can invite new members (with exception for first admin)
-- First drop existing policy if it exists (in case of redeployment)
DROP POLICY IF EXISTS "Only admins can invite members" ON memberships;

CREATE POLICY "Only admins can invite members" ON memberships
  FOR INSERT WITH CHECK (
    can_create_membership(organization_id, (SELECT auth.uid()))
  );

-- UPDATE: Only admins can update member roles
CREATE POLICY "Only admins can update member roles" ON memberships
  FOR UPDATE USING (
    is_org_admin((select auth.uid()), memberships.organization_id)
  );

-- DELETE: Members can leave, admins can remove any member
CREATE POLICY "Members can leave or admins can remove members" ON memberships
  FOR DELETE USING (
    -- Member can delete their own membership (leave)
    profile_id = (select auth.uid())
    OR
    -- Admin can delete any membership in their org
    is_org_admin((select auth.uid()), memberships.organization_id)
  );

-- Combined RLS policy for profiles (replaces multiple permissive policies for better performance)
CREATE POLICY "Users can view their profile and organization members" ON profiles
  FOR SELECT USING (
    -- Users can view their own profile OR profiles of organization members
    (select auth.uid()) = id 
    OR id IN (
      SELECT m.profile_id FROM memberships m 
      WHERE m.organization_id IN (SELECT organization_id FROM get_user_organizations((select auth.uid())))
    )
  );