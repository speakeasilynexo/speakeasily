-- Add prefers_audio column to wa_users for audio preference
ALTER TABLE public.wa_users ADD COLUMN IF NOT EXISTS prefers_audio BOOLEAN DEFAULT false;