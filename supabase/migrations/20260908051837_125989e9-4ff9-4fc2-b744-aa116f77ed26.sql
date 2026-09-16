
CREATE OR REPLACE FUNCTION public.can_access_candidate(_cand uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.session_candidates c
    WHERE c.id = _cand
      AND (public.owns_class(c.class_id, _user)
           OR public.owns_session_job(c.job_id, _user)
           OR public.has_role(_user, 'admin'))
  )
$$;

CREATE TABLE public.onboarding_plans (
  candidate_id uuid PRIMARY KEY REFERENCES public.session_candidates(id) ON DELETE CASCADE,
  start_date date NOT NULL DEFAULT (now()::date + 7),
  manager text,
  buddy text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_plans TO authenticated;
GRANT ALL ON public.onboarding_plans TO service_role;
ALTER TABLE public.onboarding_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Onboarding plans: manage accessible candidates"
  ON public.onboarding_plans FOR ALL TO authenticated
  USING (public.can_access_candidate(candidate_id, auth.uid()))
  WITH CHECK (public.can_access_candidate(candidate_id, auth.uid()));

CREATE TABLE public.onboarding_task_state (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES public.session_candidates(id) ON DELETE CASCADE,
  task_key text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, task_key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_task_state TO authenticated;
GRANT ALL ON public.onboarding_task_state TO service_role;
ALTER TABLE public.onboarding_task_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Onboarding tasks: manage accessible candidates"
  ON public.onboarding_task_state FOR ALL TO authenticated
  USING (public.can_access_candidate(candidate_id, auth.uid()))
  WITH CHECK (public.can_access_candidate(candidate_id, auth.uid()));

CREATE TRIGGER trg_onboarding_plans_touch BEFORE UPDATE ON public.onboarding_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER trg_onboarding_task_state_touch BEFORE UPDATE ON public.onboarding_task_state
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
