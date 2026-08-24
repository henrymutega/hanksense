
-- Pipeline stage enum
DO $$ BEGIN
  CREATE TYPE public.candidate_stage AS ENUM ('applied','ai_screened','assessment','shortlisted','interview','offer','hired','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.job_status AS ENUM ('draft','posted','closed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- session_jobs
CREATE TABLE IF NOT EXISTS public.session_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  lecturer_id UUID NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  employment_type TEXT,
  location TEXT,
  work_mode TEXT,
  seniority TEXT,
  openings INT NOT NULL DEFAULT 1,
  summary TEXT,
  responsibilities TEXT[] NOT NULL DEFAULT '{}',
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  preferred_skills TEXT[] NOT NULL DEFAULT '{}',
  education TEXT,
  experience TEXT,
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_currency TEXT DEFAULT 'USD',
  benefits TEXT[] NOT NULL DEFAULT '{}',
  interview_stages TEXT[] NOT NULL DEFAULT '{}',
  bias_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  status public.job_status NOT NULL DEFAULT 'posted',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_jobs TO authenticated;
GRANT ALL ON public.session_jobs TO service_role;

ALTER TABLE public.session_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_jobs: lecturer manages own"
  ON public.session_jobs FOR ALL TO authenticated
  USING (public.owns_class(class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.owns_class(class_id, auth.uid()) AND lecturer_id = auth.uid());

CREATE POLICY "session_jobs: class member reads"
  ON public.session_jobs FOR SELECT TO authenticated
  USING (public.is_class_member(class_id, auth.uid()));

-- session_candidates
CREATE TABLE IF NOT EXISTS public.session_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.session_jobs(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  cv_text TEXT,
  cv_summary TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  experience_years NUMERIC,
  score NUMERIC NOT NULL DEFAULT 0,
  ai_explanation TEXT,
  matching_skills TEXT[] NOT NULL DEFAULT '{}',
  missing_skills TEXT[] NOT NULL DEFAULT '{}',
  recommendation TEXT,
  stage public.candidate_stage NOT NULL DEFAULT 'applied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_candidates TO authenticated;
GRANT ALL ON public.session_candidates TO service_role;

ALTER TABLE public.session_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "session_candidates: lecturer manages own"
  ON public.session_candidates FOR ALL TO authenticated
  USING (public.owns_class(class_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.owns_class(class_id, auth.uid()));

CREATE POLICY "session_candidates: class member reads"
  ON public.session_candidates FOR SELECT TO authenticated
  USING (public.is_class_member(class_id, auth.uid()));

-- touch updated_at
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_session_jobs_touch ON public.session_jobs;
CREATE TRIGGER trg_session_jobs_touch BEFORE UPDATE ON public.session_jobs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS trg_session_candidates_touch ON public.session_candidates;
CREATE TRIGGER trg_session_candidates_touch BEFORE UPDATE ON public.session_candidates
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX IF NOT EXISTS idx_session_jobs_session ON public.session_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_session_jobs_class ON public.session_jobs(class_id);
CREATE INDEX IF NOT EXISTS idx_session_candidates_job ON public.session_candidates(job_id);
CREATE INDEX IF NOT EXISTS idx_session_candidates_session ON public.session_candidates(session_id);
