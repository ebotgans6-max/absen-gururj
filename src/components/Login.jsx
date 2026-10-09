import React, { useState } from 'react';
import {
  Phone,
  GraduationCap,
  LogIn,
  UserPlus,
  AlertCircle,
  AlertOctagon,
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

export default function Login({ onNavigateToForgotPassword, onNavigateToRegister }) {
  const { login, register, showToast } = useApp();

  // View state: 'login' | 'register'
  const [viewMode, setViewMode] = useState('login');

  // Login Form States (Phone Number & Password)
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorAlert, setErrorAlert] = useState('');

  // Register Form States
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

  // Unified Login Handler
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorAlert('');

    const norm = normalizePhone(phone);
    if (!norm || norm.length < 9) {
      setErrorAlert('Silakan masukkan nomor HP yang valid (minimal 10 digit).');
      showToast('Nomor HP tidak valid.', 'error');
      return;
    }

    if (!password) {
      setErrorAlert('Silakan masukkan password akun Anda.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
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

  return (
    <div className="flex-1 flex flex-col justify-between bg-slate-50 min-h-full">
      {/* 1. Header / Logo Area (Clean, Minimalist, Ample Whitespace) */}
      <div className="pt-8 sm:pt-12 pb-4 px-6 text-center">
        {/* Ikon Topi Toga (Logo) di tengah di dalam lingkaran hijau pastel */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 text-green-600 shadow-xs">
          <GraduationCap className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>

        {/* Teks Judul 2 Baris */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight">
          Sistem Informasi Guru
        </h1>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight mt-0.5">
          MTs Riyadlul Jannah
        </h2>
      </div>

      {/* 2. Form Login Card Container */}
      <div className="px-4 sm:px-6 py-2 my-auto w-full">
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100 max-w-sm sm:max-w-md mx-auto">
          {/* ============================================================== */}
          {/* VIEW 1: UNIFIED LOGIN VIEW (Nomor HP & Kata Sandi)             */}
          {/* ============================================================== */}
          {viewMode === 'login' && (
            <div className="animate-in fade-in duration-200">
              {/* Form Title: Rata Kiri & Font Modern */}
              <div className="mb-5 text-left">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                  Masuk ke Akun
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Masukkan Nomor HP dan Password untuk mengakses sistem
                </p>
              </div>

              {/* Error Alert Box */}
              {errorAlert && (
                <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertOctagon className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed text-rose-700">
                    {errorAlert}
                  </p>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Input 1: Nomor HP */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 text-left">
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
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition"
                    />
                  </div>
                </div>

                {/* Input 2: Password + Lupa Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-600">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={onNavigateToForgotPassword}
                      className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <KeyRound className="w-3 h-3 text-emerald-600" />
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
                      className="w-full pl-10 pr-11 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition"
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
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer mt-2"
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

              {/* Toggle ke Register */}
              <div className="mt-5 pt-4 text-center border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateToRegister) {
                        onNavigateToRegister();
                      } else {
                        handleSwitchView('register');
                      }
                    }}
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline ml-0.5 cursor-pointer"
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
              {/* Form Title: Rata Kiri */}
              <div className="mb-5 text-left">
                <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                  Daftar Akun Baru
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lengkapi data di bawah ini untuk membuat akun pendidik
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 text-left">
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition"
                    />
                  </div>
                </div>

                {/* 2. Nomor HP */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 text-left">
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
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition"
                    />
                  </div>
                </div>

                {/* 3. Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 text-left">
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
                      className="w-full pl-10 pr-11 py-2.5 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 outline-none transition"
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
                    <label className="text-xs font-semibold text-slate-600">
                      Pilih Jabatan ({regJabatan.length}/5)
                    </label>
                    <span className="text-[10px] text-slate-400">Min 1, Maks 5</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-gray-50 rounded-xl border border-gray-200">
                    {AVAILABLE_JABATAN.map((j) => {
                      const isSelected = regJabatan.includes(j);
                      const isDisabled = !isSelected && regJabatan.length >= 5;

                      return (
                        <button
                          key={j}
                          type="button"
                          onClick={() => handleToggleJabatan(j)}
                          disabled={isDisabled}
                          className={`p-2 rounded-xl text-left text-[11px] font-semibold border transition flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs font-bold'
                              : isDisabled
                              ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed'
                              : 'bg-white border-gray-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="truncate mr-1">{j}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Role detection indicator */}
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                    isKepalaSekolah(regJabatan)
                      ? 'bg-amber-50 border-amber-200 text-amber-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-700" />
                  <div className="leading-tight text-left">
                    <span className="font-medium block text-[10px] text-slate-500">
                      Rute Dashboard Login:
                    </span>
                    <strong className="text-xs font-bold">
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
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99] cursor-pointer mt-2"
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
                <p className="text-xs text-slate-500">
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => handleSwitchView('login')}
                    className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline ml-0.5 cursor-pointer"
                  >
                    Masuk di sini
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Formal Minimalist Footer */}
      <div className="text-center py-4 text-xs text-slate-400 font-medium">
        © 2026 MTs Riyadlul Jannah • Sistem Presensi & Kepegawaian
      </div>
    </div>
  );
}
