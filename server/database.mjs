import { mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export function openDatabase(path) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec("PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL;");
  db.exec(readFileSync(new URL("./schema.sql", import.meta.url), "utf8"));

  const insertParticipant = db.prepare(`
    INSERT INTO participants (name, email, linkedin, created_at)
    VALUES (?, ?, ?, ?) ON CONFLICT (email) DO NOTHING
  `);
  const countParticipants = db.prepare("SELECT count(*) AS total FROM participants");
  const pageParticipants = db.prepare(`
    SELECT id, name, email, linkedin AS linkedIn, created_at AS createdAt
    FROM participants ORDER BY id DESC LIMIT ? OFFSET ?
  `);
  const exportParticipants = db.prepare(`
    SELECT name, email, linkedin AS linkedIn, created_at AS createdAt
    FROM participants ORDER BY id
  `);
  const removeExpired = db.prepare("DELETE FROM request_limits WHERE expires_at <= ?");
  const recordAttempt = db.prepare(`
    INSERT INTO request_limits (bucket, hits, expires_at) VALUES (?, 1, ?)
    ON CONFLICT (bucket) DO UPDATE SET hits = hits + 1 RETURNING hits
  `);

  return {
    addParticipant({ name, email, linkedIn }) {
      insertParticipant.run(name, email, linkedIn, new Date().toISOString());
    },
    participants(page, pageSize) {
      return {
        total: countParticipants.get().total,
        rows: pageParticipants.all(pageSize, (page - 1) * pageSize),
        pageSize,
      };
    },
    exportRows() {
      return exportParticipants.iterate();
    },
    countAttempt(bucket, period, limit) {
      const now = Date.now();
      const expires = (Math.floor(now / period) + 1) * period;
      removeExpired.run(now);
      const { hits } = recordAttempt.get(bucket + ":" + expires, expires);
      return hits <= limit;
    },
  };
}
