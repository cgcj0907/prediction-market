-- run this in Supabase SQL editor to create the table for AI probabilities
CREATE TABLE IF NOT EXISTS market_ai_probabilities (
  id BIGSERIAL PRIMARY KEY,
  market_id BIGINT NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
  probability_yes INTEGER NOT NULL CHECK (probability_yes >= 0 AND probability_yes <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_market_ai_probabilities_market_id ON market_ai_probabilities(market_id);

-- Optional RLS
ALTER TABLE market_ai_probabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access to ai probabilities" ON market_ai_probabilities FOR SELECT USING (true);
