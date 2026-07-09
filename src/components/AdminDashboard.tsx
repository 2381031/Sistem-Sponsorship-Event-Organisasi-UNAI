import React, { useState } from 'react';
import { User, Event, SponsorshipTransaction } from '../types';
import { 
  Users, ShieldCheck, Landmark, Trash2, Check, X, FileText, LogOut
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  allUsers: User[];
  events: Event[];
  transactions: SponsorshipTransaction[];
  onApproveUser: (userId: string) => void;
  onRejectUser: (userId: string) => void;
  onDeleteUser: (userId: string) => void;
  onApprovePayment: (txId: string) => void;
  onRejectPayment: (txId: string) => void;
  onLogout: () => void;
}

export default function AdminDashboard({
  currentUser,
  allUsers,
  events,
  transactions,
  onApproveUser,
  onRejectUser,
  onDeleteUser,
  onApprovePayment,
  onRejectPayment,
  onLogout
}: AdminDashboardProps) {
  
  // Navigation tabs to match mockup: 'verifikasi', 'pengguna', 'pembayaran'
  const [activeTab, setActiveTab] = useState<'verifikasi' | 'pengguna' | 'pembayaran'>('verifikasi');

  // Format IDR money helper
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(num);
  };

  // Filter list of pending accounts
  const pendingAccounts = allUsers.filter(u => u.status_akun === 'pending');

  // Filter list of pending payments
  const pendingPayments = transactions.filter(t => t.status_pembayaran === 'pending_verification');

  return (
    <div className="bg-[#f8fafc] min-h-screen w-full flex flex-col">
      
      {/* Dark Navy Header Row with Name and Admin Role Details */}
      <div className="bg-[#1a2c4d] text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center font-extrabold text-blue-400 text-lg">
            A
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Admin Sistem Sponsorship UNAI</h1>
            <p className="text-[10px] text-blue-400 font-medium font-mono">{currentUser.email}</p>
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all duration-150 flex items-center justify-center"
          title="Keluar / Logout"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>

      {/* Main body area wrapped in mobile style frame container */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 pt-6 pb-28">

        {/* ==================== SCREEN: VERIFIKASI USER ==================== */}
        {activeTab === 'verifikasi' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="h-16 w-16 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-3 shadow-[0_4px_20px_rgba(26,44,77,0.05)]">
                <ShieldCheck className="h-8 w-8 text-[#1a2c4d]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#1a2c4d] tracking-tight">Verifikasi User</h2>
              <p className="text-gray-400 text-xs mt-1 font-medium">Approve atau reject akun Organisasi & Sponsor yang pending</p>
            </div>

            {pendingAccounts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-xs text-gray-400 font-medium shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
                Tidak ada antrean pendaftaran akun baru. Semua akun pendaftar telah diverifikasi.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingAccounts.map((account) => (
                  <div key={account.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-extrabold text-[#1a2c4d] tracking-tight flex items-center gap-1.5 flex-wrap">
                          {account.peran === 'organisasi' 
                            ? account.organisasiDetails?.nama_organisasi || account.nama_lengkap 
                            : account.sponsorDetails?.nama_perusahaan || account.nama_lengkap}
                          <span className="bg-yellow-100 text-yellow-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full font-mono">PENDING</span>
                        </h3>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5 capitalize">
                          {account.peran === 'organisasi' ? 'Organisasi' : 'Sponsor'} • Terdaftar 22 Maret 2024
                        </p>
                      </div>
                    </div>

                    {/* Informasi Kontak */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Informasi Kontak</h4>
                      <div className="grid grid-cols-1 gap-1 text-xs">
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="w-16 font-semibold text-gray-400">Email:</span>
                          <span className="font-mono truncate">{account.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <span className="w-16 font-semibold text-gray-400">No. Telp:</span>
                          <span>{account.peran === 'organisasi' ? account.organisasiDetails?.no_telp : account.sponsorDetails?.no_telp || '-'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Informasi Tambahan */}
                    <div className="space-y-2 pt-2 border-t border-dashed border-gray-100">
                      <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Informasi Tambahan</h4>
                      <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
                        {account.peran === 'organisasi' ? (
                          <>
                            <div className="flex gap-2">
                              <span className="w-16 font-semibold text-gray-400 shrink-0">Website:</span>
                              <span className="text-blue-600 truncate">https://{account.organisasiDetails?.nama_organisasi.toLowerCase().replace(/\s+/g, '') || 'organisasi'}.org</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="w-16 font-semibold text-gray-400 shrink-0">Deskripsi:</span>
                              <span>{account.organisasiDetails?.deskripsi || 'Organisasi yang sedang menunggu verifikasi'}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex gap-2">
                              <span className="w-16 font-semibold text-gray-400 shrink-0">Website:</span>
                              <span className="text-blue-600 truncate">https://{account.sponsorDetails?.nama_perusahaan.toLowerCase().replace(/\s+/g, '') || 'sponsor'}.com</span>
                            </div>
                            <div className="flex gap-2">
                              <span className="w-16 font-semibold text-gray-400 shrink-0">Deskripsi:</span>
                              <span>{account.sponsorDetails?.deskripsi || 'Sponsor yang sedang menunggu verifikasi'}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => onApproveUser(account.id)}
                        className="py-2.5 px-4 bg-[#22c55e] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-green-900/10 active:scale-95 transition-all"
                      >
                        <Check className="h-4 w-4 stroke-[2.5]" />
                        <span>Approve Akun</span>
                      </button>
                      <button
                        onClick={() => onRejectUser(account.id)}
                        className="py-2.5 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <X className="h-4 w-4 stroke-[2.5]" />
                        <span>Reject Akun</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== SCREEN: MANAJEMEN USER ==================== */}
        {activeTab === 'pengguna' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="h-16 w-16 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-3 shadow-[0_4px_20px_rgba(26,44,77,0.05)]">
                <Users className="h-8 w-8 text-[#1a2c4d]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#1a2c4d] tracking-tight">Manajemen User</h2>
              <p className="text-gray-400 text-xs mt-1 font-medium">Lihat dan hapus data user yang terdaftar</p>
            </div>

            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400 font-bold font-mono">Total: {allUsers.length} pengguna</span>
            </div>

            <div className="space-y-3">
              {allUsers.map((u) => (
                <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-extrabold text-[#1a2c4d] truncate">
                        {u.peran === 'organisasi' 
                          ? u.organisasiDetails?.nama_organisasi || u.nama_lengkap 
                          : u.peran === 'sponsor' 
                            ? u.sponsorDetails?.nama_perusahaan || u.nama_lengkap 
                            : u.nama_lengkap}
                      </h3>
                      <span className={`px-1.5 py-0.5 text-[8px] font-extrabold font-mono rounded-md uppercase ${
                        u.status_akun === 'verified' ? 'bg-green-100 text-green-700' :
                        u.status_akun === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {u.status_akun === 'verified' ? 'ACTIVE' : u.status_akun === 'pending' ? 'PENDING' : 'REJECTED'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono leading-none truncate">{u.email}</p>
                    
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded-md uppercase tracking-wider ${
                        u.peran === 'admin' ? 'bg-red-50 text-red-600 border border-red-100' :
                        u.peran === 'organisasi' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                        'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        {u.peran === 'organisasi' ? 'Organisasi' : u.peran}
                      </span>
                      {u.peran !== 'admin' && (
                        <span className="text-[9px] text-gray-400 font-medium font-mono">
                          {u.peran === 'organisasi' ? u.organisasiDetails?.no_telp : u.sponsorDetails?.no_telp || '-'}
                        </span>
                      )}
                    </div>
                  </div>

                  {u.peran !== 'admin' && (
                    <button
                      onClick={() => onDeleteUser(u.id)}
                      className="p-2.5 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center shrink-0 border border-transparent hover:border-red-100"
                      title="Hapus Pengguna Secara Permanen"
                    >
                      <Trash2 className="h-4.5 w-4.5 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================== SCREEN: VERIFIKASI PEMBAYARAN ==================== */}
        {activeTab === 'pembayaran' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="h-16 w-16 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-3 shadow-[0_4px_20px_rgba(26,44,77,0.05)]">
                <Landmark className="h-8 w-8 text-[#1a2c4d]" />
              </div>
              <h2 className="text-xl font-extrabold text-[#1a2c4d] tracking-tight">Verifikasi Pembayaran</h2>
              <p className="text-gray-400 text-xs mt-1 font-medium">Validasi bukti pembayaran yang masuk</p>
            </div>

            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-400 font-bold font-mono">Total: {pendingPayments.length} transaksi pending</span>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-xs text-gray-400 font-medium shadow-[0_2px_15px_rgba(0,0,0,0.02)]">
                Tidak ada bukti pembayaran baru yang masuk untuk ditinjau saat ini.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map((tx) => (
                  <div key={tx.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-4">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                      <div>
                        <h3 className="text-xs font-extrabold text-[#1a2c4d] tracking-tight">Detail Transaksi</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5 font-mono font-medium">ID: #{tx.id.toUpperCase()}</p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-700 text-[8px] font-extrabold px-2 py-0.5 rounded-full font-mono uppercase">PENDING</span>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <div className="flex items-start gap-2 text-gray-600">
                        <span className="w-16 font-semibold text-gray-400 shrink-0">Donatur:</span>
                        <span className="font-bold text-[#1a2c4d]">{tx.nama_sponsor}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <span className="w-16 font-semibold text-gray-400 shrink-0">Email:</span>
                        <span className="font-mono truncate">{allUsers.find(u => u.nama_lengkap === tx.nama_sponsor)?.email || 'sponsor@test.com'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <span className="w-16 font-semibold text-gray-400 shrink-0">Jumlah:</span>
                        <span className="font-extrabold text-[#1a2c4d]">{formatIDR(tx.jumlah)}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <span className="w-16 font-semibold text-gray-400 shrink-0">Tanggal:</span>
                        <span>{tx.tanggal_transaksi || '21 Maret 2024'}</span>
                      </div>
                      <div className="flex items-start gap-2 text-gray-600">
                        <span className="w-16 font-semibold text-gray-400 shrink-0">Keterangan:</span>
                        <span>Sponsorship {tx.nama_event} - Paket {tx.nama_paket}</span>
                      </div>
                    </div>

                    {/* Bukti Pembayaran Section */}
                    <div className="space-y-2 pt-2 border-t border-dashed border-gray-100">
                      <h4 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Bukti Pembayaran</h4>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2">
                        <div className="h-10 w-10 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-[#1a2c4d] shadow-sm shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-600 font-mono truncate max-w-xs">{tx.bukti_pembayaran_url || 'bukti_transfer.png'}</p>
                        <span className="text-[8px] font-semibold text-gray-400 uppercase tracking-wider">File Bukti Transfer</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => onApprovePayment(tx.id)}
                        className="py-2.5 px-4 bg-[#22c55e] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-green-900/10 active:scale-95 transition-all"
                      >
                        <Check className="h-4 w-4 stroke-[2.5]" />
                        <span>Approve Bayar</span>
                      </button>
                      <button
                        onClick={() => onRejectPayment(tx.id)}
                        className="py-2.5 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                      >
                        <X className="h-4 w-4 stroke-[2.5]" />
                        <span>Reject Bayar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Pinned Tab Navigation Bar to match mockup */}
      <div className="fixed bottom-0 left-0 right-0 w-full max-w-6xl mx-auto bg-white border-t border-gray-100 px-6 py-2.5 flex justify-around items-center shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-40">
        <button 
          onClick={() => setActiveTab('verifikasi')}
          className={`flex flex-col items-center justify-center py-1 transition-all duration-150 ${
            activeTab === 'verifikasi' ? 'text-[#1a2c4d]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ShieldCheck className={`h-5 w-5 ${activeTab === 'verifikasi' ? 'stroke-[2.5] text-[#1a2c4d]' : 'stroke-[1.8]'}`} />
          <span className="text-[9px] font-extrabold mt-1">Verifikasi</span>
        </button>

        <button 
          onClick={() => setActiveTab('pengguna')}
          className={`flex flex-col items-center justify-center py-1 transition-all duration-150 ${
            activeTab === 'pengguna' ? 'text-[#1a2c4d]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Users className={`h-5 w-5 ${activeTab === 'pengguna' ? 'stroke-[2.5] text-[#1a2c4d]' : 'stroke-[1.8]'}`} />
          <span className="text-[9px] font-extrabold mt-1">Pengguna</span>
        </button>

        <button 
          onClick={() => setActiveTab('pembayaran')}
          className={`flex flex-col items-center justify-center py-1 transition-all duration-150 ${
            activeTab === 'pembayaran' ? 'text-[#1a2c4d]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Landmark className={`h-5 w-5 ${activeTab === 'pembayaran' ? 'stroke-[2.5] text-[#1a2c4d]' : 'stroke-[1.8]'}`} />
          <span className="text-[9px] font-extrabold mt-1">Pembayaran</span>
        </button>
      </div>

    </div>
  );
}
