-- Run on the Neon branch/database used by the deployed backend.
-- Adds the missing table without deleting or modifying existing records.
BEGIN;

CREATE TABLE IF NOT EXISTS public.dokumentasi (
  id_dokumentasi SERIAL PRIMARY KEY,
  id_event INTEGER REFERENCES public.event(id_event) ON DELETE CASCADE,
  id_pengguna INTEGER REFERENCES public.users(id_pengguna) ON DELETE CASCADE,
  url_file VARCHAR(500),
  tipe_file VARCHAR(50) DEFAULT 'pdf'
);

COMMIT;

SELECT to_regclass('public.dokumentasi') AS tabel_dokumentasi;
