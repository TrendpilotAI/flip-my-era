-- Create credit usage logs table
CREATE TABLE IF NOT EXISTS public.credit_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    credits_used INTEGER NOT NULL CHECK (credits_used > 0),
    operation VARCHAR(200),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_user_id ON public.credit_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_resource ON public.credit_usage_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_credit_usage_logs_created_at ON public.credit_usage_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.credit_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own usage logs" ON public.credit_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow service role full access" ON public.credit_usage_logs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Create function to log credit usage
CREATE OR REPLACE FUNCTION log_credit_usage(
    p_user_id UUID,
    p_resource_type VARCHAR(100),
    p_credits_used INTEGER,
    p_resource_id UUID DEFAULT NULL,
    p_operation VARCHAR(200) DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
    current_balance INTEGER;
BEGIN
    -- Get current balance
    SELECT get_user_credit_balance(p_user_id) INTO current_balance;
    
    -- Check if user has enough credits
    IF current_balance < p_credits_used THEN
        RAISE EXCEPTION 'Insufficient credits. Available: %, Required: %', current_balance, p_credits_used;
    END IF;
    
    -- Log the usage
    INSERT INTO public.credit_usage_logs (
        user_id,
        resource_type,
        resource_id,
        credits_used,
        operation,
        metadata
    ) VALUES (
        p_user_id,
        p_resource_type,
        p_resource_id,
        p_credits_used,
        p_operation,
        p_metadata
    ) RETURNING id INTO log_id;
    
    -- Create usage transaction
    INSERT INTO public.credit_transactions (
        user_id,
        transaction_type,
        credits,
        description,
        metadata
    ) VALUES (
        p_user_id,
        'usage',
        p_credits_used,
        COALESCE(p_operation, 'Credit usage for ' || p_resource_type),
        jsonb_build_object(
            'resource_type', p_resource_type,
            'resource_id', p_resource_id,
            'usage_log_id', log_id
        )
    );
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get user usage statistics
CREATE OR REPLACE FUNCTION get_user_usage_stats(
    p_user_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    resource_type VARCHAR(100),
    total_credits_used BIGINT,
    usage_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cul.resource_type,
        SUM(cul.credits_used)::BIGINT as total_credits_used,
        COUNT(*)::BIGINT as usage_count
    FROM public.credit_usage_logs cul
    WHERE cul.user_id = p_user_id
        AND cul.created_at >= NOW() - INTERVAL '1 day' * p_days
    GROUP BY cul.resource_type
    ORDER BY total_credits_used DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get credit usage history
CREATE OR REPLACE FUNCTION get_credit_usage_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    resource_type VARCHAR(100),
    credits_used INTEGER,
    operation VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        cul.id,
        cul.resource_type,
        cul.credits_used,
        cul.operation,
        cul.created_at
    FROM public.credit_usage_logs cul
    WHERE cul.user_id = p_user_id
    ORDER BY cul.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;