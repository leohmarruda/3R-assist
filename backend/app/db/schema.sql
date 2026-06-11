-- Source of truth for SQLite schema (see spec.md 2.6)

CREATE TABLE IF NOT EXISTS methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    three_r_class TEXT NOT NULL CHECK (three_r_class IN ('replacement', 'reduction', 'refinement')),
    endpoint TEXT,
    application_area TEXT,
    jurisdiction TEXT NOT NULL CHECK (jurisdiction IN ('brazil', 'international', 'both')),
    source_urls TEXT NOT NULL,
    validation_status TEXT,
    embedding BLOB,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_seen_at TEXT
);

CREATE TABLE IF NOT EXISTS queries (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id),
    protocol_text TEXT,
    extracted_params TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS recommendations (
    id TEXT PRIMARY KEY,
    query_id TEXT NOT NULL REFERENCES queries(id),
    method_id TEXT NOT NULL REFERENCES methods(id),
    rank INTEGER NOT NULL,
    score REAL NOT NULL,
    matched_params TEXT
);

CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    recommendation_id TEXT NOT NULL REFERENCES recommendations(id),
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS method_suggestions (
    id TEXT PRIMARY KEY,
    submitted_by TEXT,
    name TEXT NOT NULL,
    source_url TEXT,
    three_r_class TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
