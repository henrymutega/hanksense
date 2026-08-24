
-- Trigger: auto-grant admin role when the designated admin email appears in profiles
CREATE OR REPLACE FUNCTION public.auto_grant_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF lower(NEW.email) = 'hmutega@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    NEW.account_status := 'approved';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_grant_admin ON public.profiles;
CREATE TRIGGER trg_auto_grant_admin
BEFORE INSERT OR UPDATE OF email ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.auto_grant_admin();

-- Backfill: if Henry already exists, ensure admin role + approved status
DO $$
DECLARE _uid uuid;
BEGIN
  SELECT id INTO _uid FROM public.profiles WHERE lower(email) = 'hmutega@gmail.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin')
      ON CONFLICT (user_id, role) DO NOTHING;
    UPDATE public.profiles SET account_status = 'approved' WHERE id = _uid;
  END IF;
END $$;
