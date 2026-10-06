import React from 'react';
import { X, Printer, Download, CheckCircle2, Building2, Briefcase, CalendarCheck, Bus, Calculator } from 'lucide-react';

export const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

export default function PrintSlipModal({ isOpen, onClose, slip, teacher }) {
  if (!isOpen || !slip) return null;

  const totalMengajar = slip.teachingHoursBonus || 0;
  const totalTransport = slip.totalTransport || 0;
  const totalTunjanganJabatan = slip.totalTunjanganJabatan || 0;
  const grandTotal =
    slip.grandTotalSalary !== undefined
      ? slip.grandTotalSalary
      : totalMengajar + totalTransport + totalTunjanganJabatan;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
        {/* Modal Controls (Not Printed) */}
        <div className="px-5 py-3.5 bg-slate-800 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">Pratinjau Cetak Slip Gaji Resmi</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Area */}
        <div id="printable-slip" className="p-6 sm:p-8 bg-white text-slate-800">
          {/* Slip Header */}
          <div className="border-b-2 border-slate-800 pb-4 mb-5 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-brand-700 text-white flex items-center justify-center font-black text-xl shadow-sm">
                RJ
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 uppercase">
                  YAYASAN PENDIDIKAN GURU RJ
                </h2>
                <p className="text-[11px] text-slate-500">
                  Jl. Pendidikan Bangsa No. 88, Jakarta Selatan • Telp: (021) 7890123
                </p>
                <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mt-0.5">
                  SLIP GAJI RESMI PENDIDIK & TENAGA KEPENDIDIKAN
                </p>
              </div>
            </div>
          </div>

          {/* Slip Metadata */}
          <div className="grid grid-cols-2 gap-3 mb-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
            <div>
              <p className="text-slate-400 text-[10px]">Nama Tenaga Pengajar</p>
              <p className="font-bold text-slate-800 text-sm mt-0.5">{slip?.teacherName || 'Bapak/Ibu Guru'}</p>
              <p className="text-slate-400 text-[10px] mt-1.5">No. HP / Kontak</p>
              <p className="font-medium text-slate-700 text-xs">
                {slip?.teacherPhone || slip?.teacherEmail || '-'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-[10px]">Periode Gaji</p>
              <p className="font-bold text-brand-700 text-sm mt-0.5">{slip?.period || '-'}</p>
              <p className="text-slate-400 text-[10px] mt-1.5">Nomor Referensi</p>
              <p className="font-mono text-slate-600 text-xs font-semibold">
                {slip.id?.toUpperCase() || 'SLIP-RJ-2026'}
              </p>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="space-y-4 mb-6">
            {/* 1. Total Mengajar */}
            <div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center justify-between pb-1 border-b border-emerald-100">
                <span>1. Total Honor Sesi Mengajar</span>
                <span>Jumlah (Rp)</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between py-1 bg-emerald-50/70 px-2.5 rounded-lg border border-emerald-100 font-semibold">
                  <span>
                    Honor Sesi Reguler ({slip.totalRegularSessions !== undefined ? slip.totalRegularSessions : slip.totalSessionsCount || 0} Sesi)
                  </span>
                  <span className="font-black text-emerald-800">
                    +{formatRupiah(slip.totalHonorSesi !== undefined ? slip.totalHonorSesi : totalMengajar)}
                  </span>
                </div>

                {(slip.totalBadalSessions > 0 || slip.totalHonorBadal > 0) && (
                  <div className="flex justify-between py-1 bg-amber-50/70 px-2.5 rounded-lg border border-amber-200 font-semibold">
                    <span className="text-amber-900">
                      Honor Badal ({slip.totalBadalSessions} Sesi × Rp 3.000)
                    </span>
                    <span className="font-black text-amber-900">
                      +{formatRupiah(slip.totalHonorBadal)}
                    </span>
                  </div>
                )}
              </div>

              {/* Teaching Sessions Itemized Recap */}
              {slip.teachingSessionsList && slip.teachingSessionsList.length > 0 && (
                <div className="mt-2 space-y-1 text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 max-h-36 overflow-y-auto">
                  {slip.teachingSessionsList.map((s, i) => {
                    const isBadal = s.isBadal || s.type === 'badal';
                    return (
                      <div
                        key={i}
                        className="flex justify-between py-0.5 border-b border-slate-200/50 last:border-0"
                      >
                        <span>
                          • {s.date} {s.time ? `(${s.time})` : ''} — {s.level} {s.className} ({s.subject})
                          {isBadal ? ' [Badal]' : ''}
                        </span>
                        <span className={`font-semibold ${isBadal ? 'text-amber-700' : 'text-emerald-700'}`}>
                          +Rp {s.rate ? s.rate.toLocaleString('id-ID') : (isBadal ? '3.000' : '7.500')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Total Transport Harian */}
            <div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center justify-between pb-1 border-b border-emerald-100">
                <span>2. Total Transport (Daily Transport Allowance)</span>
                <span>Jumlah (Rp)</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                {slip.transportData?.dailyBreakdown && slip.transportData.dailyBreakdown.length > 0 ? (
                  slip.transportData.dailyBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between py-1 px-2.5 rounded-lg bg-teal-50/50 border border-teal-100"
                    >
                      <span className="font-medium text-slate-700">
                        {item.day ? `${item.day}, ` : ''}{item.date} ({item.sessionCount} Sesi)
                      </span>
                      <span className="font-bold text-teal-800">
                        +{formatRupiah(item.allowance)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span>Uang Transport Harian</span>
                    <span className="font-bold">{formatRupiah(totalTransport)}</span>
                  </div>
                )}

                <div className="flex justify-between py-1 bg-teal-50/80 px-2.5 rounded-lg border border-teal-200 font-semibold">
                  <span>Subtotal Uang Transport</span>
                  <span className="font-black text-teal-900">
                    +{formatRupiah(totalTransport)}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Total Tunjangan Jabatan */}
            <div>
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center justify-between pb-1 border-b border-emerald-100">
                <span>3. Total Tunjangan Jabatan (Role Allowances)</span>
                <span>Jumlah (Rp)</span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                {slip.jabatanAllowancesList && slip.jabatanAllowancesList.length > 0 ? (
                  slip.jabatanAllowancesList.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between py-1 px-2.5 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <span className="font-medium text-slate-700">{item.role}</span>
                      <span className="font-bold text-slate-800">
                        {item.amount > 0 ? `+${formatRupiah(item.amount)}` : 'Rp 0 (Standar)'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between py-1">
                    <span>Wali Kelas</span>
                    <span className="font-medium">+Rp 100.000</span>
                  </div>
                )}

                <div className="flex justify-between py-1 bg-emerald-50/70 px-2.5 rounded-lg border border-emerald-100 font-semibold">
                  <span>Subtotal Tunjangan Jabatan</span>
                  <span className="font-black text-emerald-800">
                    +{formatRupiah(totalTunjanganJabatan)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Grand Total Salary Formula */}
            <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-300 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950 block">
                  GRAND TOTAL GAJI DITERIMA
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">
                  (Total Mengajar) + (Total Transport) + (Total Tunjangan Jabatan)
                </span>
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-800 tracking-tight">
                {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-slate-200">
            <div>
              <p className="text-slate-400 text-[10px]">Penerima,</p>
              <div className="h-14 flex items-end justify-center">
                <span className="border-b border-slate-800 font-bold text-slate-800 pb-0.5">
                  {slip.teacherName}
                </span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Tenaga Pendidik RJ</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px]">Jakarta, 25 September 2026</p>
              <div className="h-14 flex items-end justify-center">
                <span className="border-b border-slate-800 font-bold text-slate-800 pb-0.5">
                  Bendahara Yayasan RJ
                </span>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Bagian Keuangan & SDM</p>
            </div>
          </div>

          {/* Footer note */}
          <p className="text-[9px] text-slate-400 text-center mt-5 pt-3 border-t border-slate-100 italic">
            *Dokumen ini merupakan slip gaji resmi yang diterbitkan secara otomatis oleh Sistem Presensi & Penggajian Guru RJ.
          </p>
        </div>
      </div>
    </div>
  );
}
