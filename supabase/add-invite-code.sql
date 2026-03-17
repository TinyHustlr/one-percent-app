-- Add invite_code column if it doesn't exist
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS invite_code TEXT;

-- Update any squads without invite codes
UPDATE public.squads 
SET invite_code = LOWER(SUBSTRING(MD5(random()::text) FROM 1 FOR 8))
WHERE invite_code IS NULL OR invite_code = '';
