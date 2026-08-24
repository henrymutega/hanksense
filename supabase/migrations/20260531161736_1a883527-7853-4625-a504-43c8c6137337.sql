
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin', 'lecturer', 'student');
CREATE TYPE public.subscription_status AS ENUM ('active', 'inactive', 'trial', 'expired');
CREATE TYPE public.session_status AS ENUM ('scheduled', 'live', 'ended', 'cancelled');

-- =========================
-- PROFILES
-- =========================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =========================
-- USER ROLES (separate table — critical)
-- =========================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- =========================
-- BILLING (lecturers only)
-- =========================
CREATE TABLE public.lecturer_billing (
  lecturer_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'semester',
  status public.subscription_status NOT NULL DEFAULT 'trial',
  semester_ends_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '14 days'),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.lecturer_billing TO authenticated;
GRANT ALL ON public.lecturer_billing TO service_role;
ALTER TABLE public.lecturer_billing ENABLE ROW LEVEL SECURITY;

-- =========================
-- CLASSES
-- =========================
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  semester TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE INDEX classes_lecturer_idx ON public.classes(lecturer_id);

-- =========================
-- CLASS INVITES (short codes)
-- =========================
CREATE TABLE public.class_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  max_uses INT,
  uses INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_invites TO authenticated;
GRANT ALL ON public.class_invites TO service_role;
ALTER TABLE public.class_invites ENABLE ROW LEVEL SECURITY;

-- =========================
-- CLASS MEMBERSHIPS
-- =========================
CREATE TABLE public.class_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);
GRANT SELECT, INSERT, DELETE ON public.class_memberships TO authenticated;
GRANT ALL ON public.class_memberships TO service_role;
ALTER TABLE public.class_memberships ENABLE ROW LEVEL SECURITY;
CREATE INDEX cm_student_idx ON public.class_memberships(student_id);
CREATE INDEX cm_class_idx ON public.class_memberships(class_id);

-- helper: is _user a member of _class
CREATE OR REPLACE FUNCTION public.is_class_member(_class_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.class_memberships WHERE class_id = _class_id AND student_id = _user_id)
$$;

-- helper: lecturer owns class
CREATE OR REPLACE FUNCTION public.owns_class(_class_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.classes WHERE id = _class_id AND lecturer_id = _user_id)
$$;

-- =========================
-- SESSIONS
-- =========================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  status public.session_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sessions TO authenticated;
GRANT ALL ON public.sessions TO service_role;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX sessions_class_idx ON public.sessions(class_id);

CREATE TABLE public.session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, student_id)
);
GRANT SELECT, INSERT, DELETE ON public.session_participants TO authenticated;
GRANT ALL ON public.session_participants TO service_role;
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- =========================
-- POLICIES
-- =========================

-- profiles
CREATE POLICY "Profiles: read own" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Profiles: insert own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "Profiles: update own" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- user_roles
CREATE POLICY "Roles: read own" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
-- (no insert/update/delete for authenticated — only service_role / RPC)

-- lecturer_billing
CREATE POLICY "Billing: lecturer reads own" ON public.lecturer_billing FOR SELECT TO authenticated
  USING (lecturer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Billing: lecturer inserts own" ON public.lecturer_billing FOR INSERT TO authenticated
  WITH CHECK (lecturer_id = auth.uid() AND public.has_role(auth.uid(), 'lecturer'));
CREATE POLICY "Billing: lecturer updates own" ON public.lecturer_billing FOR UPDATE TO authenticated
  USING (lecturer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (lecturer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- classes
CREATE POLICY "Classes: lecturer manages own" ON public.classes FOR ALL TO authenticated
  USING (lecturer_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (lecturer_id = auth.uid() AND public.has_role(auth.uid(), 'lecturer'));
CREATE POLICY "Classes: member can read" ON public.classes FOR SELECT TO authenticated
  USING (public.is_class_member(id, auth.uid()));

-- class_invites
CREATE POLICY "Invites: lecturer manages own" ON public.class_invites FOR ALL TO authenticated
  USING (public.owns_class(class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.owns_class(class_id, auth.uid()));

-- class_memberships
CREATE POLICY "Memberships: student sees own" ON public.class_memberships FOR SELECT TO authenticated
  USING (student_id = auth.uid() OR public.owns_class(class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Memberships: lecturer removes" ON public.class_memberships FOR DELETE TO authenticated
  USING (public.owns_class(class_id, auth.uid()) OR student_id = auth.uid());
-- inserts happen via redeem_class_invite RPC (security definer)

-- sessions
CREATE POLICY "Sessions: lecturer manages own class" ON public.sessions FOR ALL TO authenticated
  USING (public.owns_class(class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.owns_class(class_id, auth.uid()));
CREATE POLICY "Sessions: member can read" ON public.sessions FOR SELECT TO authenticated
  USING (public.is_class_member(class_id, auth.uid()));

-- session_participants
CREATE POLICY "SP: read own or lecturer" ON public.session_participants FOR SELECT TO authenticated
  USING (student_id = auth.uid()
         OR EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND public.owns_class(s.class_id, auth.uid())));
CREATE POLICY "SP: student joins own" ON public.session_participants FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid()
              AND EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id AND public.is_class_member(s.class_id, auth.uid())));
CREATE POLICY "SP: leave own" ON public.session_participants FOR DELETE TO authenticated
  USING (student_id = auth.uid());

-- =========================
-- TRIGGER: create profile on signup
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- RPC: redeem class invite (student joins a class)
-- =========================
CREATE OR REPLACE FUNCTION public.redeem_class_invite(_code TEXT)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _invite public.class_invites;
  _class_id UUID;
  _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _invite FROM public.class_invites WHERE code = _code;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid invite code'; END IF;
  IF _invite.expires_at IS NOT NULL AND _invite.expires_at < now() THEN
    RAISE EXCEPTION 'Invite code expired';
  END IF;
  IF _invite.max_uses IS NOT NULL AND _invite.uses >= _invite.max_uses THEN
    RAISE EXCEPTION 'Invite code fully used';
  END IF;

  -- ensure student role
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'student')
    ON CONFLICT (user_id, role) DO NOTHING;

  -- create membership
  INSERT INTO public.class_memberships (class_id, student_id)
  VALUES (_invite.class_id, _uid)
  ON CONFLICT (class_id, student_id) DO NOTHING;

  UPDATE public.class_invites SET uses = uses + 1 WHERE id = _invite.id;

  RETURN _invite.class_id;
END;
$$;

-- =========================
-- RPC: assign role on signup (lecturer chooses Lecturer; otherwise default student)
-- =========================
CREATE OR REPLACE FUNCTION public.assign_self_role(_role public.app_role)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF _role = 'admin' THEN RAISE EXCEPTION 'Cannot self-assign admin'; END IF;
  -- only allow if user has no role yet
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _uid) THEN RETURN; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (_uid, _role);
  IF _role = 'lecturer' THEN
    INSERT INTO public.lecturer_billing (lecturer_id) VALUES (_uid)
    ON CONFLICT (lecturer_id) DO NOTHING;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.redeem_class_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_self_role(public.app_role) TO authenticated;
