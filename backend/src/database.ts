import pg from 'pg';
import * as path from 'path';
import * as fs from 'fs';

if (!process.env.DATABASE_URL) {
  try {
    const dotenvPath = path.resolve(process.cwd(), 'backend', '.env');
    if (fs.existsSync(dotenvPath)) {
      const envContent = fs.readFileSync(dotenvPath, 'utf-8');
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        const value = trimmed.slice(eqIndex + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  } catch {}
}

let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL tidak ditemukan.');
    }
    _pool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return _pool;
}

const pool = {
  query: (text: string, params?: any[]) => getPool().query(text, params),
  connect: () => getPool().connect(),
};

export default pool;
