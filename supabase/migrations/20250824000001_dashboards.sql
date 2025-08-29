-- Dashboards: Dashboard Management System
-- This migration sets up dashboard tables and related functionality

-- Create dashboards table
CREATE TABLE dashboards (
  id TEXT DEFAULT generate_nanoid(12) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id),
  is_private BOOLEAN NOT NULL DEFAULT true,
  period_filter JSONB DEFAULT '{"type": "relative", "value": "thisMonth"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create dashboards_favorites table
CREATE TABLE dashboards_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  membership_id UUID NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(membership_id, dashboard_id)
);

-- Create indexes for performance
CREATE INDEX idx_dashboards_organization_id ON dashboards(organization_id);
CREATE INDEX idx_dashboards_owner_id ON dashboards(owner_id);
CREATE INDEX idx_dashboards_favorites_membership_id ON dashboards_favorites(membership_id);
CREATE INDEX idx_dashboards_favorites_dashboard_id ON dashboards_favorites(dashboard_id);

-- Enable Row Level Security
ALTER TABLE dashboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboards_favorites ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at on dashboards
CREATE TRIGGER dashboards_updated_at
  BEFORE UPDATE ON dashboards
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- RLS Policies for dashboards table

-- SELECT policy: Users can see their own dashboards, admins can see all dashboards in their org, members can see non-private dashboards in their org
CREATE POLICY "Dashboard visibility by owner, admins, or if shared" ON dashboards
  FOR SELECT USING (
    -- Owner can always see their own dashboards
    owner_id = (select auth.uid())
    OR
    -- Admins can see all dashboards in their organization
    is_org_admin((select auth.uid()), dashboards.organization_id)
    OR
    -- Members can see non-private dashboards in organizations they belong to
    (
      NOT is_private 
      AND organization_id IN (SELECT organization_id FROM get_user_organizations((select auth.uid())))
    )
  );

-- INSERT policy: Members can create dashboards in organizations they belong to
CREATE POLICY "Members can create dashboards" ON dashboards
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM get_user_organizations((select auth.uid())))
    AND owner_id = (select auth.uid())
  );

-- UPDATE policy: Users can update their own dashboards, admins can update any dashboard in their org
CREATE POLICY "Dashboards can be updated by owner or admins" ON dashboards
  FOR UPDATE USING (
    owner_id = (select auth.uid())
    OR
    is_org_admin((select auth.uid()), dashboards.organization_id)
  );

-- DELETE policy: Users can delete their own dashboards, admins can delete any dashboard in their org
CREATE POLICY "Dashboards can be deleted by owner or admins" ON dashboards
  FOR DELETE USING (
    owner_id = (select auth.uid())
    OR
    is_org_admin((select auth.uid()), dashboards.organization_id)
  );

-- RLS Policies for dashboards_favorites table

-- SELECT policy: Members can view their own favorites
CREATE POLICY "Members can view their own favorited dashboards" ON dashboards_favorites
  FOR SELECT USING (
    membership_id IN (
      SELECT id FROM memberships 
      WHERE profile_id = (select auth.uid())
    )
  );

-- INSERT policy: Members can favorite dashboards they can see
CREATE POLICY "Members can add visible dashboards to favorites" ON dashboards_favorites
  FOR INSERT WITH CHECK (
    membership_id IN (
      SELECT id FROM memberships 
      WHERE profile_id = (select auth.uid())
    )
    AND
    dashboard_id IN (
      SELECT id FROM dashboards
      WHERE 
        -- Can see own dashboards
        owner_id = (select auth.uid())
        OR
        -- Can see as admin
        is_org_admin((select auth.uid()), dashboards.organization_id)
        OR
        -- Can see non-private dashboards in same org
        (
          NOT is_private 
          AND organization_id IN (
            SELECT m2.organization_id FROM memberships m1
            JOIN memberships m2 ON m1.organization_id = m2.organization_id
            WHERE m1.id = membership_id AND m2.profile_id = (select auth.uid())
          )
        )
    )
  );

-- DELETE policy: Members can remove their own favorites
CREATE POLICY "Members can remove dashboards from their favorites" ON dashboards_favorites
  FOR DELETE USING (
    membership_id IN (
      SELECT m.id FROM memberships m
      WHERE m.profile_id = (select auth.uid())
    )
  );