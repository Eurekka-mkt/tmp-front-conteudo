/*
  # Create app_dynamic_content table

  1. New Tables
    - `app_dynamic_content`
      - `id` (uuid, primary key) - Unique identifier
      - `type` (text) - Type of content: POP_UP, BANNER, or BUTTON
      - `active` (boolean) - Whether the content is active/visible
      - `link` (text) - URL link for the content
      - `image` (text) - Image URL for the content
      - `description` (text) - Description text for the content
      - `title` (text) - Title text for the content
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `app_dynamic_content` table
    - Add policy for public read access to active content
    - Add policy for authenticated users to manage all content

  3. Notes
    - This table stores dynamic content for the mobile/web app
    - Content can be of three types: POP_UP, BANNER, or BUTTON
    - Only active content should be visible to public users
    - Admin users can create, update, and delete content
*/

-- Create enum type for app content type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_type_enum') THEN
    CREATE TYPE app_type_enum AS ENUM ('POP_UP', 'BANNER', 'BUTTON');
  END IF;
END $$;

-- Create app_dynamic_content table
CREATE TABLE IF NOT EXISTS app_dynamic_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type app_type_enum NOT NULL,
  active boolean DEFAULT false,
  link text,
  image text,
  description text,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE app_dynamic_content ENABLE ROW LEVEL SECURITY;

-- Policy for public to view active content
CREATE POLICY "Public users can view active content"
  ON app_dynamic_content
  FOR SELECT
  USING (active = true);

-- Policy for authenticated users to view all content
CREATE POLICY "Authenticated users can view all content"
  ON app_dynamic_content
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy for authenticated users to insert content
CREATE POLICY "Authenticated users can insert content"
  ON app_dynamic_content
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy for authenticated users to update content
CREATE POLICY "Authenticated users can update content"
  ON app_dynamic_content
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for authenticated users to delete content
CREATE POLICY "Authenticated users can delete content"
  ON app_dynamic_content
  FOR DELETE
  TO authenticated
  USING (true);

-- Create index on type for faster queries
CREATE INDEX IF NOT EXISTS idx_app_dynamic_content_type ON app_dynamic_content(type);

-- Create index on active for faster queries
CREATE INDEX IF NOT EXISTS idx_app_dynamic_content_active ON app_dynamic_content(active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_dynamic_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_app_dynamic_content_timestamp ON app_dynamic_content;
CREATE TRIGGER update_app_dynamic_content_timestamp
  BEFORE UPDATE ON app_dynamic_content
  FOR EACH ROW
  EXECUTE FUNCTION update_app_dynamic_content_updated_at();
