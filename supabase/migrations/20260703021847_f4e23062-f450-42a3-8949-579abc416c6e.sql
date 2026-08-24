
CREATE OR REPLACE FUNCTION public.lecturer_can_read_student(_student_id uuid, _lecturer_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_memberships cm
    JOIN public.classes c ON c.id = cm.class_id
    WHERE cm.student_id = _student_id AND c.lecturer_id = _lecturer_id
  )
$$;

DROP POLICY IF EXISTS "Profiles: lecturer reads students" ON public.profiles;
CREATE POLICY "Profiles: lecturer reads students"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.lecturer_can_read_student(id, auth.uid()));
