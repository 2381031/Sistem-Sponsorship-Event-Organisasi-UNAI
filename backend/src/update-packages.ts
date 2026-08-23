import pg from 'pg';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

const envPaths = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '..', '.env')];
for (const p of envPaths) {
  if (existsSync(p)) { config({ path: p }); break; }
}

const newPackages = [
  { nama_paket: 'Platinum', persentase_dana: 100, deskripsi_keuntungan: 'Sponsor tunggal kegiatan. Logo eksklusif pada semua media (100%). Dapat menyertakan media promosi/brosur/sample produk saat kegiatan. Ucapan penghargaan saat sambutan pembukaan & penutupan. Mendapatkan dokumentasi video & foto. Publikasi di media elektronik dan cetak.' },
  { nama_paket: 'Gold', persentase_dana: 75, deskripsi_keuntungan: 'Logo eksklusif pada semua media (75%). Dapat menyertakan media promosi/brosur/sample produk saat kegiatan. Ucapan penghargaan saat sambutan pembukaan & penutupan. Mendapatkan dokumentasi video & foto. Publikasi di media elektronik dan cetak UNAI.' },
  { nama_paket: 'Silver', persentase_dana: 25, deskripsi_keuntungan: 'Logo eksklusif pada semua media (25%). Dapat menyertakan media promosi/brosur/sample produk saat kegiatan. Ucapan penghargaan saat sambutan pembukaan & penutupan. Mendapatkan dokumentasi video & foto. Publikasi di media elektronik dan cetak UNAI.' },
  { nama_paket: 'Bronze', persentase_dana: 15, deskripsi_keuntungan: 'Logo eksklusif pada semua media (15%). Dapat menyertakan media promosi/brosur/sample produk saat kegiatan. Ucapan penghargaan saat sambutan pembukaan & penutupan. Mendapatkan dokumentasi video & foto. Publikasi di media elektronik dan cetak UNAI.' },
  { nama_paket: 'Spesial', persentase_dana: 0, deskripsi_keuntungan: 'Donasi sukarela (sesuai kemampuan sponsor). Mendapatkan dokumentasi kegiatan berupa video & foto. Publikasi di media elektronik dan cetak HIMA dan BEM.' },
];

async function updatePackages() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) { console.error('DATABASE_URL tidak ditemukan'); process.exit(1); }

  const pool = new pg.Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const events = await client.query('SELECT id_event FROM event');
    console.log(`Ditemukan ${events.rows.length} event`);

    for (const ev of events.rows) {
      const existing = await client.query('SELECT id_paket, nama_paket FROM paket_sponsorship WHERE id_event = $1 ORDER BY id_paket', [ev.id_event]);
      
      if (existing.rows.length >= 5) {
        for (let i = 0; i < 5; i++) {
          await client.query(
            'UPDATE paket_sponsorship SET nama_paket = $1, persentase_dana = $2, deskripsi_keuntungan = $3 WHERE id_paket = $4',
            [newPackages[i].nama_paket, newPackages[i].persentase_dana, newPackages[i].deskripsi_keuntungan, existing.rows[i].id_paket],
          );
        }
        console.log(`Event #${ev.id_event}: 5 paket di-update`);
      } else {
        for (const pkg of newPackages) {
          await client.query(
            'INSERT INTO paket_sponsorship (id_event, nama_paket, persentase_dana, deskripsi_keuntungan) VALUES ($1, $2, $3, $4)',
            [ev.id_event, pkg.nama_paket, pkg.persentase_dana, pkg.deskripsi_keuntungan],
          );
        }
        console.log(`Event #${ev.id_event}: 5 paket baru ditambahkan`);
      }
    }

    await client.query('COMMIT');
    console.log('Semua paket berhasil diupdate!');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Gagal:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

updatePackages();
