-- Create tables for storing published era images

-- Ensure profiles has role column (needed for admin policies below)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- Staging environment images
CREATE TABLE IF NOT EXISTS public.era_images_staging (
  id TEXT PRIMARY KEY,
  collection TEXT NOT NULL, -- 'hero', 'era', or 'prompt'
  section_index INTEGER NOT NULL,
  title TEXT,
  url TEXT NOT NULL,
  original_url TEXT,
  seed INTEGER,
  score INTEGER,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Production environment images
CREATE TABLE IF NOT EXISTS public.era_images (
  id TEXT PRIMARY KEY,
  collection TEXT NOT NULL, -- 'hero', 'era', or 'prompt'
  section_index INTEGER NOT NULL,
  title TEXT,
  url TEXT NOT NULL,
  original_url TEXT,
  seed INTEGER,
  score INTEGER,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_era_images_staging_collection 
  ON public.era_images_staging(collection);
  
CREATE INDEX IF NOT EXISTS idx_era_images_staging_published_at 
  ON public.era_images_staging(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_era_images_collection 
  ON public.era_images(collection);
  
CREATE INDEX IF NOT EXISTS idx_era_images_published_at 
  ON public.era_images(published_at DESC);

-- Create storage buckets for images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('era-images-staging', 'era-images-staging', true),
  ('era-images', 'era-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies
ALTER TABLE public.era_images_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.era_images ENABLE ROW LEVEL SECURITY;

-- Policy for staging: authenticated users can insert/update
CREATE POLICY "Authenticated users can manage staging images"
  ON public.era_images_staging
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy for production: only admins can insert/update
CREATE POLICY "Only admins can manage production images"
  ON public.era_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.jwt() ->> 'sub'
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.jwt() ->> 'sub'
      AND profiles.role = 'admin'
    )
  );

-- Public read access for both tables
CREATE POLICY "Public read access for staging images"
  ON public.era_images_staging
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public read access for production images"
  ON public.era_images
  FOR SELECT
  TO anon
  USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_era_images_staging_updated_at
  BEFORE UPDATE ON public.era_images_staging
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_era_images_updated_at
  BEFORE UPDATE ON public.era_images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create a view for easily accessing the latest images
CREATE OR REPLACE VIEW public.latest_era_images AS
SELECT 
  e.*,
  CASE 
    WHEN e.collection = 'hero' THEN 1
    WHEN e.collection = 'era' THEN 2
    WHEN e.collection = 'prompt' THEN 3
    ELSE 4
  END as collection_order
FROM public.era_images e
WHERE e.approved_at IS NOT NULL
ORDER BY collection_order, e.section_index;

-- Grant access to the view
GRANT SELECT ON public.latest_era_images TO anon, authenticated;
