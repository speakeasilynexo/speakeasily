
-- 1) Bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('speak-easily-audio', 'speak-easily-audio', true)
ON CONFLICT (id) DO NOTHING;

-- 2) Public READ somente para este bucket
DROP POLICY IF EXISTS "Public read access for audio assets" ON storage.objects;
CREATE POLICY "Public read access for audio assets"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'speak-easily-audio');

-- 3) Limpar policy de upload desnecessária
DROP POLICY IF EXISTS "Service role upload audio assets" ON storage.objects;
