import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Send,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Briefcase,
  AlertCircle,
  Loader2,
  ChevronRight,
  Eye,
  EyeOff,
  Edit3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  sendOTP,
  verifyOTP,
  sendNewPhoneUpdateOTP,
  verifyNewPhoneUpdateOTP,
  clearRecaptchaVerifier,
} from '../firebase/phoneAuth';
import { normalizePhone, formatPhoneDisplay } from '../data/initialData';

export default function ProfileModal({ isOpen, onClose, onOpenJabatanModal }) {
  const { currentUser, resetPassword, updateUserPhoneNumber, showToast } = useApp();

  // Active view: 'overview' | 'change_password' | 'change_phone'
  const [view, setView] = useState('overview');

  // Change Password flow states: 'confirm' -> 'otp' -> 'new_password'
  const [pwStep, setPwStep] = useState('confirm');
  const [pwOtpCode, setPwOtpCode] = useState('');
  const [pwConfirmationResult, setPwConfirmationResult] = useState(null);
  const [pwSimulatedOtp, setPwSimulatedOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  // Change Phone flow states: 'input_new' -> 'otp'
  const [phoneStep, setPhoneStep] = useState('input_new');
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneVerificationId, setPhoneVerificationId] = useState(null);
  const [phoneConfirmationResult, setPhoneConfirmationResult] = useState(null);
  const [phoneSimulatedOtp, setPhoneSimulatedOtp] = useState('');

  // Common UI states
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  // Resend countdown timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Clean up reCAPTCHA verifier on unmount or view change
  useEffect(() => {
    return () => {
      clearRecaptchaVerifier();
    };
  }, [view]);

  const resetAllForms = () => {
    setView('overview');
    setPwStep('confirm');
    setPwOtpCode('');
    setPwConfirmationResult(null);
    setPwSimulatedOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setPhoneStep('input_new');
    setNewPhone('');
    setPhoneOtpCode('');
    setPhoneVerificationId(null);
    setPhoneConfirmationResult(null);
    setPhoneSimulatedOtp('');
    setErrorMsg('');
    setIsLoading(false);
    clearRecaptchaVerifier();
  };

  const handleClose = () => {
    resetAllForms();
    onClose();
  };

  // ==========================================
  // FLOW 1: CHANGE PASSWORD (OTP to CURRENT phone)
  // ==========================================
  const handleSendPasswordOTP = async () => {
    if (!currentUser?.phone) {
      showToast('Nomor HP pengguna tidak ditemukan.', 'error');
      return;
    }

    setErrorMsg('');
    setIsLoading(true);

    try {
      const result = await sendOTP(currentUser.phone, 'recaptcha-profile-container');
      setIsLoading(false);

      if (result.success) {
        if (result.confirmationResult) setPwConfirmationResult(result.confirmationResult);
        if (result.otpCode) setPwSimulatedOtp(result.otpCode);

        setPwStep('otp');
        setCountdown(60);
        showToast(result.message, 'info', 'OTP Terkirim');
      } else {
        setErrorMsg('Gagal mengirimkan kode OTP SMS. Silakan coba lagi.');
        showToast('Gagal mengirimkan kode OTP SMS.', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Terjadi kesalahan saat memproses pengiriman OTP.');
      showToast('Terjadi kesalahan saat memproses OTP.', 'error');
    }
  };

  const handleVerifyPasswordOTP = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!pwOtpCode || pwOtpCode.trim().length < 6) {
      setErrorMsg('Masukkan 6 digit kode OTP verifikasi.');
      return;
    }

    setIsLoading(true);
    try {
      const verification = await verifyOTP(pwOtpCode, pwConfirmationResult, pwSimulatedOtp);
      setIsLoading(false);

      if (verification.success) {
        showToast('Identitas terverifikasi! Silakan masukkan kata sandi baru Anda.', 'success', 'OTP Terverifikasi');
        setPwStep('new_password');
        setErrorMsg('');
      } else {
        setErrorMsg(verification.error || 'Kode OTP salah.');
        showToast(verification.error || 'Kode OTP salah.', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Gagal memverifikasi kode OTP.');
    }
  };

  const handleSaveNewPassword = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal harus 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    const res = resetPassword(currentUser.phone, newPassword);
    if (res.success) {
      showToast('Kata sandi berhasil diperbarui dengan aman!', 'success', 'Kata Sandi Diubah');
      resetAllForms();
    }
  };

  // ==========================================
  // FLOW 2: CHANGE PHONE (OTP to NEW phone)
  // ==========================================
  const handleSendNewPhoneOTP = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const normNew = normalizePhone(newPhone);
    const normCurrent = normalizePhone(currentUser?.phone);

    if (!normNew || normNew.length < 9) {
      setErrorMsg('Silakan masukkan format nomor HP baru yang valid.');
      return;
    }

    if (normNew === normCurrent) {
      setErrorMsg('Nomor HP baru tidak boleh sama dengan nomor Anda saat ini.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendNewPhoneUpdateOTP(normNew, 'recaptcha-profile-container');
      setIsLoading(false);

      if (result.success) {
        if (result.verificationId) setPhoneVerificationId(result.verificationId);
        if (result.confirmationResult) setPhoneConfirmationResult(result.confirmationResult);
        if (result.otpCode) setPhoneSimulatedOtp(result.otpCode);

        setPhoneStep('otp');
        setCountdown(60);
        showToast(result.message, 'info', 'OTP Terkirim ke Nomor Baru');
      } else {
        setErrorMsg('Gagal mengirimkan kode OTP ke nomor baru.');
        showToast('Gagal mengirimkan kode OTP.', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Terjadi kesalahan saat memproses pengiriman OTP ke nomor baru.');
    }
  };

  const handleVerifyNewPhoneOTP = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!phoneOtpCode || phoneOtpCode.trim().length < 6) {
      setErrorMsg('Masukkan 6 digit kode OTP verifikasi.');
      return;
    }

    setIsLoading(true);
    try {
      const verification = await verifyNewPhoneUpdateOTP({
        inputOtp: phoneOtpCode,
        verificationId: phoneVerificationId,
        confirmationResult: phoneConfirmationResult,
        simulatedOtp: phoneSimulatedOtp,
      });

      setIsLoading(false);

      if (verification.success) {
        const updateRes = updateUserPhoneNumber(currentUser.phone, newPhone);
        if (updateRes.success) {
          resetAllForms();
        } else {
          setErrorMsg(updateRes.error || 'Gagal menyimpan pembaruan nomor HP.');
        }
      } else {
        setErrorMsg(verification.error || 'Kode OTP nomor baru tidak valid.');
        showToast(verification.error || 'Kode OTP tidak valid.', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMsg('Gagal memverifikasi OTP nomor baru.');
    }
  };

  const userJabatanList = Array.isArray(currentUser?.jabatan) && currentUser.jabatan.length > 0
    ? currentUser.jabatan
    : ['Wali Kelas'];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Invisible Recaptcha Container for Firebase Phone Auth */}
        <div id="recaptcha-profile-container" className="hidden"></div>

        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view !== 'overview' ? (
              <button
                onClick={() => {
                  setView('overview');
                  setErrorMsg('');
                  clearRecaptchaVerifier();
                }}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shadow-xs">
                <User className="w-5 h-5 text-emerald-100" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-base leading-tight">
                {view === 'overview'
                  ? 'Profil Tenaga Pendidik'
                  : view === 'change_password'
                  ? 'Ubah Kata Sandi (Aman)'
                  : 'Ubah Nomor HP (OTP)'}
              </h3>
              <p className="text-xs text-emerald-100/90 truncate max-w-[200px]">
                {currentUser?.name || 'Guru RJ'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50 space-y-4">
          {/* ======================================================== */}
          {/* VIEW 1: OVERVIEW (PROFILE INFO & ACTION BUTTONS) */}
          {/* ======================================================== */}
          {view === 'overview' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Profile Card */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft-sm text-center relative overflow-hidden">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-brand-600 to-emerald-600 text-white flex items-center justify-center text-2xl font-black shadow-md shadow-brand-600/30 mb-3">
                  {currentUser?.name
                    ? currentUser.name
                        .split(' ')
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                    : 'RJ'}
                </div>

                <h2 className="text-base font-black text-slate-800 tracking-tight">
                  {currentUser?.name || 'Nama Lengkap Guru'}
                </h2>
                <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{currentUser?.phone || '-'}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-0.5" />
                </div>

                {/* Jabatan Display */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Jabatan / Peran Aktif:</span>
                    </span>
                    {onOpenJabatanModal && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenJabatanModal();
                        }}
                        className="text-[11px] font-bold text-brand-700 hover:underline flex items-center gap-0.5"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Kelola Peran</span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {userJabatanList.map((jab) => (
                      <span
                        key={jab}
                        className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200/80 flex items-center gap-1"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                        {jab}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Ubah Nomor HP & Ubah Kata Sandi */}
              <div className="space-y-2.5 pt-1">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
                  Pengaturan Keamanan Akun
                </h4>

                {/* Button: Ubah Nomor HP */}
                <button
                  onClick={() => {
                    setView('change_phone');
                    setPhoneStep('input_new');
                    setErrorMsg('');
                  }}
                  className="w-full p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-soft-xs flex items-center justify-between group transition active:scale-[0.99] text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center border border-sky-100 group-hover:scale-105 transition-transform">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs group-hover:text-brand-700 transition">
                        Ubah Nomor HP
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Verifikasi nomor baru dengan SMS OTP Firebase
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Button: Ubah Kata Sandi */}
                <button
                  onClick={() => {
                    setView('change_password');
                    setPwStep('confirm');
                    setErrorMsg('');
                  }}
                  className="w-full p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-soft-xs flex items-center justify-between group transition active:scale-[0.99] text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs group-hover:text-brand-700 transition">
                        Ubah Kata Sandi
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Verifikasi OTP ke nomor terdaftar Anda
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>

              {/* Security Badge */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-emerald-900 text-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-[11px] leading-snug">
                  Akun Anda dilindungi dengan <strong>Firebase Phone Auth</strong>. Setiap perubahan data sensitif mewajibkan verifikasi OTP SMS.
                </p>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: CHANGE PASSWORD (OTP TO CURRENT REGISTERED PHONE) */}
          {/* ======================================================== */}
          {view === 'change_password' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Step 1: Confirmation to send OTP to current phone */}
              {pwStep === 'confirm' && (
                <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft-sm space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800">
                      Verifikasi Identitas Anda
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Untuk keamanan, kami akan mengirimkan kode OTP SMS ke nomor HP terdaftar Anda saat ini:
                    </p>
                    <p className="text-sm font-black text-brand-700 mt-1.5 font-mono">
                      {formatPhoneDisplay(currentUser?.phone)}
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    onClick={handleSendPasswordOTP}
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengirim Kode OTP...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kirim Kode OTP SMS</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Step 2: Enter OTP Code */}
              {pwStep === 'otp' && (
                <form
                  onSubmit={handleVerifyPasswordOTP}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft-sm space-y-4"
                >
                  <div className="text-center">
                    <h4 className="text-sm font-black text-slate-800">
                      Masukkan Kode OTP
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Kode telah dikirimkan ke <strong>{formatPhoneDisplay(currentUser?.phone)}</strong>
                    </p>
                  </div>

                  {/* Simulated OTP notice if running in dev without real SMS keys */}
                  {pwSimulatedOtp && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                      <p className="font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Simulasi Kode OTP:
                      </p>
                      <p className="text-sm font-mono font-black text-amber-800 mt-0.5 tracking-widest">
                        {pwSimulatedOtp}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Kode Verifikasi (6 Digit)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={pwOtpCode}
                      onChange={(e) => {
                        setPwOtpCode(e.target.value.replace(/\D/g, ''));
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Contoh: 123456"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center text-lg font-mono font-bold tracking-widest focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || pwOtpCode.length < 6}
                    className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memverifikasi...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verifikasi Kode OTP</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    {countdown > 0 ? (
                      <span className="text-xs text-slate-400">
                        Kirim ulang kode dalam <strong>{countdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendPasswordOTP}
                        disabled={isLoading}
                        className="text-xs font-bold text-brand-700 hover:underline inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Kirim Ulang Kode OTP</span>
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* Step 3: Enter New Password */}
              {pwStep === 'new_password' && (
                <form
                  onSubmit={handleSaveNewPassword}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft-sm space-y-4"
                >
                  <div className="text-center">
                    <h4 className="text-sm font-black text-slate-800">
                      Tentukan Kata Sandi Baru
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Identitas Anda telah terverifikasi. Masukkan kata sandi baru yang aman.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Kata Sandi Baru
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="Minimal 6 karakter"
                        className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Konfirmasi Kata Sandi Baru
                    </label>
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Ketik ulang kata sandi baru"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Simpan Kata Sandi Baru</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: CHANGE PHONE (OTP TO NEW PHONE NUMBER) */}
          {/* ======================================================== */}
          {view === 'change_phone' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Step 1: Input New Phone Number */}
              {phoneStep === 'input_new' && (
                <form
                  onSubmit={handleSendNewPhoneOTP}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft-sm space-y-4"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center mx-auto mb-2">
                      <Phone className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-black text-slate-800">
                      Ganti Nomor HP Terdaftar
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Nomor saat ini: <strong>{formatPhoneDisplay(currentUser?.phone)}</strong>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nomor HP Baru
                    </label>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => {
                        setNewPhone(e.target.value.replace(/[^\d+]/g, ''));
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      *Kode OTP SMS akan langsung dikirimkan ke nomor HP baru ini untuk verifikasi.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !newPhone.trim()}
                    className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Mengirim Kode OTP...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Kirim OTP ke Nomor Baru</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Enter OTP Code sent to NEW phone */}
              {phoneStep === 'otp' && (
                <form
                  onSubmit={handleVerifyNewPhoneOTP}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft-sm space-y-4"
                >
                  <div className="text-center">
                    <h4 className="text-sm font-black text-slate-800">
                      Verifikasi Nomor Baru
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Kode OTP telah dikirimkan ke nomor baru Anda:{' '}
                      <strong className="text-brand-700">{formatPhoneDisplay(newPhone)}</strong>
                    </p>
                  </div>

                  {/* Simulated OTP notice if running without real SMS keys */}
                  {phoneSimulatedOtp && (
                    <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl text-xs text-sky-900">
                      <p className="font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                        Simulasi Kode OTP Nomor Baru:
                      </p>
                      <p className="text-sm font-mono font-black text-sky-800 mt-0.5 tracking-widest">
                        {phoneSimulatedOtp}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Kode Verifikasi (6 Digit)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={phoneOtpCode}
                      onChange={(e) => {
                        setPhoneOtpCode(e.target.value.replace(/\D/g, ''));
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder="Contoh: 123456"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 text-center text-lg font-mono font-bold tracking-widest focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || phoneOtpCode.length < 6}
                    className="w-full py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Menyimpan Nomor Baru...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Verifikasi & Ganti Nomor HP</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    {countdown > 0 ? (
                      <span className="text-xs text-slate-400">
                        Kirim ulang kode dalam <strong>{countdown}s</strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendNewPhoneOTP}
                        disabled={isLoading}
                        className="text-xs font-bold text-brand-700 hover:underline inline-flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Kirim Ulang Kode OTP</span>
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
