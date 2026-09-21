# Pemeriksaan kebutuhan jurnal

Acuan: Jurnal-Penelitian_AndreLumbantoruan.docx, Gambar 2–10 dan Tabel 1a–1c. Dokumen jurnal asli tidak diubah. Daftar ini mengikuti kode lokal terbaru; hasil user testing tidak diisi otomatis.

## Dua puluh skenario user testing

Gunakan akun dan data simulasi tanpa pembayaran nyata. Setiap baris berikut **menunggu pengujian langsung pengguna**; fitur sudah tersedia pada kode.

| No | Aktor | Skenario dan hasil yang diperiksa |
| --- | --- | --- |
| 1 | Organisasi | Daftar: akun tersimpan dengan status Menunggu Verifikasi. |
| 2 | Organisasi | Login: akun Aktif berhasil masuk; pending/ditolak tidak bisa masuk. |
| 3 | Organisasi | Kelola Profil: nama/telepon tersimpan dan tetap benar setelah muat ulang. |
| 4 | Organisasi | Buat Event: wajib proposal PDF; event dan paket muncul setelah diterbitkan. |
| 5 | Organisasi | Edit Event: data/proposal event sendiri diperbarui; akses event orang lain ditolak. |
| 6 | Organisasi | Daftar Sponsor: semua transaksi terverifikasi event sendiri tampil, termasuk lebih dari empat transaksi. |
| 7 | Organisasi | Total Dana: jumlah hanya dari pembayaran Diverifikasi, termasuk dua nominal berbeda dan nilai desimal. |
| 8 | Organisasi | Tutup Event: penutupan manual menyembunyikan event dari Cari Event; API menolak sponsorship baru. |
| 9 | Organisasi | Dokumentasi: unggah PDF, JPG, MP4; berkas dapat dibuka/diputar dan terkait event yang benar. |
| 10 | Sponsor | Daftar: akun menunggu persetujuan admin. |
| 11 | Sponsor | Login: akun aktif membuka Cari Event. |
| 12 | Sponsor | Profil: nama/telepon/alamat tersimpan setelah muat ulang. |
| 13 | Sponsor | Melihat Event: pencarian dan detail hanya menawarkan event yang diterbitkan. |
| 14 | Sponsor | Memberikan Sponsorship: paket biasa/Spesial dan gambar bukti menghasilkan transaksi Menunggu. |
| 15 | Sponsor | Edit Sponsorship: paket/nominal/bukti dapat diganti ketika Menunggu; transaksi Diverifikasi/Ditolak dikunci. |
| 16 | Sponsor | Dokumentasi: galeri tersedia di detail sebelum sponsorship dan pada riwayat event terkait; transaksi akun lain tidak tampil. |
| 17 | Admin | Login: akun admin aktif masuk ke menu admin. |
| 18 | Admin | Verifikasi Akun: approve menjadi Aktif; reject menjadi Ditolak. |
| 19 | Admin | Kelola Pengguna: daftar tersedia; hapus akun uji tanpa transaksi berhasil; akun non-admin tidak dapat memakai API hapus pengguna. |
| 20 | Admin | Verifikasi Pembayaran: approve/reject mengubah status yang benar, menghapus item dari daftar pending, dan memberi pesan hasil. |

## Skenario tambahan dari narasi jurnal

- Verifikasi dana di bawah target: event tetap terbit. Tepat target atau lebih: event otomatis Ditutup. Dana Menunggu/Ditolak tidak dihitung.
- Menurunkan target ke bawah dana terverifikasi juga menutup event. Event dengan target terpenuhi tidak bisa dibuka ulang tanpa menaikkan target.
- Dua admin memverifikasi pembayaran bersamaan; sponsor mengedit saat admin menyetujui: tidak boleh menimpa transaksi yang telah diproses. Perlu pengujian langsung PostgreSQL untuk konkurensi.
- JPG/PDF/MP4 maksimum 4 MB. Tolak berkas kosong, tipe palsu, ukuran berlebih, dan upload oleh organisasi lain.
- Akun tidak dapat mendaftar sebagai Admin atau menaikkan peran melalui update profil. JWT akun yang sudah ditolak/dihapus tidak berlaku.

## Validasi otomatis dan kebutuhan deployment

`cd backend && npm test` menguji layanan dengan database simulasi: status sponsorship, perhitungan target, batas peran/kepemilikan, JWT akun tidak aktif, dan validasi format dokumentasi. Pemeriksaan TypeScript dan build frontend dilakukan terpisah.

Uji langsung NeonDB, Vercel Blob, tampilan browser, dan 20 skenario di atas tetap diperlukan. Set `BLOB_READ_WRITE_TOKEN` pada hosting untuk menyimpan berkas. Periksa batas ukuran request hosting saat menguji unggahan proposal dan bukti bayar.

Isi hasil user testing dengan tanggal, penguji, bukti, dan kendala sesudah benar-benar dicoba. Status Berhasil dalam jurnal harus mengikuti bukti pengujian, bukan hanya keberadaan kode.
