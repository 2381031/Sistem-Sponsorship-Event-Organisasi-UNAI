import pg from 'pg';
import * as path from 'path';
import * as fs from 'fs';

const resolveDatabaseUrl = () => {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const candidates = [
    process.env.DATABASE_SISTEM_SPONSORSHIP_POSTGRES_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.DATABASE_SISTEM_SPONSORSHIP_POSTGRES_DATABASE,
    process.env.DATABASE_SISTEM_SPONSORSHIP_DATABASE_URL,
  ];
  return candidates.find(Boolean);
};

if (!process.env.DATABASE_URL) {
  const defaultDatabaseUrl = resolveDatabaseUrl();
  if (defaultDatabaseUrl) process.env.DATABASE_URL = defaultDatabaseUrl;

  try {
    const dotenvPaths = [
      path.resolve(process.cwd(), 'backend', '.env'),
      path.resolve(process.cwd(), '.env'),
      path.resolve(__dirname, '..', '.env'),
      path.resolve(__dirname, '..', '..', '.env'),
    ];
    const dotenvPath = dotenvPaths.find((candidate) => fs.existsSync(candidate));
    if (dotenvPath) {
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

  if (!process.env.DATABASE_URL) {
    const fallbackDatabaseUrl = resolveDatabaseUrl();
    if (fallbackDatabaseUrl) process.env.DATABASE_URL = fallbackDatabaseUrl;
  }
}

let _pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!_pool) {
    const connectionString = resolveDatabaseUrl();
    if (!connectionString) {
      throw new Error('DATABASE_URL tidak ditemukan. Tambahkan DATABASE_URL atau DATABASE_SISTEM_SPONSORSHIP_POSTGRES_URL di Vercel env.');
    }
    process.env.DATABASE_URL = connectionString;
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
