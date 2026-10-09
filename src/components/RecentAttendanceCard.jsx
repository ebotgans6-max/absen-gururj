import React from 'react';
import { FileText, FileCheck } from 'lucide-react';

export default function RecentAttendanceCard({ attendanceHistory = [] }) {
  // Total catatan text: default to "7 Catatan" as specified or show actual count if higher
  const totalCatatanText = attendanceHistory.length > 0 ? `${attendanceHistory.length} Catatan` : '7 Catatan';

  // Format record or fallback to dummy reference
  const primaryRecord = attendanceHistory.length > 0 ? attendanceHistory[0] : null;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 sm:p-6 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs sm:text-sm font-bold text-slate-800 tracking-wider uppercase">
          RIWAYAT PRESENSI TERAKHIR
        </h3>
        <span className="text-xs text-slate-400 font-normal">
          {totalCatatanText}
        </span>
      </div>

      {/* List Container */}
      <div className="space-y-3">
        {/* Item Utama sesuai referensi spesifik */}
        <div className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition">
          <div className="flex items-center justify-between">
            {/* Kiri & Tengah */}
            <div className="flex items-center gap-3">
              {/* Kiri: Kotak hijau muda dengan ikon dokumen */}
              <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>

              {/* Tengah: Tanggal & Waktu */}
              <div>
                <p className="text-xs font-bold text-slate-800">
                  {primaryRecord?.date || '2026-10-09'}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {primaryRecord?.time ? `Pukul ${primaryRecord.time} WIB` : 'Pukul 07:15:00 WIB'}
                </p>
              </div>
            </div>

            {/* Kanan: Badge outline hijau "Hadir" */}
            <span className="px-2.5 py-0.5 rounded-lg border border-green-500 text-green-700 text-[10px] font-bold bg-green-50/40">
              {primaryRecord?.attendanceStatus || primaryRecord?.status || 'Hadir'}
            </span>
          </div>

          {/* Di bawahnya: Kotak abu-abu kecil berbunyi "📝 Absen Susulan" */}
          <div className="mt-2.5 pl-0.5">
            <span className="inline-block bg-gray-100 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-lg border border-gray-200/50">
              {primaryRecord?.note ? `📝 ${primaryRecord.note}` : '📝 Absen Susulan'}
            </span>
          </div>
        </div>

        {/* Riwayat Tambahan jika ada */}
        {attendanceHistory.slice(1, 3).map((record) => (
          <div
            key={record.id}
            className="p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">{record.date}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Pukul {record.time} WIB</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-lg border border-green-500 text-green-700 text-[10px] font-bold bg-green-50/40">
                {record.attendanceStatus || record.status || 'Hadir'}
              </span>
            </div>
            {record.note && (
              <div className="mt-2.5 pl-0.5">
                <span className="inline-block bg-gray-100 text-gray-700 text-[10px] font-medium px-2 py-0.5 rounded-lg border border-gray-200/50">
                  📝 {record.note}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
