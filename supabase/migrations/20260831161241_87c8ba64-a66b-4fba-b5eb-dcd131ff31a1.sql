ALTER TABLE public.lecturer_billing ADD COLUMN IF NOT EXISTS activated_at timestamptz;

-- Backfill: derive the real activation date instead of "now"
UPDATE public.lecturer_billing
SET activated_at = COALESCE(activated_at, LEAST(updated_at, semester_ends_at - interval '90 days'));

-- Re-anchor end dates to exactly 90 days after activation
UPDATE public.lecturer_billing
SET semester_ends_at = activated_at + interval '90 days'
WHERE activated_at IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_lecturer_status(_lecturer uuid, _status account_status)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  UPDATE public.profiles SET account_status = _status WHERE id = _lecturer;

  IF _status = 'approved' THEN
    -- Start a 90-day period only when there is no running one; never restart it.
    INSERT INTO public.lecturer_billing (lecturer_id, status, activated_at, semester_ends_at, updated_at)
    VALUES (_lecturer, 'active', now(), now() + interval '90 days', now())
    ON CONFLICT (lecturer_id) DO UPDATE
      SET status = CASE
            WHEN public.lecturer_billing.activated_at IS NOT NULL
             AND public.lecturer_billing.activated_at + interval '90 days' > now()
            THEN 'active'::subscription_status
            ELSE 'active'::subscription_status
          END,
          activated_at = COALESCE(public.lecturer_billing.activated_at, now()),
          semester_ends_at = COALESCE(public.lecturer_billing.activated_at, now()) + interval '90 days',
          updated_at = now();

  ELSIF _status = 'suspended' THEN
    UPDATE public.lecturer_billing
      SET status = 'inactive', semester_ends_at = now(), updated_at = now()
      WHERE lecturer_id = _lecturer;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_activate_lecturer(_lecturer uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN RAISE EXCEPTION 'Admin only'; END IF;
  INSERT INTO public.lecturer_billing (lecturer_id, status, activated_at, semester_ends_at, updated_at)
  VALUES (_lecturer, 'active', now(), now() + interval '90 days', now())
  ON CONFLICT (lecturer_id) DO UPDATE
    SET status = 'active',
        activated_at = now(),
        semester_ends_at = now() + interval '90 days',
        updated_at = now();
  UPDATE public.profiles SET account_status = 'approved' WHERE id = _lecturer;
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
      AND b.activated_at + interval '90 days' > now()
  )
$function$;