
-- Fix wa_users: change from public to service_role only
DROP POLICY IF EXISTS "Service role can manage wa_users" ON public.wa_users;
CREATE POLICY "Service role can manage wa_users"
  ON public.wa_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Fix wa_state: change from public to service_role only
DROP POLICY IF EXISTS "Service role can manage wa_state" ON public.wa_state;
CREATE POLICY "Service role can manage wa_state"
  ON public.wa_state
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
