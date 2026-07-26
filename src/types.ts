export type Role = 'Organisasi' | 'Sponsor' | 'Admin';
export type AccountStatus = 'Menunggu Verifikasi' | 'Aktif' | 'Ditolak';
export type EventStatus = 'Draft' | 'Dipublikasikan' | 'Ditutup';
export type TransactionStatus = 'Menunggu' | 'Diverifikasi' | 'Ditolak';

export interface User {
  id: number;
  email: string;
  peran: Role;
  status_akun: AccountStatus;
  profil?: any;
}

export interface SponsorshipPackage {
  id_paket: number;
  id_event: number;
  nama_paket: string;
  persentase_dana: number;
  deskripsi_keuntungan: string | null;
}

export interface Event {
  id_event: number;
  id_organisasi: number;
  nama_event: string;
  tanggal_event: string;
  deskripsi: string | null;
  target_dana: number;
  url_proposal: string | null;
  status_event: EventStatus;
  paket_tersedia: SponsorshipPackage[];
}

export interface SponsorshipTransaction {
  id_transaksi: number;
  id_event: number;
  id_sponsor: number;
  id_paket: number;
  jumlah: number;
  bukti_pembayaran: string | null;
  status_pembayaran: TransactionStatus;
  id_admin_verifikator: number | null;
  tanggal_transaksi: string;
  nama_event?: string;
  nama_sponsor?: string;
  nama_paket?: string;
  rekening_tujuan?: string;
  nama_pengirim?: string;
}

export interface EventDoc {
  id_dokumentasi: number;
  id_event: number;
  id_pengguna: number;
  url_file: string;
  tipe_file: string | null;
}
