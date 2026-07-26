DROP TABLE IF EXISTS dokumentasi CASCADE;
DROP TABLE IF EXISTS transaksi_sponsorship CASCADE;
DROP TABLE IF EXISTS paket_sponsorship CASCADE;
DROP TABLE IF EXISTS event CASCADE;
DROP TABLE IF EXISTS sponsor CASCADE;
DROP TABLE IF EXISTS organisasi CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id_pengguna SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  kata_sandi VARCHAR(255) NOT NULL,
  nama_lengkap VARCHAR(255) DEFAULT '',
  peran VARCHAR(50) NOT NULL CHECK (peran IN ('organisasi', 'sponsor', 'admin')),
  status_akun VARCHAR(50) DEFAULT 'Menunggu Verifikasi',
  id_admin_verifikator INTEGER
);

CREATE TABLE organisasi (
  id_pengguna INTEGER PRIMARY KEY REFERENCES users(id_pengguna) ON DELETE CASCADE,
  nama_organisasi VARCHAR(255) NOT NULL,
  deskripsi TEXT,
  no_telp VARCHAR(50),
  nama_rekening VARCHAR(255),
  nomor_rekening VARCHAR(100)
);

CREATE TABLE sponsor (
  id_pengguna INTEGER PRIMARY KEY REFERENCES users(id_pengguna) ON DELETE CASCADE,
  nama_perusahaan VARCHAR(255) NOT NULL,
  alamat TEXT,
  no_telp VARCHAR(50)
);

CREATE TABLE event (
  id_event SERIAL PRIMARY KEY,
  id_organisasi INTEGER REFERENCES users(id_pengguna) ON DELETE CASCADE,
  nama_event VARCHAR(255) NOT NULL,
  tanggal_event VARCHAR(100),
  deskripsi TEXT,
  target_dana NUMERIC(15, 2) DEFAULT 0,
  url_proposal VARCHAR(500),
  status_event VARCHAR(50) DEFAULT 'open'
);

CREATE TABLE paket_sponsorship (
  id_paket SERIAL PRIMARY KEY,
  id_event INTEGER REFERENCES event(id_event) ON DELETE CASCADE,
  nama_paket VARCHAR(255) NOT NULL,
  persentase_dana NUMERIC(5, 2) DEFAULT 0,
  deskripsi_keuntungan TEXT
);

CREATE TABLE transaksi_sponsorship (
  id_transaksi SERIAL PRIMARY KEY,
  id_event INTEGER REFERENCES event(id_event),
  id_sponsor INTEGER REFERENCES users(id_pengguna),
  id_paket INTEGER REFERENCES paket_sponsorship(id_paket),
  jumlah NUMERIC(15, 2) DEFAULT 0,
  bukti_pembayaran VARCHAR(500),
  status_pembayaran VARCHAR(50) DEFAULT 'pending_verification',
  id_admin_verifikator INTEGER,
  tanggal_transaksi TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  nama_event VARCHAR(255),
  nama_sponsor VARCHAR(255),
  nama_paket VARCHAR(255),
  rekening_tujuan VARCHAR(255),
  nama_pengirim VARCHAR(255)
);

CREATE TABLE dokumentasi (
  id_dokumentasi SERIAL PRIMARY KEY,
  id_event INTEGER REFERENCES event(id_event) ON DELETE CASCADE,
  id_pengguna INTEGER REFERENCES users(id_pengguna) ON DELETE CASCADE,
  url_file VARCHAR(500),
  tipe_file VARCHAR(50) DEFAULT 'pdf'
);
