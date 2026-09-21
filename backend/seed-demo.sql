-- Idempotent demo data for local/Neon testing. Does not delete existing records.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE sponsor ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE transaksi_sponsorship ADD COLUMN IF NOT EXISTS sponsor_files JSONB NOT NULL DEFAULT '[]'::jsonb;

INSERT INTO users (email, kata_sandi, nama_lengkap, peran, status_akun)
VALUES
  ('admin@unai.edu', crypt('admin3107', gen_salt('bf')), 'Administrator UNAI', 'Admin', 'Aktif'),
  ('demo.org@unai.edu', crypt('demo1234', gen_salt('bf')), 'HIMA Teknologi Informasi', 'Organisasi', 'Aktif'),
  ('bem.demo@unai.edu', crypt('demo1234', gen_salt('bf')), 'BEM Universitas Advent Indonesia', 'Organisasi', 'Aktif'),
  ('ukm.demo@unai.edu', crypt('demo1234', gen_salt('bf')), 'UKM Kreativitas Mahasiswa', 'Organisasi', 'Aktif'),
  ('demo.sponsor@company.com', crypt('demo1234', gen_salt('bf')), 'PT Maju Bersama', 'Sponsor', 'Aktif'),
  ('sponsor2@company.com', crypt('demo1234', gen_salt('bf')), 'CV Kreatif Nusantara', 'Sponsor', 'Aktif'),
  ('pending.sponsor@company.com', crypt('demo1234', gen_salt('bf')), 'PT Menunggu Verifikasi', 'Sponsor', 'Menunggu Verifikasi'),
  ('pending.org@unai.edu', crypt('demo1234', gen_salt('bf')), 'BEM UNAI', 'Organisasi', 'Menunggu Verifikasi')
ON CONFLICT (email) DO UPDATE SET status_akun = EXCLUDED.status_akun;

INSERT INTO organisasi (id_pengguna, nama_organisasi, deskripsi, no_telp, nama_bank, nama_rekening, nomor_rekening)
SELECT id_pengguna, 'HIMA Teknologi Informasi', 'Organisasi demo untuk pengujian sistem sponsorship.', '081234567890', 'BCA', 'HIMA Teknologi Informasi', '1234567890'
FROM users WHERE email = 'demo.org@unai.edu'
ON CONFLICT (id_pengguna) DO NOTHING;

INSERT INTO organisasi (id_pengguna, nama_organisasi, deskripsi, no_telp, nama_bank, nama_rekening, nomor_rekening)
SELECT id_pengguna, 'BEM UNAI', 'Organisasi pending untuk pengujian verifikasi admin.', '081234567891', 'Mandiri', 'BEM UNAI', '9876543210'
FROM users WHERE email = 'pending.org@unai.edu'
ON CONFLICT (id_pengguna) DO NOTHING;

INSERT INTO organisasi (id_pengguna, nama_organisasi, deskripsi, no_telp, nama_bank, nama_rekening, nomor_rekening)
SELECT id_pengguna, 'BEM Universitas Advent Indonesia', 'Badan eksekutif mahasiswa penyelenggara kegiatan kampus.', '081234567893', 'BNI', 'BEM Universitas Advent Indonesia', '2233445566'
FROM users WHERE email = 'bem.demo@unai.edu'
ON CONFLICT (id_pengguna) DO NOTHING;

INSERT INTO organisasi (id_pengguna, nama_organisasi, deskripsi, no_telp, nama_bank, nama_rekening, nomor_rekening)
SELECT id_pengguna, 'UKM Kreativitas Mahasiswa', 'Unit kegiatan mahasiswa bidang seni dan kreativitas.', '081234567894', 'BRI', 'UKM Kreativitas Mahasiswa', '6677889900'
FROM users WHERE email = 'ukm.demo@unai.edu'
ON CONFLICT (id_pengguna) DO NOTHING;

INSERT INTO sponsor (id_pengguna, nama_perusahaan, alamat, no_telp, website)
SELECT id_pengguna, 'PT Maju Bersama', 'Jl. Sudirman No. 10, Jakarta', '081234567892', 'https://maju-bersama.example.com'
FROM users WHERE email = 'demo.sponsor@company.com'
ON CONFLICT (id_pengguna) DO UPDATE SET website = EXCLUDED.website;

