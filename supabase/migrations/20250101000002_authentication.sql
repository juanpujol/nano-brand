-- Authentication System: Profiles and User Management
-- This migration sets up the core authentication and user profile system

-- Create profiles table that extends auth.users
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create function to automatically create profile on user signup
-- This is the final version that includes display_name update
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  -- Generate name from email prefix or use metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    INITCAP(SPLIT_PART(NEW.email, '@', 1))
  );
  
  -- Insert into profiles table
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, user_name);
  
  -- Update the auth.users display_name
  UPDATE auth.users 
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('display_name', user_name)
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger to call the function on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create function to handle auth.users metadata updates
CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if raw_user_meta_data was updated and contains display_name OR if email changed
  IF (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data 
      AND NEW.raw_user_meta_data ? 'display_name') 
     OR OLD.email IS DISTINCT FROM NEW.email THEN
    
    -- Update the profiles table with the new display_name and/or email
    UPDATE public.profiles 
    SET 
      name = COALESCE(NEW.raw_user_meta_data->>'display_name', name),
      email = NEW.email,
      updated_at = NOW()
    WHERE id = NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create trigger for auth.users updates
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_auth_user_updated();

-- Create trigger for updated_at on profiles
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Basic RLS policies for profiles (organization policy will be added later)
-- Note: Combined SELECT policy will be added in organizations migration

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING ((select auth.uid()) = id);