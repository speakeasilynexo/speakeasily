-- Add subscription_status to wa_users
ALTER TABLE public.wa_users 
ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial' 
CHECK (subscription_status IN ('free', 'trial', 'paid'));

-- Create wa_events table for telemetry
CREATE TABLE public.wa_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    wa_id text NOT NULL,
    event_type text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_wa_events_wa_id ON public.wa_events(wa_id);
CREATE INDEX idx_wa_events_event_type ON public.wa_events(event_type);
CREATE INDEX idx_wa_events_created_at ON public.wa_events(created_at DESC);

-- Enable RLS
ALTER TABLE public.wa_events ENABLE ROW LEVEL SECURITY;

-- Service role policy for wa_events
CREATE POLICY "Service role can manage wa_events" 
ON public.wa_events 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);