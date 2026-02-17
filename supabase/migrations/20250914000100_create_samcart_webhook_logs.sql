-- Create samcart webhook logs table
CREATE TABLE IF NOT EXISTS public.samcart_webhook_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_samcart_webhook_logs_event_type ON public.samcart_webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_samcart_webhook_logs_processed ON public.samcart_webhook_logs(processed);
CREATE INDEX IF NOT EXISTS idx_samcart_webhook_logs_created_at ON public.samcart_webhook_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.samcart_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow service role full access" ON public.samcart_webhook_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_samcart_webhook_logs_updated_at
    BEFORE UPDATE ON public.samcart_webhook_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();