INSERT INTO sponsor (id_pengguna, nama_perusahaan, alamat, no_telp, website)
SELECT id_pengguna, 'CV Kreatif Nusantara', 'Jl. Asia Afrika No. 21, Bandung', '081234567895', 'https://kreatif-nusantara.example.com'
FROM users WHERE email = 'sponsor2@company.com'
ON CONFLICT (id_pengguna) DO UPDATE SET website = EXCLUDED.website;

INSERT INTO sponsor (id_pengguna, nama_perusahaan, alamat, no_telp, website)
SELECT id_pengguna, 'PT Menunggu Verifikasi', 'Jl. Gatot Subroto No. 7, Jakarta', '081234567896', 'https://menunggu-verifikasi.example.com'
FROM users WHERE email = 'pending.sponsor@company.com'
ON CONFLICT (id_pengguna) DO UPDATE SET website = EXCLUDED.website;

INSERT INTO event (id_organisasi, nama_event, tanggal_event, deskripsi, target_dana, url_proposal, status_event)
SELECT id_pengguna, 'Tech Innovation Summit UNAI 2026', '2026-11-15', 'Seminar dan workshop teknologi untuk mahasiswa.', 50000000, '/api/uploads/proposals/demo-proposal.pdf', 'Dipublikasikan'
FROM users WHERE email = 'demo.org@unai.edu'
AND NOT EXISTS (SELECT 1 FROM event WHERE nama_event = 'Tech Innovation Summit UNAI 2026');

INSERT INTO event (id_organisasi, nama_event, tanggal_event, deskripsi, target_dana, url_proposal, status_event)
SELECT id_pengguna, 'Festival Seni dan Budaya UNAI 2026', '2026-10-20', 'Pentas seni, bazar kreatif, dan pertunjukan budaya mahasiswa.', 35000000, '/api/uploads/proposals/demo-festival-seni.pdf', 'Dipublikasikan'
FROM users WHERE email = 'bem.demo@unai.edu'
AND NOT EXISTS (SELECT 1 FROM event WHERE nama_event = 'Festival Seni dan Budaya UNAI 2026');

INSERT INTO event (id_organisasi, nama_event, tanggal_event, deskripsi, target_dana, url_proposal, status_event)
SELECT id_pengguna, 'Career Preparation Week', '2026-12-05', 'Pelatihan karier, portfolio review, dan simulasi wawancara kerja.', 25000000, '/api/uploads/proposals/demo-career-week.pdf', 'Dipublikasikan'
FROM users WHERE email = 'ukm.demo@unai.edu'
AND NOT EXISTS (SELECT 1 FROM event WHERE nama_event = 'Career Preparation Week');

INSERT INTO event (id_organisasi, nama_event, tanggal_event, deskripsi, target_dana, url_proposal, status_event)
SELECT id_pengguna, 'Workshop Digital Marketing', '2026-09-30', 'Workshop strategi pemasaran digital untuk UMKM mahasiswa.', 18000000, '/api/uploads/proposals/demo-digital-marketing.pdf', 'Dipublikasikan'
FROM users WHERE email = 'demo.org@unai.edu'
AND NOT EXISTS (SELECT 1 FROM event WHERE nama_event = 'Workshop Digital Marketing');

INSERT INTO event (id_organisasi, nama_event, tanggal_event, deskripsi, target_dana, url_proposal, status_event)
SELECT id_pengguna, 'Riset Kreatif Mahasiswa', '2026-12-20', 'Draft pengajuan kegiatan riset dan pameran karya mahasiswa.', 12000000, '/api/uploads/proposals/demo-riset-kreatif.pdf', 'Draft'
FROM users WHERE email = 'ukm.demo@unai.edu'
AND NOT EXISTS (SELECT 1 FROM event WHERE nama_event = 'Riset Kreatif Mahasiswa');

