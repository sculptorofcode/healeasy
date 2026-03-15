import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('visits.db');

// Initialize database
db.execSync(
  `CREATE TABLE IF NOT EXISTS visits (
    id TEXT PRIMARY KEY,
    customer_name TEXT NOT NULL,
    contact_person TEXT NOT NULL,
    location TEXT NOT NULL,
    visit_date_time TEXT NOT NULL,
    raw_notes TEXT NOT NULL,
    outcome_status TEXT NOT NULL,
    next_follow_up_date TEXT,
    ai_summary TEXT,
    sync_status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );`
);

console.log('Database initialized');

export { db };