# Supabase Storage Assets

This folder mirrors the public Supabase Storage bucket used by the WhatsApp
audio flow.

Bucket:

```text
speak-easily-audio
```

Expected upload paths:

```text
speak-easily-audio/coach/*.ogg
speak-easily-audio/phrases/*.ogg
```

When migrating to a new Supabase project, create/apply the migrations first,
then upload these files preserving the relative paths.

Example with the Supabase CLI:

```bash
supabase storage cp supabase/storage/speak-easily-audio/coach/welcome_01.ogg ss:///speak-easily-audio/coach/welcome_01.ogg
supabase storage cp supabase/storage/speak-easily-audio/phrases/hello_01.ogg ss:///speak-easily-audio/phrases/hello_01.ogg
```

Note: `coach/repeat_after_me_01.ogg` is referenced by the webhook code but was
not present in the Lovable Storage export.
