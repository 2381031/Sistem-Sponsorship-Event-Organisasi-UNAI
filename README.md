# Sistem Sponsorship Event UNAI

Aplikasi sponsorship event untuk Organisasi, Sponsor, dan Admin. Frontend menggunakan React dan Vite, sedangkan backend menggunakan NestJS dan PostgreSQL.

## Menjalankan lokal

1. Jalankan `npm install` di folder utama dan di folder `backend`.
2. Konfigurasikan `backend/.env` sesuai [panduan backend](backend/README.md).
3. Jalankan `npm run start:dev` di folder `backend`.
4. Jalankan `npm run dev` di folder utama. Vite meneruskan permintaan `/api` ke backend pada port 4000.

## Build dan pengujian

- Frontend: `npm run lint`, `npm test`, dan `npm run build`.
- Backend: `npm test` dan `npm run bundle` dari folder `backend`.
- Pengujian antarmuka: `npm run test:browser`, menggunakan Edge/Chrome dengan API simulasi.

## Deployment

Konfigurasi Vercel tersedia di `vercel.json`. Build menjalankan bundling backend dan build frontend. Atur `DATABASE_URL`, `JWT_SECRET`, serta `BLOB_READ_WRITE_TOKEN` pada environment deployment sesuai panduan backend.

Logo aplikasi berada di `public/unai.png`. Folder sementara, hasil jurnal, dan unggahan lokal dikecualikan dari Git dan deployment Vercel. Skrip SQL demo dan alat perubahan data sekali pakai tidak diperlukan untuk menjalankan website.
