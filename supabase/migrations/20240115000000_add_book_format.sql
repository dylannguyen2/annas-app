ALTER TABLE books ADD COLUMN IF NOT EXISTS format text CHECK (format IN ('book', 'ebook', 'audiobook')) DEFAULT 'book';
