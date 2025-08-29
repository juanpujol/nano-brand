-- Foundation: Extensions and Core Functions
-- This migration sets up the basic database infrastructure

-- Enable required extensions
CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Core function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';


-- Core function for generating nanoid values
-- Uses alphabet: 0123456789abcdefghijklmnopqrstuvwxyz (lowercase alphanumeric only for consistency)
CREATE OR REPLACE FUNCTION generate_nanoid(size int DEFAULT 12)
RETURNS text AS $$
DECLARE
  alphabet text := '0123456789abcdefghijklmnopqrstuvwxyz';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..size LOOP
    result := result || substr(alphabet, floor(random() * length(alphabet))::int + 1, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = '';