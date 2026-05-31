-- SQL Schema para Player Profiles
CREATE TABLE player_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  username TEXT,
  level INTEGER DEFAULT 1,
  hp INTEGER DEFAULT 100,
  position JSONB, -- {x, y, z}
  equipped_items JSONB, -- {head, body, rightHand}
  job TEXT DEFAULT 'Novice',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
