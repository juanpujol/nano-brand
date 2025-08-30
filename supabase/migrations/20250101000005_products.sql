-- Products: Product Management System
-- This migration sets up products and product images with organization-based access control

-- Create products table
CREATE TABLE products (
  id TEXT PRIMARY KEY DEFAULT generate_nanoid(12),
  organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  reference_images TEXT[] DEFAULT '{}' CHECK (array_length(reference_images, 1) IS NULL OR array_length(reference_images, 1) <= 5),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_images table
CREATE TABLE product_images (
  id TEXT PRIMARY KEY DEFAULT generate_nanoid(12),
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  display_order INTEGER NOT NULL CHECK (display_order >= 1 AND display_order <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure each product can have max 5 images with unique ordering
  UNIQUE(product_id, display_order)
);

-- Create indexes for better query performance
CREATE INDEX idx_products_organization_id ON products (organization_id);
CREATE INDEX idx_products_created_by ON products (created_by);
CREATE INDEX idx_product_images_product_id ON product_images (product_id);
CREATE INDEX idx_product_images_display_order ON product_images (product_id, display_order);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at on products
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Security Definer function to check if user owns product or is org admin
CREATE OR REPLACE FUNCTION can_manage_product(user_id UUID, product_id TEXT)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
AS $$
  SELECT EXISTS(
    SELECT 1 FROM products p 
    WHERE p.id = product_id 
    AND (
      p.created_by = user_id 
      OR is_org_admin(user_id, p.organization_id)
    )
  );
$$;

-- RLS policies for products
-- SELECT: Members can view products in their organizations
CREATE POLICY "Members can view products in their organizations" ON products
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM get_user_organizations((select auth.uid())))
  );

-- INSERT: Members can create products in their organizations
CREATE POLICY "Members can create products in their organizations" ON products
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM get_user_organizations((select auth.uid())))
    AND created_by = (select auth.uid())
  );

-- UPDATE: Only product creator or org admin can update
CREATE POLICY "Only creator or admin can update products" ON products
  FOR UPDATE USING (
    can_manage_product((select auth.uid()), products.id)
  );

-- DELETE: Only product creator or org admin can delete
CREATE POLICY "Only creator or admin can delete products" ON products
  FOR DELETE USING (
    can_manage_product((select auth.uid()), products.id)
  );

-- RLS policies for product_images
-- SELECT: Users can view images for products they can access
CREATE POLICY "Users can view product images they have access to" ON product_images
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM products p 
      WHERE p.id = product_images.product_id 
      AND p.organization_id IN (SELECT organization_id FROM get_user_organizations((select auth.uid())))
    )
  );

-- INSERT: Users can add images to products they can manage
CREATE POLICY "Users can add images to manageable products" ON product_images
  FOR INSERT WITH CHECK (
    can_manage_product((select auth.uid()), product_id)
  );

-- UPDATE: Users can update images for products they can manage
CREATE POLICY "Users can update images for manageable products" ON product_images
  FOR UPDATE USING (
    can_manage_product((select auth.uid()), product_id)
  );

-- DELETE: Users can delete images for products they can manage
CREATE POLICY "Users can delete images for manageable products" ON product_images
  FOR DELETE USING (
    can_manage_product((select auth.uid()), product_id)
  );