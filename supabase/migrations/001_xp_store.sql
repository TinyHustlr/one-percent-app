-- XP Store Database Setup
-- Run this in your Supabase SQL Editor

-- 1. Add xp column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- 2. Create store_transactions table to log purchases
CREATE TABLE IF NOT EXISTS store_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  target_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create weekly_purchases table to track weekly limits
CREATE TABLE IF NOT EXISTS weekly_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL,
  week_start DATE NOT NULL,
  UNIQUE(user_id, item_id, week_start)
);

-- 4. Enable Row Level Security
ALTER TABLE store_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_purchases ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies
-- Users can only see their own transactions
CREATE POLICY "Users can view own transactions" ON store_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON store_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only see their own weekly purchases
CREATE POLICY "Users can view own weekly purchases" ON weekly_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own weekly purchases" ON weekly_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);
