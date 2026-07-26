import React, { useState } from 'react';
import { User, Event, SponsorshipTransaction } from '../types';
import { api } from '../api';
import { Users, ShieldCheck, Landmark, Trash2, Check, X, FileText, LogOut } from 'lucide-react';

interface Props {
  currentUser: User;
  allUsers: User[];
  events: Event[];
  transactions: SponsorshipTransaction[];
  onApproveUser: (userId: number) => Promise<void>;
  onRejectUser: (userId: number) => Promise<void>;
  onDeleteUser: (userId: number) => Promise<void>;
  onApprovePayment: (txId: number) => Promise<void>;
  onRejectPayment: (txId: number) => Promise<void>;
  onLogout: () => void;
}

export default function AdminDashboard({
  currentUser, allUsers, events, transactions,
  onApproveUser, onRejectUser, onDeleteUser, onApprovePayment, onRejectPayment, onLogout
}: Props) {
  const [activeTab, setActiveTab] = useState<'verifikasi' | 'pengguna' | 'pembayaran'>('verifikasi');

  const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const pendingAccounts = allUsers.filter(u => u.status_akun === 'Menunggu Verifikasi');
  const pendingPayments = transactions.filter(t => t.status_pembayaran === 'pending_verification');

  const getUserDisplayName = (u: User) => {
    if (u.peran === 'organisasi' && u.profil?.nama_organisasi) return u.profil.nama_organisasi;
    if (u.peran === 'sponsor' && u.profil?.nama_perusahaan) return u.profil.nama_perusahaan;
    return u.email;
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen w-full flex flex-col">
      <div className="bg-[#1a2c4d] text-white px-6 py-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center font-extrabold text-blue-400 text-lg">A</div>
          <div><h1 className="text-sm font-bold">Admin Sistem Sponsorship UNAI</h1><p className="text-[10px] text-blue-400 font-mono">{currentUser.email}</p></div>
        </div>
        <button onClick={onLogout} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all"><LogOut className="h-4 w-4" /></button>
      </div>

      <div className="flex-1 max-w-6xl w-full mx-auto px-4 pt-6 pb-28">
        {activeTab === 'verifikasi' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="h-16 w-16 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-3"><ShieldCheck className="h-8 w-8" /></div>
              <h2 className="text-xl font-extrabold text-[#1a2c4d]">Verifikasi User</h2>
              <p className="text-gray-400 text-xs mt-1 font-medium">Approve atau reject akun yang pending</p>
            </div>
            {pendingAccounts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-xs text-gray-400 font-medium">Semua akun telah diverifikasi.</div>
            ) : (
              <div className="space-y-4">
                {pendingAccounts.map(account => (
                  <div key={account.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-extrabold text-[#1a2c4d] flex items-center gap-1.5">
                          {getUserDisplayName(account)}
                          <span className="bg-yellow-100 text-yellow-700 text-[9px] font-extrabold px-2 py-0.5 rounded-full font-mono">PENDING</span>
                        </h3>
                        <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{account.peran}</p>
                      </div>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p><span className="font-semibold text-gray-400 w-16 inline-block">Email:</span> <span className="font-mono">{account.email}</span></p>
                      <p><span className="font-semibold text-gray-400 w-16 inline-block">No. Telp:</span> {account.profil?.no_telp || '-'}</p>
                      {account.peran === 'organisasi' && <p><span className="font-semibold text-gray-400 w-16 inline-block">Rekening:</span> {account.profil?.nomor_rekening} a.n. {account.profil?.nama_rekening}</p>}
                      {account.peran === 'sponsor' && <p><span className="font-semibold text-gray-400 w-16 inline-block">Alamat:</span> {account.profil?.alamat}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button onClick={() => onApproveUser(account.id)} className="py-2.5 px-4 bg-[#22c55e] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all">
                        <Check className="h-4 w-4 stroke-[2.5]" /> Approve
                      </button>
                      <button onClick={() => onRejectUser(account.id)} className="py-2.5 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                        <X className="h-4 w-4 stroke-[2.5]" /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pengguna' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="h-16 w-16 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-3"><Users className="h-8 w-8" /></div>
              <h2 className="text-xl font-extrabold text-[#1a2c4d]">Manajemen User</h2>
            </div>
            <span className="text-xs text-gray-400 font-bold font-mono">Total: {allUsers.length} pengguna</span>
            <div className="space-y-3">
              {allUsers.map(u => (
                <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-extrabold text-[#1a2c4d] truncate">{getUserDisplayName(u)}</h3>
                      <span className={`px-1.5 py-0.5 text-[8px] font-extrabold font-mono rounded-md uppercase ${u.status_akun === 'Terverifikasi' ? 'bg-green-100 text-green-700' : u.status_akun === 'Menunggu Verifikasi' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                        {u.status_akun === 'Terverifikasi' ? 'ACTIVE' : u.status_akun === 'Menunggu Verifikasi' ? 'PENDING' : 'REJECTED'}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400 font-mono truncate">{u.email}</p>
                    <span className={`px-1.5 py-0.5 text-[8px] font-extrabold rounded-md uppercase ${u.peran === 'admin' ? 'bg-red-50 text-red-600' : u.peran === 'organisasi' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>{u.peran}</span>
                  </div>
                  {u.peran !== 'admin' && (
                    <button onClick={() => { if (confirm('Hapus pengguna ini secara permanen?')) onDeleteUser(u.id); }}
                      className="p-2.5 text-gray-400 hover:text-red-600 rounded-xl hover:bg-red-50 active:scale-95 transition-all shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'pembayaran' && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="h-16 w-16 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-3"><Landmark className="h-8 w-8" /></div>
              <h2 className="text-xl font-extrabold text-[#1a2c4d]">Verifikasi Pembayaran</h2>
            </div>
            <span className="text-xs text-gray-400 font-bold font-mono">Total: {pendingPayments.length} transaksi pending</span>
            {pendingPayments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-xs text-gray-400 font-medium">Tidak ada pembayaran pending.</div>
            ) : (
              <div className="space-y-4">
                {pendingPayments.map(tx => (
                  <div key={tx.id_transaksi} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                      <div><h3 className="text-xs font-extrabold text-[#1a2c4d]">Detail Transaksi</h3><p className="text-[10px] text-gray-400 mt-0.5 font-mono">ID: #{tx.id_transaksi}</p></div>
                      <span className="bg-yellow-100 text-yellow-700 text-[8px] font-extrabold px-2 py-0.5 rounded-full font-mono uppercase">PENDING</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs">
                      <p><span className="w-16 font-semibold text-gray-400 inline-block">Donatur:</span> <span className="font-bold text-[#1a2c4d]">{tx.nama_sponsor || `Sponsor #${tx.id_sponsor}`}</span></p>
                      <p><span className="w-16 font-semibold text-gray-400 inline-block">Jumlah:</span> <span className="font-extrabold text-[#1a2c4d]">{formatIDR(tx.jumlah)}</span></p>
                      <p><span className="w-16 font-semibold text-gray-400 inline-block">Event:</span> {tx.nama_event || `Event #${tx.id_event}`}</p>
                      <p><span className="w-16 font-semibold text-gray-400 inline-block">Paket:</span> {tx.nama_paket}</p>
                    </div>
                    <div className="space-y-2 pt-2 border-t border-dashed border-gray-100">
                      <h4 className="text-[10px] font-extrabold text-gray-400 uppercase">Bukti Pembayaran</h4>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center text-center gap-2">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <p className="text-[10px] font-bold text-gray-600 font-mono">{tx.bukti_pembayaran || 'bukti_transfer.png'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button onClick={() => onApprovePayment(tx.id_transaksi)} className="py-2.5 px-4 bg-[#22c55e] hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all">
                        <Check className="h-4 w-4 stroke-[2.5]" /> Approve Bayar
                      </button>
                      <button onClick={() => onRejectPayment(tx.id_transaksi)} className="py-2.5 px-4 bg-white border border-red-200 text-red-600 hover:bg-red-50 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                        <X className="h-4 w-4 stroke-[2.5]" /> Reject Bayar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 w-full max-w-6xl mx-auto bg-white border-t border-gray-100 px-6 py-2.5 flex justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-40">
        {([['verifikasi', 'Verifikasi', ShieldCheck], ['pengguna', 'Pengguna', Users], ['pembayaran', 'Pembayaran', Landmark]] as const).map(([tab, label, Icon]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex flex-col items-center justify-center py-1 ${activeTab === tab ? 'text-[#1a2c4d]' : 'text-gray-400'}`}>
            <Icon className={`h-5 w-5 ${activeTab === tab ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[9px] font-extrabold mt-1">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