INSERT INTO paket_sponsorship (id_event, nama_paket, persentase_dana, deskripsi_keuntungan)
SELECT e.id_event, p.nama_paket, p.persentase_dana, p.deskripsi_keuntungan
FROM event e
CROSS JOIN (VALUES
  ('Platinum', 100, 'Logo utama, booth, publikasi eksklusif, dan sesi promosi.'),
  ('Gold', 75, 'Logo utama, booth, dan publikasi media.'),
  ('Silver', 25, 'Logo pada materi publikasi dan media sosial.'),
  ('Bronze', 15, 'Logo pada materi publikasi.'),
  ('Spesial', 0, 'Kontribusi sukarela dan publikasi media.')
) AS p(nama_paket, persentase_dana, deskripsi_keuntungan)
WHERE e.nama_event = 'Tech Innovation Summit UNAI 2026'
AND NOT EXISTS (SELECT 1 FROM paket_sponsorship x WHERE x.id_event = e.id_event AND x.nama_paket = p.nama_paket);

INSERT INTO paket_sponsorship (id_event, nama_paket, persentase_dana, deskripsi_keuntungan)
SELECT e.id_event, p.nama_paket, p.persentase_dana, p.deskripsi_keuntungan
FROM event e
CROSS JOIN (VALUES
  ('Gold', 75, 'Logo utama, booth, dan publikasi media.'),
  ('Silver', 25, 'Logo pada materi publikasi dan media sosial.'),
  ('Spesial', 0, 'Kontribusi sukarela dan publikasi media.')
) AS p(nama_paket, persentase_dana, deskripsi_keuntungan)
WHERE e.nama_event IN ('Festival Seni dan Budaya UNAI 2026', 'Career Preparation Week', 'Workshop Digital Marketing')
AND NOT EXISTS (SELECT 1 FROM paket_sponsorship x WHERE x.id_event = e.id_event AND x.nama_paket = p.nama_paket);

INSERT INTO transaksi_sponsorship (id_event, id_sponsor, id_paket, jumlah, bukti_pembayaran, status_pembayaran, nama_event, nama_sponsor, nama_paket, sponsor_files)
SELECT e.id_event, s.id_pengguna, p.id_paket, 12500000, '/api/uploads/bukti/demo-payment.png', 'Diverifikasi', e.nama_event, 'PT Maju Bersama', p.nama_paket, '[]'::jsonb
FROM event e
JOIN users s ON s.email = 'demo.sponsor@company.com'
JOIN paket_sponsorship p ON p.id_event = e.id_event AND p.nama_paket = 'Silver'
WHERE e.nama_event = 'Tech Innovation Summit UNAI 2026'
AND NOT EXISTS (SELECT 1 FROM transaksi_sponsorship t WHERE t.id_event = e.id_event AND t.id_sponsor = s.id_pengguna AND t.id_paket = p.id_paket);

INSERT INTO transaksi_sponsorship (id_event, id_sponsor, id_paket, jumlah, bukti_pembayaran, status_pembayaran, nama_event, nama_sponsor, nama_paket, sponsor_files)
SELECT e.id_event, s.id_pengguna, p.id_paket, 26250000, '/api/uploads/bukti/demo-payment-festival.png', 'Menunggu', e.nama_event, 'CV Kreatif Nusantara', p.nama_paket, '[]'::jsonb
FROM event e
JOIN users s ON s.email = 'sponsor2@company.com'
JOIN paket_sponsorship p ON p.id_event = e.id_event AND p.nama_paket = 'Gold'
WHERE e.nama_event = 'Festival Seni dan Budaya UNAI 2026'
AND NOT EXISTS (SELECT 1 FROM transaksi_sponsorship t WHERE t.id_event = e.id_event AND t.id_sponsor = s.id_pengguna AND t.id_paket = p.id_paket);

