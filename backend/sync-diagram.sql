-- Sinkronisasi database Neon dengan diagram database final.
-- Tidak menghapus users, organisasi, sponsor, event, paket, transaksi, atau dokumentasi.
BEGIN;

-- Fitur notifikasi sudah dihapus dari aplikasi dan diagram.
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Website hanya merupakan data profil sponsor.
ALTER TABLE public.sponsor
  ADD COLUMN IF NOT EXISTS website VARCHAR(500);

-- Admin memiliki tabel profil sendiri dan tetap terhubung ke users.
CREATE TABLE IF NOT EXISTS public.admin (
  id_pengguna INTEGER PRIMARY KEY
    REFERENCES public.users(id_pengguna) ON DELETE CASCADE,
  nama_admin VARCHAR(255) NOT NULL
);

INSERT INTO public.admin (id_pengguna, nama_admin)
SELECT id_pengguna, COALESCE(NULLIF(nama_lengkap, ''), 'Administrator')
FROM public.users
WHERE peran = 'Admin'
ON CONFLICT (id_pengguna) DO UPDATE
SET nama_admin = EXCLUDED.nama_admin;

-- Samakan nilai lama dengan status yang digunakan aplikasi.
UPDATE public.users
SET status_akun = 'Aktif'
WHERE status_akun = 'Terverifikasi';

UPDATE public.event
SET status_event = 'Dipublikasikan'
WHERE status_event IN ('open', 'published', 'terbuka');

UPDATE public.transaksi_sponsorship
SET status_pembayaran = 'Menunggu'
WHERE status_pembayaran IN ('pending_verification', 'pending', 'Menunggu Verifikasi');

COMMIT;

-- Pemeriksaan hasil:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT a.id_pengguna, a.nama_admin, u.email, u.peran, u.status_akun
-- FROM admin a JOIN users u ON u.id_pengguna = a.id_pengguna;