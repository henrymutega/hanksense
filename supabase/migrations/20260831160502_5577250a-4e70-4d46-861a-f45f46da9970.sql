
-- Admin-only activation for a new 90-day period
CREATE OR REPLACE FUNCTION public.admin_activate_lecturer(_lecturer uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  INSERT INTO public.lecturer_billing (lecturer_id, status, semester_ends_at, updated_at)
  VALUES (_lecturer, 'active', now() + interval '90 days', now())
  ON CONFLICT (lecturer_id) DO UPDATE
    SET status = 'active', semester_ends_at = now() + interval '90 days', updated_at = now();
  UPDATE public.profiles SET account_status = 'approved' WHERE id = _lecturer;
END;
$$;

-- Approval starts the 90-day window
CREATE OR REPLACE FUNCTION public.set_lecturer_status(_lecturer uuid, _status account_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  UPDATE public.profiles SET account_status = _status WHERE id = _lecturer;
  IF _status = 'approved' THEN
    INSERT INTO public.lecturer_billing (lecturer_id, status, semester_ends_at, updated_at)
    VALUES (_lecturer, 'active', now() + interval '90 days', now())
    ON CONFLICT (lecturer_id) DO UPDATE
      SET status = 'active', semester_ends_at = now() + interval '90 days', updated_at = now();
  ELSIF _status = 'suspended' THEN
    UPDATE public.lecturer_billing SET status = 'inactive', updated_at = now() WHERE lecturer_id = _lecturer;
  END IF;
END;
$$;

-- Access check: active/trial AND not past the 90-day end date
CREATE OR REPLACE FUNCTION public.lecturer_access_active(_lecturer uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.lecturer_billing b
    WHERE b.lecturer_id = _lecturer
      AND b.status IN ('active','trial')
      AND b.semester_ends_at > now()
  )
$$;

-- Lecturers may no longer extend their own period; admins only
DROP POLICY IF EXISTS "Billing: lecturer updates own" ON public.lecturer_billing;
CREATE POLICY "Billing: admin updates" ON public.lecturer_billing
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Expire lapsed periods (idempotent maintenance statement)
UPDATE public.lecturer_billing SET status = 'expired', updated_at = now()
  WHERE status IN ('active','trial') AND semester_ends_at <= now();
