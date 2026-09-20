# UNAI Sponsorship Backend

Backend aplikasi sponsorship event UNAI menggunakan NestJS dan PostgreSQL.

## Menjalankan backend

1. Masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Salin file `.env.example` ke `.env` dan konfigurasi `DATABASE_URL` ke NeonDB:
   ```bash
   cp .env.example .env
   ```
4. Jalankan server dalam mode pengembangan:
   ```bash
   npm run start:dev
   ```

## Fitur awal

- Registrasi organisasi
- Registrasi sponsor
- Login pengguna
- Manajemen event organisasi
- Sponsorship event beserta bukti pembayaran
- Verifikasi akun pengguna dan pembayaran sponsorship

## Catatan

Akses PostgreSQL menggunakan `pg` dan query berparameter. Jangan jalankan `schema.sql` atau `init-db.ts` pada database berisi data karena skrip tersebut menyiapkan ulang tabel.

Dokumentasi mendukung JPG, PDF, dan MP4 maksimal 4 MB per file. Untuk Vercel, konfigurasi `BLOB_READ_WRITE_TOKEN`; lokal menggunakan direktori `uploads/dokumentasi`. Proposal event tetap PDF maksimal 10 MB pada validasi aplikasi; batas unggahan hosting juga berlaku.

Notifikasi edit sponsorship disimpan pada tabel tambahan `notifications`. Aplikasi membuat tabel ini dengan `CREATE TABLE IF NOT EXISTS` ketika pertama kali digunakan (akun database memerlukan izin CREATE). Tidak ada penghapusan tabel atau data lama. Perubahan transaksi dan pencatatan notifikasinya menggunakan satu transaksi database.

Jalankan `npm test` untuk pengujian otomatis dengan database simulasi. Daftar pengujian pengguna ada di `../docs/UJI-KEBUTUHAN-JURNAL.md`. Pengujian simulasi bukan pengganti uji langsung database dan penyimpanan hosting.
