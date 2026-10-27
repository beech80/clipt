begin;
-- Only newly minimized retention records and completed receipt jobs are purged.
-- Active holds and unfinished erasure jobs are never expired by this schedule.
select cron.schedule('clipt-erasure-retention-expiry','17 3 * * *','select clipt_private.purge_expired_retention();');
commit;
