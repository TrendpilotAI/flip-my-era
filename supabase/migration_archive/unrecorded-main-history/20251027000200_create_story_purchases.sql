-- Create table to track purchased story generation slots
CREATE TABLE IF NOT EXISTS public.story_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('short-story', 'novella')),
  status VARCHAR(30) NOT NULL DEFAULT 'unused' CHECK (status IN ('unused', 'used', 'expired')),
  stripe_session_id VARCHAR(255),
  stripe_payment_intent VARCHAR(255),
  amount_paid_cents INTEGER,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  ebook_generation_id UUID REFERENCES public.ebook_generations(id),
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_story_purchases_user_id ON public.story_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_story_purchases_status ON public.story_purchases(status);
CREATE INDEX IF NOT EXISTS idx_story_purchases_stripe_session ON public.story_purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_story_purchases_purchased_at ON public.story_purchases(purchased_at DESC);

-- Enable RLS
ALTER TABLE public.story_purchases ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own purchases" ON public.story_purchases
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Service role can manage purchases" ON public.story_purchases
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Add token tracking to ebook_generations if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ebook_generations' AND column_name='total_tokens_used') THEN
        ALTER TABLE public.ebook_generations ADD COLUMN total_tokens_used INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ebook_generations' AND column_name='estimated_cost_usd') THEN
        ALTER TABLE public.ebook_generations ADD COLUMN estimated_cost_usd DECIMAL(10,4);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='ebook_generations' AND column_name='story_purchase_id') THEN
        ALTER TABLE public.ebook_generations ADD COLUMN story_purchase_id UUID REFERENCES public.story_purchases(id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ebook_generations_story_purchase ON public.ebook_generations(story_purchase_id);

-- Function to get user's available story slots
CREATE OR REPLACE FUNCTION get_user_story_slots(p_user_id TEXT, p_product_type VARCHAR)
RETURNS INTEGER AS $$
DECLARE
    slot_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO slot_count
    FROM public.story_purchases
    WHERE user_id = p_user_id
      AND product_type = p_product_type
      AND status = 'unused'
      AND (expires_at IS NULL OR expires_at > NOW());
    
    RETURN COALESCE(slot_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;