-- Add trial and subscription fields to wa_users
ALTER TABLE public.wa_users 
ADD COLUMN IF NOT EXISTS trial_started_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS trial_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS trial_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_subscribed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subscription_plan text;

-- Add review_count_today to wa_state for limiting free review
-- (stored in data JSONB, no column needed)

-- Create index for trial queries
CREATE INDEX IF NOT EXISTS idx_wa_users_trial ON public.wa_users (trial_completed, is_subscribed);

COMMENT ON COLUMN public.wa_users.trial_started_at IS 'When the 7-day trial started';
COMMENT ON COLUMN public.wa_users.trial_expires_at IS 'When the trial expires (trial_started_at + 7 days)';
COMMENT ON COLUMN public.wa_users.trial_completed IS 'True when Day 7 is completed';
COMMENT ON COLUMN public.wa_users.is_subscribed IS 'Placeholder for Stripe subscription status';
COMMENT ON COLUMN public.wa_users.subscription_plan IS 'mensual|trimestral|semestral - placeholder for Stripe';