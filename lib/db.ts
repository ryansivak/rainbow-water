const DB_PATH = process.env.DB_PATH || 'D:\\Rainbow_Water\\app\\db\\rainbow.db';

let _db: any = null;

export function getDb(): any | null {
  if (_db) return _db;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3');
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    return _db;
  } catch {
    return null;
  }
}
