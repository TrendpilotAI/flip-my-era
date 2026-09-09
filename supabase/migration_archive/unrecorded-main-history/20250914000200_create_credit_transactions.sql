-- Create credit transactions table
CREATE TABLE IF NOT EXISTS public.credit_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')),
    credits INTEGER NOT NULL CHECK (credits > 0),
    amount_cents INTEGER,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON public.credit_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first in case they already exist from earlier migrations)
DROP POLICY IF EXISTS "Users can view own transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own transactions" ON public.credit_transactions
    FOR SELECT USING (auth.jwt() ->> 'sub' = user_id);

DROP POLICY IF EXISTS "Allow service role full access" ON public.credit_transactions;
CREATE POLICY "Allow service role full access" ON public.credit_transactions
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Only create trigger, function, and view if this migration's schema was used
-- (i.e. the 'credits' column exists). If credit_transactions was created by
-- 20250629_001_create_credit_system.sql with a different schema, skip these.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'credit_transactions' AND column_name = 'credits') THEN
        -- Create updated_at trigger
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_credit_transactions_updated_at') THEN
            CREATE TRIGGER update_credit_transactions_updated_at
                BEFORE UPDATE ON public.credit_transactions
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        END IF;

        -- Create function to get user credit balance
        EXECUTE $fn$
        CREATE OR REPLACE FUNCTION get_user_credit_balance(user_uuid TEXT)
        RETURNS INTEGER AS $body$
        DECLARE
            total_purchased INTEGER;
            total_used INTEGER;
        BEGIN
            SELECT COALESCE(SUM(credits), 0) INTO total_purchased
            FROM public.credit_transactions
            WHERE user_id = user_uuid
            AND transaction_type IN ('purchase', 'refund', 'bonus');

            SELECT COALESCE(SUM(credits), 0) INTO total_used
            FROM public.credit_transactions
            WHERE user_id = user_uuid
            AND transaction_type = 'usage';

            RETURN GREATEST(total_purchased - total_used, 0);
        END;
        $body$ LANGUAGE plpgsql SECURITY DEFINER;
        $fn$;

        -- Create view for user credit balances
        EXECUTE $view$
        CREATE OR REPLACE VIEW public.user_credit_balances AS
        SELECT
            p.id as user_id,
            COALESCE(SUM(CASE WHEN ct.transaction_type IN ('purchase', 'refund', 'bonus') THEN ct.credits ELSE 0 END), 0) -
            COALESCE(SUM(CASE WHEN ct.transaction_type = 'usage' THEN ct.credits ELSE 0 END), 0) as balance
        FROM public.profiles p
        LEFT JOIN public.credit_transactions ct ON p.id = ct.user_id
        GROUP BY p.id;
        $view$;
    END IF;
END $$;