-- Allow staff and owners to delete profiles
CREATE POLICY "Staff can delete all profiles" ON public.profiles FOR DELETE USING (public.is_staff_or_owner(auth.uid()));
