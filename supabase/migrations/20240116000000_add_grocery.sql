CREATE TABLE IF NOT EXISTS grocery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit TEXT,
  category TEXT,
  checked BOOLEAN NOT NULL DEFAULT false,
  woolworths_id TEXT,
  woolworths_price DECIMAL(10, 2),
  coles_id TEXT,
  coles_price DECIMAL(10, 2),
  image_url TEXT,
  notes TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS grocery_items_user_id_idx ON grocery_items(user_id);
CREATE INDEX IF NOT EXISTS grocery_items_checked_idx ON grocery_items(user_id, checked);
CREATE INDEX IF NOT EXISTS grocery_items_category_idx ON grocery_items(user_id, category);

ALTER TABLE grocery_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grocery items"
  ON grocery_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grocery items"
  ON grocery_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grocery items"
  ON grocery_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own grocery items"
  ON grocery_items FOR DELETE
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_grocery_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER grocery_items_updated_at
  BEFORE UPDATE ON grocery_items
  FOR EACH ROW
  EXECUTE FUNCTION update_grocery_items_updated_at();

CREATE TABLE IF NOT EXISTS product_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store TEXT NOT NULL CHECK (store IN ('woolworths', 'coles')),
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  price DECIMAL(10, 2),
  unit_price TEXT,
  image_url TEXT,
  category TEXT,
  in_stock BOOLEAN DEFAULT true,
  raw_data JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store, product_id)
);

CREATE INDEX IF NOT EXISTS product_cache_store_idx ON product_cache(store);
CREATE INDEX IF NOT EXISTS product_cache_name_idx ON product_cache USING gin(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS product_cache_fetched_idx ON product_cache(fetched_at);
