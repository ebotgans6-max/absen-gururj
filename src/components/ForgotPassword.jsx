import React, { useState, useEffect } from 'react';
import { ArrowLeft, Phone, KeyRound, ShieldCheck, CheckCircle2, RotateCcw, Lock, Send, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { sendOTP, verifyOTP } from '../firebase/phoneAuth';
import { normalizePhone, formatPhoneDisplay } from '../data/initialData';

export default function ForgotPassword({ onNavigateToLogin }) {
  const { findUserByPhone, resetPassword, showToast } = useApp();

  // Steps: 'phone' -> 'otp' -> 'reset' -> 'success'
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Firebase OTP states
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e?.preventDefault();
    const norm = normalizePhone(phone);
    if (!norm || norm.length < 9) {
      showToast('Masukkan nomor HP yang valid.', 'error');
      return;
    }

    // Check if user exists
    const user = findUserByPhone(norm);
    if (!user) {
      showToast('Nomor HP belum terdaftar dalam sistem.', 'error', 'Nomor Tidak Ditemukan');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendOTP(norm, 'recaptcha-container');
      setIsLoading(false);

      if (result.success) {
        if (result.confirmationResult) {
          setConfirmationResult(result.confirmationResult);
        }
        if (result.otpCode) {
          setSimulatedOtp(result.otpCode);
        }

        setStep('otp');
        setCountdown(60);
        showToast(result.message, 'info', 'OTP Terkirim');
      } else {
        showToast('Gagal mengirimkan kode OTP. Silakan coba beberapa saat lagi.', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      showToast('Terjadi kesalahan saat memproses OTP.', 'error');
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      showToast('Masukkan 6 digit kode OTP verifikasi.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const verification = await verifyOTP(otpCode, confirmationResult, simulatedOtp);
      setIsLoading(false);

      if (verification.success) {
        showToast('Verifikasi nomor HP berhasil! Silakan tentukan kata sandi baru.', 'success', 'OTP Terverifikasi');
        setStep('reset');
      } else {
        showToast(verification.error || 'Kode OTP salah.', 'error', 'Verifikasi Gagal');
      }
    } catch (err) {
      setIsLoading(false);
      showToast('Gagal memverifikasi OTP.', 'error');
    }
  };

  // Step 3: Set New Password
  const handleResetPassword = (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      showToast('Kata sandi baru minimal 4 karakter.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Konfirmasi kata sandi tidak cocok. Silakan ulangi.', 'error', 'Sandi Tidak Cocok');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const result = resetPassword(phone, newPassword);
      setIsLoading(false);
      if (result.success) {
        setStep('success');
      }
    }, 450);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-gradient-to-b from-white via-brand-50/40 to-slate-50">
      {/* Invisible reCAPTCHA container for Firebase Phone Auth */}
      <div id="recaptcha-container"></div>

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
            Lupa Kata Sandi 🔐
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
            {step === 'phone' && 'Verifikasi nomor HP Anda dengan kode OTP via SMS'}
            {step === 'otp' && 'Masukkan 6 digit kode OTP yang kami kirimkan'}
            {step === 'reset' && 'Buat kata sandi baru untuk akun Anda'}
            {step === 'success' && 'Kata sandi berhasil diperbarui'}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-4">
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-soft-md border border-slate-100">
          {/* STEP 1: INPUT PHONE NUMBER */}
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nomor HP Terdaftar
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
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Kami akan mengirimkan SMS berisi kode OTP verifikasi ke nomor ini.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 group mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Kirim Kode OTP</span>
                    <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              {/* Simulated OTP Notification Banner for instantaneous testing */}
              {simulatedOtp && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Notifikasi SMS OTP Masuk:</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Kode verifikasi Anda adalah: <strong className="text-brand-700 text-sm tracking-wider font-mono">{simulatedOtp}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => setOtpCode(simulatedOtp)}
                    className="mt-1 text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    👉 Klik untuk isi otomatis ({simulatedOtp})
                  </button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kode OTP (6 Digit)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Masukkan 6 angka OTP"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-base font-mono tracking-widest text-slate-800 text-center focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                  <span>Terkirim ke: <strong>{formatPhoneDisplay(phone)}</strong></span>
                  {countdown > 0 ? (
                    <span className="text-brand-700 font-semibold">Kirim ulang ({countdown}s)</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOTP}
                      className="text-brand-600 font-bold hover:underline"
                    >
                      Kirim Ulang OTP
                    </button>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 group mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Verifikasi Kode OTP</span>
                    <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 4 karakter"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-[0.98] text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-2 group mt-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Simpan Kata Sandi Baru</span>
                    <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-soft-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Kata Sandi Berhasil Diperbarui!</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Akun dengan nomor <strong>{formatPhoneDisplay(phone)}</strong> sekarang dapat digunakan untuk masuk dengan kata sandi baru.
                </p>
              </div>

              <button
                onClick={onNavigateToLogin}
                className="w-full py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-lg shadow-brand-600/30 transition-all"
              >
                Masuk Sekarang
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center pb-2">
        <p className="text-[11px] text-slate-400 font-medium">
          Keamanan akun didukung oleh Firebase Phone Authentication
        </p>
      </div>
    </div>
  );
}
