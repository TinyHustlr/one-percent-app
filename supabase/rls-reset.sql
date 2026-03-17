-- Completely reset RLS for our tables to allow authenticated users full access

-- Disable RLS
ALTER TABLE public.squads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS with permissive policies
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Full access for authenticated users
CREATE POLICY "squads_all" ON public.squads FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "squad_members_all" ON public.squad_members FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "profiles_all" ON public.profiles FOR ALL USING (auth.role() = 'authenticated');
