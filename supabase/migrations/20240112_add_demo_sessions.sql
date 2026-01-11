CREATE TABLE IF NOT EXISTS demo_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demo_sessions_token ON demo_sessions(token);
CREATE INDEX IF NOT EXISTS idx_demo_sessions_owner_id ON demo_sessions(owner_id);

ALTER TABLE demo_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own demo sessions" ON demo_sessions;
CREATE POLICY "Users can read own demo sessions" ON demo_sessions
  FOR SELECT USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can create own demo sessions" ON demo_sessions;
CREATE POLICY "Users can create own demo sessions" ON demo_sessions
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own demo sessions" ON demo_sessions;
CREATE POLICY "Users can update own demo sessions" ON demo_sessions
  FOR UPDATE USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Anyone can read active demo sessions by token" ON demo_sessions;
CREATE POLICY "Anyone can read active demo sessions by token" ON demo_sessions
  FOR SELECT USING (
    ended_at IS NULL 
    AND expires_at > NOW()
  );
