-- 0013_supabase_hourly_backup_cron.sql
-- Enables pg_net and pg_cron to guarantee automated hourly backups directly from Supabase

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'hourly-automated-database-backup') THEN
    PERFORM cron.unschedule('hourly-automated-database-backup');
  END IF;
END $$;

SELECT cron.schedule(
  'hourly-automated-database-backup',
  '0 * * * *',
  $$SELECT net.http_get('https://indigo-techfest.vercel.app/api/cron/backup');$$
);
