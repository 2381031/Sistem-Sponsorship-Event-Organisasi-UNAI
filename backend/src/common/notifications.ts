import pool from '../database';

export const notificationSchema = `CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  id_pengguna INTEGER NOT NULL REFERENCES users(id_pengguna) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMPTZ
)`;

let ready: Promise<unknown> | undefined;
export function ensureNotifications() {
  if (!ready) ready = pool.query(notificationSchema).catch(error => { ready = undefined; throw error; });
  return ready;
}
