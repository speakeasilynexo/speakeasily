-- Table: audio_transcription_errors
-- Registra falhas de transcrição para análise
CREATE TABLE public.audio_transcription_errors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wa_id TEXT NOT NULL,
  error_code TEXT NOT NULL,
  raw_error TEXT,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audio_transcription_errors ENABLE ROW LEVEL SECURITY;

-- Policy: Service role only
CREATE POLICY "Service role can manage audio_transcription_errors"
ON public.audio_transcription_errors
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Index for querying by user
CREATE INDEX idx_audio_transcription_errors_wa_id ON public.audio_transcription_errors(wa_id);
CREATE INDEX idx_audio_transcription_errors_created_at ON public.audio_transcription_errors(created_at DESC);

-- Table: audio_usage
-- Controla rate limit por usuário e global
CREATE TABLE public.audio_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wa_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audio_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Service role only
CREATE POLICY "Service role can manage audio_usage"
ON public.audio_usage
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Unique index for efficient upsert
CREATE UNIQUE INDEX idx_audio_usage_wa_id_date ON public.audio_usage(wa_id, date);