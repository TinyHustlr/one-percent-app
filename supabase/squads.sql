-- Add invite code to squads table
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Generate invite codes for existing squads (optional, for new ones we'll generate on creation)
UPDATE public.squads SET invite_code = LOWER(SUBSTRING(MD5(random()::text) FROM 1 FOR 8));

-- Create function to generate invite code for new squads
CREATE OR REPLACE FUNCTION generate_squad_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invite_code := LOWER(SUBSTRING(MD5(CONCAT(NEW.id, random())::text) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invite code on squad creation
DROP TRIGGER IF EXISTS generate_squad_invite_code ON public.squads;
CREATE TRIGGER generate_squad_invite_code
  BEFORE INSERT ON public.squads
  FOR EACH ROW
  EXECUTE FUNCTION generate_squad_invite_code();

-- Enable RLS on squads and squad_members
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

-- Squads RLS: members can view their squad
CREATE POLICY "Squad members can view their squad" ON public.squads
  FOR SELECT USING (
    id IN (SELECT squad_id FROM public.squad_members WHERE user_id = auth.uid())
  );

-- Squads RLS: users can create squads
CREATE POLICY "Users can create squads" ON public.squads
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Squad members RLS: members can view squad members
CREATE POLICY "Members can view squad members" ON public.squad_members
  FOR SELECT USING (
    squad_id IN (SELECT squad_id FROM public.squad_members WHERE user_id = auth.uid())
  );

-- Squad members RLS: users can join squads
CREATE POLICY "Users can join squads" ON public.squad_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Squad members RLS: users can leave squads
CREATE POLICY "Users can leave squads" ON public.squad_members
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_squad_members_user_id ON public.squad_members(user_id);
CREATE INDEX IF NOT EXISTS idx_squads_invite_code ON public.squads(invite_code);
