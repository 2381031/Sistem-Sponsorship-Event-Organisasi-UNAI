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

Model saat ini menggunakan TypeORM dan migrasi sederhana dengan `synchronize: true`.
Gunakan hanya untuk pengembangan; pada produksi sebaiknya gunakan migrasi eksplisit.
