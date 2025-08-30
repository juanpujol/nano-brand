-- Storage policies for multi-tenant organization access
-- These policies allow organization members to upload/access files in their org folder

-- Policy for uploading files: Users can upload to their organization folders
CREATE POLICY "Users can upload to their organization folders"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'storage' AND 
  (split_part(name, '/', 1)) IN (
    SELECT organization_id FROM get_user_organizations(auth.uid())
  )
);

-- Policy for viewing files: Users can view files from their organizations  
CREATE POLICY "Users can view files from their organizations"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'storage' AND 
  (split_part(name, '/', 1)) IN (
    SELECT organization_id FROM get_user_organizations(auth.uid())
  )
);

-- Policy for updating files (needed for upsert): Users can update files in their orgs
CREATE POLICY "Users can update files from their organizations" 
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'storage' AND 
  (split_part(name, '/', 1)) IN (
    SELECT organization_id FROM get_user_organizations(auth.uid())
  )
);

-- Policy for deleting files: Only org admins can delete files
CREATE POLICY "Only org admins can delete files"
ON storage.objects  
FOR DELETE
TO authenticated
USING (
  bucket_id = 'storage' AND 
  is_org_admin(auth.uid(), split_part(name, '/', 1))
);