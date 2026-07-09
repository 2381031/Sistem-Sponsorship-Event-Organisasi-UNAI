export type Role = 'organisasi' | 'sponsor' | 'admin';
export type AccountStatus = 'pending' | 'verified' | 'rejected';
export type EventStatus = 'open' | 'closed';
export type TransactionStatus = 'unpaid' | 'pending_verification' | 'verified' | 'rejected';
export type DocType = 'image' | 'pdf' | 'video';

export interface User {
  id: string;
  email: string;
  peran: Role;
  status_akun: AccountStatus;
  nama_lengkap: string; // fallback or general name
  
  // Specific profile data based on role
  organisasiDetails?: {
    nama_organisasi: string;
    deskripsi: string;
    no_telp: string;
    alamat: string;
    rekening_nomor?: string;
    rekening_atas_nama?: string;
  };
  sponsorDetails?: {
    nama_perusahaan: string;
    alamat: string;
    no_telp: string;
    is_alumni: boolean;
    angkatan?: string;
    deskripsi?: string;
  };
}

export interface SponsorshipPackage {
  id: string;
  nama_paket: string; // Platinum, Gold, Silver, Bronze, etc.
  jumlah_dana: number;
  deskripsi_keuntungan: string[];
}

export interface Event {
  id: string;
  id_organisasi: string;
  nama_organisasi: string; // Cache for easy display
  nama_event: string;
  tanggal_event: string;
  deskripsi: string;
  target_dana: number;
  dana_terkumpul: number;
  proposal_url?: string; // Will mock filename or base64
  proposal_name?: string;
  status_event: EventStatus;
  paket_tersedia: SponsorshipPackage[];
}

export interface SponsorshipTransaction {
  id: string;
  id_event: string;
  nama_event: string; // Cache
  id_sponsor: string;
  nama_sponsor: string; // Cache
  id_paket: string;
  nama_paket: string; // Cache
  jumlah: number;
  bukti_pembayaran_url?: string; // Base64 or mock filename
  status_pembayaran: TransactionStatus;
  tanggal_transaksi: string;
  rekening_tujuan?: string;
  nama_pengirim?: string;
}

export interface EventDoc {
  id: string;
  id_event: string;
  nama_event: string; // Cache
  url_file: string; // Base64 or mock filename
  tipe_file: DocType;
  keterangan: string;
  tanggal_upload: string;
}
