import React from 'react';
import { Wallet, ArrowUpRight, FileText, History } from 'lucide-react';

export default function GojekSalaryCard({
  amount = 'Rp 3.500.000',
  label = 'Insentif Bulan Ini',
  onWithdraw,
  onSalarySlip,
  onHistory,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-soft-md border border-slate-100 p-3.5 sm:p-4 flex items-center justify-between transition-all hover:shadow-soft-lg">
      {/* Sisi Kiri: Ikon dompet + Nominal Gaji + Subtitle */}
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className="w-10 h-10 rounded-2xl bg-sky-50 flex items-center justify-center text-[#0081A0] flex-shrink-0 border border-sky-100/80 shadow-xs">
          <Wallet className="w-5 h-5 text-[#0081A0]" />
        </div>
        <div className="min-w-0">
          <p className="text-base sm:text-lg font-black text-slate-800 tracking-tight leading-snug truncate">
            {amount}
          </p>
          <p className="text-[11px] font-medium text-slate-500 truncate">
            {label}
          </p>
        </div>
      </div>

      {/* Sisi Kanan: 3 menu aksi kecil berjejer sejajar (flex-row) */}
      <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
        {/* Menu 1: Tarik */}
        <button
          type="button"
          onClick={onWithdraw}
          className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
          title="Tarik Honor / Insentif"
        >
          <div className="w-8 h-8 rounded-full bg-sky-50 group-hover:bg-sky-100 flex items-center justify-center transition-colors border border-sky-100/60 shadow-2xs">
            <ArrowUpRight className="w-4 h-4 text-[#0081A0]" />
          </div>
          <span className="text-[10px] font-semibold text-slate-700 mt-1">Tarik</span>
        </button>

        {/* Menu 2: Slip Gaji */}
        <button
          type="button"
          onClick={onSalarySlip}
          className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
          title="Buka Rincian Slip Gaji"
        >
          <div className="w-8 h-8 rounded-full bg-sky-50 group-hover:bg-sky-100 flex items-center justify-center transition-colors border border-sky-100/60 shadow-2xs">
            <FileText className="w-4 h-4 text-[#0081A0]" />
          </div>
          <span className="text-[10px] font-semibold text-slate-700 mt-1">Slip Gaji</span>
        </button>

        {/* Menu 3: Riwayat */}
        <button
          type="button"
          onClick={onHistory}
          className="flex flex-col items-center group cursor-pointer active:scale-95 transition-transform"
          title="Lihat Riwayat Presensi"
        >
          <div className="w-8 h-8 rounded-full bg-sky-50 group-hover:bg-sky-100 flex items-center justify-center transition-colors border border-sky-100/60 shadow-2xs">
            <History className="w-4 h-4 text-[#0081A0]" />
          </div>
          <span className="text-[10px] font-semibold text-slate-700 mt-1">Riwayat</span>
        </button>
      </div>
    </div>
  );
}
