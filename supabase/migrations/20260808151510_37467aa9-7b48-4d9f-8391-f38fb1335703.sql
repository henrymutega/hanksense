ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS description text;

CREATE OR REPLACE FUNCTION public.job_is_lecturer_posted(_job_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.session_jobs j WHERE j.id = _job_id AND j.created_by = j.lecturer_id)
$$;

DROP POLICY IF EXISTS "session_jobs: class member reads" ON public.session_jobs;
CREATE POLICY "session_jobs: class member reads" ON public.session_jobs
FOR SELECT TO authenticated
USING (
  public.is_class_member(class_id, auth.uid())
  AND (created_by = auth.uid() OR created_by = lecturer_id)
);

DROP POLICY IF EXISTS "session_candidates: class member reads" ON public.session_candidates;
CREATE POLICY "session_candidates: class member reads" ON public.session_candidates
FOR SELECT TO authenticated
USING (
  public.is_class_member(class_id, auth.uid())
  AND (public.owns_session_job(job_id, auth.uid()) OR public.job_is_lecturer_posted(job_id))
);

CREATE OR REPLACE FUNCTION public.enforce_student_job_cap()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _count int;
BEGIN
  IF NEW.created_by = NEW.lecturer_id THEN RETURN NEW; END IF;
  IF public.has_role(NEW.created_by, 'admin') THEN RETURN NEW; END IF;
  SELECT count(*) INTO _count
    FROM public.session_jobs j
   WHERE j.created_by = NEW.created_by
     AND j.lecturer_id = NEW.lecturer_id;
  IF _count >= 3 THEN
    RAISE EXCEPTION 'Student job limit reached (max 3 posts per lecturer)';
  END IF;
  RETURN NEW;
END $$;