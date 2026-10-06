import React, { useState } from 'react';
import {
  Phone,
  GraduationCap,
  LogIn,
  UserPlus,
  AlertCircle,
  AlertOctagon,
  CheckCircle2,
  Loader2,
  Lock,
  User,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  normalizePhone,
  AVAILABLE_JABATAN,
  isKepalaSekolah,
} from '../data/initialData';

export default function Login({ onNavigateToForgotPassword }) {
  const { login, register, showToast } = useApp();

  // View state: 'login' | 'register'
  const [viewMode, setViewMode] = useState('login');

  // Login Form States (Phone Number & Password)
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState('');

  // Register Form States (Nama Lengkap, Nomor HP, Kata Sandi, Pilih Jabatan)
  const [regFullName, setRegFullName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regJabatan, setRegJabatan] = useState(['Guru Mapel']);
  const [regError, setRegError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Switch between Login and Register views
  const handleSwitchView = (mode) => {
    setViewMode(mode);
    setErrorAlert('');
    setRegError('');
  };

  // Jabatan toggle for Registration (min 1, max 5)
  const handleToggleJabatan = (item) => {
    if (regJabatan.includes(item)) {
      if (regJabatan.length <= 1) {
        showToast('Wajib memilih minimal 1 jabatan.', 'error', 'Validasi Jabatan');
        return;
      }
      setRegJabatan(regJabatan.filter((j) => j !== item));
    } else {
      if (regJabatan.length >= 5) {
        showToast('Maksimal hanya 5 jabatan yang dapat dipilih.', 'warning', 'Batas Maksimum');
        return;
      }
      setRegJabatan([...regJabatan, item]);
    }
  };

  // Requirement 20: Unified Login Handler & Automatic Backend Routing
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorAlert('');

    const norm = normalizePhone(phone);
    if (!norm || norm.length < 9) {
      setErrorAlert('Silakan masukkan nomor HP Indonesia yang valid (minimal 10 digit).');
      showToast('Nomor HP tidak valid.', 'error');
      return;
    }

    if (!password) {
      setErrorAlert('Silakan masukkan password akun Anda.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Backend automatically checks credentials and routes to Admin or Teacher Dashboard
      const res = login(phone, password);
      setIsLoading(false);

      if (!res.success) {
        setErrorAlert(res.error || 'Gagal masuk. Silakan periksa kembali Nomor HP dan Password Anda.');
      }
    }, 350);
  };

  // Registration Submit Handler
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setRegError('');

    if (!regFullName.trim()) {
      setRegError('Nama Lengkap wajib diisi.');
      return;
    }

    const norm = normalizePhone(regPhone);
    if (!norm || norm.length < 9) {
      setRegError('Nomor HP tidak valid. Masukkan nomor HP aktif (minimal 10 digit).');
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setRegError('Password minimal 4 karakter.');
      return;
    }

    if (regJabatan.length < 1 || regJabatan.length > 5) {
      setRegError('Silakan pilih antara 1 hingga 5 jabatan.');
      return;
    }

    setIsRegistering(true);
    setTimeout(() => {
      const res = register(regFullName, regPhone, regPassword, regJabatan);
      setIsRegistering(false);

      if (res.success) {
        showToast('Akun berhasil didaftarkan! Silakan masuk.', 'success', 'Registrasi Sukses');
        setPhone(regPhone);
        setPassword(regPassword);
        setViewMode('login');
        setErrorAlert('');
      }
    }, 400);
  };

  // Emergency local data reset handler
  const handleEmergencyReset = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA data lokal di browser (guru, akun, absen, jadwal)? Halaman akan dimuat ulang ke kondisi awal.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 min-h-full">
      {/* 1. Header & Identity */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-blue-950 text-white shadow-soft-md border-b-2 border-emerald-500">
        {/* Top Government/Institution Micro Bar */}
        <div className="px-5 py-2 bg-black/30 border-b border-white/10 flex items-center justify-between text-[10px] text-slate-300">
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>PORTAL RESMI GTK & KEPENGAWASAN</span>
          </div>
          <span className="font-mono text-emerald-300 font-bold">VERSI 2026.1</span>
        </div>

        {/* Institution Brand Header */}
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 text-white border border-white/20 shadow-md backdrop-blur-md mb-2.5">
            <GraduationCap className="w-8 h-8 text-emerald-300" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white uppercase leading-snug">
            SISTEM INFORMASI GURU RJ
          </h1>
          <p className="text-xs text-emerald-200/90 font-bold tracking-wide mt-0.5">
            YAYASAN PENDIDIKAN GURU RJ
          </p>
          <p className="text-[11px] text-slate-300 mt-1 max-w-xs mx-auto">
            Portal Layanan Presensi, Jadwal Pelajaran, dan Administrasi Terpadu
          </p>
        </div>
      </div>

      {/* 2. Main Form Card Container */}
      <div className="p-4 sm:p-6 my-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-soft-md border border-slate-200/80 max-w-md mx-auto">
          {/* ============================================================== */}
          {/* VIEW 1: UNIFIED LOGIN VIEW (Nomor HP & Kata Sandi)             */}
          {/* ============================================================== */}
          {viewMode === 'login' && (
            <div className="animate-in fade-in duration-200">
              {/* Form Title & Subtitle */}
              <div className="mb-5 text-center">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">
                  Masuk ke Akun
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Masukkan Nomor HP dan Password untuk mengakses portal
                </p>
              </div>

              {/* Error Alert Box */}
              {errorAlert && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed text-rose-700">
                    {errorAlert}
                  </p>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Input 1: Nomor HP */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor HP
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value.replace(/[^\d+]/g, ''));
                        if (errorAlert) setErrorAlert('');
                      }}
                      placeholder="contoh: 081234567890"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                    />
                  </div>
                </div>

                {/* Input 2: Password + Lupa Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Password
                    </label>
                    {/* Link: Lupa Password? */}
                    <button
                      type="button"
                      onClick={onNavigateToForgotPassword}
                      className="text-[11px] font-bold text-brand-700 hover:text-brand-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3 text-brand-600" />
                      <span>Lupa Password?</span>
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorAlert) setErrorAlert('');
                      }}
                      placeholder="Masukkan password akun"
                      className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Primary Button: Masuk ke Akun */}
                <button
                  type="submit"
                  disabled={isLoading || !phone.trim() || !password}
                  className="w-full py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer mt-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk ke Akun</span>
                      <LogIn className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Below button toggle link: "Belum punya akun? Daftar di sini" */}
              <div className="mt-5 pt-4 text-center border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchView('register')}
                    className="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-0.5 cursor-pointer"
                  >
                    Daftar di sini
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* VIEW 2: REGISTRATION VIEW                                       */}
          {/* ============================================================== */}
          {viewMode === 'register' && (
            <div className="animate-in fade-in duration-200">
              {/* Form Title & Subtitle */}
              <div className="mb-5 text-center">
                <h2 className="text-lg font-black text-slate-800 tracking-tight">
                  Daftar Akun Baru
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Lengkapi data di bawah ini untuk membuat akun Anda
                </p>
              </div>

              {regError && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* 1. Nama Lengkap */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="contoh: Budi Santoso, S.Pd."
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                    />
                  </div>
                </div>

                {/* 2. Nomor HP */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nomor HP
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value.replace(/[^\d+]/g, ''))}
                      placeholder="contoh: 081234567890"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                    />
                  </div>
                </div>

                {/* 3. Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Minimal 4 karakter (default: guru123)"
                      className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 4. Pilih Jabatan */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Pilih Jabatan ({regJabatan.length}/5)
                    </label>
                    <span className="text-[10px] text-slate-500">Min 1, Maks 5</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                    {AVAILABLE_JABATAN.map((j) => {
                      const isSelected = regJabatan.includes(j);
                      const isDisabled = !isSelected && regJabatan.length >= 5;

                      return (
                        <button
                          key={j}
                          type="button"
                          onClick={() => handleToggleJabatan(j)}
                          disabled={isDisabled}
                          className={`p-2 rounded-xl text-left text-[11px] font-bold border transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-brand-50 border-brand-500 text-brand-900 shadow-2xs'
                              : isDisabled
                              ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="truncate mr-1">{j}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role detection indicator based on selected Jabatan */}
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    isKepalaSekolah(regJabatan)
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 text-brand-700" />
                  <div className="leading-tight">
                    <span className="font-semibold block text-[10px] text-slate-500">
                      Rute Dashboard Login:
                    </span>
                    <strong className="text-xs">
                      {isKepalaSekolah(regJabatan)
                        ? '🏛️ Admin Dashboard (Kepala Sekolah)'
                        : '🎓 Teacher Dashboard (GTK)'}
                    </strong>
                  </div>
                </div>

                {/* Submit Register Button */}
                <button
                  type="submit"
                  disabled={isRegistering || !regFullName.trim() || !regPhone.trim() || !regPassword}
                  className="w-full py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer mt-1"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mendaftarkan Akun...</span>
                    </>
                  ) : (
                    <>
                      <span>Daftar Akun</span>
                      <UserPlus className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Toggle Back to Login */}
              <div className="mt-5 pt-4 text-center border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchView('login')}
                    className="font-bold text-brand-600 hover:text-brand-700 hover:underline ml-0.5 cursor-pointer"
                  >
                    Masuk di sini
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Formal Portal Footer */}
      <div className="text-center py-4 bg-slate-200/60 border-t border-slate-300/80 text-[11px] text-slate-500 space-y-1">
        <p className="font-semibold text-slate-600">
          © 2026 Yayasan Pendidikan Guru RJ • Terintegrasi Dapodik & EMIS
        </p>
        <p className="text-[10px] text-slate-400">
          Pusat Data dan Informasi Pendidikan Terpadu • Seluruh Hak Cipta Dilindungi
        </p>

        {/* Emergency Reset Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleEmergencyReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-[10px] font-black uppercase tracking-wider shadow-sm transition hover:scale-105 active:scale-95 cursor-pointer border border-rose-700"
          >
            🔴 RESET SEMUA DATA (DANGER)
          </button>
        </div>
      </div>
    </div>
  );
}
