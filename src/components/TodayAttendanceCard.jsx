import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';

export default function TodayAttendanceCard({
  todayRecord,
  scheduleText = 'Patokan: Senin - Kamis (Masuk 09.30 WIB • Pulang 13.45 WIB)',
  onClockInClick,
  onClockOutClick,
}) {
  const isClockedIn = Boolean(todayRecord);
  const isClockedOut = Boolean(todayRecord?.outTime);

  // Status display & badge styling
  const statusLabel = isClockedIn
    ? isClockedOut
      ? 'Presensi Lengkap'
      : (todayRecord.attendanceStatus || todayRecord.status || 'Hadir')
    : 'Belum Absen';

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6 transition-all">
      {/* Header Card */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm sm:text-base font-bold text-slate-800">
          Status Presensi Hari Ini
        </h2>

        {/* Badge Melingkar */}
        {isClockedIn ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{statusLabel}</span>
          </span>
        ) : (
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold">
            Belum Absen
          </span>
        )}
      </div>

      {/* Subtitle dengan ikon jam kecil */}
      <div className="flex items-center gap-1.5 mt-2 text-slate-500">
        <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <p className="text-[11px] sm:text-xs leading-tight">
          {scheduleText}
        </p>
      </div>

      {/* Isi Card: Grid 2 Kolom */}
      <div className="grid grid-cols-2 gap-3 mt-4 pt-1">
        {/* Kotak Kiri: JAM MASUK */}
        <div
          onClick={onClockInClick}
          className="bg-gray-50/90 hover:bg-gray-100/80 active:scale-[0.99] rounded-2xl p-3.5 sm:p-4 border border-gray-100/90 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              JAM MASUK
            </span>
          </div>

          <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
            {isClockedIn ? `${todayRecord.time} WIB` : 'Belum Absen'}
          </p>
        </div>

        {/* Kotak Kanan: JAM PULANG */}
        <div
          onClick={onClockOutClick}
          className="bg-gray-50/90 hover:bg-gray-100/80 active:scale-[0.99] rounded-2xl p-3.5 sm:p-4 border border-gray-100/90 transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              JAM PULANG
            </span>
          </div>

          <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
            {isClockedOut ? `${todayRecord.outTime} WIB` : 'Batas: 13.45 WIB'}
          </p>
        </div>
      </div>
    </div>
  );
}
