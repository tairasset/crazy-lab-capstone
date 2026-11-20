import { DatabaseSync } from 'node:sqlite';

const day = 24 * 60 * 60 * 1000;
const minute = 60 * 1000;

export function createBetaQuota(filename, dailyLimit, now = Date.now) {
  if (!Number.isSafeInteger(dailyLimit) || dailyLimit < 1) throw new Error('The daily guide request limit must be a positive integer.');
  const db = new DatabaseSync(filename);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 1500;
    CREATE TABLE IF NOT EXISTS requests (visitor TEXT NOT NULL, sent_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS requests_by_time ON requests(sent_at);
    CREATE INDEX IF NOT EXISTS requests_by_visitor ON requests(visitor, sent_at);
    CREATE TABLE IF NOT EXISTS cooldown (id INTEGER PRIMARY KEY CHECK (id = 1), until INTEGER NOT NULL);
  `);
  const removeOld = db.prepare('DELETE FROM requests WHERE sent_at <= ?');
  const totalSince = db.prepare('SELECT count(*) AS count FROM requests WHERE sent_at > ?');
  const visitorSince = db.prepare('SELECT count(*) AS count FROM requests WHERE visitor = ? AND sent_at > ?');
  const record = db.prepare('INSERT INTO requests (visitor, sent_at) VALUES (?, ?)');
  const cooldown = db.prepare('SELECT until FROM cooldown WHERE id = 1');
  const setCooldown = db.prepare('INSERT INTO cooldown (id, until) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET until = max(cooldown.until, excluded.until)');

  function reserve(visitor) {
    const time = now();
    db.exec('BEGIN IMMEDIATE');
    try {
      const until = cooldown.get()?.until ?? 0;
      const reason = until > time ? 'provider-cooldown'
        : totalSince.get(time - day).count >= dailyLimit ? 'daily-limit'
        : visitorSince.get(visitor, time - 10 * minute).count >= 3 ? 'visitor-limit'
        : totalSince.get(time - minute).count >= 6 ? 'rate-limit'
        : null;
      if (!reason) {
        removeOld.run(time - day);
        record.run(visitor, time);
      }
      db.exec('COMMIT');
      return reason;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function pause(delay) {
    setCooldown.run(now() + Math.min(day, Math.max(minute, delay || 0)));
  }

  return { reserve, pause };
}