INSERT INTO transaksi_sponsorship (id_event, id_sponsor, id_paket, jumlah, bukti_pembayaran, status_pembayaran, nama_event, nama_sponsor, nama_paket, sponsor_files)
SELECT e.id_event, s.id_pengguna, p.id_paket, 6250000, '/api/uploads/bukti/demo-payment-career.png', 'Diverifikasi', e.nama_event, 'CV Kreatif Nusantara', p.nama_paket, '[]'::jsonb
FROM event e
JOIN users s ON s.email = 'sponsor2@company.com'
JOIN paket_sponsorship p ON p.id_event = e.id_event AND p.nama_paket = 'Silver'
WHERE e.nama_event = 'Career Preparation Week'
AND NOT EXISTS (SELECT 1 FROM transaksi_sponsorship t WHERE t.id_event = e.id_event AND t.id_sponsor = s.id_pengguna AND t.id_paket = p.id_paket);

INSERT INTO transaksi_sponsorship (id_event, id_sponsor, id_paket, jumlah, bukti_pembayaran, status_pembayaran, nama_event, nama_sponsor, nama_paket, sponsor_files)
SELECT e.id_event, s.id_pengguna, p.id_paket, 18000000, '/api/uploads/bukti/demo-payment-marketing.png', 'Diverifikasi', e.nama_event, 'PT Maju Bersama', p.nama_paket, '[]'::jsonb
FROM event e
JOIN users s ON s.email = 'demo.sponsor@company.com'
JOIN paket_sponsorship p ON p.id_event = e.id_event AND p.nama_paket = 'Gold'
WHERE e.nama_event = 'Workshop Digital Marketing'
AND NOT EXISTS (SELECT 1 FROM transaksi_sponsorship t WHERE t.id_event = e.id_event AND t.id_sponsor = s.id_pengguna AND t.id_paket = p.id_paket);

INSERT INTO transaksi_sponsorship (id_event, id_sponsor, id_paket, jumlah, bukti_pembayaran, status_pembayaran, nama_event, nama_sponsor, nama_paket, sponsor_files)
SELECT e.id_event, s.id_pengguna, p.id_paket, 37500000, '/api/uploads/bukti/demo-payment-pending.png', 'Menunggu', e.nama_event, 'PT Maju Bersama', p.nama_paket, '[]'::jsonb
FROM event e
JOIN users s ON s.email = 'demo.sponsor@company.com'
JOIN paket_sponsorship p ON p.id_event = e.id_event AND p.nama_paket = 'Gold'
WHERE e.nama_event = 'Tech Innovation Summit UNAI 2026'
AND NOT EXISTS (SELECT 1 FROM transaksi_sponsorship t WHERE t.id_event = e.id_event AND t.id_sponsor = s.id_pengguna AND t.id_paket = p.id_paket);

INSERT INTO dokumentasi (id_event, id_pengguna, url_file, tipe_file)
SELECT e.id_event, o.id_pengguna, '/api/uploads/dokumentasi/demo-poster.pdf', 'PDF'
FROM event e JOIN users o ON o.email = 'demo.org@unai.edu'
WHERE e.nama_event = 'Tech Innovation Summit UNAI 2026'
AND NOT EXISTS (SELECT 1 FROM dokumentasi d WHERE d.id_event = e.id_event AND d.url_file = '/api/uploads/dokumentasi/demo-poster.pdf');

INSERT INTO dokumentasi (id_event, id_pengguna, url_file, tipe_file)
SELECT e.id_event, o.id_pengguna, '/api/uploads/dokumentasi/demo-festival-seni.jpg', 'JPG'
FROM event e JOIN users o ON o.email = 'bem.demo@unai.edu'
WHERE e.nama_event = 'Festival Seni dan Budaya UNAI 2026'
AND NOT EXISTS (SELECT 1 FROM dokumentasi d WHERE d.id_event = e.id_event AND d.url_file = '/api/uploads/dokumentasi/demo-festival-seni.jpg');

INSERT INTO dokumentasi (id_event, id_pengguna, url_file, tipe_file)
SELECT e.id_event, o.id_pengguna, '/api/uploads/dokumentasi/demo-career-week.mp4', 'MP4'
FROM event e JOIN users o ON o.email = 'ukm.demo@unai.edu'
WHERE e.nama_event = 'Career Preparation Week'
AND NOT EXISTS (SELECT 1 FROM dokumentasi d WHERE d.id_event = e.id_event AND d.url_file = '/api/uploads/dokumentasi/demo-career-week.mp4');

