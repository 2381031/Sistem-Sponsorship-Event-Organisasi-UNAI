import pg from 'pg';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

const envPaths = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '..', '.env')];
for (const p of envPaths) {
  if (existsSync(p)) { config({ path: p }); break; }
}

async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
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

    const schemaPaths = [
      resolve(process.cwd(), 'schema.sql'),
      resolve(__dirname, '..', 'schema.sql'),
    ];
    let schema: string | null = null;
    for (const sp of schemaPaths) {
      if (existsSync(sp)) { schema = readFileSync(sp, 'utf-8'); break; }
    }
    if (!schema) { throw new Error('schema.sql tidak ditemukan'); }

    await client.query(schema);
    console.log('Schema berhasil dibuat!');

    const adminPassword = await bcrypt.hash('admin3107', 10);
    await client.query(
      `INSERT INTO users (email, kata_sandi, nama_lengkap, peran, status_akun)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE SET kata_sandi = $2, peran = $4, status_akun = $5`,
      ['admin@unai.edu', adminPassword, 'Administrator', 'admin', 'Terverifikasi'],
    );
    console.log('Admin user berhasil dibuat (admin@unai.edu / admin3107)');

    client.release();
    console.log('Database berhasil diinisialisasi!');
  } catch (err: any) {
    console.error('Gagal menginisialisasi database:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
