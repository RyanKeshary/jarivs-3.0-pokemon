-- 0014_stop_supabase_backup_cron.sql
-- Stops and unschedules the automated hourly backup cron in Supabase pg_cron

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hourly-automated-database-backup') THEN
      PERFORM cron.unschedule('hourly-automated-database-backup');
    END IF;
  END IF;
END $$;
