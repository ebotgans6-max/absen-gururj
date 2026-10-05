import React, { useState } from 'react';
import { User, Phone, Lock, UserPlus, ArrowLeft, Shield, Check, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { normalizePhone, AVAILABLE_JABATAN, isKepalaSekolah } from '../data/initialData';

export default function Register({ onNavigateToLogin }) {
  const { register, showToast } = useApp();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedJabatan, setSelectedJabatan] = useState(['Guru Mapel']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleToggleJabatan = (item) => {
    if (selectedJabatan.includes(item)) {
      if (selectedJabatan.length <= 1) {
        showToast('Wajib memilih minimal 1 jabatan.', 'error', 'Validasi Jabatan');
        return;
      }
      setSelectedJabatan(selectedJabatan.filter((j) => j !== item));
    } else {
      if (selectedJabatan.length >= 5) {
        showToast('Maksimal hanya 5 jabatan yang dapat dipilih.', 'warning', 'Batas Maksimum');
        return;
      }
      setSelectedJabatan([...selectedJabatan, item]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Nama Lengkap wajib diisi.');
      return;
    }

    const norm = normalizePhone(phone);
    if (!norm || norm.length < 9) {
      setErrorMsg('Nomor HP tidak valid. Masukkan nomor HP aktif (minimal 10 digit).');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMsg('Kata sandi minimal 4 karakter.');
      return;
    }

    if (selectedJabatan.length < 1 || selectedJabatan.length > 5) {
      setErrorMsg('Silakan pilih antara 1 hingga 5 jabatan.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = register(fullName, phone, password, selectedJabatan, false);
      setIsLoading(false);

      if (result.success) {
        showToast('Akun berhasil didaftarkan! Silakan masuk.', 'success', 'Registrasi Sukses');
        onNavigateToLogin();
      } else {
        setErrorMsg(result.error || 'Gagal mendaftarkan akun.');
      }
    }, 450);
  };

  const isAdmin = isKepalaSekolah(selectedJabatan);

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-white via-brand-50/40 to-slate-50 min-h-full">
      {/* Top Header */}
      <div className="pt-2">
        <button
          onClick={onNavigateToLogin}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-700 p-2 -ml-2 rounded-xl hover:bg-brand-50 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Masuk</span>
        </button>

        <div className="mt-4">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Daftar Akun Baru 📝
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
            Lengkapi data di bawah ini untuk membuat akun di Guru RJ
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div className="my-auto py-4">
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-soft-md border border-slate-100 max-w-md mx-auto">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="contoh: Budi Santoso, S.Pd."
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition"
                />
              </div>
            </div>

            {/* Nomor HP */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nomor HP (Telepon)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="contoh: 081234567890"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 4 karakter"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition"
                />
              </div>
            </div>

            {/* Pilih Jabatan */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Pilih Jabatan ({selectedJabatan.length}/5)
                </label>
                <span className="text-[10px] text-slate-500">Min 1, Maks 5</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-200">
                {AVAILABLE_JABATAN.map((j) => {
                  const isSelected = selectedJabatan.includes(j);
                  const isDisabled = !isSelected && selectedJabatan.length >= 5;

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

            {/* Role detection indicator */}
            <div
              className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                isAdmin
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
                  {isAdmin
                    ? '🏛️ Admin Dashboard (Jabatan Kepala Sekolah)'
                    : '🎓 Teacher Dashboard (GTK / Tenaga Pengajar)'}
                </strong>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !fullName.trim() || !phone.trim() || !password}
              className="w-full py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 group mt-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Daftar Sekarang</span>
                  <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Link to Login */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Sudah memiliki akun?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="font-bold text-brand-600 hover:text-brand-700 hover:underline transition ml-1"
              >
                Masuk di sini
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Rules Notice */}
      <div className="bg-slate-100/80 rounded-2xl p-3 border border-slate-200/60 text-[11px] text-slate-600 text-center leading-relaxed mb-2 max-w-md mx-auto">
        💡 <strong>Info Akses:</strong> Akun dengan jabatan <strong>Kepala Sekolah</strong> otomatis diarahkan ke <strong>Admin Dashboard</strong>, sedangkan seluruh jabatan lainnya (Operator, Guru Mapel, Wali Kelas, dll.) diarahkan ke <strong>Teacher Dashboard</strong>.
      </div>
    </div>
  );
}
