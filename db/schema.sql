CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  category_guess TEXT, -- from folder/filename convention, e.g. 'fox'
  status TEXT NOT NULL DEFAULT 'pending', -- pending | processing | done | failed
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS image_tags (
  id SERIAL PRIMARY KEY,
  image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  attributes TEXT[] NOT NULL,
  caption TEXT NOT NULL,
  confidence NUMERIC(4,3) NOT NULL,
  flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_image_tags_image_id ON image_tags(image_id);
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);

CREATE TABLE IF NOT EXISTS ai_call_costs (
  id SERIAL PRIMARY KEY,
  call_type TEXT NOT NULL, -- 'vision' | 'embedding'
  reference_id INTEGER,    -- image_id or post_id
  input_tokens INTEGER,
  output_tokens INTEGER,
  estimated_cost_usd NUMERIC(10,6),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS image_vectors (
  id SERIAL PRIMARY KEY,
  image_id INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE UNIQUE,
  embedding FLOAT8[] NOT NULL,
  model_used TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS post_vectors (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE UNIQUE,
  embedding FLOAT8[] NOT NULL,
  model_used TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suggestions (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_id INTEGER REFERENCES images(id) ON DELETE SET NULL, -- null when guard rejects everything
  similarity_score NUMERIC(6,5),
  guard_verdict TEXT NOT NULL, -- 'approved' | 'rejected' | 'no_match'
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected (human review)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suggestions_post_id ON suggestions(post_id);