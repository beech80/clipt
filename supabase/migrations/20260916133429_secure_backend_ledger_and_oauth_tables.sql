BEGIN;
-- These are trusted server state, not user-editable profile resources.
REVOKE ALL ON public.token_transactions, public.stream_oauth_tokens,
  public.rate_limits, public.chat_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.token_transactions, public.stream_oauth_tokens,
  public.rate_limits, public.chat_rate_limits TO service_role;
GRANT SELECT ON public.token_transactions TO authenticated;
CREATE POLICY ledger_owner_read_boundary ON public.token_transactions AS RESTRICTIVE
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
COMMIT;
