-- Add delete policy for squad members
DROP POLICY IF EXISTS "Users can leave squad" ON public.squad_members;

CREATE POLICY "Users can delete their own membership" ON public.squad_members
  FOR DELETE USING (auth.uid() = user_id);
