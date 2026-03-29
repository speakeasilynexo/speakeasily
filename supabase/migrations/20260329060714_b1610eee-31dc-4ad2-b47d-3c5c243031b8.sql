
-- Explicitly deny anon and authenticated access to all sensitive tables

-- wa_users: already has service_role policy, add deny for others
CREATE POLICY "Deny anon access to wa_users"
  ON public.wa_users
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny authenticated access to wa_users"
  ON public.wa_users
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- wa_state: already has service_role policy
CREATE POLICY "Deny anon access to wa_state"
  ON public.wa_state
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny authenticated access to wa_state"
  ON public.wa_state
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- wa_events
CREATE POLICY "Deny anon access to wa_events"
  ON public.wa_events
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny authenticated access to wa_events"
  ON public.wa_events
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- audio_usage
CREATE POLICY "Deny anon access to audio_usage"
  ON public.audio_usage
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny authenticated access to audio_usage"
  ON public.audio_usage
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

-- audio_transcription_errors
CREATE POLICY "Deny anon access to audio_transcription_errors"
  ON public.audio_transcription_errors
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny authenticated access to audio_transcription_errors"
  ON public.audio_transcription_errors
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
