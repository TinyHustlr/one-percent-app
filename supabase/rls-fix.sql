-- Allow squad members to view other members' profiles
CREATE POLICY "Squad members can view member profiles" ON public.profiles
  FOR SELECT USING (
    id IN (
      SELECT user_id FROM public.squad_members 
      WHERE squad_id IN (
        SELECT squad_id FROM public.squad_members WHERE user_id = auth.uid()
      )
    )
  );
