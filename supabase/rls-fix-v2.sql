-- Make RLS more permissive for squad functionality

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Members can view squad members" ON public.squad_members;
DROP POLICY IF EXISTS "Members can view squad members" ON public.squads;

-- Allow anyone authenticated to view squad members
CREATE POLICY "Anyone authenticated can view squad members" ON public.squad_members
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow anyone authenticated to view squads
CREATE POLICY "Anyone authenticated can view squads" ON public.squads
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow anyone to delete their own squad membership
CREATE POLICY "Users can leave squad" ON public.squad_members
  FOR DELETE USING (auth.uid() = user_id);

-- Allow anyone authenticated to view profiles
CREATE POLICY "Anyone authenticated can view profiles" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
