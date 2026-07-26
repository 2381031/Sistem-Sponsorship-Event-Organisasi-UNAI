import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../api';
import { ArrowLeft, Building2, Users, CheckCircle2, ShieldAlert } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  onRegisterUser: (data: any) => Promise<void>;
}

export default function AuthScreen({ onLoginSuccess, onRegisterUser }: AuthScreenProps) {
  const [currentStep, setCurrentStep] = useState<'login' | 'select-role' | 'register-org' | 'register-sponsor'>('login');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [orgNama, setOrgNama] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgPassword, setOrgPassword] = useState('');
  const [orgNoTelp, setOrgNoTelp] = useState('');
  const [orgDeskripsi, setOrgDeskripsi] = useState('');
  const [orgRekNo, setOrgRekNo] = useState('');
  const [orgRekNama, setOrgRekNama] = useState('');

  const [sponNama, setSponNama] = useState('');
  const [sponEmail, setSponEmail] = useState('');
  const [sponPassword, setSponPassword] = useState('');
  const [sponNoTelp, setSponNoTelp] = useState('');
  const [sponAlamat, setSponAlamat] = useState('');
  const [sponDeskripsi, setSponDeskripsi] = useState('');

  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const result = await api.login(loginEmail, loginPassword);
      onLoginSuccess(result.user);
    } catch (err: any) {
      setLoginError(err.message || 'Login gagal');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);

    try {
      await onRegisterUser({
        email: orgEmail,
        password: orgPassword,
        nama_lengkap: orgNama,
        peran: 'organisasi',
        organisasiDetails: {
          nama_organisasi: orgNama,
          deskripsi: orgDeskripsi,
          no_telp: orgNoTelp,
          nama_rekening: orgRekNama,
          nomor_rekening: orgRekNo,
        },
      });
      setRegisterSuccess('Pendaftaran berhasil! Akun Anda sedang menunggu verifikasi admin.');
      setTimeout(() => {
        setRegisterSuccess('');
        setCurrentStep('login');
        setOrgNama(''); setOrgEmail(''); setOrgPassword(''); setOrgNoTelp(''); setOrgDeskripsi(''); setOrgRekNo(''); setOrgRekNama('');
      }, 3000);
    } catch (err: any) {
      setRegisterError(err.message || 'Pendaftaran gagal');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRegisterSponsor = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterLoading(true);

    try {
      await onRegisterUser({
        email: sponEmail,
        password: sponPassword,
        nama_lengkap: sponNama,
        peran: 'sponsor',
        sponsorDetails: {
          nama_perusahaan: sponNama,
          alamat: sponAlamat,
          no_telp: sponNoTelp,
        },
      });
      setRegisterSuccess('Pendaftaran berhasil! Akun Anda sedang menunggu verifikasi admin.');
      setTimeout(() => {
        setRegisterSuccess('');
        setCurrentStep('login');
        setSponNama(''); setSponEmail(''); setSponPassword(''); setSponNoTelp(''); setSponAlamat(''); setSponDeskripsi('');
      }, 3000);
    } catch (err: any) {
      setRegisterError(err.message || 'Pendaftaran gagal');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#f8fafc] px-4 py-8">

      {currentStep === 'select-role' && (
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden px-6 py-8">
          <button onClick={() => setCurrentStep('login')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-6 transition-all">
            <ArrowLeft className="h-4 w-4" /> Kembali ke Login
          </button>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#1a2c4d] tracking-tight">Daftar</h2>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-4">
                <Building2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-[#1a2c4d]">Organisasi</h3>
              <p className="text-gray-400 text-xs mt-1">Daftarkan organisasi mahasiswa untuk mengajukan event</p>
              <button onClick={() => setCurrentStep('register-org')} className="w-full py-3 bg-[#f8fafc] hover:bg-gray-100 text-[#1a2c4d] font-semibold text-xs rounded-xl border border-gray-100 transition-all mt-4">
                Daftar sebagai Organisasi
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-4">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-[#1a2c4d]">Sponsor</h3>
              <p className="text-gray-400 text-xs mt-1">Daftarkan perusahaan sebagai sponsor</p>
              <button onClick={() => setCurrentStep('register-sponsor')} className="w-full py-3 bg-[#f8fafc] hover:bg-gray-100 text-[#1a2c4d] font-semibold text-xs rounded-xl border border-gray-100 transition-all mt-4">
                Daftar sebagai Sponsor
              </button>
            </div>
          </div>
        </div>
      )}

      {currentStep === 'login' && (
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden px-6 py-8 flex flex-col items-center">
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-lg shadow-slate-900/10 border border-slate-200 overflow-hidden">
              <img src="/unai.png" alt="Logo UNAI" className="h-16 w-16 object-contain" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#1a2c4d] tracking-tight">Sistem Sponsorship Event UNAI</h2>
            </div>
          </div>
          {loginError && (
            <div className="w-full p-3 mb-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" /><span>{loginError}</span>
            </div>
          )}
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Email</label>
              <input type="email" required placeholder="email@example.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900/30 text-gray-800 placeholder-gray-400 transition-all font-medium" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Password</label>
              <input type="password" required placeholder="Masukkan password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900/30 text-gray-800 placeholder-gray-400 transition-all font-medium" />
            </div>
            <button type="submit" disabled={loginLoading}
              className="w-full py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-900/10 mt-2 active:scale-[0.99] disabled:opacity-50">
              {loginLoading ? 'Memproses...' : 'Login'}
            </button>
            <div className="flex items-center justify-center my-4">
              <div className="border-t border-gray-100 flex-1"></div>
              <span className="text-[10px] text-gray-300 mx-3 uppercase font-bold tracking-wider">atau</span>
              <div className="border-t border-gray-100 flex-1"></div>
            </div>
            <button type="button" onClick={() => { setCurrentStep('select-role'); setLoginError(''); }}
              className="w-full py-3 bg-[#f8fafc] hover:bg-gray-100 text-[#1a2c4d] font-bold text-xs rounded-xl border border-gray-100 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] active:scale-[0.99]">
              Daftar Akun Baru
            </button>
          </form>
        </div>
      )}

      {currentStep === 'register-org' && (
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden px-6 py-8">
          <button onClick={() => setCurrentStep('select-role')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-5 transition-all">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-12 w-12 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-3">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-[#1a2c4d]">Form Registrasi Organisasi</h2>
          </div>
          {registerError && <div className="p-3 mb-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium">{registerError}</div>}
          {registerSuccess && <div className="p-3 mb-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /><span>{registerSuccess}</span></div>}
          <form onSubmit={handleRegisterOrg} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nama Organisasi <span className="text-red-500">*</span></label>
              <input type="text" required placeholder="HIMA FTI" value={orgNama} onChange={(e) => setOrgNama(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Email <span className="text-red-500">*</span></label>
              <input type="email" required placeholder="organisasi@test.com" value={orgEmail} onChange={(e) => setOrgEmail(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Password <span className="text-red-500">*</span></label>
              <input type="password" required placeholder="Minimal 6 karakter" value={orgPassword} onChange={(e) => setOrgPassword(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nomor Telepon <span className="text-red-500">*</span></label>
              <input type="text" required placeholder="08123456789" value={orgNoTelp} onChange={(e) => setOrgNoTelp(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nomor Rekening <span className="text-red-500">*</span></label>
              <input type="text" required placeholder="1234567890" value={orgRekNo} onChange={(e) => setOrgRekNo(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Atas Nama Rekening <span className="text-red-500">*</span></label>
              <input type="text" required placeholder="Nama Pemilik Rekening" value={orgRekNama} onChange={(e) => setOrgRekNama(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Deskripsi Organisasi</label>
              <textarea rows={3} placeholder="Himpunan Mahasiswa FTI" value={orgDeskripsi} onChange={(e) => setOrgDeskripsi(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none resize-none" />
            </div>
            <button type="submit" disabled={registerLoading} className="w-full py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl transition-all shadow-md mt-4 disabled:opacity-50">
              {registerLoading ? 'Mendaftarkan...' : 'Daftar'}
            </button>
          </form>
        </div>
      )}

      {currentStep === 'register-sponsor' && (
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden px-6 py-8">
          <button onClick={() => setCurrentStep('select-role')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-5 transition-all">
            <ArrowLeft className="h-4 w-4" /> Kembali
          </button>
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-12 w-12 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-[#1a2c4d]">Form Registrasi Sponsor</h2>
          </div>
          {registerError && <div className="p-3 mb-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium">{registerError}</div>}
          {registerSuccess && <div className="p-3 mb-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /><span>{registerSuccess}</span></div>}
          <form onSubmit={handleRegisterSponsor} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nama Perusahaan <span className="text-red-500">*</span></label>
              <input type="text" required placeholder="PT Teknologi Indonesia" value={sponNama} onChange={(e) => setSponNama(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Email <span className="text-red-500">*</span></label>
              <input type="email" required placeholder="sponsor@test.com" value={sponEmail} onChange={(e) => setSponEmail(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Password <span className="text-red-500">*</span></label>
              <input type="password" required placeholder="Minimal 6 karakter" value={sponPassword} onChange={(e) => setSponPassword(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nomor Telepon <span className="text-red-500">*</span></label>
              <input type="text" required placeholder="08198765432" value={sponNoTelp} onChange={(e) => setSponNoTelp(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Alamat <span className="text-red-500">*</span></label>
              <input type="text" required placeholder="Jl. Sudirman No. 123" value={sponAlamat} onChange={(e) => setSponAlamat(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Deskripsi Perusahaan</label>
              <textarea rows={3} placeholder="Perusahaan teknologi terkemuka" value={sponDeskripsi} onChange={(e) => setSponDeskripsi(e.target.value)} className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none resize-none" />
            </div>
            <button type="submit" disabled={registerLoading} className="w-full py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl transition-all shadow-md mt-4 disabled:opacity-50">
              {registerLoading ? 'Mendaftarkan...' : 'Daftar'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
