import pg from 'pg';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

const envPaths = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '..', '.env')];
for (const p of envPaths) {
  if (existsSync(p)) { config({ path: p }); break; }
}

const pkgs = [
  { n: 'Platinum', d: 'Sponsor tunggal kegiatan. Logo eksklusif pada semua media (100%). Dapat menyertakan media promosi, brosur, atau sample produk saat kegiatan. Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan oleh moderator. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto. Publikasi di media elektronik dan cetak.' },
  { n: 'Gold', d: 'Logo eksklusif pada semua media (75%). Dapat menyertakan media promosi, brosur, atau sample produk saat kegiatan. Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan oleh moderator. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto serta publikasi di media elektronik dan cetak UNAI.' },
  { n: 'Silver', d: 'Logo eksklusif pada semua media (25%). Dapat menyertakan media promosi, brosur, atau sample produk saat kegiatan. Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan oleh moderator. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto. Publikasi di media elektronik dan cetak UNAI.' },
  { n: 'Bronze', d: 'Logo eksklusif pada semua media (15%). Dapat menyertakan media promosi, brosur, atau sample produk saat kegiatan. Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan oleh moderator. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto. Publikasi di media elektronik dan cetak UNAI.' },
];

async function updateDesc() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  for (const p of pkgs) {
    await pool.query('UPDATE paket_sponsorship SET deskripsi_keuntungan = $1 WHERE nama_paket = $2', [p.d, p.n]);
  }
  console.log('Deskripsi paket di-update');
  await pool.end();
}

updateDesc();
