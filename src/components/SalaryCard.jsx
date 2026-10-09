import React from 'react';
import { Wallet, ArrowUp, FileText, Receipt } from 'lucide-react';

export default function SalaryCard({
  amount = 'Rp 3.500.000',
  label = 'Honor Mengajar Bulan Ini',
  onWithdraw,
  onSalarySlip,
  onHistory,
}) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-4 sm:p-5 mb-6 flex justify-between items-center transition-all">
      {/* Bagian Kiri (Info Saldo) */}
      <div className="flex items-center gap-3 min-w-0 pr-2">
        {/* Ikon Dompet di dalam lingkaran biru muda */}
        <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
          <Wallet className="w-5 h-5 text-blue-600" />
        </div>

        {/* Nominal Gaji & Subteks */}
        <div className="min-w-0">
          <p className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight leading-snug truncate">
            {amount}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {label}
          </p>
        </div>
      </div>

      {/* Bagian Kanan (Menu Aksi ala Gojek) */}
      <div className="flex items-center gap-4 flex-shrink-0">
        {/* Menu 1: Tarik */}
        <button
          type="button"
          onClick={onWithdraw}
          className="flex flex-col items-center group cursor-pointer focus:outline-none active:scale-95 transition-transform"
          title="Tarik Honor"
        >
          <div className="w-7 h-7 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ArrowUp className="w-4 h-4 text-[#0081A0]" />
          </div>
          <span className="text-[10px] font-medium text-gray-700 mt-0.5">
            Tarik
          </span>
        </button>

        {/* Menu 2: Slip */}
        <button
          type="button"
          onClick={onSalarySlip}
          className="flex flex-col items-center group cursor-pointer focus:outline-none active:scale-95 transition-transform"
          title="Lihat Slip Gaji"
        >
          <div className="w-7 h-7 flex items-center justify-center group-hover:scale-110 transition-transform">
            <FileText className="w-4 h-4 text-[#0081A0]" />
          </div>
          <span className="text-[10px] font-medium text-gray-700 mt-0.5">
            Slip
          </span>
        </button>

        {/* Menu 3: Riwayat Gaji */}
        <button
          type="button"
          onClick={onHistory}
          className="flex flex-col items-center group cursor-pointer focus:outline-none active:scale-95 transition-transform"
          title="Riwayat Gaji & Transaksi Bulanan"
        >
          <div className="w-7 h-7 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Receipt className="w-4 h-4 text-[#0081A0]" />
          </div>
          <span className="text-[10px] font-medium text-gray-700 mt-0.5 whitespace-nowrap">
            Riwayat Gaji
          </span>
        </button>
      </div>
    </div>
  );
}
