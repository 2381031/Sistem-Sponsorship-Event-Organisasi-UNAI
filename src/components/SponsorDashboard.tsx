import React, { useEffect, useRef, useState } from 'react';
import { User, Event, SponsorshipTransaction, EventDoc } from '../types';
import { api } from '../api';
import DocumentGallery, { documentUrl } from './DocumentGallery';
import { MaterialInputs, MaterialFiles, MaterialSelection, attachMaterials, validateSelection } from './SponsorMaterials';
import {
  Search, ArrowLeft, Check, Edit2, FileText, Upload, Landmark, History,
  User as UserIcon, Calendar, MapPin, Building, ShieldAlert, CheckCircle2,
  FolderOpen, DollarSign, LogOut
} from 'lucide-react';

interface Props {
  currentUser: User;
  events: Event[];
  transactions: SponsorshipTransaction[];
  docs: EventDoc[];
  allUsers: User[];
  onAddTransaction: (data: any) => Promise<void>;
  onUpdateTransaction: (id: number, data: FormData) => Promise<void>;
  onLogout: () => void;
}

export default function SponsorDashboard({ currentUser, events, transactions, docs, allUsers, onAddTransaction, onUpdateTransaction, onLogout }: Props) {
  const profil = currentUser.profil;
  const [activeTab, setActiveTab] = useState<'browse' | 'riwayat' | 'profil'>('browse');
  const [currentStep, setCurrentStep] = useState<'list' | 'pilih-paket' | 'bukti-bayar'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [buktiFile, setBuktiFile] = useState<File | null>(null);
  const [buktiPreview, setBuktiPreview] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const submitPending = useRef(false);
  const [customAmount, setCustomAmount] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPackageId, setEditPackageId] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editProof, setEditProof] = useState<File | null>(null);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const editPending = useRef(false);
  const [materials, setMaterials] = useState<MaterialSelection>({});
  const [editMaterials, setEditMaterials] = useState<MaterialSelection>({});

  useEffect(() => {
    if (!buktiFile) {
      setBuktiPreview('');
      return;
    }
    const previewUrl = URL.createObjectURL(buktiFile);
    setBuktiPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [buktiFile]);

  const handleEdit = async (e: React.FormEvent, tx: SponsorshipTransaction, event: Event) => {
    e.preventDefault();
    if (editPending.current) return;
    setEditError('');
    const paket = event.paket_tersedia.find(p => p.id_paket === Number(editPackageId));
    if (!paket) { setEditError('Pilih paket sponsorship.'); return; }
    const materialError = validateSelection(paket, editMaterials, editProof, tx.sponsor_files);
    if (materialError) { setEditError(materialError); return; }
    const amount = Number(paket.persentase_dana) > 0
      ? Math.round(Number(event.target_dana) * Number(paket.persentase_dana)) / 100 : Number(editAmount);
    if (!Number.isFinite(amount) || amount <= 0) { setEditError('Nominal harus lebih dari nol.'); return; }
    if (editProof && (!editProof.type.startsWith('image/') || editProof.size > 5 * 1024 * 1024)) {
      setEditError('Bukti pembayaran harus berupa gambar maksimal 5 MB.'); return;
    }
    const data = new FormData();
    data.append('id_paket', String(paket.id_paket));
    data.append('jumlah', String(amount));
    if (editProof) data.append('bukti_pembayaran', editProof);
    attachMaterials(data, editMaterials);
    editPending.current = true;
    setEditLoading(true);
    try {
      await onUpdateTransaction(tx.id_transaksi, data);
      setEditingId(null);
      setEditProof(null);
      setEditSuccess('Sponsorship diperbarui dan masih menunggu persetujuan Admin.');
    } catch (err: any) { setEditError(err.message || 'Gagal memperbarui sponsorship.'); }
    finally { editPending.current = false; setEditLoading(false); }
  };

  const [profileNama, setProfileNama] = useState(profil?.nama_perusahaan || '');
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profileNoTelp, setProfileNoTelp] = useState(profil?.no_telp || '');
  const [profileAlamat, setProfileAlamat] = useState(profil?.alamat || '');
  const [profileWebsite, setProfileWebsite] = useState(profil?.website || '');
  const [profileDeskripsi, setProfileDeskripsi] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const profilePending = useRef(false);
  useEffect(() => {
    setProfileNama(profil?.nama_perusahaan || '');
    setProfileNoTelp(profil?.no_telp || '');
    setProfileAlamat(profil?.alamat || '');
    setProfileWebsite(profil?.website || '');
    setProfileEmail(currentUser.email);
  }, [profil, currentUser.email]);

  const openEvents = events.filter(e => {
    const status = String(e.status_event || '').trim().toLowerCase();
    const isClosed = ['ditutup', 'ditutupkan', 'closed', 'close'].includes(status);
    const isPublished = ['dipublikasikan', 'published', 'open', 'terbuka'].includes(status);
    return !isClosed && isPublished && e.nama_event.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const myTransactions = transactions.filter(t => t.id_sponsor === currentUser.id);

  const getOrgBankDetails = (idOrganisasi: number) => {
    const orgUser = allUsers.find(u => u.id === idOrganisasi && u.peran === 'Organisasi');
    return orgUser?.profil || null;
  };

  const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profilePending.current) return;
    profilePending.current = true;
    setProfileLoading(true);
    setProfileSuccess('');
    try {
      await api.updateUser(currentUser.id, {
        sponsorDetails: { nama_perusahaan: profileNama, alamat: profileAlamat, no_telp: profileNoTelp, website: profileWebsite.trim() },
      });
      setProfileSuccess('Profil berhasil diperbarui!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) { setProfileSuccess('Gagal: ' + err.message); }
    finally { profilePending.current = false; setProfileLoading(false); }
  };

  const handleBuktiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBuktiFile(e.target.files?.[0] ?? null);
  };

  const resetBukti = () => {
    setBuktiFile(null);
  };

  const handleUploadPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitPending.current) return;
    setErrorMsg('');
    setSuccessMsg('');
    if (!buktiFile) { setErrorMsg('Pilih file bukti transfer.'); return; }
    if (!selectedEvent || !selectedPackage) return;
    const materialError = validateSelection(selectedPackage, materials, buktiFile);
    if (materialError) { setErrorMsg(materialError); return; }
    if (Number(selectedPackage.persentase_dana) === 0 && (!customAmount || Number(customAmount) <= 0)) { setErrorMsg('Masukkan jumlah donasi.'); return; }
    submitPending.current = true;
    setSubmitLoading(true);

    try {
      const fd = new FormData();
      fd.append('id_event', String(selectedEvent.id_event));
      fd.append('id_paket', String(selectedPackage.id_paket));
      fd.append('jumlah', String(
        selectedPackage.persentase_dana > 0
          ? selectedEvent.target_dana * (selectedPackage.persentase_dana / 100)
          : Number(customAmount) || 0
      ));
      fd.append('nama_event', selectedEvent.nama_event);
      fd.append('nama_sponsor', profileNama);
      fd.append('nama_paket', selectedPackage.nama_paket);
      fd.append('bukti_pembayaran', buktiFile);
      attachMaterials(fd, materials);

      await onAddTransaction(fd);
      setMaterials({});
      setSuccessMsg('Bukti transfer berhasil dikirim! Menunggu verifikasi admin.');
      setCurrentStep('list');
      setActiveTab('riwayat');
      resetBukti();
      setCustomAmount('');
      setSelectedPackage(null);
      setSelectedEvent(null);
    } catch (err: any) { setErrorMsg(err.message); }
    finally { submitPending.current = false; setSubmitLoading(false); }
  };

  return (
    <div className="bg-[#f8fafc] min-h-screen">
      <div className="bg-[#1a2c4d] text-white px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center font-bold text-emerald-400 shrink-0">{profileNama.substring(0, 2).toUpperCase()}</div>
          <div className="min-w-0"><h1 className="text-sm font-bold truncate">{profileNama}</h1><p className="text-[10px] text-emerald-400 font-mono">Sponsor</p></div>
        </div>
        <button onClick={onLogout} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all shrink-0"><LogOut className="h-4 w-4" /></button>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-4 md:pt-6 pb-24">
        {activeTab === 'browse' && currentStep === 'list' && (
          <div className="space-y-6">
            <div className="text-center mb-6"><h2 className="text-xl font-bold text-[#1a2c4d]">Cari Event & Ajukan Sponsorship</h2></div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400"><Search className="h-4 w-4" /></span>
              <input type="text" placeholder="Cari nama event..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-xs bg-white border border-gray-100 rounded-2xl focus:outline-none font-medium shadow-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
                <h4 className="text-2xl font-extrabold text-[#1a2c4d]">{openEvents.length}</h4>
                <p className="text-gray-400 text-[10px] font-bold uppercase mt-1">Event Tersedia</p>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm text-center">
                <h4 className="text-2xl font-extrabold text-[#1a2c4d]">{myTransactions.filter(t => t.status_pembayaran === 'Diverifikasi').length}</h4>
                <p className="text-gray-400 text-[10px] font-bold uppercase mt-1">Sponsorship Aktif</p>
              </div>
            </div>
            <div className="space-y-4">
              {openEvents.map(event => {
                const eventTxs = transactions.filter(t => t.id_event === event.id_event);
                const eventApproved = eventTxs.filter(t => t.status_pembayaran === 'Diverifikasi');
                const eventCollected = Number(event.dana_terkumpul ?? 0);
                const progressPct = event.target_dana > 0 ? Math.min(100, Math.round((eventCollected / event.target_dana) * 100)) : 0;
                return (
                  <div key={event.id_event} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
                    <div className="flex justify-between items-start gap-3">
                      <div><h3 className="text-base font-bold text-[#1a2c4d]">{event.nama_event}</h3><p className="text-[10px] text-gray-400">{event.tanggal_event}</p></div>
                      <span className="bg-[#e2f6ec] text-[#2ebd7d] px-2 py-0.5 rounded text-[10px] font-bold uppercase">{event.status_event}</span>
                    </div>
                    {event.url_proposal && !event.url_proposal.includes('fakepath') && (
                      <a href={event.url_proposal} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline">
                        <FileText className="h-3.5 w-3.5" /> Lihat Proposal Event Organisasi
                      </a>
                    )}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-gray-700"><span>Terkumpul</span><span>{progressPct}%</span></div>
                      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-[#1a2c4d] rounded-full" style={{ width: `${progressPct}%` }} /></div>
                      <div className="flex justify-between text-[10px] font-medium">
                        <span className="text-[#1a2c4d] font-bold">{formatIDR(eventCollected)}</span>
                        <span className="text-red-500 font-bold">Sisa: {formatIDR(Math.max(0, event.target_dana - eventCollected))}</span>
                      </div>
                    </div>
                    <button onClick={() => { setSuccessMsg(''); setErrorMsg(''); setMaterials({}); setSelectedEvent(event); setSelectedPackage(event.paket_tersedia?.[0] || null); setCurrentStep('pilih-paket'); }}
                      className="text-xs font-extrabold text-[#1a2c4d] hover:underline">Lihat Detail &gt;</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'browse' && currentStep === 'pilih-paket' && selectedEvent && (
          <div className="space-y-6">
            <button onClick={() => setCurrentStep('list')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium">
              <ArrowLeft className="h-4 w-4" /> Pilih Paket Sponsorship
            </button>
            <div className="text-center"><h2 className="text-xl font-bold text-[#1a2c4d]">Pilih Paket Sponsorship</h2></div>
            <div className="bg-[#f0f4f8] rounded-2xl p-4 border border-gray-100 text-center">
              <p className="text-[10px] text-gray-400 font-bold">Event: {selectedEvent.nama_event}</p>
              <p className="text-[11px] text-[#1a2c4d] font-bold">Target: {formatIDR(selectedEvent.target_dana)}</p>
            </div>
            {selectedEvent.status_event === 'Ditutup' && <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-100 text-yellow-800 text-sm font-bold">Event sudah ditutup.</div>}
            <div className="rounded-xl border border-gray-100 bg-white p-3 text-xs space-y-2">
              <p className="font-bold">Proposal Event Organisasi — {selectedEvent.nama_event}</p>
              {documentUrl(selectedEvent.url_proposal) ? <a href={documentUrl(selectedEvent.url_proposal)!} target="_blank" rel="noreferrer" className="font-bold text-blue-700 underline">Buka PDF Proposal Event</a> : <p className="text-gray-500">Proposal event belum tersedia.</p>}
            </div>
            {docs.some(doc => doc.id_event === selectedEvent.id_event) && <DocumentGallery docs={docs.filter(doc => doc.id_event === selectedEvent.id_event)} />}
            <div className="space-y-4">
              {selectedEvent.paket_tersedia?.map(pkg => {
                const isSelected = selectedPackage?.id_paket === pkg.id_paket;
                const disabled = selectedEvent.status_event === 'Ditutup';
                return (
                  <div key={pkg.id_paket} onClick={() => { if (!disabled) { setMaterials({}); setSelectedPackage(pkg); } }}
                    className={`bg-white rounded-3xl p-5 border cursor-pointer transition-all space-y-3 ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400/20' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-start">
                      <div><h4 className="text-sm font-extrabold text-slate-800">{pkg.nama_paket}</h4>
                        <h5 className="text-lg font-extrabold text-[#1a2c4d] mt-1.5">{pkg.persentase_dana > 0 ? formatIDR(selectedEvent.target_dana * (pkg.persentase_dana / 100)) : 'Sukarela'}</h5></div>
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-yellow-500 bg-yellow-500 text-white' : 'border-gray-300'}`}>
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                    </div>
                    <p className="text-[11px] text-gray-500">{pkg.deskripsi_keuntungan}</p>
                  </div>
                );
              })}
            </div>
            <button onClick={() => { if (!selectedPackage) { alert('Pilih paket dulu'); return; } setCurrentStep('bukti-bayar'); }}
              disabled={selectedEvent.status_event === 'Ditutup'}
              className={`w-full py-3 ${selectedEvent.status_event === 'Ditutup' ? 'bg-gray-300 text-gray-600' : 'bg-[#1a2c4d] hover:bg-[#15233e] text-white'} font-bold text-xs rounded-xl shadow-md`}>
              Lanjutkan Pembayaran
            </button>
          </div>
        )}

        {activeTab === 'browse' && currentStep === 'bukti-bayar' && selectedEvent && selectedPackage && (
          <div className="space-y-6">
            <button onClick={() => { setCustomAmount(''); setCurrentStep('pilih-paket'); }} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium">
              <ArrowLeft className="h-4 w-4" /> Upload Bukti Pembayaran
            </button>
            <div className="text-center"><h2 className="text-xl font-bold text-[#1a2c4d]">Upload Bukti Pembayaran</h2></div>
            {errorMsg && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium">{errorMsg}</div>}
            <div className="bg-[#f8fafc] rounded-2xl p-4 border border-gray-100 flex justify-between items-center text-xs">
              <span className="text-gray-400 font-bold">Paket dipilih</span>
              <span className="font-extrabold text-[#1a2c4d] uppercase font-mono">{selectedPackage.nama_paket}</span>
            </div>
            {Number(selectedPackage.persentase_dana) === 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Jumlah Donasi (Rp) <span className="text-red-500">*</span></label>
                <input type="number" min="0" required placeholder="Masukkan jumlah donasi"
                  value={customAmount} onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none font-mono" />
              </div>
            )}
            <form onSubmit={handleUploadPayment} className="space-y-4">
              <MaterialInputs key={selectedPackage.id_paket} paket={selectedPackage} value={materials} onChange={setMaterials} />
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700">Upload Bukti Transfer</label>
                <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center bg-[#f8fafc] relative cursor-pointer">
                  <input type="file" required accept="image/*" onChange={handleBuktiChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <FileText className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-500">{buktiFile ? buktiFile.name : 'Pilih File bukti transfer'}</p>
                </div>
                {buktiPreview && (
                  <div className="rounded-xl overflow-hidden border border-gray-100 bg-white">
                    <img src={buktiPreview} alt="Preview bukti transfer" decoding="async" className="max-h-56 w-full object-contain bg-white" />
                  </div>
                )}
              </div>
              {(() => {
                const orgBank = getOrgBankDetails(selectedEvent.id_organisasi);
                if (!orgBank) return null;
                return (
                  <div className="bg-[#f0f4f8] rounded-2xl p-4 border border-gray-100 space-y-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Transfer ke rekening berikut</p>
                    <div className="grid grid-cols-1 gap-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-gray-400 font-bold">Bank</span><span className="font-extrabold text-[#1a2c4d]">{orgBank.nama_bank || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400 font-bold">No. Rekening</span><span className="font-extrabold text-[#1a2c4d] font-mono">{orgBank.nomor_rekening || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400 font-bold">a.n.</span><span className="font-extrabold text-[#1a2c4d]">{orgBank.nama_rekening || '-'}</span></div>
                    </div>
                  </div>
                );
              })()}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button type="button" onClick={() => { resetBukti(); setCustomAmount(''); setCurrentStep('pilih-paket'); }} className="py-3 bg-white hover:bg-gray-50 text-gray-500 font-bold text-xs rounded-xl border border-gray-100">Batal</button>
                <button type="submit" disabled={submitLoading} className="py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50">
                  {submitLoading ? 'Mengirim...' : 'Upload Bukti'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'riwayat' && (
          <div className="space-y-6">
            <div className="text-center mb-6"><h2 className="text-xl font-bold text-[#1a2c4d]">Riwayat Sponsorship Saya</h2></div>
            {successMsg && <div role="status" className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-medium">{successMsg}</div>}
            {editSuccess && <p role="status" className="rounded-xl bg-green-50 p-3 text-xs text-green-700">{editSuccess}</p>}
            <p className="text-xs text-gray-400 font-bold">Total: {myTransactions.length} sponsorship</p>
            <div className="space-y-4">
              {myTransactions.map(tx => {
                const event = events.find(event => event.id_event === tx.id_event);
                const proposalUrl = documentUrl(event?.url_proposal);
                const eventDocs = docs.filter(doc => doc.id_event === tx.id_event);
                const editPackage = event?.paket_tersedia.find(p => p.id_paket === Number(editPackageId));
                return (
                <div key={tx.id_transaksi} className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <h3 className="text-base font-bold text-[#1a2c4d]">{tx.nama_event || `Event #${tx.id_event}`}</h3>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${tx.status_pembayaran === 'Diverifikasi' ? 'bg-[#e2f6ec] text-[#2ebd7d]' : 'bg-[#fffbeb] text-[#d97706]'}`}>
                      {tx.status_pembayaran.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-3 border-t border-gray-50 text-xs">
                    <div><p className="text-gray-400 font-medium">Paket</p><p className="font-extrabold text-[#d97706] mt-0.5">{tx.nama_paket}</p></div>
                    <div><p className="text-gray-400 font-medium">Jumlah</p><p className="font-extrabold text-[#1a2c4d] mt-0.5 font-mono">{formatIDR(tx.jumlah)}</p></div>
                    <div><p className="text-gray-400 font-medium">Tanggal</p><p className="font-bold text-gray-700 mt-0.5">{new Date(tx.tanggal_transaksi).toLocaleDateString('id-ID')}</p></div>
                  </div>
                  {tx.status_pembayaran === 'Menunggu' && event && (
                    editingId === tx.id_transaksi ? (
                      <form onSubmit={e => handleEdit(e, tx, event)} className="space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs">
                        <p className="font-bold">Edit Sponsorship</p>
                        <label className="block">Paket Sponsorship
                          <select required value={editPackageId} onChange={e => { setEditPackageId(e.target.value); setEditMaterials({}); }} className="mt-1 w-full rounded-lg border p-2">
                            {event.paket_tersedia.map(p => <option key={p.id_paket} value={p.id_paket}>{p.nama_paket}</option>)}
                          </select>
                        </label>
                        {editPackage && Number(editPackage.persentase_dana) === 0 ? (
                          <label className="block">Nominal (Rp)<input type="number" min="0.01" step="0.01" required value={editAmount} onChange={e => setEditAmount(e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
                        ) : <p>Nominal: {formatIDR(Math.round(Number(event.target_dana) * Number(editPackage?.persentase_dana || 0)) / 100)}</p>}
                        {editPackage && <MaterialInputs key={editPackage.id_paket} paket={editPackage} value={editMaterials} onChange={setEditMaterials} existing={tx.sponsor_files} />}
                        <label className="block">Ganti bukti pembayaran (opsional, JPG/PNG)
                          <input type="file" accept="image/*" onChange={e => setEditProof(e.target.files?.[0] || null)} className="mt-1 block w-full" />
                        </label>
                        <p>Pastikan bukti pembayaran sesuai nominal terbaru. Bukti sebelumnya tetap digunakan jika tidak diganti.</p>
                        {editError && <p role="alert" className="text-red-600">{editError}</p>}
                        <div className="flex gap-3">
                          <button type="submit" disabled={editLoading} className="rounded-lg bg-[#1a2c4d] p-2 text-white disabled:opacity-50">{editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                          <button type="button" disabled={editLoading} onClick={() => setEditingId(null)}>Batal</button>
                        </div>
                      </form>
                    ) : <button type="button" disabled={editLoading} onClick={() => { setEditingId(tx.id_transaksi); setEditMaterials({}); setEditPackageId(String(tx.id_paket)); setEditAmount(String(tx.jumlah)); setEditProof(null); setEditError(''); setEditSuccess(''); }} className="text-xs font-bold text-blue-700 hover:underline">Edit Sponsorship</button>
                  )}
                  <div className="space-y-2 pt-2 border-t border-gray-50">
                    <p className="text-xs text-gray-500 font-bold">Proposal Event Organisasi</p>
                    {proposalUrl ? <a href={proposalUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:underline"><FileText className="h-4 w-4" /> Lihat Proposal Event Organisasi</a> : <p className="text-xs text-gray-400">Proposal dokumentasi event belum tersedia.</p>}
                  </div>
                  {eventDocs.length > 0 && <DocumentGallery docs={eventDocs} />}
                  <MaterialFiles files={tx.sponsor_files} />
                </div>
              ); })}
            </div>
          </div>
        )}

        {activeTab === 'profil' && (
          <div className="space-y-6">
            <div className="text-center mb-6"><h2 className="text-xl font-bold text-[#1a2c4d]">Kelola Profil</h2></div>
            {profileSuccess && <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-medium">{profileSuccess}</div>}
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Nama Perusahaan <span className="text-red-500">*</span></label>
                <input type="text" required value={profileNama} onChange={(e) => setProfileNama(e.target.value)} className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Email <span className="text-red-500">*</span></label>
                <input type="email" required value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none text-gray-400" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">No. Telepon <span className="text-red-500">*</span></label>
                <input type="text" required value={profileNoTelp} onChange={(e) => setProfileNoTelp(e.target.value)} className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Alamat <span className="text-red-500">*</span></label>
                <input type="text" required value={profileAlamat} onChange={(e) => setProfileAlamat(e.target.value)} className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none" /></div>
              <div className="space-y-1"><label className="text-xs font-bold text-gray-700">Website Perusahaan</label>
                <input type="url" value={profileWebsite} onChange={(e) => setProfileWebsite(e.target.value)} className="w-full px-4 py-3 text-xs bg-white border border-gray-100 rounded-xl focus:outline-none" placeholder="https://www.perusahaan.com" /></div>
              <button type="submit" disabled={profileLoading} className="w-full py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl shadow-md mt-4 disabled:opacity-50">
                {profileLoading ? 'Menyimpan...' : 'Update Profil'}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-gray-100 px-4 py-2 flex justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-40 max-w-6xl mx-auto">
        {([['browse', 'Cari Event', Search], ['riwayat', 'Riwayat', FileText], ['profil', 'Profil', UserIcon]] as const).map(([tab, label, Icon]) => (
          <button key={tab} onClick={() => { setActiveTab(tab); setCurrentStep('list'); }}
            className={`flex flex-col items-center gap-1 py-1 ${activeTab === tab ? 'text-[#1a2c4d]' : 'text-gray-400'}`}>
            <Icon className="h-5 w-5" /><span className="text-[10px] font-bold">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
