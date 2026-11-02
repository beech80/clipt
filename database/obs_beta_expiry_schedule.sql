-- No private key, service key, JWT, webhook secret or stream credential is sent
-- through pg_net. The public endpoint can only claim expired, rate-limited work.
select cron.schedule('clipt-obs-provider-expiry','* * * * *',
 $job$select net.http_post(
  url:='https://slnjliheyiiummxhrgmk.supabase.co/functions/v1/obs-broadcast-session?operation=expire',
  headers:='{"Content-Type":"application/json"}'::jsonb,
  body:='{}'::jsonb,
  timeout_milliseconds:=60000
 );$job$);
