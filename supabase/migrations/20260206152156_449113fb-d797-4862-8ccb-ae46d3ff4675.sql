-- Add i18n columns to wa_users (only if not present)
-- preferred_language: 'pt'|'es'|'en'
-- show_translations: boolean default true (partial translations for PT/ES)
-- ui_language_locked: boolean default false (optional)

ALTER TABLE public.wa_users
ADD COLUMN IF NOT EXISTS preferred_language text NULL,
ADD COLUMN IF NOT EXISTS show_translations boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS ui_language_locked boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.wa_users.preferred_language IS 'User preferred language: pt, es, en';
COMMENT ON COLUMN public.wa_users.show_translations IS 'Show partial translations in exercises (true for PT/ES by default)';
COMMENT ON COLUMN public.wa_users.ui_language_locked IS 'Language selection is locked after first choice';