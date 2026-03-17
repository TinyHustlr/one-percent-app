-- Allow authenticated users to read entries for leaderboard
CREATE POLICY "Anyone can view entries for leaderboard" ON public.entries
  FOR SELECT USING (auth.role() = 'authenticated');
