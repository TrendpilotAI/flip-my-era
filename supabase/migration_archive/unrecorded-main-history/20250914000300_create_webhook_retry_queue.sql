-- Create webhook retry queue table
CREATE TABLE IF NOT EXISTS public.webhook_retry_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    webhook_type VARCHAR(100) NOT NULL,
    webhook_id UUID NOT NULL,
    payload JSONB NOT NULL,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_retry_queue_scheduled_at ON public.webhook_retry_queue(scheduled_at)
    WHERE processed = FALSE;
CREATE INDEX IF NOT EXISTS idx_webhook_retry_queue_webhook_type ON public.webhook_retry_queue(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_retry_queue_processed ON public.webhook_retry_queue(processed);

-- Enable RLS
ALTER TABLE public.webhook_retry_queue ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow service role full access" ON public.webhook_retry_queue
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create updated_at trigger
CREATE TRIGGER update_webhook_retry_queue_updated_at
    BEFORE UPDATE ON public.webhook_retry_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to enqueue webhook for retry
CREATE OR REPLACE FUNCTION enqueue_webhook_retry(
    p_webhook_type VARCHAR(100),
    p_webhook_id UUID,
    p_payload JSONB,
    p_retry_count INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
    queue_id UUID;
BEGIN
    INSERT INTO public.webhook_retry_queue (
        webhook_type,
        webhook_id,
        payload,
        retry_count,
        scheduled_at
    ) VALUES (
        p_webhook_type,
        p_webhook_id,
        p_payload,
        p_retry_count,
        NOW() + INTERVAL '1 minute' * POWER(2, p_retry_count) -- Exponential backoff
    ) RETURNING id INTO queue_id;
    
    RETURN queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get pending webhooks for processing
CREATE OR REPLACE FUNCTION get_pending_webhooks(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    id UUID,
    webhook_type VARCHAR(100),
    webhook_id UUID,
    payload JSONB,
    retry_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        wrq.id,
        wrq.webhook_type,
        wrq.webhook_id,
        wrq.payload,
        wrq.retry_count
    FROM public.webhook_retry_queue wrq
    WHERE wrq.processed = FALSE
        AND wrq.scheduled_at <= NOW()
    ORDER BY wrq.scheduled_at ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark webhook as processed
CREATE OR REPLACE FUNCTION mark_webhook_processed(
    p_queue_id UUID,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    IF p_success THEN
        UPDATE public.webhook_retry_queue
        SET processed = TRUE,
            processed_at = NOW(),
            error_message = NULL
        WHERE id = p_queue_id;
    ELSE
        UPDATE public.webhook_retry_queue
        SET retry_count = retry_count + 1,
            scheduled_at = CASE
                WHEN retry_count < max_retries THEN
                    NOW() + INTERVAL '1 minute' * POWER(2, retry_count + 1)
                ELSE
                    NULL
            END,
            error_message = p_error_message,
            updated_at = NOW()
        WHERE id = p_queue_id;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;