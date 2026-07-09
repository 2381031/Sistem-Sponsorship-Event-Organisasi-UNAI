import React, { useState } from 'react';
import { User, Event, SponsorshipTransaction, EventDoc, SponsorshipPackage } from '../types';
import { defaultPackages } from '../data';
import { 
  Building2, Calendar, Target, DollarSign, UploadCloud, Users, CheckCircle2, 
  Clock, AlertCircle, FileText, ChevronRight, Edit3, Trash2, Eye, Image as ImageIcon,
  FileDown, Video, ShieldAlert, CheckCircle, ArrowLeft, LogOut, Check, HelpCircle, Upload
} from 'lucide-react';

interface OrganizationDashboardProps {
  currentUser: User;
  events: Event[];
  transactions: SponsorshipTransaction[];
  docs: EventDoc[];
  onCreateEvent: (newEvent: Event) => void;
  onUpdateEvent: (updatedEvent: Event) => void;
  onUploadDoc: (newDoc: EventDoc) => void;
  onLogout: () => void;
}

export default function OrganizationDashboard({
  currentUser,
  events,
  transactions,
  docs,
  onCreateEvent,
  onUpdateEvent,
  onUploadDoc,
  onLogout
}: OrganizationDashboardProps) {
  
  // Tabs: 'dashboard' (Screen 5), 'manajemen' (Screen 6), 'buat-event' (Screen 7), 'profil' (Screen 3)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'manajemen' | 'buat-event' | 'profil'>('dashboard');

  // Profile Form States (Screen 3)
  const [profileNama, setProfileNama] = useState<string>(currentUser.organisasiDetails?.nama_organisasi || currentUser.nama_lengkap);
  const [profileEmail, setProfileEmail] = useState<string>(currentUser.email);
  const [profilePassword, setProfilePassword] = useState<string>('');
  const [profileNoTelp, setProfileNoTelp] = useState<string>(currentUser.organisasiDetails?.no_telp || '08123456789');
  const [profileDeskripsi, setProfileDeskripsi] = useState<string>(currentUser.organisasiDetails?.deskripsi || '');
  const [profileSuccess, setProfileSuccess] = useState<string>('');

  // Form States for Creating Event (Screen 7)
  const [namaEvent, setNamaEvent] = useState<string>('');
  const [tanggalEvent, setTanggalEvent] = useState<string>('');
  const [lokasiEvent, setLokasiEvent] = useState<string>('');
  const [deskripsiEvent, setDeskripsiEvent] = useState<string>('');
  const [targetDana, setTargetDana] = useState<number>(50000000);
  const [proposalFile, setProposalFile] = useState<string>('');
  const [createError, setCreateError] = useState<string>('');
  const [createSuccess, setCreateSuccess] = useState<string>('');

  // Editing event
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Form states for uploading LPJ/Doc
  const [uploadingDocEventId, setUploadingDocEventId] = useState<string | null>(null);
  const [docFileUrl, setDocFileUrl] = useState<string>('');
  const [docDesc, setDocDesc] = useState<string>('');
  const [docSuccess, setDocSuccess] = useState<string>('');

  const myEvents = events.filter(e => e.id_organisasi === currentUser.id);
  const myEventIds = myEvents.map(e => e.id);

  // Stats calculation
  const totalEvents = myEvents.length;

  // Total Verified funds
  const myApprovedTransactions = transactions.filter(t => myEventIds.includes(t.id_event) && t.status_pembayaran === 'verified');
  const totalDanaTerkumpul = myApprovedTransactions.reduce((acc, t) => acc + t.jumlah, 0);

  // Total Target Dana across all open/closed events
  const totalTargetDana = myEvents.reduce((acc, e) => acc + e.target_dana, 0);

  // Format currency
  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('Profil berhasil diperbarui!');
    // Update local variables or parent state
    setTimeout(() => setProfileSuccess(''), 3000);
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');

    if (!namaEvent || !tanggalEvent || !lokasiEvent || !deskripsiEvent || !targetDana) {
      setCreateError('Harap isi semua kolom wajib (*).');
      return;
    }

    const newEventId = 'e-' + Math.random().toString(36).substring(2, 9);
    
    // Automatically divide target into packages based on requested sponsorship tiers
    const customPackages: SponsorshipPackage[] = [
      {
        id: 'pkg-p-' + newEventId,
        nama_paket: 'Platinum',
        jumlah_dana: targetDana,
        deskripsi_keuntungan: [
          'Menjadi sponsor tunggal kegiatan',
          'Logo eksklusif pada semua media dengan ukuran 100% dari tempat logo yang tersedia',
          'Dapat menyertakan media promosi, brosur atau sampel produk saat kegiatan',
          'Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan oleh moderator kegiatan ini',
          'Mendapatkan hasil dari dokumentasi kegiatan berupa video dan foto-foto',
          'Publikasi di media elektronik dan cetak'
        ]
      },
      {
        id: 'pkg-g-' + newEventId,
        nama_paket: 'Gold',
        jumlah_dana: Math.round(targetDana * 0.75),
        deskripsi_keuntungan: [
          'Logo eksklusif pada semua media dengan ukuran 75% dari tempat logo yang tersedia',
          'Dapat menyertakan media promosi, brosur atau sampel produk saat kegiatan',
          'Ucapan penghargaan pada sponsor saat sambutan pembukaan dan penutupan',
          'Mendapatkan hasil dari dokumentasi kegiatan berupa video dan foto-foto',
          'Publikasi di media elektronik dan cetak'
        ]
      },
      {
        id: 'pkg-s-' + newEventId,
        nama_paket: 'Silver',
        jumlah_dana: Math.round(targetDana * 0.25),
        deskripsi_keuntungan: [
          'Logo pada media dengan ukuran 25% dari tempat logo yang tersedia',
          'Dapat menyertakan media promosi, brosur atau sampel produk',
          'Mendapatkan hasil dari dokumentasi kegiatan berupa foto-foto',
          'Publikasi di media cetak'
        ]
      },
      {
        id: 'pkg-b-' + newEventId,
        nama_paket: 'Bronze',
        jumlah_dana: Math.round(targetDana * 0.15),
        deskripsi_keuntungan: [
          'Logo pada media dengan ukuran 15% dari tempat logo yang tersedia',
          'Mendapatkan publikasi di media internal acara',
          'Sertifikat penghargaan digital dari Panitia'
        ]
      },
      {
        id: 'pkg-x-' + newEventId,
        nama_paket: 'Spesial',
        jumlah_dana: 0,
        deskripsi_keuntungan: [
          'Kontribusi sukarela — jumlah disesuaikan oleh sponsor',
          'Publikasi sesuai kesepakatan dengan panitia'
        ]
      }
    ];

    const newEvent: Event = {
      id: newEventId,
      id_organisasi: currentUser.id,
      nama_organisasi: profileNama,
      nama_event: namaEvent,
      tanggal_event: tanggalEvent,
      deskripsi: deskripsiEvent,
      target_dana: targetDana,
      dana_terkumpul: 0,
      proposal_name: proposalFile ? proposalFile.replace('C:\\fakepath\\', '') : 'Proposal_' + namaEvent.replace(/\s+/g, '_') + '.pdf',
      status_event: 'open',
      paket_tersedia: customPackages
    };

    onCreateEvent(newEvent);
    setCreateSuccess('Event berhasil diterbitkan!');
    
    setTimeout(() => {
      setCreateSuccess('');
      setActiveTab('manajemen');
      // Reset forms
      setNamaEvent('');
      setTanggalEvent('');
      setLokasiEvent('');
      setDeskripsiEvent('');
      setProposalFile('');
    }, 2000);
  };

  const handleToggleEventStatus = (event: Event) => {
    const updated: Event = {
      ...event,
      status_event: event.status_event === 'open' ? 'closed' : 'open'
    };
    onUpdateEvent(updated);
  };

  const handleUploadDocSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingDocEventId || !docFileUrl) return;

    const event = events.find(ev => ev.id === uploadingDocEventId);
    onUploadDoc({
      id: 'd-doc' + Math.random().toString(36).substring(2, 9),
      id_event: uploadingDocEventId,
      nama_event: event ? event.nama_event : 'Event',
      url_file: docFileUrl.replace('C:\\fakepath\\', ''),
      tipe_file: 'pdf',
      keterangan: docDesc || 'Laporan pertanggungjawaban kegiatan.',
      tanggal_upload: new Date().toISOString().split('T')[0]
    });

    setDocSuccess('Laporan LPJ berhasil diunggah!');
    setTimeout(() => {
      setDocSuccess('');
      setUploadingDocEventId(null);
      setDocFileUrl('');
      setDocDesc('');
    }, 2000);
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      
      {/* Dark Navy Header Row with Navigation Badges */}
      <div className="bg-[#1a2c4d] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center font-bold text-yellow-400">
            {currentUser.organisasiDetails?.nama_organisasi?.substring(0, 2).toUpperCase() || 'OM'}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">{profileNama}</h1>
            <p className="text-[10px] text-gray-300 font-medium">Organisasi</p>
          </div>
        </div>

        {/* Dashboard sub navigation tab controllers */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5 bg-slate-800/50 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                activeTab === 'dashboard' ? 'bg-[#1a2c4d] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('manajemen')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                activeTab === 'manajemen' || activeTab === 'buat-event' ? 'bg-[#1a2c4d] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Manajemen Event
            </button>
            <button 
              onClick={() => { setActiveTab('profil'); setProfileSuccess(''); }}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                activeTab === 'profil' ? 'bg-[#1a2c4d] text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Profil
            </button>
          </div>

          <button 
            onClick={onLogout}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all duration-150 flex items-center justify-center"
            title="Keluar / Logout"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Main body area containing active components to match screenshots */}
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* ==================== 1. MONITORING DASHBOARD (Screen 5) ==================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            <div className="text-center mb-6">
              <div className="h-12 w-12 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mx-auto mb-3">
                <Building2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#1a2c4d] tracking-tight">Dashboard Monitoring</h2>
              <p className="text-gray-400 text-xs mt-1 font-medium">Ringkasan event dan total dana terkumpul</p>
            </div>

            {/* Stats list cards */}
            <div className="space-y-4">
              
              {/* Total Event Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex items-center gap-4">
                <div className="h-10 w-10 bg-[#f8fafc] rounded-xl flex items-center justify-center text-gray-500 border border-gray-100">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Event</p>
                  <h4 className="text-base font-extrabold text-slate-800">{totalEvents}</h4>
                </div>
              </div>

              {/* Total Dana Terkumpul Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex items-center gap-4">
                <div className="h-10 w-10 bg-[#f8fafc] rounded-xl flex items-center justify-center text-blue-900 border border-gray-100">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Dana Terkumpul</p>
                  <h4 className="text-base font-extrabold text-[#1a2c4d]">{formatIDR(totalDanaTerkumpul)}</h4>
                </div>
              </div>

              {/* Total Target Dana Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex items-center gap-4">
                <div className="h-10 w-10 bg-[#f8fafc] rounded-xl flex items-center justify-center text-gray-400 border border-gray-100">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Target Dana</p>
                  <h4 className="text-base font-extrabold text-slate-700">{formatIDR(totalTargetDana)}</h4>
                </div>
              </div>

            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#1a2c4d] tracking-tight">Daftar Sponsor</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Sponsor yang telah mendukung event Anda melalui sistem</p>
                </div>
              </div>

              {myApprovedTransactions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-slate-50 p-4 text-center text-[11px] text-gray-500">
                  Belum ada sponsor yang terverifikasi untuk event Anda.
                </div>
              ) : (
                <div className="space-y-2">
                  {myApprovedTransactions.slice(0, 4).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-slate-50 px-3 py-2.5">
                      <div>
                        <p className="text-[11px] font-bold text-[#1a2c4d]">{tx.nama_sponsor}</p>
                        <p className="text-[9px] text-gray-400">{tx.nama_paket} • {tx.nama_event}</p>
                      </div>
                      <span className="text-[10px] font-extrabold text-emerald-600">{formatIDR(tx.jumlah)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Main Event Monitoring Card (E.g. CyberCup 2026 or last event) */}
            {myEvents.map(event => {
              const eventTxs = transactions.filter(t => t.id_event === event.id);
              const eventApprovedTxs = eventTxs.filter(t => t.status_pembayaran === 'verified');
              const eventCollected = eventApprovedTxs.reduce((sum, t) => sum + t.jumlah, 0);
              const eventRemaining = Math.max(0, event.target_dana - eventCollected);
              const progressPct = event.target_dana > 0 ? Math.min(100, Math.round((eventCollected / event.target_dana) * 100)) : 0;

              return (
                <div key={event.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-4">
                  
                  {/* Event Title Block */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-[#1a2c4d] tracking-tight">{event.nama_event}</h3>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">{event.tanggal_event}</p>
                    </div>
                    <span className="bg-[#e2f6ec] text-[#2ebd7d] px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                      {event.status_event}
                    </span>
                  </div>

                  {/* Fund comparison grid */}
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* Collected Box */}
                    <div className="bg-[#f8fafc] rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold">Dana Terkumpul</p>
                      <h5 className="text-xs font-extrabold text-[#1a2c4d] mt-1">{formatIDR(eventCollected)}</h5>
                      <p className="text-[9px] text-gray-400 mt-0.5">dari {eventApprovedTxs.length} sponsor</p>
                    </div>

                    {/* Target Box */}
                    <div className="bg-[#f8fafc] rounded-xl p-3 border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold">Target Dana</p>
                      <h5 className="text-xs font-extrabold text-slate-700 mt-1">{formatIDR(event.target_dana)}</h5>
                      <p className="text-[9px] text-red-500 font-bold mt-0.5">Sisa: {formatIDR(eventRemaining)}</p>
                    </div>

                  </div>

                  {/* Progress bar matching Screen 5 */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-gray-700">
                      <span>Progress</span>
                      <span>{progressPct}%</span>
                    </div>
                    <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                      <div 
                        className="h-full bg-[#1a2c4d] rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                      <span>Terkumpul: {progressPct}%</span>
                      <span>Sisa: {100 - progressPct}%</span>
                    </div>
                  </div>

                  <p className="text-[9px] text-gray-400 italic font-medium leading-relaxed">
                    * Hanya menampilkan dana dari pembayaran yang sudah diverifikasi admin
                  </p>

                  {/* Sponsor list table */}
                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <h4 className="text-xs font-bold text-[#1a2c4d]">| Daftar Sponsor</h4>
                    
                    {eventTxs.length === 0 ? (
                      <p className="text-[10px] text-gray-400 italic font-medium py-2">Belum ada sponsor yang berkontribusi.</p>
                    ) : (
                      <div className="overflow-x-auto border border-gray-100 rounded-xl">
                        <table className="w-full text-left text-[11px]">
                          <thead>
                            <tr className="bg-[#f8fafc] text-gray-500 font-bold border-b border-gray-100">
                              <th className="p-2">Nama Sponsor</th>
                              <th className="p-2">Paket</th>
                              <th className="p-2">Jumlah</th>
                              <th className="p-2">Status</th>
                              <th className="p-2 text-center">Dok</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {eventTxs.map(tx => (
                              <tr key={tx.id} className="hover:bg-gray-50/50">
                                <td className="p-2 font-semibold text-slate-700 max-w-[100px] truncate">{tx.nama_sponsor}</td>
                                <td className="p-2 text-gray-500">{tx.nama_paket}</td>
                                <td className="p-2 font-mono font-bold text-[#1a2c4d]">{formatIDR(tx.jumlah)}</td>
                                <td className="p-2">
                                  <span className={`inline-block px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold ${
                                    tx.status_pembayaran === 'verified' ? 'bg-[#e2f6ec] text-[#2ebd7d]' : 'bg-amber-100 text-amber-800'
                                  }`}>
                                    {tx.status_pembayaran === 'verified' ? 'Terverifikasi' : 'Pending'}
                                  </span>
                                </td>
                                <td className="p-2 text-center">
                                  {tx.status_pembayaran === 'verified' ? (
                                    <button 
                                      onClick={() => {
                                        setUploadingDocEventId(event.id);
                                        setActiveTab('manajemen');
                                      }}
                                      className="text-gray-400 hover:text-blue-900 transition-colors"
                                      title="Upload Laporan LPJ"
                                    >
                                      <Upload className="h-3.5 w-3.5 mx-auto" />
                                    </button>
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}

            {/* Bottom button triggers tab navigation */}
            <button 
              onClick={() => setActiveTab('manajemen')}
              className="w-full py-3 bg-[#f8fafc] hover:bg-gray-100 text-[#1a2c4d] font-bold text-xs rounded-xl border border-gray-100 transition-all text-center"
            >
              Lihat Semua Event
            </button>

          </div>
        )}


        {/* ==================== 2. MANAJEMEN EVENT (Screen 6) ==================== */}
        {activeTab === 'manajemen' && (
          <div className="space-y-6">
            
            <div className="text-center mb-6">
              <div className="h-12 w-12 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mx-auto mb-3">
                <Calendar className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#1a2c4d] tracking-tight">Manajemen Event</h2>
              <p className="text-gray-400 text-xs mt-1 font-medium">Buat, kelola, dan pantau event Anda</p>
            </div>

            {/* Buat Event Baru Blue button */}
            <button
              onClick={() => setActiveTab('buat-event')}
              className="w-full py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-900/10 text-center"
            >
              + Buat Event Baru
            </button>

            <p className="text-xs text-gray-400 font-bold">Total: {totalEvents} event</p>

            {/* Event List */}
            <div className="space-y-4">
              {myEvents.map(event => {
                const eventTxs = transactions.filter(t => t.id_event === event.id);
                const eventApprovedTxs = eventTxs.filter(t => t.status_pembayaran === 'verified');
                const eventCollected = eventApprovedTxs.reduce((sum, t) => sum + t.jumlah, 0);

                return (
                  <div key={event.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-4">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-[#1a2c4d] tracking-tight">{event.nama_event}</h3>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">{event.tanggal_event}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Lokasi: {event.proposal_name ? 'Kampus UNAI' : 'Jakarta Convention Center'}</p>
                      </div>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                        event.status_event === 'open' ? 'bg-[#e2f6ec] text-[#2ebd7d]' : 'bg-red-50 text-red-600'
                      }`}>
                        {event.status_event === 'open' ? 'OPEN' : 'CLOSED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-t border-gray-50 pt-3">
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold">Total Dana</p>
                        <h5 className="text-xs font-bold text-[#1a2c4d] mt-0.5">{formatIDR(eventCollected)}</h5>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-bold">Target Dana</p>
                        <h5 className="text-xs font-bold text-slate-700 mt-0.5">{formatIDR(event.target_dana)}</h5>
                      </div>
                    </div>

                    <p className="text-[10px] text-gray-500 font-medium">
                      🧑‍🤝‍🧑 {eventTxs.length} sponsor terdaftar
                    </p>

                    {/* Upload LPJ subform if clicked */}
                    {uploadingDocEventId === event.id && (
                      <div className="bg-slate-50 border border-gray-100 rounded-2xl p-4 mt-2 space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs font-bold text-[#1a2c4d]">Upload Laporan LPJ (PDF)</h4>
                          <button onClick={() => setUploadingDocEventId(null)} className="text-gray-400 text-xs">Batal</button>
                        </div>
                        {docSuccess && <p className="text-xs text-green-600 font-bold">{docSuccess}</p>}
                        <form onSubmit={handleUploadDocSubmit} className="space-y-2">
                          <input 
                            type="file" 
                            required 
                            accept=".pdf" 
                            onChange={(e) => setDocFileUrl(e.target.value)}
                            className="text-xs"
                          />
                          <input 
                            type="text" 
                            placeholder="Deskripsi Laporan (Contoh: LPJ Pertanggungjawaban)"
                            value={docDesc}
                            onChange={(e) => setDocDesc(e.target.value)}
                            className="w-full p-2 text-xs border bg-white rounded-lg focus:outline-none"
                          />
                          <button type="submit" className="w-full py-1.5 bg-[#1a2c4d] text-white text-[10px] font-bold rounded-lg">
                            Kirim LPJ
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Edit and Tutup Event buttons */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        onClick={() => {
                          setEditingEvent(event);
                          setNamaEvent(event.nama_event);
                          setTanggalEvent(event.tanggal_event);
                          setLokasiEvent('Kampus UNAI');
                          setDeskripsiEvent(event.deskripsi);
                          setTargetDana(event.target_dana);
                          setActiveTab('buat-event');
                        }}
                        className="py-2.5 bg-[#f8fafc] hover:bg-gray-100 text-[#1a2c4d] font-bold text-[11px] rounded-xl border border-gray-100 transition-all text-center flex items-center justify-center gap-1.5"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        onClick={() => handleToggleEventStatus(event)}
                        className={`py-2.5 font-bold text-[11px] rounded-xl border transition-all text-center flex items-center justify-center gap-1.5 ${
                          event.status_event === 'open' 
                            ? 'bg-[#fff5f5] text-[#e53e3e] border-[#fed7d7] hover:bg-red-100/50' 
                            : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100/50'
                        }`}
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        {event.status_event === 'open' ? 'Tutup Event' : 'Buka Event'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}


        {/* ==================== 3. BUAT EVENT BARU (Screen 7) ==================== */}
        {activeTab === 'buat-event' && (
          <div className="space-y-6">
            
            <button 
              onClick={() => {
                setActiveTab('manajemen');
                setEditingEvent(null);
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-4 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Dashboard
            </button>

            <div className="text-center mb-6">
              <div className="h-12 w-12 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mx-auto mb-3">
                <Calendar className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#1a2c4d] tracking-tight">
                {editingEvent ? 'Edit Detail Event' : 'Buat Event Baru'}
              </h2>
              <p className="text-gray-400 text-xs mt-1 font-medium">Isi informasi event dan upload proposal</p>
            </div>

            {createError && (
              <div className="p-3 mb-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            {createSuccess && (
              <div className="p-3 mb-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{createSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateEvent} className="space-y-4">
              
              {/* Nama Event */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Nama Event <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: TechFest 2026"
                  value={namaEvent}
                  onChange={(e) => setNamaEvent(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none"
                />
              </div>

              {/* Tanggal Event */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Tanggal Event <span className="text-red-500">*</span></label>
                <input 
                  type="date"
                  required
                  value={tanggalEvent}
                  onChange={(e) => setTanggalEvent(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none text-gray-600"
                />
              </div>

              {/* Lokasi Event */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Lokasi Event <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  required
                  placeholder="Contoh: Jakarta Convention Center"
                  value={lokasiEvent}
                  onChange={(e) => setLokasiEvent(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none"
                />
              </div>

              {/* Deskripsi Event */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Deskripsi Event <span className="text-red-500">*</span></label>
                <textarea 
                  rows={4}
                  required
                  placeholder="Jelaskan tentang event ini..."
                  value={deskripsiEvent}
                  onChange={(e) => setDeskripsiEvent(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none resize-none"
                />
              </div>

              {/* Target Dana */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">Target Dana (Rp) <span className="text-red-500">*</span></label>
                <input 
                  type="number"
                  required
                  placeholder="50000000"
                  value={targetDana}
                  onChange={(e) => setTargetDana(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none"
                />
              </div>

              {/* Upload Proposal PDF box with Dotted Border */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">Upload Proposal (.pdf) <span className="text-red-500">*</span></label>
                
                <div className="border border-dashed border-gray-200 hover:border-blue-900/30 bg-[#f8fafc] rounded-2xl p-6 text-center transition-colors relative cursor-pointer">
                  <input 
                    type="file"
                    required={!editingEvent}
                    accept=".pdf"
                    onChange={(e) => setProposalFile(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-500">
                    {proposalFile ? proposalFile.replace('C:\\fakepath\\', '') : 'Ketuk untuk memilih file PDF'}
                  </p>
                </div>
              </div>

              {/* Cancel and Submit Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('manajemen');
                    setEditingEvent(null);
                  }}
                  className="py-3 bg-white text-gray-500 font-bold text-xs rounded-xl border border-gray-100 hover:bg-gray-50 text-center transition-all"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl text-center transition-all"
                >
                  {editingEvent ? 'Simpan Perubahan' : 'Terbitkan Event'}
                </button>
              </div>

            </form>

          </div>
        )}


        {/* ==================== 4. PROFILE SCREEN (Screen 3 style inside Dashboard) ==================== */}
        {activeTab === 'profil' && (
          <div className="space-y-6">
            
            <div className="text-center mb-6">
              <div className="h-12 w-12 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mx-auto mb-3">
                <Building2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#1a2c4d] tracking-tight font-sans">Kelola Profil</h2>
              <p className="text-gray-400 text-xs mt-1 font-medium font-sans">Update informasi profil organisasi Anda</p>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{profileSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              
              {/* Nama Organisasi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Nama Organisasi <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  required
                  value={profileNama}
                  onChange={(e) => setProfileNama(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900/20 font-medium"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Email <span className="text-red-500">*</span></label>
                <input 
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none text-gray-500"
                />
              </div>

              {/* Password Baru */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Password Baru</label>
                <input 
                  type="password"
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none"
                />
                <p className="text-[10px] text-gray-400 font-medium pl-1 mt-0.5">Minimal 8 karakter</p>
              </div>

              {/* Nomor Telepon */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Nomor Telepon <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  required
                  value={profileNoTelp}
                  onChange={(e) => setProfileNoTelp(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none"
                />
              </div>

              {/* Deskripsi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Deskripsi Organisasi</label>
                <textarea 
                  rows={4}
                  placeholder="Himpunan Mahasiswa Fakultas Teknologi Informasi"
                  value={profileDeskripsi}
                  onChange={(e) => setProfileDeskripsi(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl transition-all shadow-md mt-4"
              >
                Update Profil
              </button>

            </form>

          </div>
        )}

      </div>
    </div>
  );
}
