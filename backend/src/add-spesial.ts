import pg from 'pg';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

const envPaths = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '..', '.env')];
for (const p of envPaths) {
  if (existsSync(p)) { config({ path: p }); break; }
}

async function addSpesial() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  const events = await pool.query('SELECT id_event FROM event');
  for (const ev of events.rows) {
    const exists = await pool.query("SELECT id_paket FROM paket_sponsorship WHERE id_event = $1 AND nama_paket = 'Spesial'", [ev.id_event]);
    if (exists.rows.length === 0) {
      await pool.query(
        "INSERT INTO paket_sponsorship (id_event, nama_paket, persentase_dana, deskripsi_keuntungan) VALUES ($1, 'Spesial', 0, 'Bentuk kerjasama finansial dengan kontribusi sukarela dari sponsor. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto. Publikasi di media elektronik dan cetak HIMA dan BEM.')",
        [ev.id_event],
      );
      console.log(`Event #${ev.id_event}: Spesial ditambahkan`);
    }
  }
  console.log('Selesai');
  await pool.end();
}

addSpesial();
