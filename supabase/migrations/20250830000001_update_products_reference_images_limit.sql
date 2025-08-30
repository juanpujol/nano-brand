-- Update products table to allow up to 6 reference images instead of 5

-- Drop the existing constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_reference_images_check;

-- Add the new constraint allowing up to 6 images
ALTER TABLE products ADD CONSTRAINT products_reference_images_check 
  CHECK (array_length(reference_images, 1) IS NULL OR array_length(reference_images, 1) <= 6);