import { User, Event, SponsorshipTransaction, EventDoc, SponsorshipPackage } from './types';

// Helper for generating unique IDs
const uuid = () => Math.random().toString(36).substring(2, 11);

export const defaultPackages: SponsorshipPackage[] = [
  {
    id: 'p-plat',
    nama_paket: 'Platinum',
    jumlah_dana: 25000000,
    deskripsi_keuntungan: [
      'Pemasangan logo besar pada backdrop utama',
      'Penyebutan nama sponsor oleh MC di awal dan akhir event',
      'Pemasangan umbul-umbul di area utama event (max 10 buah)',
      'Akses booth pameran ukuran 3x3m di lokasi strategis',
      'Pemuatan artikel advertorial khusus di media kampus',
      'Sertifikat penghargaan eksklusif dari Rektorat UNAI'
    ]
  },
  {
    id: 'p-gold',
    nama_paket: 'Gold',
    jumlah_dana: 15000000,
    deskripsi_keuntungan: [
      'Pemasangan logo sedang pada backdrop utama',
      'Penyebutan nama sponsor oleh MC saat istirahat',
      'Pemasangan umbul-umbul di area event (max 5 buah)',
      'Akses booth pameran ukuran 2x2m',
      'Sertifikat penghargaan dari Dekanat'
    ]
  },
  {
    id: 'p-silver',
    nama_paket: 'Silver',
    jumlah_dana: 7500000,
    deskripsi_keuntungan: [
      'Pemasangan logo kecil pada backdrop utama',
      'Penyebutan nama sponsor oleh MC sebanyak 2 kali',
      'Akses pembagian brosur di meja registrasi',
      'Sertifikat penghargaan dari Panitia'
    ]
  },
  {
    id: 'p-bronze',
    nama_paket: 'Bronze',
    jumlah_dana: 3000000,
    deskripsi_keuntungan: [
      'Pemasangan logo mini pada backdrop pendukung',
      'Sertifikat penghargaan digital dari Panitia'
    ]
  }
];

export const mockUsers: User[] = [
  {
    id: 'u-admin',
    email: 'admin@unai.edu',
    peran: 'admin',
    status_akun: 'verified',
    nama_lengkap: 'Admin Sponsorship UNAI'
  }
];

export const mockEvents: Event[] = [];

export const mockTransactions: SponsorshipTransaction[] = [];

export const mockDocs: EventDoc[] = [];
