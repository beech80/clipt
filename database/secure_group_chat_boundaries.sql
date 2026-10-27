BEGIN;
SET LOCAL lock_timeout='5s';
-- LOCAL staged repair based on read-only development policy definitions.
-- Helpers expose only caller-scoped boolean membership, never member records.
CREATE FUNCTION clipt_private.group_access(p_group uuid,p_admin boolean DEFAULT false)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT clipt_private.account_available() AND auth.uid() IS NOT NULL AND (
    EXISTS(SELECT 1 FROM public.group_chats g WHERE g.id=p_group AND g.created_by=auth.uid())
    OR EXISTS(SELECT 1 FROM public.group_chat_members m WHERE m.group_id=p_group
      AND m.user_id=auth.uid() AND (NOT p_admin OR m.role='admin'))
  );
$$;
CREATE FUNCTION clipt_private.group_can_join(p_group uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT clipt_private.account_available() AND EXISTS(SELECT 1 FROM public.group_chats g
    WHERE g.id=p_group AND NOT g.is_private AND NOT clipt_private.blocked_with(g.created_by));
$$;
REVOKE ALL ON FUNCTION clipt_private.group_access(uuid,boolean),clipt_private.group_can_join(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION clipt_private.group_access(uuid,boolean),clipt_private.group_can_join(uuid) TO authenticated;
ALTER TABLE public.group_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY clipt_group_creator_read ON public.group_chats FOR SELECT TO authenticated
  USING(created_by=auth.uid());
-- Replace the recursive policy; restrictive policies alone cannot cure recursion.
DROP POLICY IF EXISTS "Users can view group members" ON public.group_chat_members;
CREATE POLICY clipt_group_member_read ON public.group_chat_members FOR SELECT TO authenticated
  USING(clipt_private.group_access(group_id));
CREATE POLICY clipt_group_member_read_boundary ON public.group_chat_members AS RESTRICTIVE FOR SELECT TO authenticated
  USING(clipt_private.group_access(group_id));
CREATE POLICY clipt_group_member_add ON public.group_chat_members FOR INSERT TO authenticated
  WITH CHECK(clipt_private.group_access(group_id,true));
CREATE POLICY clipt_group_member_add_boundary ON public.group_chat_members AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK((role IN ('member','admin')) AND (
    clipt_private.group_access(group_id,true)
    OR (user_id=auth.uid() AND role='member' AND clipt_private.group_can_join(group_id))));
CREATE POLICY clipt_group_message_read ON public.group_messages AS RESTRICTIVE FOR SELECT TO authenticated
  USING(clipt_private.group_access(group_id));
CREATE POLICY clipt_group_message_send ON public.group_messages AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK(sender_id=auth.uid() AND clipt_private.group_access(group_id)
    AND length(trim(content)) BETWEEN 1 AND 4000 AND coalesce(is_deleted,false)=false AND deleted_by IS NULL);
CREATE POLICY clipt_group_message_edit ON public.group_messages AS RESTRICTIVE FOR UPDATE TO authenticated
  USING(sender_id=auth.uid() AND clipt_private.group_access(group_id))
  WITH CHECK(sender_id=auth.uid() AND clipt_private.group_access(group_id)
    AND length(trim(content)) BETWEEN 1 AND 4000 AND (deleted_by IS NULL OR deleted_by=auth.uid()));
-- Identity, target, timestamps and privileged member roles are never client edits.
REVOKE ALL ON public.group_messages,public.group_chat_members,public.group_chats FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.group_messages,public.group_chat_members,public.group_chats TO authenticated;
GRANT INSERT(sender_id,group_id,content) ON public.group_messages TO authenticated;
GRANT UPDATE(content,is_deleted,deleted_by) ON public.group_messages TO authenticated;
GRANT INSERT(group_id,user_id,role) ON public.group_chat_members TO authenticated;
GRANT INSERT(name,description,created_by,is_private,avatar_url,max_members,chat_rules,custom_emotes,slow_mode_interval) ON public.group_chats TO authenticated;
GRANT UPDATE(name,description,is_private,avatar_url,max_members,chat_rules,custom_emotes,slow_mode_interval) ON public.group_chats TO authenticated;
COMMIT;
