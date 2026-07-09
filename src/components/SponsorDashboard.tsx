import React, { useState } from 'react';
import { User, Event, SponsorshipTransaction, EventDoc, SponsorshipPackage } from '../types';
import { 
  Search, ArrowLeft, Check, Edit2, FileText, Upload, Landmark, History, 
  User as UserIcon, Calendar, MapPin, Building, ShieldAlert, CheckCircle2,
  FolderOpen, DollarSign, LogOut
} from 'lucide-react';

interface SponsorDashboardProps {
  currentUser: User;
  events: Event[];
  transactions: SponsorshipTransaction[];
  docs: EventDoc[];
  onAddTransaction: (newTx: SponsorshipTransaction) => void;
  onUpdateTransaction: (updatedTx: SponsorshipTransaction) => void;
  onLogout: () => void;
}

export default function SponsorDashboard({
  currentUser,
  events,
  transactions,
  docs,
  onAddTransaction,
  onUpdateTransaction,
  onLogout
}: SponsorDashboardProps) {
  
  // Navigation: 'browse', 'riwayat', 'profil', 'pilih-paket', 'bukti-bayar'
  const [activeTab, setActiveTab] = useState<'browse' | 'riwayat' | 'profil'>('browse');
  const [currentStep, setCurrentStep] = useState<'list' | 'pilih-paket' | 'bukti-bayar'>('list');

  // Search State
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Selected event and package
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<SponsorshipPackage | null>(null);

  // Form input fields for upload (Screen 10)
  const [buktiFile, setBuktiFile] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Profile Form States (Screen 4)
  const [profileNama, setProfileNama] = useState<string>(currentUser.sponsorDetails?.nama_perusahaan || currentUser.nama_lengkap);
  const [profileEmail, setProfileEmail] = useState<string>(currentUser.email);
  const [profilePassword, setProfilePassword] = useState<string>('');
  const [profileNoTelp, setProfileNoTelp] = useState<string>(currentUser.sponsorDetails?.no_telp || '08123456789');
  const [profileAlamat, setProfileAlamat] = useState<string>(currentUser.sponsorDetails?.alamat || 'Jl. Sudirman No. 123, Jakarta');
  const [profileDeskripsi, setProfileDeskripsi] = useState<string>(currentUser.sponsorDetails?.deskripsi || '');
  const [profileSuccess, setProfileSuccess] = useState<string>('');

  // Editing transaction state
  const [editingTx, setEditingTx] = useState<SponsorshipTransaction | null>(null);

  // Filter events belonging to search
  const openEvents = events.filter(e => 
    (e.status_event === 'open' || e.status_event === 'closed') &&
    (e.nama_event.toLowerCase().includes(searchTerm.toLowerCase()) || 
     e.nama_organisasi.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const myTransactions = transactions.filter(t => t.id_sponsor === currentUser.id);

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
    setTimeout(() => setProfileSuccess(''), 3000);
  };

  const handleConfirmPackageSelect = () => {
    if (!selectedPackage) {
      alert('Pilih paket yang Anda inginkan terlebih dahulu.');
      return;
    }
    setCurrentStep('bukti-bayar');
  };

  const handleUploadPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!buktiFile) {
      setErrorMsg('Harap pilih file bukti transfer Anda.');
      return;
    }

    if (!selectedEvent || !selectedPackage) return;

    // Create a new transaction as pending_verification
    const newTx: SponsorshipTransaction = {
      id: 't-tx' + Math.random().toString(36).substring(2, 9),
      id_event: selectedEvent.id,
      nama_event: selectedEvent.nama_event,
      id_sponsor: currentUser.id,
      nama_sponsor: profileNama,
      id_paket: selectedPackage.id,
      nama_paket: selectedPackage.nama_paket,
      jumlah: selectedPackage.jumlah_dana,
      bukti_pembayaran_url: buktiFile.replace('C:\\fakepath\\', '') || 'bukti_transfer.png',
      status_pembayaran: 'pending_verification',
      tanggal_transaksi: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      rekening_tujuan: 'BCA 1234567890 a.n. Bendahara',
      nama_pengirim: profileNama
    };

    onAddTransaction(newTx);
    setSuccessMsg('Bukti transfer berhasil dikirim! Menunggu verifikasi admin.');
    
    setTimeout(() => {
      setSuccessMsg('');
      setCurrentStep('list');
      setActiveTab('riwayat');
      setBuktiFile('');
      setSelectedPackage(null);
      setSelectedEvent(null);
    }, 2500);
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      
      {/* Dark Navy Header Row with Name and Perusahaan Details */}
      <div className="bg-[#1a2c4d] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center font-bold text-emerald-400">
            {profileNama.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">{profileNama}</h1>
            <p className="text-[10px] text-emerald-400 font-medium font-mono">Sponsor</p>
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
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-24">

        {/* ==================== SCREEN 8: CARI EVENT ==================== */}
        {activeTab === 'browse' && currentStep === 'list' && (
          <div className="space-y-6">
            
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-[#1a2c4d] tracking-tight">Cari Event & Ajukan Sponsorship</h2>
              <p className="text-gray-400 text-xs mt-1 font-medium">Temukan event organisasi mahasiswa UNAI dan berikan dukungan sponsorship secara terstruktur</p>
            </div>

            {/* Search Box with Search Icon */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input 
                type="text"
                placeholder="Cari nama event atau organisasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-xs bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-1 focus:ring-blue-900/10 font-medium shadow-[0_2px_15px_rgba(0,0,0,0.02)]"
              />
            </div>

            {/* Statistics Grid (Screen 8) */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Event Tersedia Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_2px_15px_rgba(0,0,0,0.01)] text-center">
                <h4 className="text-2xl font-extrabold text-[#1a2c4d]">{openEvents.length}</h4>
                <p className="text-gray-400 text-[10px] font-bold uppercase mt-1">Event Tersedia</p>
              </div>

              {/* Sponsor Aktif Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-[0_2px_15px_rgba(0,0,0,0.01)] text-center">
                <h4 className="text-2xl font-extrabold text-[#1a2c4d]">
                  {myTransactions.filter(t => t.status_pembayaran === 'verified').length}
                </h4>
                <p className="text-gray-400 text-[10px] font-bold uppercase mt-1">Sponsorship Aktif</p>
              </div>

            </div>

            {/* List of Open/Closed Events */}
            <div className="space-y-4">
              {openEvents.map(event => {
                const eventTxs = transactions.filter(t => t.id_event === event.id);
                const eventApprovedTxs = eventTxs.filter(t => t.status_pembayaran === 'verified');
                const eventCollected = eventApprovedTxs.reduce((sum, t) => sum + t.jumlah, 0);
                const sisaTarget = Math.max(0, event.target_dana - eventCollected);
                const progressPct = event.target_dana > 0 ? Math.min(100, Math.round((eventCollected / event.target_dana) * 100)) : 0;

                return (
                  <div key={event.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_4px_25px_rgba(0,0,0,0.02)] space-y-4">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-base font-bold text-[#1a2c4d] tracking-tight">{event.nama_event}</h3>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">🗓️ {event.tanggal_event}</p>
                        <p className="text-[10px] text-gray-400 font-medium">📍 {event.proposal_name ? 'Kampus UNAI' : 'Jakarta Convention Center'}</p>
                      </div>
                      <span className="bg-[#e2f6ec] text-[#2ebd7d] px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                        {event.status_event}
                      </span>
                    </div>

                    {/* Progress Bar and Collected summary */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-gray-700">
                        <span>Dana terkumpul</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#1a2c4d] rounded-full"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-medium">
                        <span className="text-[#1a2c4d] font-bold">Terkumpul: {formatIDR(eventCollected)}</span>
                        <span className="text-red-500 font-bold">Sisa target: {formatIDR(sisaTarget)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                      <span className="text-[10px] text-gray-400 font-bold">Target: {formatIDR(event.target_dana)}</span>
                      
                      <button
                        onClick={() => {
                          setSelectedEvent(event);
                          // Select Platinum as default selected package
                          setSelectedPackage(event.paket_tersedia[0] || null);
                          setCurrentStep('pilih-paket');
                        }}
                        className="text-xs font-extrabold text-[#1a2c4d] hover:underline"
                      >
                        Lihat Detail &gt;
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}


        {/* ==================== SCREEN 9: PILIH PAKET SPONSORSHIP ==================== */}
        {activeTab === 'browse' && currentStep === 'pilih-paket' && selectedEvent && (
          <div className="space-y-6">
            
            {/* Back Button and Title */}
            <button 
              onClick={() => setCurrentStep('list')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-4 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Pilih Paket Sponsorship
            </button>

            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-[#1a2c4d] tracking-tight">Pilih Paket Sponsorship</h2>
              <p className="text-gray-400 text-xs mt-1 font-medium">Pilih paket yang sesuai dengan kebutuhan Anda</p>
            </div>

            {/* Gray Event Info Card Banner */}
            <div className="bg-[#f0f4f8] rounded-2xl p-4 border border-gray-100 text-center space-y-1">
              <p className="text-[10px] text-gray-400 font-bold">Event: {selectedEvent.nama_event}</p>
              <p className="text-[11px] text-[#1a2c4d] font-bold">Target Dana: {formatIDR(selectedEvent.target_dana)}</p>
            </div>

            {/* Packages List */}
            {selectedEvent.status_event === 'closed' && (
              <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100 text-yellow-800 text-sm font-bold">
                Event ini sudah ditutup dan tidak menerima sponsorship saat ini.
              </div>
            )}
            <div className="space-y-4">
              {selectedEvent.paket_tersedia.map(pkg => {
                const isSelected = selectedPackage?.id === pkg.id;
                // If event is closed, do not allow selecting packages
                const disabled = selectedEvent.status_event === 'closed';

                return (
                  <div 
                    key={pkg.id}
                    onClick={() => { if (!disabled) setSelectedPackage(pkg); }}
                    className={`bg-white rounded-3xl p-5 border ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} transition-all space-y-3 relative ${
                      isSelected 
                        ? 'border-yellow-400 ring-2 ring-yellow-400/20 shadow-[0_4px_20px_rgba(217,119,6,0.05)]' 
                        : 'border-gray-100 hover:border-gray-200 shadow-[0_2px_15px_rgba(0,0,0,0.01)]'
                    }`}
                  >
                    
                    {/* Top Package Details and Radio Badge */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-extrabold text-slate-800">{pkg.nama_paket}</h4>
                          <span className="bg-[#edf2f7] text-gray-600 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {pkg.nama_paket === 'Platinum' ? '100%' : pkg.nama_paket === 'Gold' ? '75%' : pkg.nama_paket === 'Silver' ? '25%' : pkg.nama_paket === 'Bronze' ? '15%' : 'Custom'}
                          </span>
                        </div>
                        <h5 className="text-lg font-extrabold text-[#1a2c4d] mt-1.5">{formatIDR(pkg.jumlah_dana)}</h5>
                      </div>

                      {/* Circular Custom Radio Button (gold/yellow checked) */}
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected ? 'border-yellow-500 bg-yellow-500 text-white' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>

                    {/* Benefit bullets list */}
                    <ul className="space-y-2 pt-2 border-t border-gray-50 text-[11px] text-gray-500 font-medium">
                      {pkg.deskripsi_keuntungan.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-3.5 w-3.5 text-yellow-500 shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>

                  </div>
                );
              })}
            </div>

            {/* Next step buttons */}
            <button 
              onClick={handleConfirmPackageSelect}
              disabled={selectedEvent.status_event === 'closed'}
              className={`w-full py-3 ${selectedEvent.status_event === 'closed' ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-[#1a2c4d] hover:bg-[#15233e] text-white'} font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-900/10 text-center mt-4`}
            >
              Lanjutkan Pembayaran
            </button>

          </div>
        )}


        {/* ==================== SCREEN 10: UPLOAD BUKTI PEMBAYARAN ==================== */}
        {activeTab === 'browse' && currentStep === 'bukti-bayar' && selectedEvent && selectedPackage && (
          <div className="space-y-6">
            
            <button 
              onClick={() => setCurrentStep('pilih-paket')}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-4 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Upload Bukti Pembayaran
            </button>

            <div className="text-center mb-6">
              <div className="h-12 w-12 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mx-auto mb-3">
                <Upload className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#1a2c4d] tracking-tight">Upload Bukti Pembayaran</h2>
              <p className="text-gray-400 text-xs mt-1 font-medium">Upload bukti transfer untuk verifikasi</p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-medium">
                {successMsg}
              </div>
            )}

            {/* Grey Row chosen package */}
            <div className="bg-[#f8fafc] rounded-2xl p-4 border border-gray-100 flex justify-between items-center text-xs">
              <span className="text-gray-400 font-bold">Paket dipilih</span>
              <span className="font-extrabold text-[#1a2c4d] uppercase font-mono">{selectedPackage.nama_paket}</span>
            </div>

            {/* Transfer Bank Information Box */}
            <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_2px_15px_rgba(0,0,0,0.01)] space-y-4">
              <h4 className="text-xs font-bold text-[#1a2c4d] uppercase border-b pb-2">Informasi Bank Transfer:</h4>
              
              <div className="divide-y divide-gray-50 text-xs">
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-400 font-medium">Bank</span>
                  <span className="font-bold text-slate-800">BCA</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-400 font-medium">No. Rekening</span>
                  <span className="font-mono font-bold text-slate-800">1234567890</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-400 font-medium">Atas Nama</span>
                  <span className="font-bold text-slate-800">Bendahara</span>
                </div>
                <div className="flex justify-between py-2.5">
                  <span className="text-gray-400 font-medium">Jumlah Transfer</span>
                  <span className="font-bold text-[#1a2c4d] font-mono">{formatIDR(selectedPackage.jumlah_dana)}</span>
                </div>
              </div>
            </div>

            {/* Field: Upload Bukti Transfer */}
            <form onSubmit={handleUploadPayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Upload Bukti Transfer</label>
                <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center bg-[#f8fafc] hover:border-blue-900/20 relative transition-colors cursor-pointer">
                  <input 
                    type="file"
                    required
                    accept="image/*"
                    onChange={(e) => setBuktiFile(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FileText className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-500">
                    {buktiFile ? buktiFile.replace('C:\\fakepath\\', '') : 'Pilih File pembayaran.png'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCurrentStep('pilih-paket')}
                  className="py-3 bg-white hover:bg-gray-50 text-gray-500 font-bold text-xs rounded-xl border border-gray-100 text-center transition-all"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  className="py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl text-center transition-all shadow-md shadow-blue-900/10"
                >
                  Upload Bukti Pembayaran
                </button>
              </div>
            </form>

          </div>
        )}


        {/* ==================== SCREEN 11: RIWAYAT SPONSORSHIP SAYA ==================== */}
        {activeTab === 'riwayat' && (
          <div className="space-y-6">
            
            <div className="text-center mb-6">
              <div className="h-12 w-12 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mx-auto mb-3">
                <History className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#1a2c4d] tracking-tight">Riwayat Sponsorship Saya</h2>
              <p className="text-gray-400 text-xs mt-1 font-medium">Lihat dokumentasi event yang telah Anda danai</p>
            </div>

            <p className="text-xs text-gray-400 font-bold">Total: {myTransactions.length} sponsorship</p>

            {/* Sponsorship History cards */}
            <div className="space-y-4">
              {myTransactions.map(tx => {
                const isPending = tx.status_pembayaran === 'pending_verification';

                return (
                  <div key={tx.id} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] space-y-4">
                    
                    <div className="flex justify-between items-start">
                      <h3 className="text-base font-bold text-[#1a2c4d] tracking-tight">{tx.nama_event}</h3>
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                        tx.status_pembayaran === 'verified' ? 'bg-[#e2f6ec] text-[#2ebd7d]' : 'bg-[#fffbeb] text-[#d97706]'
                      }`}>
                        {tx.status_pembayaran === 'verified' ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>

                    {/* Columns grid for info matching Screen 11 */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-gray-50 text-xs">
                      <div>
                        <p className="text-gray-400 font-medium">Paket</p>
                        <p className="font-extrabold text-[#d97706] mt-0.5">{tx.nama_paket}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Jumlah</p>
                        <p className="font-extrabold text-[#1a2c4d] mt-0.5 font-mono">{formatIDR(tx.jumlah)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Tanggal</p>
                        <p className="font-bold text-gray-700 mt-0.5">{tx.tanggal_transaksi}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-medium">Edit</p>
                        <button className="h-7 w-7 bg-[#f8fafc] border border-gray-100 rounded-lg flex items-center justify-center text-gray-500 hover:text-blue-900 mt-0.5 transition-colors">
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Documentation attachment block */}
                    <div className="space-y-2 pt-2 border-t border-gray-50">
                      <p className="text-[10px] text-gray-400 font-bold">Dokumentasi Event</p>
                      
                      {tx.status_pembayaran === 'verified' && docs.filter(d => d.id_event === tx.id_event).length > 0 ? (
                        <div className="space-y-2">
                          {docs.filter(d => d.id_event === tx.id_event).map(doc => (
                            <div key={doc.id} className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                              <span className="font-bold text-green-700 truncate">{doc.url_file}</span>
                              <span className="text-[9px] text-gray-400 font-mono">{doc.tanggal_upload}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-[#f8fafc] rounded-2xl border border-gray-100 p-4 text-center space-y-1">
                          <FolderOpen className="h-5 w-5 text-gray-400 mx-auto" />
                          <p className="text-xs text-gray-400 font-medium">Belum tersedia</p>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}


        {/* ==================== SCREEN 4: KELOLA PROFIL (Sponsor) ==================== */}
        {activeTab === 'profil' && (
          <div className="space-y-6">
            
            <div className="text-center mb-6">
              <div className="h-12 w-12 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mx-auto mb-3">
                <UserIcon className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold text-[#1a2c4d] tracking-tight">Kelola Profil</h2>
              <p className="text-gray-400 text-xs mt-1 font-medium">Update informasi profil sponsor Anda</p>
            </div>

            {profileSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-medium">
                {profileSuccess}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Nama Perusahaan <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  required
                  value={profileNama}
                  onChange={(e) => setProfileNama(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900/10 font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Email <span className="text-red-500">*</span></label>
                <input 
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none text-gray-400"
                />
              </div>

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

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Nomor Telepon <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  required
                  value={profileNoTelp}
                  onChange={(e) => setProfileNoTelp(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Alamat <span className="text-red-500">*</span></label>
                <input 
                  type="text"
                  required
                  value={profileAlamat}
                  onChange={(e) => setProfileAlamat(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700">Deskripsi Perusahaan</label>
                <textarea 
                  rows={4}
                  placeholder="Perusahaan teknologi terkemuka..."
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

      {/* ==================== BOTTOM TAB NAVIGATION BAR (Screen 8 style) ==================== */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-100 px-6 py-2 flex justify-around shadow-[0_-2px_15px_rgba(0,0,0,0.03)] z-40 max-w-6xl mx-auto">
        
        {/* Cari Event tab */}
        <button 
          onClick={() => {
            setActiveTab('browse');
            setCurrentStep('list');
          }}
          className={`flex flex-col items-center gap-1 py-1 text-center transition-all ${
            activeTab === 'browse' ? 'text-[#1a2c4d]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-bold">Cari Event</span>
        </button>

        {/* Riwayat tab */}
        <button 
          onClick={() => {
            setActiveTab('riwayat');
            setCurrentStep('list');
          }}
          className={`flex flex-col items-center gap-1 py-1 text-center transition-all ${
            activeTab === 'riwayat' ? 'text-[#1a2c4d]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <FileText className="h-5 w-5" />
          <span className="text-[10px] font-bold">Riwayat</span>
        </button>

        {/* Profil tab */}
        <button 
          onClick={() => {
            setActiveTab('profil');
            setCurrentStep('list');
          }}
          className={`flex flex-col items-center gap-1 py-1 text-center transition-all ${
            activeTab === 'profil' ? 'text-[#1a2c4d]' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <UserIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold">Profil</span>
        </button>

      </div>

    </div>
  );
}
