
-- 1. account_status enum + profile columns
DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('pending','approved','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS institution TEXT,
  ADD COLUMN IF NOT EXISTS department TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS student_id TEXT,
  ADD COLUMN IF NOT EXISTS account_status public.account_status NOT NULL DEFAULT 'approved';

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS course_code TEXT,
  ADD COLUMN IF NOT EXISTS academic_year TEXT;

ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS join_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS sessions_join_code_key ON public.sessions(join_code) WHERE join_code IS NOT NULL;

-- Allow anyone authenticated to lookup a session by code (needed for redeem RPC SECURITY DEFINER — already covered, but
-- add a permissive SELECT policy for sessions when looking up by join_code is not needed since RPC bypasses RLS)

-- 2. Updated assign_self_role: lecturers start pending
CREATE OR REPLACE FUNCTION public.assign_self_role(_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _role = 'admin' THEN RAISE EXCEPTION 'Cannot self-assign admin'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid) THEN RETURN; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, _role);
  IF _role = 'lecturer' THEN
    UPDATE public.profiles SET account_status = 'pending' WHERE id = _uid;
    INSERT INTO public.lecturer_billing (lecturer_id, status)
    VALUES (_uid, 'inactive') ON CONFLICT (lecturer_id) DO NOTHING;
  END IF;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.assign_self_role(app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_self_role(app_role) TO authenticated;

-- 3. Admin-only lecturer status setter
CREATE OR REPLACE FUNCTION public.set_lecturer_status(_lecturer UUID, _status public.account_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  UPDATE public.profiles SET account_status = _status WHERE id = _lecturer;
  IF _status = 'approved' THEN
    UPDATE public.lecturer_billing SET status = 'trial', updated_at = now() WHERE lecturer_id = _lecturer AND status = 'inactive';
  ELSIF _status = 'suspended' THEN
    UPDATE public.lecturer_billing SET status = 'inactive', updated_at = now() WHERE lecturer_id = _lecturer;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.set_lecturer_status(UUID, public.account_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_lecturer_status(UUID, public.account_status) TO authenticated;

-- 4. Redeem session join code (joins membership + participant, ensures student role)
CREATE OR REPLACE FUNCTION public.redeem_session_code(_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _sess public.sessions;
  _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT * INTO _sess FROM public.sessions WHERE join_code = _code;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid session code'; END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'student')
    ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.class_memberships (class_id, student_id)
  VALUES (_sess.class_id, _uid)
  ON CONFLICT (class_id, student_id) DO NOTHING;

  INSERT INTO public.session_participants (session_id, student_id)
  VALUES (_sess.id, _uid)
  ON CONFLICT DO NOTHING;

  RETURN _sess.id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_session_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_session_code(TEXT) TO authenticated;

-- 5. Ensure unique constraint on session_participants for ON CONFLICT
DO $$ BEGIN
  ALTER TABLE public.session_participants ADD CONSTRAINT session_participants_session_student_key UNIQUE (session_id, student_id);
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL; END $$;
