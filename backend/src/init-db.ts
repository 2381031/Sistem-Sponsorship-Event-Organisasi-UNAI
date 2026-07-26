import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import bcryptjs from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv(): Record<string, string> {
  const envPath = resolve(__dirname, '..', '.env');
  const content = readFileSync(envPath, 'utf-8');
  const env: Record<string, string> = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    env[key] = value;
  }
  return env;
}

async function initDatabase() {
  const env = loadEnv();
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL tidak ditemukan di .env');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('Connected! Running schema.sql...');

    const schemaPath = resolve(__dirname, '..', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    await client.query(schema);
    console.log('Schema berhasil dibuat!');

    const adminPassword = await bcryptjs.hash('admin123', 10);
    await client.query(
      `INSERT INTO users (email, kata_sandi, nama_lengkap, peran, status_akun)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET kata_sandi = $2`,
      ['admin@unai.ac.id', adminPassword, 'Administrator', 'admin', 'Terverifikasi'],
    );
    console.log('Admin user berhasil dibuat (admin@unai.ac.id / admin123)');

    client.release();
    console.log('Database berhasil diinisialisasi!');
  } catch (err) {
    console.error('Gagal menginisialisasi database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
