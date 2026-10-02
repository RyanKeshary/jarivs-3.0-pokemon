/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase project URL, e.g. https://abcdefgh.supabase.co */
  readonly VITE_SUPABASE_URL: string;
  /**
   * The publishable ("anon") key. Safe in the browser: every request it makes
   * runs as the `anon`/`authenticated` role and is filtered by RLS.
   * The secret key must never be given a VITE_ prefix - see .env.example.
   */
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
