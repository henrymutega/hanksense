CREATE OR REPLACE FUNCTION public.admin_set_lecturer_billing(_lecturer uuid, _mode text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;

  IF _mode = 'trial' THEN
    INSERT INTO public.lecturer_billing (lecturer_id, status, activated_at, semester_ends_at, updated_at)
    VALUES (_lecturer, 'trial', now(), now() + interval '7 days', now())
    ON CONFLICT (lecturer_id) DO UPDATE
      SET status = 'trial', activated_at = now(), semester_ends_at = now() + interval '7 days', updated_at = now();
    UPDATE public.profiles SET account_status = 'approved' WHERE id = _lecturer;

  ELSIF _mode = 'active' THEN
    INSERT INTO public.lecturer_billing (lecturer_id, status, activated_at, semester_ends_at, updated_at)
    VALUES (_lecturer, 'active', now(), now() + interval '90 days', now())
    ON CONFLICT (lecturer_id) DO UPDATE
      SET status = 'active', activated_at = now(), semester_ends_at = now() + interval '90 days', updated_at = now();
    UPDATE public.profiles SET account_status = 'approved' WHERE id = _lecturer;

  ELSIF _mode = 'inactive' THEN
    INSERT INTO public.lecturer_billing (lecturer_id, status, activated_at, semester_ends_at, updated_at)
    VALUES (_lecturer, 'inactive', NULL, now(), now())
    ON CONFLICT (lecturer_id) DO UPDATE
      SET status = 'inactive', activated_at = NULL, semester_ends_at = now(), updated_at = now();

  ELSIF _mode = 'suspended' THEN
    INSERT INTO public.lecturer_billing (lecturer_id, status, activated_at, semester_ends_at, updated_at)
    VALUES (_lecturer, 'inactive', NULL, now(), now())
    ON CONFLICT (lecturer_id) DO UPDATE
      SET status = 'inactive', activated_at = NULL, semester_ends_at = now(), updated_at = now();
    UPDATE public.profiles SET account_status = 'suspended' WHERE id = _lecturer;

  ELSE
    RAISE EXCEPTION 'Unknown mode %', _mode;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.lecturer_access_active(_lecturer uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.lecturer_billing b
    WHERE b.lecturer_id = _lecturer
      AND b.status IN ('active','trial')
      AND b.activated_at IS NOT NULL
      AND b.activated_at + (CASE WHEN b.status = 'trial' THEN interval '7 days' ELSE interval '90 days' END) > now()
  )
$function$;