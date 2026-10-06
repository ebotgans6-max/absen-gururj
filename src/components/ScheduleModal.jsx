import React, { useState, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  BookOpen,
  Coffee,
  Sparkles,
  Search,
  School,
  Layers,
  ChevronRight,
  Filter,
  CheckCircle2,
  Square,
  CheckSquare,
  Wallet,
  UserCheck,
  Lock,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { scheduleData, isTeacherMatch } from '../data/scheduleData';
import { useApp } from '../context/AppContext';
import { normalizePhone, getTodayDateString, calculateSessionDuration } from '../data/initialData';
import { formatRupiah } from './PrintSlipModal';

// Color map for unselected subjects
const getSubjectColor = (subject) => {
  if (!subject || subject === '-') return 'bg-slate-100 text-slate-500 border-slate-200';
  const s = subject.toUpperCase();

  if (s.includes('MTK') || s.includes('MATEMATIKA'))
    return 'bg-blue-50 text-blue-800 border-blue-200 hover:border-blue-300';
  if (s.includes('JEPANG') || s.includes('JAPANISE'))
    return 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-300';
  if (s.includes('INGG') || s.includes('MANDARIN') || s.includes('ARAB'))
    return 'bg-purple-50 text-purple-800 border-purple-200 hover:border-purple-300';
  if (s.includes('INDO') || s.includes('B.INDO'))
    return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300';
  if (s.includes('IPA') || s.includes('FISIKA') || s.includes('GEO') || s.includes('KIMIA'))
    return 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:border-cyan-300';
  if (s.includes('QURDIS') || s.includes('FIQIH') || s.includes('AQIDAH') || s.includes('PAI'))
    return 'bg-amber-50 text-amber-800 border-amber-200 hover:border-amber-300';
  if (s.includes('PJOK') || s.includes('PENJAS'))
    return 'bg-orange-50 text-orange-800 border-orange-200 hover:border-orange-300';
  if (s.includes('PRAMUKA') || s.includes('CLUB'))
    return 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:border-indigo-300';
  if (s.includes('TIK'))
    return 'bg-sky-50 text-sky-800 border-sky-200 hover:border-sky-300';
  if (s.includes('IPS') || s.includes('SOSIO') || s.includes('EKO') || s.includes('SEJARAH') || s.includes('PKN'))
    return 'bg-teal-50 text-teal-800 border-teal-200 hover:border-teal-300';

  return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:border-emerald-300';
};

// Interactive Subject Block Component
function SubjectBlock({
  level,
  day,
  time,
  classKey,
  classLabel,
  subject,
  activeDate,
  isClaimLocked,
  lockMessage,
  onlyMySchedule,
  duration,
}) {
  const {
    currentUser,
    completedSessions,
    toggleTeachingSession,
    showToast,
    RATE_PER_SESSION = 7500,
  } = useApp();

  const isAssignedToMe = isTeacherMatch(subject, currentUser?.name);

  if (onlyMySchedule && !isAssignedToMe) {
    return null;
  }

  if (!subject || subject === '-') {
    return (
      <div className="p-3 rounded-2xl bg-slate-100/70 border border-dashed border-slate-200 text-slate-400 flex flex-col justify-between select-none">
        <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">
          {classLabel}
        </span>
        <span className="text-xs italic">- Kosong -</span>
      </div>
    );
  }

  const parts = String(subject || '').split(' - ');
  const mapelTitle = parts[0] || subject;
  const teacherInSlot = parts[1] || '';

  const sessionId = `${level}-${day}-${time}-${classKey}`;
  const claim = completedSessions.find(
    (s) => s.sessionId === sessionId && s.date === activeDate
  );

  const sessionDuration = Number(
    claim?.duration || duration || calculateSessionDuration(time) || 1
  );
  const sessionRate =
    claim?.rate !== undefined
      ? Number(claim.rate)
      : sessionDuration * (RATE_PER_SESSION || 7500);

  const isMyClaim =
    claim &&
    currentUser?.phone &&
    normalizePhone(claim.teacherPhone) === normalizePhone(currentUser.phone);

  const isOtherClaim = claim && !isMyClaim;

  const handleToggle = (e) => {
    e.stopPropagation();

    // Lock enforcement
    if (isClaimLocked) {
      showToast(
        lockMessage || 'Klaim sesi mengajar terkunci karena status presensi Anda hari ini.',
        'error',
        'Klaim Terkunci'
      );
      return;
    }

    const todayDate = getTodayDateString();

    if (isMyClaim) {
      if (activeDate < todayDate) {
        showToast(
          'Sesi mengajar dari hari sebelumnya telah terkunci dan tidak dapat dibatalkan.',
          'warning',
          'Sesi Terkunci'
        );
        return;
      }

      const confirmed = window.confirm(
        `Apakah Anda yakin ingin membatalkan klaim sesi mengajar ${subject} (${classLabel})?`
      );
      if (!confirmed) return;
    }

    toggleTeachingSession({
      sessionId,
      level,
      day,
      time,
      className: classLabel,
      subject,
      date: activeDate,
      duration: sessionDuration,
      rate: sessionRate,
      teacherPhone: currentUser?.phone,
      teacherName: currentUser?.name,
    });
  };

  // 1. Claimed by Current Teacher: Solid Green with Checkmark Visual Cue
  if (isMyClaim) {
    const todayDate = getTodayDateString();
    const isPastDate = activeDate < todayDate;

    return (
      <div
        onClick={handleToggle}
        className={`relative overflow-hidden p-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-brand-600 text-white shadow-soft-md shadow-emerald-600/30 border-2 border-emerald-400 transition-all duration-200 group ${
          isClaimLocked || isPastDate ? 'cursor-not-allowed opacity-90' : 'cursor-pointer active:scale-95'
        }`}
      >
        <div className="flex items-start justify-between gap-1 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100">
            {classLabel}
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/25 text-[9px] font-black tracking-wide text-white">
            {isClaimLocked || isPastDate ? (
              <>
                <Lock className="w-3 h-3 text-emerald-200" />
                <span>TERKUNCI</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-200" />
                <span>SELESAI (+{sessionRate >= 1000 ? `${(sessionRate / 1000).toLocaleString('id-ID')}K` : sessionRate})</span>
              </>
            )}
          </span>
        </div>

        <h4 className="font-black text-sm tracking-tight text-white mb-0.5 group-hover:underline">
          {mapelTitle}
        </h4>
        {teacherInSlot && (
          <p className="text-[11px] text-emerald-100/90 font-medium truncate mb-2">
            👤 {teacherInSlot}
          </p>
        )}

        <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-white/20 text-emerald-100">
          <span className="flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-emerald-200" />
            <strong className="truncate max-w-[85px]">Klaim Saya</strong>
          </span>
          <span className="underline opacity-80 group-hover:opacity-100 text-[9px]">
            {isClaimLocked || isPastDate ? 'Terkunci' : 'Batal?'}
          </span>
        </div>
      </div>
    );
  }

  // 2. Claimed by Another Teacher
  if (isOtherClaim) {
    return (
      <div
        onClick={handleToggle}
        className={`p-3 rounded-2xl bg-slate-100 border border-slate-300 text-slate-700 transition-all opacity-85 ${
          isClaimLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-slate-200/80'
        }`}
      >
        <div className="flex items-start justify-between gap-1 mb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {classLabel}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200 text-slate-700">
            Terisi
          </span>
        </div>

        <h4 className="font-extrabold text-sm tracking-tight text-slate-800 mb-0.5 line-through decoration-slate-400">
          {mapelTitle}
        </h4>
        {teacherInSlot && (
          <p className="text-[11px] text-slate-500 font-medium truncate mb-1">
            👤 {teacherInSlot}
          </p>
        )}

        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 truncate">
          Diajar: <strong>{claim.teacherName}</strong>
        </div>
      </div>
    );
  }

  // 3a. Unclaimed: When Locked
  if (isClaimLocked) {
    return (
      <div
        onClick={handleToggle}
        className="p-3 rounded-2xl border border-slate-200/90 bg-slate-100/90 text-slate-400 transition-all duration-200 cursor-not-allowed select-none flex flex-col justify-between group shadow-2xs"
      >
        <div>
          <div className="flex items-start justify-between gap-1 mb-1">
            <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider text-slate-500">
              {classLabel}
            </span>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-200/90 text-slate-500 text-[9px] font-bold border border-slate-300/80">
              <Lock className="w-2.5 h-2.5 text-slate-500" />
              <span>Terkunci</span>
            </span>
          </div>

          <h4 className="font-extrabold text-sm tracking-tight text-slate-600 line-clamp-1">
            {mapelTitle}
          </h4>
          {teacherInSlot && (
            <p className="text-[10px] text-slate-400 truncate mt-0.5">
              👤 {teacherInSlot}
            </p>
          )}
        </div>

        <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center justify-between text-[10px]">
          <span className="text-slate-400 italic">Klaim Dinonaktifkan</span>
          <span className="font-semibold text-rose-500 text-[9px]">Perlu Hadir</span>
        </div>
      </div>
    );
  }

  // 3b. Unclaimed: Normal Interactive Checkbox
  return (
    <div
      onClick={handleToggle}
      className={`p-3 rounded-2xl border transition-all duration-200 cursor-pointer hover:shadow-soft-sm active:scale-95 flex flex-col justify-between group ${
        isAssignedToMe
          ? 'ring-2 ring-emerald-500/60 border-emerald-400 bg-emerald-50/80'
          : getSubjectColor(mapelTitle)
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-1 mb-1">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] font-bold opacity-80 uppercase tracking-wider">
              {classLabel}
            </span>
            {isAssignedToMe && (
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-600 text-white text-[9px] font-black shadow-2xs">
                Jadwal Anda
              </span>
            )}
          </div>
          <button
            type="button"
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 text-[9px] font-bold border border-slate-200/80 transition group-hover:border-brand-500 group-hover:text-brand-700 shadow-2xs"
          >
            <Square className="w-3 h-3 text-slate-400 group-hover:text-brand-600" />
            <span>Klaim</span>
          </button>
        </div>

        <h4 className="font-extrabold text-sm tracking-tight leading-snug">
          {mapelTitle}
        </h4>
        {teacherInSlot && (
          <p className="text-[11px] font-semibold text-slate-600 truncate mt-0.5 flex items-center gap-1">
            <span>👤</span>
            <span className={isAssignedToMe ? 'text-emerald-800 font-bold' : ''}>
              {teacherInSlot}
            </span>
          </p>
        )}
      </div>

      <div className="mt-2 pt-1.5 border-t border-black/5 flex items-center justify-between text-[10px] opacity-75 group-hover:opacity-100">
        <span className="text-slate-500">Honor Sesi:</span>
        <span className="font-bold text-brand-700">+Rp {sessionRate.toLocaleString('id-ID')}</span>
      </div>
    </div>
  );
}

export default function ScheduleModal({ isOpen, onClose, teacherName, onOpenAttendance }) {
  const {
    currentUser,
    completedSessions = [],
    RATE_PER_SESSION = 7500,
    isClockedInToday,
    attendance = [],
    clockIn,
    showToast,
  } = useApp();

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const todayIndex = new Date().getDay();
  const defaultDay = todayIndex >= 1 && todayIndex <= 6 ? dayNames[todayIndex] : 'Senin';

  // Helper: map day name to specific date in current school week (Senin to Sabtu)
  const getDateForDay = (dayName) => {
    const dayMap = {
      Senin: 1,
      Selasa: 2,
      Rabu: 3,
      Kamis: 4,
      Jumat: 5,
      Sabtu: 6,
    };
    const targetIdx = dayMap[dayName] || 1;
    const now = new Date();
    const currentDayIdx = now.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    const diffToMonday = currentDayIdx === 0 ? -6 : 1 - currentDayIdx;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const targetDate = new Date(monday);
    targetDate.setDate(monday.getDate() + (targetIdx - 1));

    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const formatIndoDateBadge = (dateStr) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
          'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
        ];
        const mIdx = parseInt(parts[1], 10) - 1;
        return `${parseInt(parts[2], 10)} ${monthNames[mIdx] || parts[1]} ${parts[0]}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const [selectedLevel, setSelectedLevel] = useState('MTS'); // 'MTS' | 'SMAT'
  const [selectedDay, setSelectedDay] = useState(defaultDay);
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState(() => getDateForDay(defaultDay));
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyMySchedule, setOnlyMySchedule] = useState(false);

  const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  // Attendance check for teacher specifically for selectedDate (supports Backdated Absen Susulan)
  const todayDateString = getTodayDateString();
  const isCurrentDay = selectedDate === todayDateString;
  const isPastDay = selectedDate < todayDateString;
  const isFutureDay = selectedDate > todayDateString;

  const targetDateRecord = (attendance || []).find(
    (a) =>
      normalizePhone(a.teacherPhone) === normalizePhone(currentUser?.phone) &&
      a.date === selectedDate
  );

  const getAttendanceStatus = (record) => {
    if (!record) return null;
    if (record.attendanceStatus) return record.attendanceStatus;
    if (record.status === 'Tepat Waktu' || record.status === 'Terlambat') return 'Hadir';
    if (['Hadir', 'Sakit', 'Izin', 'Lainnya'].includes(record.status)) return record.status;
    return record.status || 'Hadir';
  };

  const targetDateStatus = getAttendanceStatus(targetDateRecord);

  // Lock logic evaluated specifically for selectedDate (past, today, or future)
  let isClaimLocked = false;
  let lockReasonType = null; // 'not_clocked_in' | 'backdate_needed' | 'absent' | 'future' | null
  let lockMessage = '';

  if (currentUser?.role !== 'admin') {
    if (isFutureDay) {
      isClaimLocked = true;
      lockReasonType = 'future';
      lockMessage = `Jadwal hari ${selectedDay} (${selectedDate}) belum dapat diklaim karena belum waktunya.`;
    } else if (isCurrentDay) {
      if (!targetDateRecord) {
        isClaimLocked = true;
        lockReasonType = 'not_clocked_in';
        lockMessage = 'Silakan lakukan Absen Masuk terlebih dahulu sebelum mengklaim sesi mengajar hari ini.';
      } else if (targetDateStatus !== 'Hadir') {
        isClaimLocked = true;
        lockReasonType = 'absent';
        lockMessage = `🔒 Anda tidak dapat mengklaim sesi mengajar karena status absensi Anda hari ini: ${targetDateStatus}.`;
      }
    } else if (isPastDay) {
      if (!targetDateRecord) {
        isClaimLocked = true;
        lockReasonType = 'backdate_needed';
        lockMessage = `Anda belum melakukan presensi untuk hari ${selectedDay} (${formatIndoDateBadge(selectedDate)}). Silakan lakukan "Absen Susulan" agar honor mengajar & uang transport dapat tercatat.`;
      } else if (targetDateStatus !== 'Hadir') {
        isClaimLocked = true;
        lockReasonType = 'absent';
        lockMessage = `🔒 Anda tidak dapat mengklaim sesi mengajar pada hari ${selectedDay} (${formatIndoDateBadge(selectedDate)}) karena status absensi Anda: ${targetDateStatus}.`;
      }
    }
  }

  // Quick 1-click Absen Susulan / Absen Masuk handler right from schedule modal
  const handleQuickCheckIn = (isBackdated) => {
    if (!currentUser) return;
    const res = clockIn(currentUser, {
      date: selectedDate,
      attendanceStatus: 'Hadir',
      note: isBackdated ? 'Absen Susulan' : '',
    });
    if (res?.success) {
      showToast(
        isBackdated
          ? `Absen Susulan hari ${selectedDay} (${formatIndoDateBadge(selectedDate)}) berhasil dicatat sebagai Hadir! Jadwal kini terbuka.`
          : 'Absen Masuk (Hadir) berhasil tercatat! Jadwal hari ini telah terbuka.',
        'success',
        isBackdated ? 'Absen Susulan Berhasil' : 'Absen Masuk Berhasil'
      );
    }
  };

  const classOptions = useMemo(() => {
    if (selectedLevel === 'MTS') {
      return [
        { key: 'ALL', label: 'Semua Kelas' },
        { key: 'kelas7', label: 'Kelas 7' },
        { key: 'kelas8', label: 'Kelas 8' },
        { key: 'kelas9', label: 'Kelas 9' },
      ];
    } else {
      return [
        { key: 'ALL', label: 'Semua Kelas' },
        { key: 'kelas10', label: 'Kelas 10' },
        { key: 'kelas11', label: 'Kelas 11' },
      ];
    }
  }, [selectedLevel]);

  const handleLevelChange = (lvl) => {
    setSelectedLevel(lvl);
    setSelectedClass('ALL');
  };

  const rawList = scheduleData[selectedLevel]?.[selectedDay] || [];

  const filteredList = useMemo(() => {
    let list = rawList;

    if (onlyMySchedule && currentUser?.name) {
      list = list.filter((item) => {
        if (item.isBreak) return false;
        return (
          isTeacherMatch(item.kelas7, currentUser.name) ||
          isTeacherMatch(item.kelas8, currentUser.name) ||
          isTeacherMatch(item.kelas9, currentUser.name) ||
          isTeacherMatch(item.kelas10, currentUser.name) ||
          isTeacherMatch(item.kelas11, currentUser.name)
        );
      });
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();

    return list.filter((item) => {
      if (item.isBreak) return item.label?.toLowerCase().includes(q);
      const values = Object.values(item).join(' ').toLowerCase();
      return values.includes(q);
    });
  }, [rawList, searchQuery, onlyMySchedule, currentUser]);

  // Compute total sessions claimed by this teacher for this month
  const myCompletedSessions = useMemo(() => {
    if (!currentUser?.phone) return [];
    return completedSessions.filter(
      (s) => normalizePhone(s.teacherPhone) === normalizePhone(currentUser.phone)
    );
  }, [completedSessions, currentUser]);

  const totalMyHonor = myCompletedSessions.reduce((acc, s) => {
    return (
      acc +
      (s?.rate !== undefined
        ? Number(s.rate)
        : Number(s?.duration || 1) * RATE_PER_SESSION)
    );
  }, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Calendar className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">Jadwal & Klaim Mengajar</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                  {selectedLevel}
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 truncate max-w-[240px]">
                {currentUser?.name || teacherName || 'Guru Pendidik'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Payroll Earning Highlight Banner */}
        <div className="bg-emerald-50 px-4 py-2 sm:px-5 sm:py-2.5 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-900">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] text-emerald-700 font-semibold leading-tight">
                Total Sesi Terverifikasi Bulan Ini:
              </p>
              <p className="text-xs font-black text-emerald-950">
                {myCompletedSessions.length} Sesi Selesai
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] text-emerald-700 font-semibold">Akumulasi Honor</p>
            <p className="text-sm font-black text-brand-700">{formatRupiah(totalMyHonor)}</p>
          </div>
        </div>

        {/* Warning Message Alert based on Attendance Status (Past days Absen Susulan or Today) */}
        {isClaimLocked && (
          <div
            className={`mx-3 sm:mx-4 mt-2 p-2.5 sm:p-3 rounded-2xl border flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 shadow-soft-xs ${
              lockReasonType === 'absent'
                ? 'bg-rose-50/95 border-rose-200 text-rose-950'
                : lockReasonType === 'backdate_needed'
                ? 'bg-amber-50/95 border-amber-300 text-amber-950'
                : 'bg-amber-50/95 border-amber-200 text-amber-950'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs ${
                lockReasonType === 'absent'
                  ? 'bg-rose-600 text-white'
                  : lockReasonType === 'backdate_needed'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-500 text-white'
              }`}
            >
              {lockReasonType === 'backdate_needed' ? (
                <Clock className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <h4 className="text-xs font-black tracking-wide flex items-center gap-1.5 text-slate-900">
                  <span>
                    {lockReasonType === 'absent'
                      ? 'Klaim Sesi Ditutup'
                      : lockReasonType === 'backdate_needed'
                      ? 'Absen Susulan Diperlukan'
                      : lockReasonType === 'future'
                      ? 'Jadwal Hari Mendatang'
                      : 'Presensi Masuk Diperlukan'}
                  </span>
                  {targetDateStatus && (
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-200/90 text-rose-900">
                      Status: {targetDateStatus}
                    </span>
                  )}
                  {isPastDay && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900">
                      {formatIndoDateBadge(selectedDate)}
                    </span>
                  )}
                </h4>

                {/* Quick Check-in Buttons */}
                {lockReasonType === 'backdate_needed' && (
                  <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
                    <button
                      type="button"
                      onClick={() => handleQuickCheckIn(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Absen Susulan (Hadir)</span>
                    </button>
                    {onOpenAttendance && (
                      <button
                        type="button"
                        onClick={() => onOpenAttendance(selectedDate)}
                        className="text-[11px] font-semibold text-amber-800 hover:underline px-1 py-1 cursor-pointer"
                      >
                        Pilihan Lain
                      </button>
                    )}
                  </div>
                )}

                {lockReasonType === 'not_clocked_in' && (
                  <div className="flex items-center gap-1.5 mt-1 sm:mt-0">
                    <button
                      type="button"
                      onClick={() => handleQuickCheckIn(false)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Absen Masuk (Hadir)</span>
                    </button>
                    {onOpenAttendance && (
                      <button
                        type="button"
                        onClick={() => onOpenAttendance(selectedDate)}
                        className="text-[11px] font-semibold text-emerald-800 hover:underline px-1 py-1 cursor-pointer"
                      >
                        Detail
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs font-medium mt-1 leading-snug text-slate-700">
                {lockMessage}
              </p>
              {targetDateRecord?.note && (
                <p className="text-[11px] mt-1.5 text-rose-900 italic bg-white/90 px-2.5 py-1 rounded-xl border border-rose-200/60">
                  Keterangan: "{targetDateRecord.note}"
                </p>
              )}
            </div>
          </div>
        )}

        {/* Level Selector & Quick Date Selector (Two Rows for Mobile Comfort) */}
        <div className="px-3.5 sm:px-5 py-2.5 sm:py-3 bg-slate-50 border-b border-slate-200/80 flex flex-col gap-2.5 sm:gap-3">
          {/* Row 1: Level Toggle MTS vs SMAT */}
          <div className="w-full flex bg-slate-200/80 p-1 rounded-2xl shadow-inner-xs">
            <button
              type="button"
              onClick={() => handleLevelChange('MTS')}
              className={`flex-1 py-1.5 sm:py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                selectedLevel === 'MTS'
                  ? 'bg-brand-600 text-white shadow-xs shadow-brand-600/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">MTS (Kelas 7, 8, 9)</span>
            </button>
            <button
              type="button"
              onClick={() => handleLevelChange('SMAT')}
              className={`flex-1 py-1.5 sm:py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
                selectedLevel === 'SMAT'
                  ? 'bg-brand-600 text-white shadow-xs shadow-brand-600/30'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">SMAT (Kelas 10, 11)</span>
            </button>
          </div>

          {/* Row 2: Presensi Hadir Badge & Date Picker */}
          <div className="flex flex-row justify-between items-center w-full gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {targetDateRecord && targetDateStatus === 'Hadir' ? (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/80 text-[11px] font-bold inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Presensi Hadir ✓</span>
                </span>
              ) : isClaimLocked ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300/70 text-[10px] sm:text-[11px] font-bold inline-flex items-center gap-1 shadow-2xs whitespace-nowrap">
                  <Lock className="w-3 h-3 text-amber-700 flex-shrink-0" />
                  <span>Klaim Terkunci</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-500 truncate">
                  Pilih tanggal presensi:
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 flex-shrink-0">
              <span className="text-[11px] font-bold text-slate-500">Tgl:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDate(val);
                  if (val) {
                    const parts = val.split('-');
                    if (parts.length === 3) {
                      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
                      const idx = d.getDay();
                      if (idx >= 1 && idx <= 6) {
                        setSelectedDay(dayNames[idx]);
                      }
                    }
                  }
                }}
                className="text-xs font-semibold px-2.5 py-1 rounded-xl border border-slate-200 bg-white text-slate-800 outline-none cursor-pointer focus:ring-1 focus:ring-brand-500 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Day Selector Pills */}
        <div className="w-full bg-white border-b border-slate-100">
          <div className="flex flex-row overflow-x-auto flex-nowrap hide-scrollbar no-scrollbar w-full px-3.5 sm:px-5 py-2.5 gap-2 items-center">
            {days.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => {
                  setSelectedDay(day);
                  setSelectedDate(getDateForDay(day));
                }}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center justify-center cursor-pointer ${
                  selectedDay === day
                    ? 'bg-brand-600 text-white shadow-xs shadow-brand-600/30 border border-brand-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/70'
                }`}
              >
                {day}
              </button>
            ))}
            {/* Generous right-side breathing room so last item (Sabtu) is never clipped */}
            <div className="pr-6 flex-shrink-0" />
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-3.5 sm:px-5 py-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto flex-nowrap hide-scrollbar no-scrollbar py-0.5 w-full sm:w-auto">
            {/* Quick Toggle: Jadwal Saya */}
            <button
              type="button"
              onClick={() => setOnlyMySchedule(!onlyMySchedule)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer shadow-2xs ${
                onlyMySchedule
                  ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs'
                  : 'bg-white border border-emerald-300/80 text-emerald-800 hover:bg-emerald-50'
              }`}
              title="Filter khusus jadwal mengajar nama Anda"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{onlyMySchedule ? '⭐ Jadwal Saya (Aktif)' : `Jadwal Saya (${currentUser?.name || 'Guru'})`}</span>
            </button>

            <span className="text-[11px] font-bold text-slate-300 mx-0.5 flex-shrink-0">|</span>

            <span className="text-[11px] font-bold text-slate-500 mr-0.5 flex items-center gap-1 flex-shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Kelas:</span>
            </span>
            {classOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setSelectedClass(opt.key)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition flex-shrink-0 cursor-pointer ${
                  selectedClass === opt.key
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
            <div className="pr-4 sm:hidden flex-shrink-0" />
          </div>

          <div className="relative min-w-[170px] sm:w-56 flex-shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari mapel / nama guru..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs focus:border-brand-500 outline-none shadow-2xs"
            />
          </div>
        </div>

        {/* Schedule List Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1 bg-slate-50">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>
              Jadwal <strong>{selectedLevel}</strong> • Hari <strong>{selectedDay}</strong>
            </span>
            <span
              className={`font-semibold text-[11px] ${
                isCurrentDay && isClaimLocked ? 'text-rose-600' : 'text-brand-700'
              }`}
            >
              {isCurrentDay && isClaimLocked
                ? '🔒 Klaim sesi terkunci'
                : '*Klik kartu mapel untuk klaim sesi selesai'}
            </span>
          </div>

          {filteredList.length > 0 ? (
            filteredList.map((slot, idx) => {
              // Case 1: BREAK TIME (Istirahat)
              if (slot.isBreak) {
                return (
                  <div
                    key={`break-${idx}`}
                    className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 shadow-soft-sm flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-200/70 text-amber-800 flex items-center justify-center">
                        <Coffee className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs tracking-wider uppercase text-amber-900">
                          {slot.label || 'ISTIRAHAT'}
                        </h4>
                        <p className="text-[11px] text-amber-700 font-medium">
                          Waktu istirahat & sholat dhuha / santai sejenak
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-800 bg-amber-100/80 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{slot.waktu}</span>
                    </div>
                  </div>
                );
              }

              // Case 2: EXTRACURRICULAR (isExtra)
              if (slot.isExtra) {
                return (
                  <div
                    key={`extra-${idx}`}
                    className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 text-purple-950 shadow-soft-sm space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white font-bold text-[10px] uppercase tracking-wider">
                          ⭐ Ekstrakurikuler
                        </span>
                        <h4 className="font-extrabold text-sm text-purple-900">
                          {slot.kelas7 || slot.kelas10 || 'Kegiatan Klub'}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-mono font-bold text-purple-800 bg-purple-100 px-2.5 py-1 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-purple-700" />
                        <span>{slot.waktu}</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-purple-700">
                      Diikuti seluruh kelas {selectedLevel === 'MTS' ? '7, 8, dan 9' : '10 dan 11'}.
                    </p>
                  </div>
                );
              }

              // Case 3: NORMAL CLASS TEACHING SLOTS WITH INTERACTIVE BLOCKS
              return (
                <div
                  key={`slot-${idx}`}
                  className="bg-white rounded-2xl p-4 shadow-soft-sm border border-slate-100 hover:border-brand-200 transition-all space-y-3"
                >
                  {/* Time Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-mono font-extrabold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-brand-600" />
                      <span>{slot.waktu}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Sesi ke-{idx + 1}
                    </span>
                  </div>

                  {/* Interactive Class Columns */}
                  {selectedLevel === 'MTS' ? (
                    <div
                      className={`grid gap-2 text-xs ${
                        selectedClass === 'ALL'
                          ? 'grid-cols-3'
                          : 'grid-cols-1'
                      }`}
                    >
                      {/* Kelas 7 */}
                      {(selectedClass === 'ALL' || selectedClass === 'kelas7') && (
                        <SubjectBlock
                          level="MTS"
                          day={selectedDay}
                          time={slot.waktu}
                          classKey="kelas7"
                          classLabel="Kelas 7"
                          subject={slot.kelas7}
                          activeDate={selectedDate}
                          isClaimLocked={isClaimLocked}
                          lockMessage={lockMessage}
                          onlyMySchedule={onlyMySchedule}
                          duration={slot.duration || slot.jp || calculateSessionDuration(slot.waktu)}
                        />
                      )}

                      {/* Kelas 8 */}
                      {(selectedClass === 'ALL' || selectedClass === 'kelas8') && (
                        <SubjectBlock
                          level="MTS"
                          day={selectedDay}
                          time={slot.waktu}
                          classKey="kelas8"
                          classLabel="Kelas 8"
                          subject={slot.kelas8}
                          activeDate={selectedDate}
                          isClaimLocked={isClaimLocked}
                          lockMessage={lockMessage}
                          onlyMySchedule={onlyMySchedule}
                          duration={slot.duration || slot.jp || calculateSessionDuration(slot.waktu)}
                        />
                      )}

                      {/* Kelas 9 */}
                      {(selectedClass === 'ALL' || selectedClass === 'kelas9') && (
                        <SubjectBlock
                          level="MTS"
                          day={selectedDay}
                          time={slot.waktu}
                          classKey="kelas9"
                          classLabel="Kelas 9"
                          subject={slot.kelas9}
                          activeDate={selectedDate}
                          isClaimLocked={isClaimLocked}
                          lockMessage={lockMessage}
                          onlyMySchedule={onlyMySchedule}
                          duration={slot.duration || slot.jp || calculateSessionDuration(slot.waktu)}
                        />
                      )}
                    </div>
                  ) : (
                    /* SMAT: Kelas 10 & Kelas 11 */
                    <div
                      className={`grid gap-2 text-xs ${
                        selectedClass === 'ALL'
                          ? 'grid-cols-2'
                          : 'grid-cols-1'
                      }`}
                    >
                      {/* Kelas 10 */}
                      {(selectedClass === 'ALL' || selectedClass === 'kelas10') && (
                        <SubjectBlock
                          level="SMAT"
                          day={selectedDay}
                          time={slot.waktu}
                          classKey="kelas10"
                          classLabel="Kelas 10"
                          subject={slot.kelas10}
                          activeDate={selectedDate}
                          isClaimLocked={isClaimLocked}
                          lockMessage={lockMessage}
                          onlyMySchedule={onlyMySchedule}
                          duration={slot.duration || slot.jp || calculateSessionDuration(slot.waktu)}
                        />
                      )}

                      {/* Kelas 11 */}
                      {(selectedClass === 'ALL' || selectedClass === 'kelas11') && (
                        <SubjectBlock
                          level="SMAT"
                          day={selectedDay}
                          time={slot.waktu}
                          classKey="kelas11"
                          classLabel="Kelas 11"
                          subject={slot.kelas11}
                          activeDate={selectedDate}
                          isClaimLocked={isClaimLocked}
                          lockMessage={lockMessage}
                          onlyMySchedule={onlyMySchedule}
                          duration={slot.duration || slot.jp || calculateSessionDuration(slot.waktu)}
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 px-4 bg-white rounded-2xl border border-dashed border-slate-200">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                {onlyMySchedule
                  ? `Tidak ada jadwal mengajar untuk ${currentUser?.name || 'Anda'}`
                  : 'Tidak ada jadwal ditemukan'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {onlyMySchedule
                  ? `Bapak/Ibu ${currentUser?.name || 'Guru'} tidak memiliki jadwal mengajar pada hari ${selectedDay} di jenjang ${selectedLevel}.`
                  : searchQuery
                  ? `Tidak ada mata pelajaran yang cocok dengan pencarian "${searchQuery}".`
                  : `Tidak ada jadwal pelajaran untuk ${selectedLevel} pada hari ${selectedDay}.`}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Honor mengajar otomatis masuk ke Slip Gaji bulanan.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
          >
            Tutup Jadwal
          </button>
        </div>
      </div>
    </div>
  );
}
