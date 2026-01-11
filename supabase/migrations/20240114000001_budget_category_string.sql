ALTER TABLE budget_transactions ADD COLUMN IF NOT EXISTS category text;

UPDATE budget_transactions t
SET category = c.name
FROM budget_categories c
WHERE t.category_id = c.id AND t.category IS NULL;

CREATE INDEX IF NOT EXISTS idx_budget_transactions_category ON budget_transactions(category);
