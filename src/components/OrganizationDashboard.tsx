import React, { useState } from 'react';
import { User, Event, SponsorshipTransaction, EventDoc } from '../types';
import { api } from '../api';
import {
  Building2, Calendar, Target, DollarSign, UploadCloud, Users, CheckCircle2,
  Clock, AlertCircle, FileText, ChevronRight, Edit3, Trash2, Eye, Image as ImageIcon,
  FileDown, Video, ShieldAlert, CheckCircle, ArrowLeft, LogOut, Check, HelpCircle, Upload
} from 'lucide-react';

interface Props {
  currentUser: User;
  events: Event[];
  transactions: SponsorshipTransaction[];
  docs: EventDoc[];
  onCreateEvent: (data: any) => Promise<void>;
  onUpdateEvent: (id: number, data: any) => Promise<void>;
  onUpdateEventStatus: (id: number, status: string) => Promise<void>;
  onUploadDoc: (data: any) => Promise<void>;
  onLogout: () => void;
}

export default function OrganizationDashboard({
  currentUser, events, transactions, docs, onCreateEvent, onUpdateEvent, onUpdateEventStatus, onUploadDoc, onLogout
}: Props) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manajemen' | 'buat-event' | 'profil'>('dashboard');
  const profil = currentUser.profil;

  const [profileNama, setProfileNama] = useState(profil?.nama_organisasi || '');
  const [profileDeskripsi, setProfileDeskripsi] = useState(profil?.deskripsi || '');
  const [profileNoTelp, setProfileNoTelp] = useState(profil?.no_telp || '');
  const [profileRekNo, setProfileRekNo] = useState(profil?.nomor_rekening || '');
  const [profileRekNama, setProfileRekNama] = useState(profil?.nama_rekening || '');
  const [profileNamaBank, setProfileNamaBank] = useState(profil?.nama_bank || '');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [namaEvent, setNamaEvent] = useState('');
  const [tanggalEvent, setTanggalEvent] = useState('');
  const [deskripsiEvent, setDeskripsiEvent] = useState('');
  const [targetDana, setTargetDana] = useState(50000000);
  const [proposalFile, setProposalFile] = useState('');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const [uploadingDocEventId, setUploadingDocEventId] = useState<number | null>(null);
  const [docFileUrl, setDocFileUrl] = useState('');
  const [docDesc, setDocDesc] = useState('');
  const [docSuccess, setDocSuccess] = useState('');

  const myEvents = events.filter(e => e.id_organisasi === currentUser.id);
  const myEventIds = myEvents.map(e => e.id_event);
  const totalEvents = myEvents.length;

  const myApprovedTransactions = transactions.filter(t => myEventIds.includes(t.id_event) && t.status_pembayaran === 'Diverifikasi');
  const totalDanaTerkumpul = myApprovedTransactions.reduce((acc, t) => acc + t.jumlah, 0);
  const totalTargetDana = myEvents.reduce((acc, e) => acc + e.target_dana, 0);

  const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      await api.updateUser(currentUser.id, {
        organisasiDetails: {
          nama_organisasi: profileNama,
          deskripsi: profileDeskripsi,
          no_telp: profileNoTelp,
          nama_bank: profileNamaBank,
          nama_rekening: profileRekNama,
          nomor_rekening: profileRekNo,
        },
      });
      setProfileSuccess('Profil berhasil diperbarui!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      setProfileSuccess('Gagal update profil: ' + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    setCreateLoading(true);

    try {
      const customPackages = [
        {
          nama_paket: 'Platinum',
          persentase_dana: 100,
          deskripsi_keuntungan: 'Sponsor tunggal kegiatan. Logo eksklusif pada semua media (100%). Dapat menyertakan media promosi, brosur, atau sample produk saat kegiatan. Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan oleh moderator. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto. Publikasi di media elektronik dan cetak.',
        },
        {
          nama_paket: 'Gold',
          persentase_dana: 75,
          deskripsi_keuntungan: 'Logo eksklusif pada semua media (75%). Dapat menyertakan media promosi, brosur, atau sample produk saat kegiatan. Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan oleh moderator. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto serta publikasi di media elektronik dan cetak UNAI.',
        },
        {
          nama_paket: 'Silver',
          persentase_dana: 25,
          deskripsi_keuntungan: 'Logo eksklusif pada semua media (25%). Dapat menyertakan media promosi, brosur, atau sample produk saat kegiatan. Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan oleh moderator. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto. Publikasi di media elektronik dan cetak UNAI.',
        },
        {
          nama_paket: 'Bronze',
          persentase_dana: 15,
          deskripsi_keuntungan: 'Logo eksklusif pada semua media (15%). Dapat menyertakan media promosi, brosur, atau sample produk saat kegiatan. Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan oleh moderator. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto. Publikasi di media elektronik dan cetak UNAI.',
        },
        {
          nama_paket: 'Spesial',
          persentase_dana: 0,
          deskripsi_keuntungan: 'Bentuk kerjasama finansial dengan kontribusi sukarela dari sponsor. Mendapatkan hasil dokumentasi kegiatan berupa video dan foto-foto. Publikasi di media elektronik dan cetak HIMA dan BEM.',
        },
      ];

      if (editingEvent) {
        await onUpdateEvent(editingEvent.id_event, {
          nama_event: namaEvent,
          tanggal_event: tanggalEvent,
          deskripsi: deskripsiEvent,
          target_dana: targetDana,
        });
        setCreateSuccess('Event berhasil diperbarui!');
      } else {
        await onCreateEvent({
          nama_event: namaEvent,
          tanggal_event: tanggalEvent,
          deskripsi: deskripsiEvent,
          target_dana: targetDana,
          url_proposal: proposalFile || null,
          status_event: 'Dipublikasikan',
          paket_tersedia: customPackages,
        });
        setCreateSuccess('Event berhasil diterbitkan!');
      }

      setTimeout(() => {
        setCreateSuccess('');
        setActiveTab('manajemen');
        setEditingEvent(null);
        setNamaEvent(''); setTanggalEvent(''); setDeskripsiEvent(''); setProposalFile('');
      }, 2000);
    } catch (err: any) {
      setCreateError(err.message || 'Gagal menyimpan event');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleEventStatus = async (event: Event) => {
    const newStatus = event.status_event === 'Dipublikasikan' ? 'Ditutup' : 'Dipublikasikan';
    await onUpdateEventStatus(event.id_event, newStatus);
  };

  const handleUploadDocSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingDocEventId || !docFileUrl) return;
    await onUploadDoc({
      id_event: uploadingDocEventId,
      url_file: docFileUrl.replace('C:\\fakepath\\', ''),
      tipe_file: 'PDF',
    });
    setDocSuccess('LPJ berhasil diunggah!');
    setTimeout(() => { setDocSuccess(''); setUploadingDocEventId(null); setDocFileUrl(''); setDocDesc(''); }, 2000);
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <div className="bg-[#1a2c4d] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center font-bold text-yellow-400">
            {profileNama?.substring(0, 2).toUpperCase() || 'OM'}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">{profileNama}</h1>
            <p className="text-[10px] text-gray-300 font-medium">Organisasi</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 bg-slate-800/50 p-1 rounded-xl">
            {(['dashboard', 'manajemen', 'profil'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${(activeTab === tab || (tab === 'manajemen' && activeTab === 'buat-event')) ? 'bg-[#1a2c4d] text-white' : 'text-gray-400 hover:text-white'}`}>
                {tab === 'dashboard' ? 'Dashboard' : tab === 'manajemen' ? 'Manajemen Event' : 'Profil'}
              </button>
            ))}
          </div>
          <button onClick={onLogout} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all" title="Logout">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="h-12 w-12 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mx-auto mb-3"><Building2 className="h-6 w-6" /></div>
              <h2 className="text-xl font-bold text-[#1a2c4d] tracking-tight">Dashboard Monitoring</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 bg-[#f8fafc] rounded-xl flex items-center justify-center text-gray-500 border border-gray-100"><Calendar className="h-5 w-5" /></div>
                <div><p className="text-[10px] text-gray-400 font-bold uppercase">Total Event</p><h4 className="text-base font-extrabold text-slate-800">{totalEvents}</h4></div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 bg-[#f8fafc] rounded-xl flex items-center justify-center text-blue-900 border border-gray-100"><DollarSign className="h-5 w-5" /></div>
                <div><p className="text-[10px] text-gray-400 font-bold uppercase">Total Dana Terkumpul</p><h4 className="text-base font-extrabold text-[#1a2c4d]">{formatIDR(totalDanaTerkumpul)}</h4></div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex items-center gap-4">
                <div className="h-10 w-10 bg-[#f8fafc] rounded-xl flex items-center justify-center text-gray-400 border border-gray-100"><Target className="h-5 w-5" /></div>
                <div><p className="text-[10px] text-gray-400 font-bold uppercase">Total Target Dana</p><h4 className="text-base font-extrabold text-slate-700">{formatIDR(totalTargetDana)}</h4></div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-[#1a2c4d]">Daftar Sponsor</h3>
              {myApprovedTransactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 p-4 text-center text-[11px] text-gray-500">Belum ada sponsor terverifikasi.</div>
              ) : (
                <div className="space-y-2">
                  {myApprovedTransactions.slice(0, 4).map(tx => (
                    <div key={tx.id_transaksi} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-slate-50 px-3 py-2.5">
                      <div><p className="text-[11px] font-bold text-[#1a2c4d]">{tx.nama_sponsor}</p><p className="text-[9px] text-gray-400">{tx.nama_paket} - {tx.nama_event}</p></div>
                      <span className="text-[10px] font-extrabold text-emerald-600">{formatIDR(tx.jumlah)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {myEvents.map(event => {
              const eventTxs = transactions.filter(t => t.id_event === event.id_event);
              const eventApprovedTxs = eventTxs.filter(t => t.status_pembayaran === 'Diverifikasi');
              const eventCollected = eventApprovedTxs.reduce((sum, t) => sum + t.jumlah, 0);
              const progressPct = event.target_dana > 0 ? Math.min(100, Math.round((eventCollected / event.target_dana) * 100)) : 0;
              return (
                <div key={event.id_event} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div><h3 className="text-base font-bold text-[#1a2c4d]">{event.nama_event}</h3><p className="text-[10px] text-gray-400">{event.tanggal_event}</p></div>
                    <span className="bg-[#e2f6ec] text-[#2ebd7d] px-2 py-0.5 rounded text-[10px] font-bold uppercase">{event.status_event}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#f8fafc] rounded-xl p-3 border border-gray-100"><p className="text-[10px] text-gray-400 font-bold">Dana Terkumpul</p><h5 className="text-xs font-extrabold text-[#1a2c4d] mt-1">{formatIDR(eventCollected)}</h5></div>
                    <div className="bg-[#f8fafc] rounded-xl p-3 border border-gray-100"><p className="text-[10px] text-gray-400 font-bold">Target Dana</p><h5 className="text-xs font-extrabold text-slate-700 mt-1">{formatIDR(event.target_dana)}</h5></div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-gray-700"><span>Progress</span><span>{progressPct}%</span></div>
                    <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#1a2c4d] rounded-full" style={{ width: `${progressPct}%` }} /></div>
                  </div>
                </div>
              );
            })}
            <button onClick={() => setActiveTab('manajemen')} className="w-full py-3 bg-[#f8fafc] hover:bg-gray-100 text-[#1a2c4d] font-bold text-xs rounded-xl border border-gray-100">Lihat Semua Event</button>
          </div>
        )}

        {activeTab === 'manajemen' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#1a2c4d] tracking-tight">Manajemen Event</h2>
            </div>
            <button onClick={() => { setActiveTab('buat-event'); setEditingEvent(null); setNamaEvent(''); setTanggalEvent(''); setDeskripsiEvent(''); setTargetDana(50000000); }}
              className="w-full py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl transition-all shadow-md">
              + Buat Event Baru
            </button>
            <p className="text-xs text-gray-400 font-bold">Total: {totalEvents} event</p>
            <div className="space-y-4">
              {myEvents.map(event => {
                const eventTxs = transactions.filter(t => t.id_event === event.id_event);
                const eventApprovedTxs = eventTxs.filter(t => t.status_pembayaran === 'Diverifikasi');
                const eventCollected = eventApprovedTxs.reduce((sum, t) => sum + t.jumlah, 0);
                return (
                  <div key={event.id_event} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                      <div><h3 className="text-sm font-bold text-[#1a2c4d]">{event.nama_event}</h3><p className="text-[10px] text-gray-400">{event.tanggal_event}</p></div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${event.status_event === 'Dipublikasikan' ? 'bg-[#e2f6ec] text-[#2ebd7d]' : 'bg-red-50 text-red-600'}`}>{event.status_event === 'Dipublikasikan' ? 'DIPUBLIKASIKAN' : 'DITUTUP'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 border-t border-gray-50 pt-3">
                      <div><p className="text-[9px] text-gray-400 font-bold">Total Dana</p><h5 className="text-xs font-bold text-[#1a2c4d]">{formatIDR(eventCollected)}</h5></div>
                      <div><p className="text-[9px] text-gray-400 font-bold">Target Dana</p><h5 className="text-xs font-bold text-slate-700">{formatIDR(event.target_dana)}</h5></div>
                    </div>

                    {uploadingDocEventId === event.id_event && (
                      <div className="bg-slate-50 border border-gray-100 rounded-2xl p-4 mt-2 space-y-3">
                        <div className="flex justify-between items-center"><h4 className="text-xs font-bold text-[#1a2c4d]">Upload LPJ</h4><button onClick={() => setUploadingDocEventId(null)} className="text-gray-400 text-xs">Batal</button></div>
                        {docSuccess && <p className="text-xs text-green-600 font-bold">{docSuccess}</p>}
                        <form onSubmit={handleUploadDocSubmit} className="space-y-2">
                          <input type="file" required accept=".pdf" onChange={(e) => setDocFileUrl(e.target.value)} className="text-xs" />
                          <input type="text" placeholder="Deskripsi Laporan" value={docDesc} onChange={(e) => setDocDesc(e.target.value)} className="w-full p-2 text-xs border bg-white rounded-lg focus:outline-none" />
                          <button type="submit" className="w-full py-1.5 bg-[#1a2c4d] text-white text-[10px] font-bold rounded-lg">Kirim LPJ</button>
                        </form>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button onClick={() => { setEditingEvent(event); setNamaEvent(event.nama_event); setTanggalEvent(event.tanggal_event); setDeskripsiEvent(event.deskripsi || ''); setTargetDana(event.target_dana); setActiveTab('buat-event'); }}
                        className="py-2.5 bg-[#f8fafc] hover:bg-gray-100 text-[#1a2c4d] font-bold text-[11px] rounded-xl border border-gray-100 flex items-center justify-center gap-1.5">
                        <Edit3 className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button onClick={() => handleToggleEventStatus(event)}
                        className={`py-2.5 font-bold text-[11px] rounded-xl border flex items-center justify-center gap-1.5 ${event.status_event === 'Dipublikasikan' ? 'bg-[#fff5f5] text-[#e53e3e] border-[#fed7d7]' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        <CheckCircle className="h-3.5 w-3.5" /> {event.status_event === 'Dipublikasikan' ? 'Tutup Event' : 'Buka Event'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'buat-event' && (
          <div className="space-y-6">
            <button onClick={() => { setActiveTab('manajemen'); setEditingEvent(null); }} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium">
              <ArrowLeft className="h-4 w-4" /> Kembali
            </button>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#1a2c4d] tracking-tight">{editingEvent ? 'Edit Detail Event' : 'Buat Event Baru'}</h2>
            </div>
            {createError && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium">{createError}</div>}
            {createSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{createSuccess}</div>}
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Nama Event <span className="text-red-500">*</span></label>
                <input type="text" required value={namaEvent} onChange={(e) => setNamaEvent(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Tanggal Event <span className="text-red-500">*</span></label>
                <input type="date" required value={tanggalEvent} onChange={(e) => setTanggalEvent(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Deskripsi Event <span className="text-red-500">*</span></label>
                <textarea rows={4} required value={deskripsiEvent} onChange={(e) => setDeskripsiEvent(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none resize-none" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Target Dana (Rp) <span className="text-red-500">*</span></label>
                <input type="number" required value={targetDana} onChange={(e) => setTargetDana(parseInt(e.target.value) || 0)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" /></div>
              {!editingEvent && (
                <div className="space-y-1.5"><label className="text-xs font-bold text-gray-700">Upload Proposal (.pdf)</label>
                  <div className="border border-dashed border-gray-200 hover:border-blue-900/30 bg-[#f8fafc] rounded-2xl p-6 text-center relative cursor-pointer">
                    <input type="file" accept=".pdf" onChange={(e) => setProposalFile(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-gray-500">{proposalFile ? proposalFile.replace('C:\\fakepath\\', '') : 'Ketuk untuk memilih file PDF'}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button type="button" onClick={() => { setActiveTab('manajemen'); setEditingEvent(null); }} className="py-3 bg-white text-gray-500 font-bold text-xs rounded-xl border border-gray-100 hover:bg-gray-50">Batal</button>
                <button type="submit" disabled={createLoading} className="py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl disabled:opacity-50">
                  {createLoading ? 'Menyimpan...' : editingEvent ? 'Simpan Perubahan' : 'Terbitkan Event'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'profil' && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#1a2c4d] tracking-tight">Kelola Profil</h2>
            </div>
            {profileSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{profileSuccess}</div>}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Nama Organisasi <span className="text-red-500">*</span></label>
                <input type="text" required value={profileNama} onChange={(e) => setProfileNama(e.target.value)} className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Deskripsi</label>
                <textarea rows={4} value={profileDeskripsi} onChange={(e) => setProfileDeskripsi(e.target.value)} className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none resize-none" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">No. Telepon <span className="text-red-500">*</span></label>
                <input type="text" required value={profileNoTelp} onChange={(e) => setProfileNoTelp(e.target.value)} className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Nomor Rekening <span className="text-red-500">*</span></label>
                <input type="text" required value={profileRekNo} onChange={(e) => setProfileRekNo(e.target.value)} className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Nama Bank <span className="text-red-500">*</span></label>
                <select required value={profileNamaBank} onChange={(e) => setProfileNamaBank(e.target.value)} className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none">
                  <option value="">Pilih Bank</option>
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="BRI">BRI</option>
                  <option value="BNI">BNI</option>
                  <option value="BSI">BSI (Bank Syariah Indonesia)</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                  <option value="Danamon">Danamon</option>
                  <option value="Permata">Permata</option>
                  <option value="Panin">Panin</option>
                  <option value="Lainnya">Lainnya</option>
                </select></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Atas Nama Rekening <span className="text-red-500">*</span></label>
                <input type="text" required value={profileRekNama} onChange={(e) => setProfileRekNama(e.target.value)} className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none" /></div>
              <button type="submit" disabled={profileLoading} className="w-full py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl transition-all shadow-md mt-4 disabled:opacity-50">
                {profileLoading ? 'Menyimpan...' : 'Update Profil'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
