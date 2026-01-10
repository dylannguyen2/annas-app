CREATE TABLE period_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  flow_intensity TEXT CHECK (flow_intensity IN ('spotting', 'light', 'medium', 'heavy')),
  symptoms TEXT[] DEFAULT '{}',
  notes TEXT,
  is_period_day BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE cycle_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  average_cycle_length INTEGER DEFAULT 28,
  average_period_length INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_period_logs_user_id ON period_logs(user_id);
CREATE INDEX idx_period_logs_date ON period_logs(date);
CREATE INDEX idx_period_logs_user_date ON period_logs(user_id, date DESC);

ALTER TABLE period_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cycle_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own period logs" ON period_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own period logs" ON period_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own period logs" ON period_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own period logs" ON period_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own cycle settings" ON cycle_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cycle settings" ON cycle_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cycle settings" ON cycle_settings
  FOR UPDATE USING (auth.uid() = user_id);
