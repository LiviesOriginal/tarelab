CREATE TABLE IF NOT EXISTS club_log (
  id TEXT PRIMARY KEY,
  book_title TEXT NOT NULL,
  author TEXT NOT NULL,
  status TEXT NOT NULL,
  reader TEXT NOT NULL,
  notes TEXT,
  rating REAL,
  quote TEXT,
  reflection TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_club_log_updated_at
  ON club_log(updated_at DESC);
