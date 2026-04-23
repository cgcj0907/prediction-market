-- Supabase Schema for Prediction Market

-- 1. Create a custom profiles table (optional, to link wallet addresses or store extra info for web2 users)
CREATE TABLE public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  wallet_address text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Function to automatically create a profile on new user signup (Google/GitHub Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- 2. Create the markets table to index/cache smart contract data
CREATE TABLE public.markets (
  id bigint primary key, -- The on-chain market ID
  question text not null,
  creator text not null, -- The wallet address of the creator
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null,
  settled_at timestamp with time zone,
  settled boolean default false,
  outcome text, -- "YES" or "NO"
  total_yes_pool numeric default 0,
  total_no_pool numeric default 0
);

-- Enable RLS for markets
ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the markets (since blockchain data is public)
CREATE POLICY "Markets are viewable by everyone."
  ON public.markets FOR SELECT USING (true);

-- Usually, only an authenticated Oracle service account should insert/update this table.
-- For demo purposes, we can allow authenticated users or a specific service role to insert.
CREATE POLICY "Authenticated users can insert markets"
  ON public.markets FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update markets"
  ON public.markets FOR UPDATE TO authenticated USING (true);

-- 3. (Optional) Create a predictions/bets table if you want to track user bets off-chain
CREATE TABLE public.predictions (
  id uuid default gen_random_uuid() primary key,
  market_id bigint references public.markets(id) on delete cascade not null,
  user_id uuid references public.profiles(id) not null,
  wallet_address text not null,
  prediction text not null, -- "YES" or "NO"
  amount numeric not null,
  claimed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Predictions are viewable by everyone"
  ON public.predictions FOR SELECT USING (true);

CREATE POLICY "Users can insert their own predictions"
  ON public.predictions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
