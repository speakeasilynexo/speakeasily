-- Create enum for user levels
CREATE TYPE public.english_level AS ENUM ('beginner', 'elementary', 'pre_intermediate', 'intermediate', 'upper_intermediate', 'advanced');

-- Create wa_users table for storing WhatsApp user data
CREATE TABLE public.wa_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    wa_id TEXT NOT NULL UNIQUE,
    name TEXT,
    level english_level,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wa_state table for storing conversation state
CREATE TABLE public.wa_state (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    wa_id TEXT NOT NULL UNIQUE REFERENCES public.wa_users(wa_id) ON DELETE CASCADE,
    step TEXT NOT NULL DEFAULT 'welcome',
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.wa_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_state ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access (edge functions use service role)
CREATE POLICY "Service role can manage wa_users"
ON public.wa_users
FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role can manage wa_state"
ON public.wa_state
FOR ALL
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_wa_users_updated_at
    BEFORE UPDATE ON public.wa_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wa_state_updated_at
    BEFORE UPDATE ON public.wa_state
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_wa_users_wa_id ON public.wa_users(wa_id);
CREATE INDEX idx_wa_state_wa_id ON public.wa_state(wa_id);
CREATE INDEX idx_wa_state_step ON public.wa_state(step);