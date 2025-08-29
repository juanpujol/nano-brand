-- Webhooks: Webhook Management
-- This migration sets up webhooks table for organization webhook configurations

-- Create webhooks table
CREATE TABLE public.webhooks (
  id TEXT PRIMARY KEY DEFAULT generate_nanoid(12),
  organization_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  secret_key TEXT NOT NULL DEFAULT generate_nanoid(24),
  field_mappings JSONB,
  sample_payload JSONB,
  is_active BOOLEAN DEFAULT true,
  capture_next BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT webhooks_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_webhooks_organization_id ON public.webhooks USING btree (organization_id);
CREATE INDEX idx_webhooks_org_id_composite ON public.webhooks USING btree (organization_id, id);

-- Enable Row Level Security
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- Create trigger for updated_at
CREATE TRIGGER webhooks_updated_at
  BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create function to handle automatic capture_next reset
CREATE OR REPLACE FUNCTION public.handle_webhook_capture_reset()
RETURNS TRIGGER AS $$
BEGIN
  -- If capture_next is true and sample_payload was updated (not null), 
  -- automatically set capture_next to false
  IF OLD.capture_next = true 
     AND NEW.sample_payload IS NOT NULL 
     AND (OLD.sample_payload IS DISTINCT FROM NEW.sample_payload) THEN
    NEW.capture_next = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Create trigger to automatically reset capture_next when payload is captured
CREATE TRIGGER webhooks_capture_reset
  BEFORE UPDATE ON webhooks
  FOR EACH ROW EXECUTE PROCEDURE public.handle_webhook_capture_reset();

-- RLS policies for webhooks (admin-only access)
CREATE POLICY "Only admins can view webhooks" ON webhooks
  FOR SELECT USING (
    is_org_admin((select auth.uid()), organization_id)
  );

CREATE POLICY "Only admins can create webhooks" ON webhooks
  FOR INSERT WITH CHECK (
    is_org_admin((select auth.uid()), organization_id)
  );

CREATE POLICY "Only admins can update webhooks" ON webhooks
  FOR UPDATE USING (
    is_org_admin((select auth.uid()), organization_id)
  );

CREATE POLICY "Only admins can delete webhooks" ON webhooks
  FOR DELETE USING (
    is_org_admin((select auth.uid()), organization_id)
  );