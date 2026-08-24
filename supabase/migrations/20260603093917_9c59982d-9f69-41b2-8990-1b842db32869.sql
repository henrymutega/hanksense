
-- Lock down SECURITY DEFINER function execution: revoke broad defaults,
-- grant only to roles that legitimately need to call each function.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_class(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_class_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.assign_self_role(public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.redeem_class_invite(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Re-grant to authenticated where needed (RLS policies + client RPCs).
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_class(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_class_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_self_role(public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_class_invite(text) TO authenticated;

-- Belt-and-braces: explicit deny policies on user_roles so even if a future
-- GRANT is added, authenticated users still cannot self-assign roles.
CREATE POLICY "Roles: no self insert" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "Roles: no self update" ON public.user_roles
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY "Roles: no self delete" ON public.user_roles
  FOR DELETE TO authenticated USING (false);
