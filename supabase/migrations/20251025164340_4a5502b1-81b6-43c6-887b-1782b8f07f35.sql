-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the matured investments processing function to run every 6 hours
SELECT cron.schedule(
  'process-matured-investments',
  '0 */6 * * *', -- Run every 6 hours
  $$
  SELECT
    net.http_post(
        url:='https://suovyfsyyfnfynbqlvav.supabase.co/functions/v1/process-matured-investments',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1b3Z5ZnN5eWZuZnluYnFsdmF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMDY2NjQsImV4cCI6MjA3NTc4MjY2NH0.mFeD_wAC0XiZUphkClvxZF9Lwxp0ueXXQ3LfBJHxAwQ"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);