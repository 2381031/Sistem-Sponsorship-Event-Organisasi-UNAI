import pg from 'pg';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env') });

let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL tidak ditemukan. Pastikan file .env sudah dikonfigurasi.');
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
