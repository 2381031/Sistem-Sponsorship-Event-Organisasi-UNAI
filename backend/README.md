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
3. Buat file `.env` dengan `DATABASE_URL` untuk PostgreSQL/Neon dan `JWT_SECRET` untuk penandatanganan token. Untuk penyimpanan Vercel Blob, tambahkan `BLOB_READ_WRITE_TOKEN`.
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

Akses PostgreSQL menggunakan `pg` dan query berparameter. `schema.sql` disediakan untuk menyiapkan database baru dan mengandung penghapusan tabel. Jangan jalankan pada database berisi data. Folder `migrations` berisi perubahan skema yang diperlukan aplikasi. `sync-diagram.sql` merupakan skrip pemeliharaan skema lama dan perlu ditinjau sebelum dijalankan, termasuk penghapusan tabel notifikasi lama.

Dokumentasi mendukung JPG, PDF, dan MP4 maksimal 4 MB per file. Untuk Vercel, konfigurasi `BLOB_READ_WRITE_TOKEN`; lokal menggunakan direktori `uploads/dokumentasi`. Proposal event tetap PDF maksimal 10 MB pada validasi aplikasi; batas unggahan hosting juga berlaku.

Jalankan `npm test` untuk pengujian otomatis dengan database simulasi. Pengujian simulasi bukan pengganti uji langsung database dan penyimpanan hosting.
