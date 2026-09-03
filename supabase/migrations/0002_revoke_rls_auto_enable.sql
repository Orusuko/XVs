-- Revoke Data API access to a leftover SECURITY DEFINER helper.
-- It was callable as POST /rest/v1/rpc/rls_auto_enable by anon and authenticated.

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
