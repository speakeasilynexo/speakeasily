
-- Add subscription tracking columns to wa_users
ALTER TABLE public.wa_users
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Index for idempotency check
CREATE UNIQUE INDEX IF NOT EXISTS idx_wa_users_stripe_session_id ON public.wa_users(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
