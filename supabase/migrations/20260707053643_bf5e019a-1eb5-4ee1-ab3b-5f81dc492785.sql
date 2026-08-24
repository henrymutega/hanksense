
CREATE OR REPLACE FUNCTION public.validate_student_code(_code text)
RETURNS TABLE(kind text, class_id uuid, class_name text, lecturer_id uuid, lecturer_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _c text := upper(trim(_code));
BEGIN
  -- Try session join_code first
  RETURN QUERY
  SELECT 'session'::text, s.class_id, c.name, c.lecturer_id, p.full_name
  FROM public.sessions s
  JOIN public.classes c ON c.id = s.class_id
  LEFT JOIN public.profiles p ON p.id = c.lecturer_id
  WHERE s.join_code = _c
  LIMIT 1;
  IF FOUND THEN RETURN; END IF;

  -- Then class invites
  RETURN QUERY
  SELECT 'class'::text, ci.class_id, c.name, c.lecturer_id, p.full_name
  FROM public.class_invites ci
  JOIN public.classes c ON c.id = ci.class_id
  LEFT JOIN public.profiles p ON p.id = c.lecturer_id
  WHERE ci.code = _c
    AND (ci.expires_at IS NULL OR ci.expires_at > now())
    AND (ci.max_uses IS NULL OR ci.uses < ci.max_uses)
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_student_code(text) TO anon, authenticated;
