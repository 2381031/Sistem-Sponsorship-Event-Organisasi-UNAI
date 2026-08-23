import pg from 'pg';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { config } from 'dotenv';

const envPaths = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '..', '.env')];
for (const p of envPaths) {
  if (existsSync(p)) { config({ path: p }); break; }
}

const correctPackages = [
  { nama_paket: 'Platinum', persentase_dana: 100, deskripsi_keuntungan: 'Sponsor tunggal kegiatan. Logo eksklusif pada semua media (100%). Dapat menyertakan media promosi, brosur, atau sample produk saat kegiatan. Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan oleh moderator. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto. Publikasi di media elektronik dan cetak.' },
  { nama_paket: 'Gold', persentase_dana: 75, deskripsi_keuntungan: 'Logo eksklusif pada semua media (75%). Dapat menyertakan media promosi, brosur, atau sample produk saat kegiatan. Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan oleh moderator. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto serta publikasi di media elektronik dan cetak UNAI.' },
  { nama_paket: 'Silver', persentase_dana: 25, deskripsi_keuntungan: 'Logo eksklusif pada semua media (25%). Dapat menyertakan media promosi, brosur, atau sample produk saat kegiatan. Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan oleh moderator. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto. Publikasi di media elektronik dan cetak UNAI.' },
  { nama_paket: 'Bronze', persentase_dana: 15, deskripsi_keuntungan: 'Logo eksklusif pada semua media (15%). Dapat menyertakan media promosi, brosur, atau sample produk saat kegiatan. Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan oleh moderator. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto. Publikasi di media elektronik dan cetak UNAI.' },
];

async function fixPackages() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) { console.error('DATABASE_URL tidak ditemukan'); process.exit(1); }

  const pool = new pg.Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const events = await client.query('SELECT id_event FROM event');
    console.log(`Ditemukan ${events.rows.length} event`);

    for (const ev of events.rows) {
      const existing = await client.query(
        'SELECT id_paket, nama_paket FROM paket_sponsorship WHERE id_event = $1 ORDER BY id_paket',
        [ev.id_event],
      );

      const existingNames = existing.rows.map((r: any) => r.nama_paket);
      const correctNames = correctPackages.map(p => p.nama_paket);

      const toDelete = existing.rows.filter((r: any) => !correctNames.includes(r.nama_paket));
      for (const d of toDelete) {
        await client.query('DELETE FROM paket_sponsorship WHERE id_paket = $1', [d.id_paket]);
      }

      for (const pkg of correctPackages) {
        const match = existing.rows.find((r: any) => r.nama_paket === pkg.nama_paket);
        if (match) {
          await client.query(
            'UPDATE paket_sponsorship SET persentase_dana = $1, deskripsi_keuntungan = $2 WHERE id_paket = $3',
            [pkg.persentase_dana, pkg.deskripsi_keuntungan, match.id_paket],
          );
        } else {
          await client.query(
            'INSERT INTO paket_sponsorship (id_event, nama_paket, persentase_dana, deskripsi_keuntungan) VALUES ($1, $2, $3, $4)',
            [ev.id_event, pkg.nama_paket, pkg.persentase_dana, pkg.deskripsi_keuntungan],
          );
        }
      }

      const finalCount = await client.query('SELECT COUNT(*) FROM paket_sponsorship WHERE id_event = $1', [ev.id_event]);
      console.log(`Event #${ev.id_event}: ${toDelete.length} dihapus, ${finalCount.rows[0].count} paket tersisa`);
    }

    await client.query('COMMIT');
    console.log('Selesai!');
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Gagal:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

fixPackages();
