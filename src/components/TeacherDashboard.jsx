import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  Wallet,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ChevronRight,
  BookOpen,
  Sparkles,
  MapPin,
  Bell,
  Award,
  FileCheck,
  Briefcase,
  Edit3,
  User,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ScheduleModal from './ScheduleModal';
import SalarySlipModal from './SalarySlipModal';
import JabatanModal from './JabatanModal';
import AttendanceModal from './AttendanceModal';
import ProfileModal from './ProfileModal';
import BadalModal from './BadalModal';
import { getTodayDateString, normalizePhone, getScheduleHoursForDate } from '../data/initialData';
import { initDailyAttendanceReminder, sendTestAttendanceReminder } from '../utils/localNotifications';

export default function TeacherDashboard() {
  const { currentUser, logout, clockIn, clockOut, isClockedInToday, attendance = [], showToast } = useApp();
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceTargetDate, setAttendanceTargetDate] = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isSalaryOpen, setIsSalaryOpen] = useState(false);
  const [isJabatanOpen, setIsJabatanOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBadalModalOpen, setIsBadalModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('Selamat Pagi,');

  const scheduleHoursToday = getScheduleHoursForDate(new Date());

  const handleClockOutClick = () => {
    if (!todayRecord) {
      showToast('Silakan lakukan Absen Masuk terlebih dahulu sebelum melakukan Absen Pulang.', 'error', 'Belum Absen Masuk');
      return;
    }
    if (todayRecord.outTime) {
      showToast(`Anda sudah melakukan Absen Pulang hari ini pada pukul ${todayRecord.outTime} WIB.`, 'info', 'Sudah Absen Pulang');
      return;
    }

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isEarly = currentMinutes < scheduleHoursToday.outMinutes;

    if (isEarly) {
      const confirmEarly = window.confirm(
        `Saat ini belum memasuki jam kepulangan resmi (${scheduleHoursToday.outLabel}).\n\nApakah Anda yakin ingin melakukan Absen Pulang lebih awal sekarang?`
      );
      if (!confirmEarly) return;
      clockOut(currentUser, { allowEarly: true });
      return;
    }

    clockOut(currentUser);
  };

  // Requirement 44: Initialize daily attendance reminder (06:30 AM local notification)
  useEffect(() => {
    initDailyAttendanceReminder();
  }, []);

  // Realtime Clock & Dynamic Greeting
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );

      const hour = now.getHours();
      if (hour >= 4 && hour < 11) {
        setGreeting('Selamat Pagi,');
      } else if (hour >= 11 && hour < 15) {
        setGreeting('Selamat Siang,');
      } else if (hour >= 15 && hour < 18) {
        setGreeting('Selamat Sore,');
      } else {
        setGreeting('Selamat Malam,');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayRecord = isClockedInToday();

  // Helper to reliably resolve attendance status string ('Hadir', 'Sakit', 'Izin', 'Lainnya')
  const getAttendanceStatusDisplay = (record) => {
    if (!record) return '';
    if (record.attendanceStatus) return record.attendanceStatus;
    if (record.status === 'Tepat Waktu' || record.status === 'Terlambat') {
      return 'Hadir';
    }
    if (['Hadir', 'Sakit', 'Izin', 'Lainnya'].includes(record.status)) {
      return record.status;
    }
    return record.status || 'Hadir';
  };

  const displayStatus = todayRecord ? getAttendanceStatusDisplay(todayRecord) : null;

  // Filter teacher's own attendance history
  const teacherAttendanceHistory = (attendance || []).filter(
    (a) => a.teacherPhone && currentUser?.phone && normalizePhone(a.teacherPhone) === normalizePhone(currentUser.phone)
  );

  const formattedDateToday = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-full pb-8">
      {/* 1. Header (Requirement: Greeting + Nama Lengkap right below it) */}
      <div className="bg-gradient-to-b from-brand-700 via-brand-600 to-emerald-600 text-white p-6 pt-7 rounded-b-[36px] shadow-soft-lg shadow-brand-700/20 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-36 h-36 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1 pr-3">
            {/* Greeting */}
            <p className="text-sm font-medium text-emerald-100/90 tracking-wide">
              {greeting}
            </p>

            {/* Logged-in teacher's "Nama Lengkap" retrieved from registration data */}
            <h1 className="text-2xl font-black tracking-tight text-white mt-0.5 leading-snug">
              {currentUser?.name || 'Bapak/Ibu Guru'}
            </h1>

            {/* Display the selected "Jabatan" in header right below Nama Lengkap */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2 mb-1">
              {(Array.isArray(currentUser?.jabatan) && currentUser.jabatan.length > 0
                ? currentUser.jabatan
                : typeof currentUser?.jabatan === 'string'
                ? [currentUser.jabatan]
                : ['Wali Kelas']
              ).map((jab) => (
                <span
                  key={jab}
                  className="px-2.5 py-0.5 rounded-lg bg-emerald-950/45 text-emerald-100 border border-emerald-300/40 text-[10px] font-bold shadow-xs flex items-center gap-1 backdrop-blur-xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  {jab}
                </span>
              ))}
              <button
                onClick={() => setIsJabatanOpen(true)}
                title="Ubah Jabatan"
                className="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 text-emerald-100 text-[10px] font-semibold transition flex items-center gap-1"
              >
                <Edit3 className="w-2.5 h-2.5" />
                <span>Ubah</span>
              </button>
            </div>

            <p className="text-xs text-emerald-100/80 font-medium mt-1 truncate">
              📱 {currentUser?.phone}
            </p>
          </div>

          {/* Header Action Buttons: Notification Reminder Info, Profile & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 pt-0.5">
            <button
              type="button"
              onClick={async () => {
                showToast('Pengingat Absen Aktif: Setiap hari pukul 09:00 WIB.', 'info', 'Pengingat Absen ⏰');
                await sendTestAttendanceReminder();
              }}
              title="Pengingat Absen Aktif Setiap 09:00 WIB (Klik untuk tes notifikasi)"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all shadow-sm cursor-pointer"
            >
              <Bell className="w-4 h-4 text-emerald-200" />
            </button>

            <button
              onClick={() => setIsProfileOpen(true)}
              title="Profil Pengguna & Keamanan"
              className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center gap-1.5 text-white backdrop-blur-md transition-all shadow-sm text-xs font-bold cursor-pointer"
            >
              <User className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">Profil</span>
            </button>

            <button
              onClick={logout}
              title="Keluar dari akun"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Date & Digital Clock Card */}
        <div className="mt-5 p-3.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Calendar className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <p className="text-[11px] text-emerald-100 font-medium">Hari Ini</p>
              <p className="text-xs font-bold text-white">{formattedDateToday}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-emerald-100 uppercase tracking-wider font-semibold">Waktu Lokal</p>
            <div className="text-sm font-mono font-extrabold text-white tracking-wider flex items-center gap-1 justify-end">
              <Clock className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>{currentTime || '08:00:00'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 -mt-3 space-y-5">
        {/* Status Presensi Hari Ini Card */}
        <div className="bg-white rounded-3xl p-4 shadow-soft-md border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800">Status Presensi Hari Ini</span>
              <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                ⏰ Patokan: {scheduleHoursToday.dayName} (Masuk {scheduleHoursToday.inLabel} • Pulang {scheduleHoursToday.outLabel})
              </p>
            </div>
            {todayRecord ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{todayRecord.outTime ? 'Presensi Lengkap' : 'Sudah Masuk'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Belum Absen</span>
              </span>
            )}
          </div>

          {/* Details Row: Jam Masuk & Jam Pulang */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                todayRecord ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                <Clock className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Jam Masuk</p>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {todayRecord ? `${todayRecord.time} WIB` : 'Belum Absen'}
                </p>
              </div>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                todayRecord?.outTime ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Jam Pulang</p>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {todayRecord?.outTime ? `${todayRecord.outTime} WIB` : `Batas: ${scheduleHoursToday.outLabel}`}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Absen Masuk & Absen Pulang */}
          <div className="grid grid-cols-2 gap-2.5 mt-3 pt-3 border-t border-slate-100">
            {/* Tombol Absen Masuk */}
            <button
              type="button"
              onClick={() => setIsAttendanceModalOpen(true)}
              className={`p-2.5 rounded-2xl border transition-all text-left flex items-center justify-between active:scale-[0.98] ${
                todayRecord
                  ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-gradient-to-r from-emerald-600 to-brand-600 hover:from-emerald-700 hover:to-brand-700 text-white shadow-soft-sm border-transparent'
              }`}
            >
              <div className="min-w-0 pr-1">
                <p className={`text-xs font-bold ${todayRecord ? 'text-slate-800' : 'text-white'}`}>
                  {todayRecord ? 'Ubah Presensi' : 'Absen Masuk'}
                </p>
                <p className={`text-[10px] truncate ${todayRecord ? 'text-slate-500' : 'text-emerald-100'}`}>
                  {todayRecord ? `Status: ${displayStatus}` : `Masuk: ${scheduleHoursToday.inLabel}`}
                </p>
              </div>
              <Clock className={`w-4 h-4 flex-shrink-0 ${todayRecord ? 'text-slate-400' : 'text-emerald-200'}`} />
            </button>

            {/* Tombol Absen Pulang */}
            <button
              type="button"
              onClick={handleClockOutClick}
              disabled={!todayRecord || Boolean(todayRecord?.outTime)}
              className={`p-2.5 rounded-2xl border transition-all text-left flex items-center justify-between active:scale-[0.98] ${
                todayRecord?.outTime
                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-default opacity-85'
                  : !todayRecord
                  ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-soft-sm border-transparent'
              }`}
            >
              <div className="min-w-0 pr-1">
                <p className={`text-xs font-bold ${todayRecord && !todayRecord.outTime ? 'text-white' : 'text-slate-700'}`}>
                  {todayRecord?.outTime ? 'Sudah Pulang' : 'Absen Pulang'}
                </p>
                <p className={`text-[10px] truncate ${todayRecord && !todayRecord.outTime ? 'text-amber-100' : 'text-slate-400'}`}>
                  {todayRecord?.outTime ? `${todayRecord.outTime} WIB` : `Mulai ${scheduleHoursToday.outLabel}`}
                </p>
              </div>
              <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${todayRecord && !todayRecord.outTime ? 'text-amber-100' : 'text-slate-300'}`} />
            </button>
          </div>
        </div>

        {/* 2. Main Menu (Grid Layout as required) */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">
              Menu Utama Guru
            </h2>
            <span className="text-[11px] font-medium text-brand-700">
              Layanan Terintegrasi
            </span>
          </div>

          {/* Grid Layout */}
          {/* 2x2 Grid Layout containing Absen Masuk, Jadwal Mengajar, Slip Gaji, and Jabatan alongside each other */}
          <div className="grid grid-cols-2 gap-3.5">
            {/* Menu 1: Absen Masuk */}
            <button
              onClick={() => setIsAttendanceModalOpen(true)}
              className={`rounded-3xl p-4 border transition-all text-left flex flex-col justify-between group active:scale-[0.98] ${
                todayRecord
                  ? displayStatus === 'Sakit'
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50/70 border-amber-200/80 shadow-soft-sm cursor-pointer'
                    : displayStatus === 'Izin'
                    ? 'bg-gradient-to-br from-sky-50 to-blue-50/70 border-sky-200/80 shadow-soft-sm cursor-pointer'
                    : displayStatus === 'Lainnya'
                    ? 'bg-gradient-to-br from-purple-50 to-indigo-50/70 border-purple-200/80 shadow-soft-sm cursor-pointer'
                    : 'bg-gradient-to-br from-emerald-50 to-teal-50/70 border-emerald-200/80 shadow-soft-sm cursor-pointer'
                  : 'bg-gradient-to-br from-white to-emerald-50/40 hover:to-emerald-50 border-emerald-300 shadow-soft-md hover:shadow-soft-lg cursor-pointer ring-1 ring-emerald-500/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 border ${
                      todayRecord
                        ? displayStatus === 'Sakit'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : displayStatus === 'Izin'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : displayStatus === 'Lainnya'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                          : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                    }`}
                  >
                    {todayRecord ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Clock className="w-6 h-6 animate-pulse" />
                    )}
                  </div>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      todayRecord
                        ? displayStatus === 'Sakit'
                          ? 'bg-amber-200 text-amber-900'
                          : displayStatus === 'Izin'
                          ? 'bg-sky-200 text-sky-900'
                          : displayStatus === 'Lainnya'
                          ? 'bg-purple-200 text-purple-900'
                          : 'bg-emerald-200 text-emerald-900'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {todayRecord ? displayStatus : 'Wajib'}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-brand-700 transition">
                  Absen Masuk
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                  {todayRecord ? (
                    displayStatus === 'Hadir' ? (
                      `Hadir (${todayRecord.time})`
                    ) : (
                      `${displayStatus}${todayRecord.note ? `: "${todayRecord.note}"` : ''} (${todayRecord.time})`
                    )
                  ) : (
                    'Pilih status Hadir, Sakit, Izin, atau Lainnya'
                  )}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-brand-700">
                <span>{todayRecord ? 'Ubah Status Presensi' : 'Catat Presensi'}</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Menu 2: Jadwal Mengajar */}
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="bg-white hover:bg-slate-50 active:scale-[0.98] rounded-3xl p-4 border border-slate-200/70 shadow-soft-sm hover:shadow-soft-md transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    MTS & SMAT
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-brand-700 transition">
                  Jadwal Mengajar
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                  Agenda kelas, jam & klaim honor
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-brand-700">
                <span>Lihat Jadwal</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Menu 3: Slip Gaji */}
            <button
              onClick={() => setIsSalaryOpen(true)}
              className="bg-white hover:bg-slate-50 active:scale-[0.98] rounded-3xl p-4 border border-slate-200/70 shadow-soft-sm hover:shadow-soft-md transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Honor Sesi
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-brand-700 transition">
                  Slip Gaji
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                  Rekap gaji bulanan & unduh slip
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-brand-700">
                <span>Lihat Rincian</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Menu 4: Jabatan */}
            <button
              onClick={() => setIsJabatanOpen(true)}
              className="bg-white hover:bg-slate-50 active:scale-[0.98] rounded-3xl p-4 border border-slate-200/70 shadow-soft-sm hover:shadow-soft-md transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-emerald-100">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {(currentUser?.jabatan?.length || 1)} Jabatan
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-brand-700 transition">
                  Jabatan
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">
                  {(currentUser?.jabatan && currentUser.jabatan.join(', ')) || 'Wali Kelas'}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-brand-700">
                <span>Kelola Peran</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* Klaim Jam Badal Button (Requirement 33) */}
          <div className="mt-3.5">
            <button
              onClick={() => setIsBadalModalOpen(true)}
              className="w-full p-4 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.99] text-white shadow-soft-md hover:shadow-soft-lg transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/25 group-hover:scale-105 transition-transform flex-shrink-0 shadow-2xs">
                  <UserCheck className="w-6 h-6 text-amber-100" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">
                      Klaim Jam Badal
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-black/20 text-amber-100 border border-white/20">
                      Rp 3.000 / Sesi
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-100/90 mt-0.5">
                    Klaim honor guru pengganti kelas & mapel
                  </p>
                </div>
              </div>
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white group-hover:translate-x-1 transition-transform flex-shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>
        </div>

        {/* 3. Riwayat Presensi Saya (Recent Attendance Logs) */}
        <div className="bg-white rounded-3xl p-5 shadow-soft-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Riwayat Presensi Terakhir
            </h3>
            <span className="text-[11px] text-slate-400">
              {teacherAttendanceHistory.length} Catatan
            </span>
          </div>

          <div className="space-y-2.5">
            {teacherAttendanceHistory.length > 0 ? (
              teacherAttendanceHistory.slice(0, 4).map((record) => {
                const attStatus = getAttendanceStatusDisplay(record);
                const isSakit = attStatus === 'Sakit';
                const isIzin = attStatus === 'Izin';
                const isLainnya = attStatus === 'Lainnya';

                return (
                  <div
                    key={record.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            isSakit
                              ? 'bg-amber-100 text-amber-700'
                              : isIzin
                              ? 'bg-sky-100 text-sky-700'
                              : isLainnya
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{record.date}</p>
                          <p className="text-[10px] text-slate-500">Pukul {record.time} WIB</p>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                          isSakit
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isIzin
                            ? 'bg-sky-50 text-sky-800 border-sky-200'
                            : isLainnya
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        }`}
                      >
                        {attStatus}
                      </span>
                    </div>

                    {record.note && (
                      <p className="text-[10px] text-slate-600 bg-white p-2 rounded-xl border border-slate-200/60 mt-1 italic">
                        📝 "{record.note}"
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                Belum ada riwayat presensi tercatat
              </div>
            )}
          </div>
        </div>

        {/* 4. Tips & Kebijakan Sekolah */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-800 to-brand-900 text-white shadow-soft-md">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">
                Informasi Presensi Guru RJ
              </h4>
              <p className="text-[11px] text-emerald-100/90 mt-1 leading-relaxed">
                Lakukan presensi <strong>Hadir</strong> saat mulai bertugas di sekolah. Jika berhalangan (Sakit, Izin, atau Lainnya), mohon sertakan keterangan jelas untuk rekapitulasi sekolah.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isAttendanceModalOpen && (
        <AttendanceModal
          isOpen={isAttendanceModalOpen}
          onClose={() => {
            setIsAttendanceModalOpen(false);
            setAttendanceTargetDate(null);
          }}
          targetDate={attendanceTargetDate}
          existingRecord={
            attendanceTargetDate
              ? (attendance || []).find(
                  (a) =>
                    a.teacherPhone &&
                    currentUser?.phone &&
                    normalizePhone(a.teacherPhone) === normalizePhone(currentUser.phone) &&
                    a.date === attendanceTargetDate
                )
              : todayRecord
          }
        />
      )}

      {isScheduleOpen && (
        <ScheduleModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          teacherPhone={currentUser?.phone}
          teacherName={currentUser?.name}
          onOpenAttendance={(targetDate) => {
            setAttendanceTargetDate(targetDate || null);
            setIsScheduleOpen(false);
            setIsAttendanceModalOpen(true);
          }}
        />
      )}

      {isSalaryOpen && (
        <SalarySlipModal
          isOpen={isSalaryOpen}
          onClose={() => setIsSalaryOpen(false)}
          teacherPhone={currentUser?.phone}
          teacherName={currentUser?.name}
        />
      )}

      {isJabatanOpen && (
        <JabatanModal
          isOpen={isJabatanOpen}
          onClose={() => setIsJabatanOpen(false)}
        />
      )}

      {isProfileOpen && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onOpenJabatanModal={() => setIsJabatanOpen(true)}
        />
      )}

      {isBadalModalOpen && (
        <BadalModal
          isOpen={isBadalModalOpen}
          onClose={() => setIsBadalModalOpen(false)}
        />
      )}
    </div>
  );
}
