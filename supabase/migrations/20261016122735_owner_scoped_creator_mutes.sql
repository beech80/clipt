-- A private feed preference, not a ban and not a content safety decision.
CREATE TABLE public.user_mutes (
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  muted_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(owner_id,muted_id), CHECK(owner_id<>muted_id)
);
CREATE INDEX user_mutes_target_idx ON public.user_mutes(muted_id);
ALTER TABLE public.user_mutes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_mutes FROM PUBLIC,anon,authenticated;
GRANT SELECT,DELETE ON public.user_mutes TO authenticated;
GRANT INSERT(owner_id,muted_id) ON public.user_mutes TO authenticated;
CREATE POLICY mute_read ON public.user_mutes FOR SELECT TO authenticated
 USING(owner_id=(SELECT auth.uid()) AND (SELECT clipt_private.account_available()));
CREATE POLICY mute_insert ON public.user_mutes FOR INSERT TO authenticated
 WITH CHECK(owner_id=(SELECT auth.uid()) AND (SELECT clipt_private.account_available()));
CREATE POLICY mute_delete ON public.user_mutes FOR DELETE TO authenticated
 USING(owner_id=(SELECT auth.uid()) AND (SELECT clipt_private.account_available()));
INSERT INTO clipt_private.erasure_tables(table_oid,table_name)
 VALUES('public.user_mutes'::regclass::oid,'user_mutes');
