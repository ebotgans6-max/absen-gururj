import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ChevronRight,
  BookOpen,
  Sparkles,
  Bell,
  FileCheck,
  Briefcase,
  Edit3,
  User,
  UserCheck,
  FileText,
  GraduationCap,
  CalendarDays,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ScheduleModal from './ScheduleModal';
import SalarySlipModal from './SalarySlipModal';
import JabatanModal from './JabatanModal';
import AttendanceModal from './AttendanceModal';
import ProfileModal from './ProfileModal';
import BadalModal from './BadalModal';
import MenuLainnyaModal from './MenuLainnyaModal';
import FeaturePreviewModal from './FeaturePreviewModal';
import GojekSalaryCard from './GojekSalaryCard';
import TeacherGridMenu from './TeacherGridMenu';
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
  const [isMenuLainnyaOpen, setIsMenuLainnyaOpen] = useState(false);
  const [featurePreview, setFeaturePreview] = useState(null);
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('Selamat Pagi,');

  const historyRef = useRef(null);
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

  const handleWithdrawClick = () => {
    showToast(
      'Penarikan Insentif: Honor & insentif guru diproses otomatis setiap akhir bulan ke rekening terdaftar.',
      'info',
      'Penarikan Honor 💳'
    );
  };

  const handleHistoryClick = () => {
    if (historyRef.current) {
      historyRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    showToast('Menampilkan riwayat presensi terbaru Anda.', 'info', 'Riwayat Presensi');
  };

  const handleOpenStudentAssignments = () => {
    setFeaturePreview({
      title: 'Tugas Siswa',
      subtitle: 'Modul Penugasan & Evaluasi Mandiri Siswa',
      icon: <BookOpen className="w-7 h-7 text-purple-600" />,
      badgeText: 'Kurikulum Merdeka',
      description:
        'Kelola tugas harian, lembar kerja peserta didik (LKPD), serta pemantauan pengumpulan tugas kelas secara online.',
      details: [
        'Pembuatan tugas berbasis kelas dan mata pelajaran',
        'Cek status siswa yang sudah dan belum mengumpulkan',
        'Penilaian dan umpan balik langsung untuk siswa',
      ],
    });
  };

  const handleOpenTeachingJournal = () => {
    setFeaturePreview({
      title: 'Jurnal KBM',
      subtitle: 'Jurnal Harian Kegiatan Belajar Mengajar',
      icon: <FileText className="w-7 h-7 text-yellow-600" />,
      badgeText: 'Administrasi Guru',
      description:
        'Pencatatan materi pelajaran yang dibahas, capaian pembelajaran (CP/TP), absensi kelas, dan catatan khusus pembelajaran.',
      details: [
        'Dokumentasi materi dan indikator ketercapaian tatap muka',
        'Daftar hadir siswa di dalam jam pelajaran aktif',
        'Catatan kendala dan refleksi pembelajaran harian',
      ],
    });
  };

  const handleOpenStudentGrades = () => {
    setFeaturePreview({
      title: 'Nilai Siswa',
      subtitle: 'Rekapitulasi Asesmen Formatif & Sumatif',
      icon: <GraduationCap className="w-7 h-7 text-indigo-600" />,
      badgeText: 'Penilaian Akademik',
      description:
        'Input dan rekap nilai ulangan harian, Asesmen Sumatif Tengah Semester (ASTS), dan Sumatif Akhir Semester (ASAS).',
      details: [
        'Input nilai berdasarkan tujuan pembelajaran (TP)',
        'Kalkulasi otomatis rata-rata kelas & bobot penilaian',
        'Ekspor nilai untuk persiapan rapor madrasah',
      ],
    });
  };

  const handleOpenAcademicCalendar = () => {
    setFeaturePreview({
      title: 'Kalender Akademik',
      subtitle: 'Kalender Pendidikan & Agenda Madrasah 2026',
      icon: <CalendarDays className="w-7 h-7 text-cyan-600" />,
      badgeText: 'Agenda Tahunan',
      description:
        'Informasi pekan efektif belajar mengajar, agenda ujian semester, libur hari besar nasional, dan kegiatan resmi sekolah.',
      details: [
        'Hitungan pekan efektif semester ganjil dan genap',
        'Jadwal Penilaian Tengah Semester & Akhir Semester',
        'Agenda libur hari besar keagamaan dan cuti bersama',
      ],
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-full pb-8">
      {/* 1. Header (Greeting + Nama Lengkap + Jabatan + Akses Cepat) */}
      <div className="bg-gradient-to-b from-brand-700 via-brand-600 to-emerald-600 text-white p-6 pt-7 pb-10 rounded-b-[36px] shadow-soft-lg shadow-brand-700/20 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-36 h-36 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1 pr-3">
            {/* Greeting */}
            <p className="text-sm font-medium text-emerald-100/90 tracking-wide">
              {greeting}
            </p>

            {/* Nama Lengkap */}
            <h1 className="text-2xl font-black tracking-tight text-white mt-0.5 leading-snug">
              {currentUser?.name || 'Bapak/Ibu Guru'}
            </h1>

            {/* Jabatan Pills */}
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
                type="button"
                onClick={() => setIsJabatanOpen(true)}
                title="Ubah Jabatan"
                className="px-2 py-0.5 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95 text-emerald-100 text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-2.5 h-2.5" />
                <span>Ubah</span>
              </button>
            </div>

            <p className="text-xs text-emerald-100/80 font-medium mt-1 truncate">
              📱 {currentUser?.phone}
            </p>
          </div>

          {/* Action Buttons: Notifikasi, Profil, Logout */}
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
              type="button"
              onClick={() => setIsProfileOpen(true)}
              title="Profil Pengguna & Keamanan"
              className="h-9 sm:h-10 px-2.5 sm:px-3 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center gap-1.5 text-white backdrop-blur-md transition-all shadow-sm text-xs font-bold cursor-pointer"
            >
              <User className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">Profil</span>
            </button>

            <button
              type="button"
              onClick={logout}
              title="Keluar dari akun"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-white backdrop-blur-md transition-all shadow-sm cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Date & Digital Clock Card */}
        <div className="mt-4 p-3 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Calendar className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <p className="text-[10px] text-emerald-100 font-medium">Hari Ini</p>
              <p className="text-xs font-bold text-white">{formattedDateToday}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-emerald-100 uppercase tracking-wider font-semibold">Waktu Lokal</p>
            <div className="text-xs font-mono font-extrabold text-white tracking-wider flex items-center gap-1 justify-end">
              <Clock className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>{currentTime || '08:00:00'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 -mt-6 space-y-5 relative z-20">
        {/* 1. Card Saldo (Mirip Saldo GoPay) */}
        <GojekSalaryCard
          amount="Rp 3.500.000"
          label="Insentif Bulan Ini"
          onWithdraw={handleWithdrawClick}
          onSalarySlip={() => setIsSalaryOpen(true)}
          onHistory={handleHistoryClick}
        />

        {/* 2. Grid Menu Utama (Di bawah Card Saldo) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-soft-sm border border-slate-100">
          <div className="flex items-center justify-between mb-1 px-1">
            <h2 className="text-sm font-extrabold text-slate-800 tracking-tight">
              Menu Layanan Guru
            </h2>
            <span className="text-[11px] font-semibold text-emerald-700">
              Terintegrasi
            </span>
          </div>

          <TeacherGridMenu
            onClockIn={() => setIsAttendanceModalOpen(true)}
            onClockOut={handleClockOutClick}
            onSchedule={() => setIsScheduleOpen(true)}
            onStudentAssignments={handleOpenStudentAssignments}
            onTeachingJournal={handleOpenTeachingJournal}
            onStudentGrades={handleOpenStudentGrades}
            onAcademicCalendar={handleOpenAcademicCalendar}
            onOtherMenu={() => setIsMenuLainnyaOpen(true)}
            todayRecord={todayRecord}
          />
        </div>

        {/* Status Presensi Hari Ini Card */}
        <div className="bg-white rounded-3xl p-4 shadow-soft-sm border border-slate-100">
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
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  todayRecord ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
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
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  todayRecord?.outTime ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'
                }`}
              >
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
        </div>

        {/* Banner Klaim Jam Badal Cepat */}
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white shadow-soft-sm flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 border border-white/30">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-extrabold text-white">Klaim Jam Badal</p>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-black/20 text-amber-100 border border-white/20">
                  Rp 3.000 / Sesi
                </span>
              </div>
              <p className="text-[11px] text-amber-100/90 truncate mt-0.5">
                Klaim honor guru pengganti kelas & mapel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsBadalModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-white text-amber-700 font-bold text-xs hover:bg-amber-50 active:scale-95 transition shadow-xs cursor-pointer flex-shrink-0"
          >
            Klaim
          </button>
        </div>

        {/* 3. Riwayat Presensi Saya (Recent Attendance Logs) */}
        <div ref={historyRef} className="bg-white rounded-3xl p-5 shadow-soft-sm border border-slate-100 scroll-mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Riwayat Presensi Terakhir
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">
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
        <div className="p-4 rounded-3xl bg-gradient-to-br from-emerald-800 to-brand-900 text-white shadow-soft-sm">
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

      {isMenuLainnyaOpen && (
        <MenuLainnyaModal
          isOpen={isMenuLainnyaOpen}
          onClose={() => setIsMenuLainnyaOpen(false)}
          onOpenBadal={() => setIsBadalModalOpen(true)}
          onOpenJabatan={() => setIsJabatanOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenSalarySlip={() => setIsSalaryOpen(true)}
          onTestNotification={async () => {
            showToast('Pengingat Absen Aktif: Setiap hari pukul 09:00 WIB.', 'info', 'Pengingat Absen ⏰');
            await sendTestAttendanceReminder();
          }}
        />
      )}

      {featurePreview && (
        <FeaturePreviewModal
          isOpen={Boolean(featurePreview)}
          onClose={() => setFeaturePreview(null)}
          title={featurePreview.title}
          subtitle={featurePreview.subtitle}
          icon={featurePreview.icon}
          badgeText={featurePreview.badgeText}
          description={featurePreview.description}
          details={featurePreview.details}
        />
      )}
    </div>
  );
}
