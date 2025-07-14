-- Create ebook_generations table
CREATE TABLE IF NOT EXISTS public.ebook_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  story_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  status TEXT DEFAULT 'completed',
  credits_used INTEGER DEFAULT 1,
  paid_with_credits BOOLEAN DEFAULT true,
  transaction_id TEXT,
  story_type TEXT,
  chapter_count INTEGER,
  word_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_ebook_generations_user_id ON public.ebook_generations(user_id);
CREATE INDEX IF NOT EXISTS idx_ebook_generations_story_id ON public.ebook_generations(story_id);
CREATE INDEX IF NOT EXISTS idx_ebook_generations_created_at ON public.ebook_generations(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ebook_generations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see only their own ebook generations
CREATE POLICY "Users can view their own ebook generations" ON public.ebook_generations
  FOR SELECT USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own ebook generations
CREATE POLICY "Users can insert their own ebook generations" ON public.ebook_generations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own ebook generations
CREATE POLICY "Users can update their own ebook generations" ON public.ebook_generations
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own ebook generations
CREATE POLICY "Users can delete their own ebook generations" ON public.ebook_generations
  FOR DELETE USING (auth.uid() = user_id);