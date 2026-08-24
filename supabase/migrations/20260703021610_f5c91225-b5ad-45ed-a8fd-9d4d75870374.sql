
-- Helper: does user own the parent session_job (i.e. created it)?
CREATE OR REPLACE FUNCTION public.owns_session_job(_job_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.session_jobs WHERE id = _job_id AND created_by = _user_id)
$$;

-- Auto-fill lecturer_id (from class owner) and created_by (auth.uid()) on session_jobs insert.
CREATE OR REPLACE FUNCTION public.set_session_job_defaults()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _owner uuid;
BEGIN
  IF NEW.created_by IS NULL THEN NEW.created_by := auth.uid(); END IF;
  SELECT lecturer_id INTO _owner FROM public.classes WHERE id = NEW.class_id;
  IF _owner IS NULL THEN RAISE EXCEPTION 'Invalid class'; END IF;
  NEW.lecturer_id := _owner;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_session_jobs_defaults ON public.session_jobs;
CREATE TRIGGER trg_session_jobs_defaults
BEFORE INSERT ON public.session_jobs
FOR EACH ROW EXECUTE FUNCTION public.set_session_job_defaults();

-- Enforce per-student cap of 3 job posts per class.
CREATE OR REPLACE FUNCTION public.enforce_student_job_cap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _count int;
BEGIN
  -- Only cap students (non-owners of the class, non-admins)
  IF NEW.created_by = NEW.lecturer_id THEN RETURN NEW; END IF;
  IF public.has_role(NEW.created_by, 'admin') THEN RETURN NEW; END IF;
  SELECT count(*) INTO _count FROM public.session_jobs
   WHERE class_id = NEW.class_id AND created_by = NEW.created_by;
  IF _count >= 3 THEN
    RAISE EXCEPTION 'Student job limit reached (max 3 posts per class)';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_session_jobs_student_cap ON public.session_jobs;
CREATE TRIGGER trg_session_jobs_student_cap
BEFORE INSERT ON public.session_jobs
FOR EACH ROW EXECUTE FUNCTION public.enforce_student_job_cap();

-- === Student write policies on session_jobs ===
DROP POLICY IF EXISTS "session_jobs: student creates own" ON public.session_jobs;
CREATE POLICY "session_jobs: student creates own"
  ON public.session_jobs FOR INSERT TO authenticated
  WITH CHECK (
    is_class_member(class_id, auth.uid())
    AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "session_jobs: student updates own" ON public.session_jobs;
CREATE POLICY "session_jobs: student updates own"
  ON public.session_jobs FOR UPDATE TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "session_jobs: student deletes own" ON public.session_jobs;
CREATE POLICY "session_jobs: student deletes own"
  ON public.session_jobs FOR DELETE TO authenticated
  USING (created_by = auth.uid());

-- === Student write policies on session_candidates for jobs they created ===
DROP POLICY IF EXISTS "session_candidates: student manages own job" ON public.session_candidates;
CREATE POLICY "session_candidates: student manages own job"
  ON public.session_candidates FOR ALL TO authenticated
  USING (public.owns_session_job(job_id, auth.uid()))
  WITH CHECK (public.owns_session_job(job_id, auth.uid()));
