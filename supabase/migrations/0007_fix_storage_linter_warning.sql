-- =============================================================================
-- KENTO LEAGUE · JARVIS HACKATHON 3.0
-- 0007_fix_storage_linter_warning.sql
-- Resolves Supabase Security Linter warning 0025: public_bucket_allows_listing
-- =============================================================================

-- Drop the overly broad SELECT policy that allowed arbitrary clients to list all files in avatars bucket.
-- Public buckets do not need a SELECT policy for public image URLs (e.g. getPublicUrl).
DROP POLICY IF EXISTS "anyone can view avatars" ON storage.objects;

-- Allow authenticated trainers to view/list their own avatar folder if needed, and staff to inspect
CREATE POLICY "trainers view own avatar"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars' 
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.is_staff()
  )
);
