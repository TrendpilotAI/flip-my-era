BEGIN;

-- API provider credentials must only be accessible from trusted server code.
DROP POLICY IF EXISTS "Enable insert access for all users" ON public.api_settings;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.api_settings;
DROP POLICY IF EXISTS "Enable update access for all users" ON public.api_settings;
DROP POLICY IF EXISTS "Service role can manage API settings" ON public.api_settings;

REVOKE ALL PRIVILEGES ON TABLE public.api_settings FROM anon, authenticated;

ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_settings FORCE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage API settings"
  ON public.api_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.api_settings IS
  'Deprecated credential store. Access is restricted to service_role pending provider-key rotation and removal.';

COMMIT;
