import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  LogOut,
  Bell,
  Edit3,
  User,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import ScheduleModal from './ScheduleModal';
import SalarySlipModal from './SalarySlipModal';
import JabatanModal from './JabatanModal';
import AttendanceModal from './AttendanceModal';
import ProfileModal from './ProfileModal';
import BadalModal from './BadalModal';
import MenuLainnyaModal from './MenuLainnyaModal';
import SalaryCard from './SalaryCard';
import TeacherGridMenu from './TeacherGridMenu';
import RecentAttendanceCard from './RecentAttendanceCard';
import { normalizePhone, getScheduleHoursForDate } from '../data/initialData';
import { initDailyAttendanceReminder, sendTestAttendanceReminder } from '../utils/localNotifications';

export default function TeacherDashboard() {
  const { currentUser, logout, clockOut, isClockedInToday, attendance = [], showToast } = useApp();
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [attendanceTargetDate, setAttendanceTargetDate] = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isSalaryOpen, setIsSalaryOpen] = useState(false);
  const [isJabatanOpen, setIsJabatanOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isBadalModalOpen, setIsBadalModalOpen] = useState(false);
  const [isMenuLainnyaOpen, setIsMenuLainnyaOpen] = useState(false);
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

  // Requirement: Initialize daily attendance reminder (06:30 AM local notification)
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

  const handleSalaryHistoryClick = () => {
    setIsSalaryOpen(true);
    showToast('Membuka riwayat slip dan rekapitulasi gaji bulanan Anda.', 'info', 'Riwayat Gaji 📄');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-full pb-10">
      {/* Modern Top Header / Navbar */}
      <div className="bg-white border-b border-slate-100 px-5 pt-6 pb-5 shadow-xs sticky top-0 z-30">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-3">
            <p className="text-xs font-semibold text-slate-400">
              {greeting}
            </p>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight leading-snug truncate">
              {currentUser?.name || 'Bapak/Ibu Guru'}
            </h1>

            {/* Jabatan Pills */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              {(Array.isArray(currentUser?.jabatan) && currentUser.jabatan.length > 0
                ? currentUser.jabatan
                : typeof currentUser?.jabatan === 'string'
                ? [currentUser.jabatan]
                : ['Wali Kelas']
              ).map((jab) => (
                <span
                  key={jab}
                  className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/70 text-[10px] font-bold shadow-2xs flex items-center gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {jab}
                </span>
              ))}
              <button
                type="button"
                onClick={() => setIsJabatanOpen(true)}
                title="Ubah Jabatan"
                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 text-[10px] font-semibold transition flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-2.5 h-2.5" />
                <span>Ubah</span>
              </button>
            </div>
          </div>

          {/* Action Buttons: Notifikasi, Profil, Logout */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={async () => {
                showToast('Pengingat Absen Aktif: Setiap hari pukul 09:00 WIB.', 'info', 'Pengingat Absen ⏰');
                await sendTestAttendanceReminder();
              }}
              title="Pengingat Absen (Klik untuk tes notifikasi)"
              className="w-9 h-9 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Bell className="w-4 h-4 text-slate-600" />
            </button>

            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              title="Profil Pengguna & Keamanan"
              className="w-9 h-9 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <User className="w-4 h-4 text-slate-600" />
            </button>

            <button
              type="button"
              onClick={logout}
              title="Keluar dari akun"
              className="w-9 h-9 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 flex items-center justify-center transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Date & Realtime Clock Subbar */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-slate-500 text-xs">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-700">{formattedDateToday}</span>
          </div>
          <div className="flex items-center gap-1 font-mono font-bold text-slate-700">
            <Clock className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>{currentTime || '08:00:00'} WIB</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 sm:p-5 max-w-lg mx-auto w-full">
        {/* Card Saldo/Gaji ala GoPay di paling atas */}
        <SalaryCard
          amount="Rp 3.500.000"
          label="Honor Mengajar Bulan Ini"
          onSalarySlip={() => setIsSalaryOpen(true)}
          onHistory={handleSalaryHistoryClick}
        />

        <div className="space-y-6">
          {/* 1. Bagian "Menu Layanan Guru" (Grid Icon 4 Kolom 7 Item) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100">
            <TeacherGridMenu
              onClockIn={() => setIsAttendanceModalOpen(true)}
              onClockOut={handleClockOutClick}
              onSchedule={() => setIsScheduleOpen(true)}
              onBadal={() => setIsBadalModalOpen(true)}
              onJabatan={() => setIsJabatanOpen(true)}
              onProfile={() => setIsProfileOpen(true)}
              onOtherMenu={() => setIsMenuLainnyaOpen(true)}
              todayRecord={todayRecord}
            />
          </div>

          {/* 2. Card "Riwayat Presensi Terakhir" */}
          <RecentAttendanceCard
            attendanceHistory={teacherAttendanceHistory}
          />
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
    </div>
  );
}
