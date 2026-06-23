import Database from 'better-sqlite3';
import path from 'path';

// Absolute path to the shared SQLite database
const DB_PATH = 'D:\\Rainbow_Water\\app\\db\\rainbow.db';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
  }
  return _db;
}
