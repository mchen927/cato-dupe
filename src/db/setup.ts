import * as SQLite from 'expo-sqlite';

const DB_NAME = 'cato.db';

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Get (or create) the database connection.
 *
 * expo-sqlite gives us a local SQLite database that lives on the phone.
 * Think of it like a tiny, file-based SQL database embedded in the app --
 * no server needed. Data survives app restarts and updates.
 *
 * We use a singleton pattern here: the first call opens the database,
 * every subsequent call returns the same connection. This avoids opening
 * multiple connections which can cause locking issues.
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await _db.execAsync('PRAGMA journal_mode = WAL;');
  await createTables(_db);
  return _db;
}

/**
 * Create all tables if they don't already exist.
 *
 * IF NOT EXISTS means this is safe to call every time the app starts --
 * it only creates tables that are missing, never overwrites existing data.
 *
 * These match the data model from docs/02-architecture.md.
 */
async function createTables(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      dueAt       INTEGER,
      type        TEXT NOT NULL DEFAULT 'fixedTime',
      notifyId    TEXT,
      completedAt INTEGER,
      lang        TEXT NOT NULL DEFAULT 'en',
      createdAt   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS habits (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      emoji       TEXT NOT NULL DEFAULT '✨',
      createdAt   INTEGER NOT NULL,
      archivedAt  INTEGER
    );

    CREATE TABLE IF NOT EXISTS checkins (
      id          TEXT PRIMARY KEY,
      habitId     TEXT NOT NULL,
      date        TEXT NOT NULL,
      createdAt   INTEGER NOT NULL,
      FOREIGN KEY (habitId) REFERENCES habits(id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id          TEXT PRIMARY KEY,
      role        TEXT NOT NULL,
      text        TEXT NOT NULL,
      createdAt   INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_checkins_habit_date
      ON checkins(habitId, date);

    CREATE INDEX IF NOT EXISTS idx_tasks_dueAt
      ON tasks(dueAt);

    CREATE INDEX IF NOT EXISTS idx_messages_createdAt
      ON messages(createdAt);
  `);
}
