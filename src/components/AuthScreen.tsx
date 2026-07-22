import React, { useState } from 'react';
import { User, Role } from '../types';
import { ArrowLeft, Building2, Users, CheckCircle2, User as UserIcon, MapPin, Phone, Mail, Lock, ShieldAlert } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
  allUsers: User[];
  onRegisterUser: (newUser: User) => void;
}

export default function AuthScreen({ onLoginSuccess, allUsers, onRegisterUser }: AuthScreenProps) {
  const [currentStep, setCurrentStep] = useState<'login' | 'select-role' | 'register-org' | 'register-sponsor'>('login');
  
  // Login State
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Register State - Organisasi
  const [orgNama, setOrgNama] = useState<string>('');
  const [orgEmail, setOrgEmail] = useState<string>('');
  const [orgPassword, setOrgPassword] = useState<string>('');
  const [orgNoTelp, setOrgNoTelp] = useState<string>('');
  const [orgDeskripsi, setOrgDeskripsi] = useState<string>('');
  const [orgRekNo, setOrgRekNo] = useState<string>('');
  const [orgRekNama, setOrgRekNama] = useState<string>('');

  // Register State - Sponsor
  const [sponNama, setSponNama] = useState<string>('');
  const [sponEmail, setSponEmail] = useState<string>('');
  const [sponPassword, setSponPassword] = useState<string>('');
  const [sponNoTelp, setSponNoTelp] = useState<string>('');
  const [sponAlamat, setSponAlamat] = useState<string>('');
  const [sponDeskripsi, setSponDeskripsi] = useState<string>('');

  const [registerError, setRegisterError] = useState<string>('');
  const [registerSuccess, setRegisterSuccess] = useState<string>('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Harap masukkan email dan password Anda.');
      return;
    }

    const user = allUsers.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());

    if (!user) {
      setLoginError('Email atau password salah.');
      return;
    }

    if (user.status_akun === 'pending') {
      setLoginError('Akun Anda belum aktif. Menunggu verifikasi Administrator.');
      return;
    }

    if (user.status_akun === 'rejected') {
      setLoginError('Pendaftaran akun Anda ditolak oleh Administrator.');
      return;
    }

    onLoginSuccess(user);
  };

  const handleRegisterOrg = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!orgNama || !orgEmail || !orgPassword || !orgNoTelp) {
      setRegisterError('Harap isi semua kolom wajib (*).');
      return;
    }

    const emailExists = allUsers.some(u => u.email.toLowerCase() === orgEmail.toLowerCase());
    if (emailExists) {
      setRegisterError('Email sudah terdaftar.');
      return;
    }

    const newUser: User = {
      id: 'u-' + Math.random().toString(36).substring(2, 9),
      email: orgEmail,
      peran: 'organisasi',
      status_akun: 'pending',
      nama_lengkap: orgNama,
      organisasiDetails: {
        nama_organisasi: orgNama,
        deskripsi: orgDeskripsi,
        no_telp: orgNoTelp,
        alamat: 'Kampus UNAI',
        rekening_nomor: orgRekNo,
        rekening_atas_nama: orgRekNama
      }
    };

    onRegisterUser(newUser);
    setRegisterSuccess('Pendaftaran berhasil! Akun Anda sedang menunggu verifikasi admin.');
    setTimeout(() => {
      setRegisterSuccess('');
      setCurrentStep('login');
      // Clear fields
      setOrgNama('');
      setOrgEmail('');
      setOrgPassword('');
      setOrgNoTelp('');
      setOrgDeskripsi('');
    }, 3000);
  };

  const handleRegisterSponsor = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!sponNama || !sponEmail || !sponPassword || !sponNoTelp || !sponAlamat) {
      setRegisterError('Harap isi semua kolom wajib (*).');
      return;
    }

    const emailExists = allUsers.some(u => u.email.toLowerCase() === sponEmail.toLowerCase());
    if (emailExists) {
      setRegisterError('Email sudah terdaftar.');
      return;
    }

    const newUser: User = {
      id: 'u-' + Math.random().toString(36).substring(2, 9),
      email: sponEmail,
      peran: 'sponsor',
      status_akun: 'pending',
      nama_lengkap: sponNama,
      sponsorDetails: {
        nama_perusahaan: sponNama,
        alamat: sponAlamat,
        no_telp: sponNoTelp,
        is_alumni: true, // Mark as alumni default for UNAI target alumni/sponsor connect
        angkatan: '2018'
      }
    };

    onRegisterUser(newUser);
    setRegisterSuccess('Pendaftaran berhasil! Akun Anda sedang menunggu verifikasi admin.');
    setTimeout(() => {
      setRegisterSuccess('');
      setCurrentStep('login');
      // Clear fields
      setSponNama('');
      setSponEmail('');
      setSponPassword('');
      setSponNoTelp('');
      setSponAlamat('');
      setSponDeskripsi('');
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-[#f8fafc] px-4 py-8">
      
      {/* 1. SELECT ROLE SCREEN (Screen 1) */}
      {currentStep === 'select-role' && (
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden px-6 py-8">
          
          {/* Back to Login Header */}
          <button 
            id="back-to-login-btn"
            onClick={() => setCurrentStep('login')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-6 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Login
          </button>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#1a2c4d] tracking-tight">Daftar</h2>
          </div>

          <div className="space-y-6">
            
            {/* Organisasi Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-4">
                <Building2 className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-[#1a2c4d]">Organisasi</h3>
              <p className="text-gray-400 text-xs mt-1">Daftarkan organisasi mahasiswa atau lembaga Anda untuk mengajukan event</p>
              
              <ul className="text-left w-full my-4 space-y-2.5 px-2">
                <li className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Kelola program dan kegiatan
                </li>
                <li className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Terima dukungan dari sponsor
                </li>
                <li className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Publikasikan kegiatan organisasi
                </li>
              </ul>

              <button 
                id="select-role-org"
                onClick={() => setCurrentStep('register-org')}
                className="w-full py-3 bg-[#f8fafc] hover:bg-gray-100 text-[#1a2c4d] font-semibold text-xs rounded-xl border border-gray-100 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              >
                Daftar sebagai Organisasi
              </button>
            </div>

            {/* Sponsor Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-[0_2px_15px_rgba(0,0,0,0.02)] flex flex-col items-center text-center">
              <div className="h-14 w-14 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-4">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-[#1a2c4d]">Sponsor</h3>
              <p className="text-gray-400 text-xs mt-1">Daftarkan perusahaan atau pihak pendukung sebagai sponsor</p>

              <ul className="text-left w-full my-4 space-y-2.5 px-2">
                <li className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Dukung organisasi dan kegiatan
                </li>
                <li className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Dapatkan keuntungan promosi
                </li>
                <li className="flex items-center gap-2.5 text-xs text-gray-500 font-medium">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  Dapatkan laporan transparansi
                </li>
              </ul>

              <button 
                id="select-role-sponsor"
                onClick={() => setCurrentStep('register-sponsor')}
                className="w-full py-3 bg-[#f8fafc] hover:bg-gray-100 text-[#1a2c4d] font-semibold text-xs rounded-xl border border-gray-100 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
              >
                Daftar sebagai Sponsor
              </button>
            </div>

          </div>
        </div>
      )}


      {/* 2. LOGIN SCREEN (Screen 2) */}
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
            <div id="login-error-alert" className="w-full p-3 mb-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-red-500" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} id="form-login" className="w-full space-y-4">
            
            {/* Email field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Email</label>
              <input 
                id="input-login-email"
                type="email"
                required
                placeholder="email@example.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900/30 text-gray-800 placeholder-gray-400 transition-all font-medium"
              />
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 block">Password</label>
              <input 
                id="input-login-password"
                type="password"
                required
                placeholder="Masukkan password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900/30 text-gray-800 placeholder-gray-400 transition-all font-medium"
              />
            </div>

            {/* Login blue button */}
            <button
              id="btn-submit-login"
              type="submit"
              className="w-full py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-900/10 mt-2 active:scale-[0.99]"
            >
              Login
            </button>

            {/* Separator */}
            <div className="flex items-center justify-center my-4">
              <div className="border-t border-gray-100 flex-1"></div>
              <span className="text-[10px] text-gray-300 mx-3 uppercase font-bold tracking-wider">atau</span>
              <div className="border-t border-gray-100 flex-1"></div>
            </div>

            {/* Register button */}
            <button
              id="btn-go-to-select-role"
              type="button"
              onClick={() => { setCurrentStep('select-role'); setLoginError(''); }}
              className="w-full py-3 bg-[#f8fafc] hover:bg-gray-100 text-[#1a2c4d] font-bold text-xs rounded-xl border border-gray-100 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] active:scale-[0.99]"
            >
              Daftar Akun Baru
            </button>

            {/* Demo quick-access removed per request */}

          </form>

        </div>
      )}


      {/* 3. REGISTRASI ORGANISASI SCREEN (Screen 3 style) */}
      {currentStep === 'register-org' && (
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden px-6 py-8">
          
          <button 
            id="back-to-select-btn"
            onClick={() => setCurrentStep('select-role')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-5 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-12 w-12 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-3">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-[#1a2c4d]">Form Registrasi Organisasi</h2>
            <p className="text-gray-400 text-xs mt-1 font-medium">Silakan isi formulir di bawah ini untuk mendaftar</p>
          </div>

          {registerError && (
            <div className="p-3 mb-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{registerError}</span>
            </div>
          )}

          {registerSuccess && (
            <div className="p-3 mb-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{registerSuccess}</span>
            </div>
          )}

          <form onSubmit={handleRegisterOrg} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nama Organisasi <span className="text-red-500">*</span></label>
              <input 
                type="text"
                required
                placeholder="HIMA FTI"
                value={orgNama}
                onChange={(e) => setOrgNama(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-900/30 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Email <span className="text-red-500">*</span></label>
              <input 
                type="email"
                required
                placeholder="organisasi@test.com"
                value={orgEmail}
                onChange={(e) => setOrgEmail(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Password Baru</label>
              <input 
                type="password"
                required
                placeholder="Minimal 8 karakter"
                value={orgPassword}
                onChange={(e) => setOrgPassword(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none"
              />
              <p className="text-[10px] text-gray-400 font-medium pl-1">Minimal 8 karakter</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nomor Telepon <span className="text-red-500">*</span></label>
              <input 
                type="text"
                required
                placeholder="08123456789"
                value={orgNoTelp}
                onChange={(e) => setOrgNoTelp(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nomor Rekening <span className="text-red-500">*</span></label>
              <input 
                type="text"
                required
                placeholder="1234567890"
                value={orgRekNo}
                onChange={(e) => setOrgRekNo(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Atas Nama Rekening <span className="text-red-500">*</span></label>
              <input 
                type="text"
                required
                placeholder="Nama Pemilik Rekening"
                value={orgRekNama}
                onChange={(e) => setOrgRekNama(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Deskripsi Organisasi</label>
              <textarea 
                rows={3}
                placeholder="Himpunan Mahasiswa Fakultas Teknologi Informasi"
                value={orgDeskripsi}
                onChange={(e) => setOrgDeskripsi(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-900/10 mt-4"
            >
              Daftar
            </button>

          </form>
        </div>
      )}


      {/* 4. REGISTRASI SPONSOR SCREEN (Screen 4 style) */}
      {currentStep === 'register-sponsor' && (
        <div className="w-full max-w-2xl bg-white rounded-3xl shadow-[0_4px_25px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden px-6 py-8">
          
          <button 
            id="back-to-select-btn-2"
            onClick={() => setCurrentStep('select-role')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium mb-5 transition-all"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>

          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-12 w-12 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center justify-center text-[#1a2c4d] mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-[#1a2c4d]">Form Registrasi Sponsor</h2>
            <p className="text-gray-400 text-xs mt-1 font-medium">Silakan isi formulir di bawah ini untuk mendaftar</p>
          </div>

          {registerError && (
            <div className="p-3 mb-4 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl font-medium flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{registerError}</span>
            </div>
          )}

          {registerSuccess && (
            <div className="p-3 mb-4 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-xl font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{registerSuccess}</span>
            </div>
          )}

          <form onSubmit={handleRegisterSponsor} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nama Perusahaan <span className="text-red-500">*</span></label>
              <input 
                type="text"
                required
                placeholder="PT Teknologi Indonesia"
                value={sponNama}
                onChange={(e) => setSponNama(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Email <span className="text-red-500">*</span></label>
              <input 
                type="email"
                required
                placeholder="sponsor@test.com"
                value={sponEmail}
                onChange={(e) => setSponEmail(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Password Baru</label>
              <input 
                type="password"
                required
                placeholder="Minimal 8 karakter"
                value={sponPassword}
                onChange={(e) => setSponPassword(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none"
              />
              <p className="text-[10px] text-gray-400 font-medium pl-1">Minimal 8 karakter</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Nomor Telepon <span className="text-red-500">*</span></label>
              <input 
                type="text"
                required
                placeholder="08198765432"
                value={sponNoTelp}
                onChange={(e) => setSponNoTelp(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Alamat <span className="text-red-500">*</span></label>
              <input 
                type="text"
                required
                placeholder="Jl. Sudirman No. 123, Jakarta"
                value={sponAlamat}
                onChange={(e) => setSponAlamat(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Deskripsi Perusahaan</label>
              <textarea 
                rows={3}
                placeholder="Perusahaan teknologi terkemuka di Indonesia"
                value={sponDeskripsi}
                onChange={(e) => setSponDeskripsi(e.target.value)}
                className="w-full px-4 py-3 text-xs bg-[#f8fafc] border border-gray-100 rounded-xl focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#1a2c4d] hover:bg-[#15233e] text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-900/10 mt-4"
            >
              Daftar
            </button>

          </form>
        </div>
      )}

    </div>
  );
}
