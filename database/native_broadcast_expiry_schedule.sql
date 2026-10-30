-- Development operation. No HTTP, credential headers or pg_net queue entries.
-- Run only after native_broadcast_sessions.sql on the reviewed target project.
do $schedule$
declare task bigint;
begin
 if not exists(select 1 from pg_extension where extname='pg_cron') then
  raise exception 'pg_cron is required for native broadcast expiry';
 end if;
 select jobid into task from cron.job where jobname='clipt-native-session-expiry';
 if found then
  perform cron.alter_job(task,schedule=>'* * * * *',command=>'select clipt_private.expire_native_broadcast_sessions();',active=>true);
 else
  perform cron.schedule('clipt-native-session-expiry','* * * * *','select clipt_private.expire_native_broadcast_sessions();');
 end if;
end;
$schedule$;
