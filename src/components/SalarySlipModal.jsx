import React, { useState, useMemo } from 'react';
import {
  X,
  Wallet,
  Printer,
  CheckCircle2,
  CalendarCheck,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  Info,
  Calculator,
  ShieldCheck,
  Award,
  Bus,
  Calendar,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  History,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import PrintSlipModal, { formatRupiah } from './PrintSlipModal';
import {
  normalizePhone,
  JABATAN_ALLOWANCES,
  getJabatanAllowance,
  calculateDailyTransport,
  getPeriodFromDate,
  INDO_MONTHS,
  RATE_PER_SESSION,
  RATE_PER_BADAL_SESSION,
} from '../data/initialData';

export default function SalarySlipModal({
  isOpen,
  onClose,
  teacherPhone,
  teacherEmail,
  teacherName,
}) {
  const {
    salarySlips,
    completedSessions,
    RATE_PER_SESSION = 7500,
    currentUser,
    teachers,
    registeredUsers,
  } = useApp();

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Compute current month and year string in Indonesian (e.g. "September 2026")
  const currentMonthYear = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric',
    });
  }, []);

  // Dropdown state: defaults to current month and year
  const [selectedPeriod, setSelectedPeriod] = useState(currentMonthYear);

  const cleanPhone = (teacherPhone || currentUser?.phone || '').replace(/\D/g, '');

  // Filter all slips for this teacher
  const userSlips = useMemo(() => {
    return salarySlips.filter((s) => {
      if (s.teacherPhone && cleanPhone && s.teacherPhone.replace(/\D/g, '') === cleanPhone)
        return true;
      if (teacherName && s.teacherName && s.teacherName.toLowerCase() === teacherName.toLowerCase())
        return true;
      if (teacherEmail && s.teacherEmail && s.teacherEmail.toLowerCase() === teacherEmail.toLowerCase())
        return true;
      return false;
    });
  }, [salarySlips, cleanPhone, teacherName, teacherEmail]);

  // Generate Month and Year list for selector dropdown
  // Combines current month, past 12 months, and any periods present in slips or completed sessions
  const periodOptions = useMemo(() => {
    const list = [];
    const now = new Date();

    // 1. Generate past 12 months from now
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const str = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      if (!list.includes(str)) list.push(str);
    }

    // 2. Include any periods from existing salary slips
    (userSlips || []).forEach((s) => {
      if (s?.period && !list.includes(s.period)) {
        list.push(s.period);
      }
    });

    // 3. Include any periods from completed sessions
    (completedSessions || []).forEach((s) => {
      const p = s?.period || (s?.date ? getPeriodFromDate(s.date) : null);
      if (p && !list.includes(p)) {
        list.push(p);
      }
    });

    return list;
  }, [userSlips, completedSessions]);

  // Resolve matching slip for selected period or create an active virtual slip
  const activeSlip = useMemo(() => {
    const existing = (userSlips || []).find((s) => s?.period === selectedPeriod);
    if (existing) return existing;

    return {
      id: `slip-${(selectedPeriod || 'periode').replace(/\s+/g, '-').toLowerCase()}`,
      teacherPhone: cleanPhone,
      teacherName: teacherName || currentUser?.name || 'Tenaga Pendidik',
      period: selectedPeriod,
      status: selectedPeriod === currentMonthYear ? 'Sedang Berjalan' : 'Sudah Terbit',
      dateIssued: selectedPeriod === currentMonthYear ? 'Berjalan' : 'Arsip Bulanan',
    };
  }, [userSlips, selectedPeriod, currentMonthYear, cleanPhone, teacherName, currentUser]);

  // Resolve active teacher's profile & active 'Jabatan' list
  const resolvedProfile =
    (currentUser && (normalizePhone(currentUser.phone) === cleanPhone || currentUser.name === (activeSlip?.teacherName || teacherName)))
      ? currentUser
      : (teachers || []).find((t) => t && (normalizePhone(t.phone) === cleanPhone || (teacherName && t.name && t.name.toLowerCase() === teacherName.toLowerCase()))) ||
        (registeredUsers || []).find((u) => u && (normalizePhone(u.phone) === cleanPhone || (teacherName && u.name && u.name.toLowerCase() === teacherName.toLowerCase())));

  const activeJabatanList = Array.isArray(resolvedProfile?.jabatan) && resolvedProfile.jabatan.length > 0
    ? resolvedProfile.jabatan
    : typeof resolvedProfile?.jabatan === 'string'
    ? [resolvedProfile.jabatan]
    : Array.isArray(currentUser?.jabatan) && currentUser.jabatan.length > 0
    ? currentUser.jabatan
    : typeof currentUser?.jabatan === 'string'
    ? [currentUser.jabatan]
    : ['Wali Kelas'];

  // Dynamically filter checked/completed sessions for the selected month and year
  const teacherSessions = useMemo(() => {
    return completedSessions.filter((s) => {
      const matchesPhone =
        normalizePhone(s.teacherPhone) ===
        normalizePhone(activeSlip?.teacherPhone || cleanPhone);
      const matchesName =
        s.teacherName &&
        (activeSlip?.teacherName || teacherName) &&
        s.teacherName.toLowerCase() === (activeSlip?.teacherName || teacherName).toLowerCase();

      if (!matchesPhone && !matchesName) return false;

      // Match period against selected month & year
      const sessPeriod = s.period || getPeriodFromDate(s.date);
      return sessPeriod === selectedPeriod;
    });
  }, [completedSessions, activeSlip, cleanPhone, teacherName, selectedPeriod]);

  // 1. Separate Regular and Badal Teaching Sessions
  const regularSessions = teacherSessions.filter((s) => !s.isBadal && s.type !== 'badal');
  const badalSessions = teacherSessions.filter((s) => s.isBadal || s.type === 'badal');

  const totalRegularSessions = regularSessions.length;
  const totalBadalSessions = badalSessions.length;
  const totalCheckedSessions = teacherSessions.length;

  const ratePerSession = RATE_PER_SESSION || 7500; // Rp 7.500
  const ratePerBadalSession = RATE_PER_BADAL_SESSION || 3000; // Rp 3.000

  const totalHonorSesi = regularSessions.reduce((sum, s) => {
    return (
      sum +
      (s?.rate !== undefined
        ? Number(s.rate)
        : Number(s?.duration || 1) * ratePerSession)
    );
  }, 0);
  const totalHonorBadal = totalBadalSessions * ratePerBadalSession;
  const totalMengajar = totalHonorSesi + totalHonorBadal;

  // 2. Daily Transport Allowance:
  // Group checked sessions in selected month by DATE
  // 1-2 sessions in a day = Rp 17.000 | > 2 sessions in a day = Rp 25.000
  const transportData = calculateDailyTransport(teacherSessions);
  const totalTransport = transportData.totalTransport;

  // 3. Total Tunjangan Jabatan: Calculated from active positions
  const jabatanAllowancesList = activeJabatanList.map((role) => ({
    role,
    amount: getJabatanAllowance(role),
  }));

  const totalTunjanganJabatan = jabatanAllowancesList.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  // 4. Grand Total: (Honor Sesi) + (Honor Badal) + (Total Transport) + (Total Tunjangan Jabatan)
  const grandTotalSalary = totalHonorSesi + totalHonorBadal + totalTransport + totalTunjanganJabatan;

  const isCurrentMonthActive = selectedPeriod === currentMonthYear;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md shadow-xs">
                <Wallet className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Slip Gaji Guru RJ</h3>
                <p className="text-xs text-emerald-100/90 truncate max-w-[200px]">
                  {resolvedProfile?.name || activeSlip?.teacherName || teacherName || 'Bapak/Ibu Guru'}
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

          {/* Month and Year Selector Dropdown Filter (Requirement 14) */}
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block leading-tight">
                  Pilih Periode Bulan & Tahun:
                </span>
                <span className="text-xs font-bold text-slate-800">
                  {isCurrentMonthActive ? 'Bulan Berjalan (Realtime)' : 'Arsip Riwayat Slip Gaji'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-56">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-8 py-2 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-xs outline-none cursor-pointer transition hover:border-slate-400"
                >
                  {periodOptions.map((period) => (
                    <option key={period} value={period}>
                      {period} {period === currentMonthYear ? '• (Bulan Ini)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {!isCurrentMonthActive && (
                <button
                  type="button"
                  onClick={() => setSelectedPeriod(currentMonthYear)}
                  className="px-2.5 py-2 text-[11px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-xl border border-brand-200 transition whitespace-nowrap"
                  title="Kembali ke bulan berjalan"
                >
                  Bulan Ini
                </button>
              )}
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-slate-50/70">
            {/* Grand Total Highlight Box */}
            <div className="p-5 rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-emerald-600 text-white shadow-soft-lg shadow-brand-600/30 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between text-xs text-emerald-100 mb-1">
                <span className="font-semibold tracking-wide">
                  Grand Total Gaji {selectedPeriod}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-xs">
                  {isCurrentMonthActive ? 'Sedang Berjalan' : 'Sudah Terbit / Arsip'}
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2">
                {formatRupiah(grandTotalSalary)}
              </h2>
              <div className="flex items-center justify-between text-[11px] text-emerald-100/90 pt-2.5 border-t border-white/20">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-200" />
                  <span>
                    Periode: <strong>{selectedPeriod}</strong>
                  </span>
                </span>
                <span>
                  <strong>{totalCheckedSessions}</strong> Sesi •{' '}
                  <strong>{transportData.activeDaysCount}</strong> Hari Kerja
                </span>
              </div>
            </div>

            {/* BREAKDOWN 1: Total Mengajar (Teaching Earnings) */}
            <div className="bg-white rounded-3xl p-4 shadow-soft-sm border border-emerald-200/80">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      1. Total Sesi Mengajar Terklaim
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {totalRegularSessions} Sesi Reguler • {totalBadalSessions} Sesi Badal ({selectedPeriod})
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-700">
                  +{formatRupiah(totalMengajar)}
                </span>
              </div>

              {/* List of completed teaching sessions */}
              <div className="mt-3 space-y-2">
                {teacherSessions.length > 0 ? (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {teacherSessions.map((sess, idx) => {
                      const isBadal = sess.isBadal || sess.type === 'badal';
                      return (
                        <div
                          key={sess.id || idx}
                          className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs ${
                            isBadal
                              ? 'bg-amber-50/70 border-amber-200/80'
                              : 'bg-emerald-50/60 border-emerald-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <CheckCircle2
                              className={`w-4 h-4 flex-shrink-0 ${
                                isBadal ? 'text-amber-600' : 'text-emerald-600'
                              }`}
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-extrabold text-slate-800 leading-tight">
                                  {sess.level} • {sess.className} • {sess.subject}
                                </p>
                                {isBadal && (
                                  <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 border border-amber-300">
                                    Badal
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>
                                  {sess.day ? `${sess.day}, ` : ''}{sess.time || ''} ({sess.date})
                                  {sess.notes ? ` • ${sess.notes}` : ''}
                                </span>
                              </p>
                            </div>
                          </div>
                          <span
                            className={`font-bold text-xs flex-shrink-0 ${
                              isBadal ? 'text-amber-700 font-black' : 'text-emerald-700'
                            }`}
                          >
                            +{formatRupiah(isBadal ? ratePerBadalSession : ratePerSession)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-600 font-medium">
                      Belum ada sesi mengajar yang tercatat untuk periode {selectedPeriod}.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                      Klaim sesi mengajar pada jadwal harian untuk menambahkan honor otomatis ke slip gaji.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* BREAKDOWN 2: Total Transport (Daily Transport Allowance) */}
            <div className="bg-white rounded-3xl p-4 shadow-soft-sm border border-emerald-200/80">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                    <Bus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      2. Total Uang Transport Harian
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      1-2 sesi: Rp 17.000/hari • &gt;2 sesi: Rp 25.000/hari ({selectedPeriod})
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-700">
                  +{formatRupiah(totalTransport)}
                </span>
              </div>

              {/* Grouped by date list */}
              <div className="mt-3 space-y-2">
                {transportData?.dailyBreakdown && transportData.dailyBreakdown.length > 0 ? (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {transportData.dailyBreakdown.map((dayGroup, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl bg-teal-50/50 border border-teal-100/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-xl bg-white border border-teal-200 text-teal-700 flex items-center justify-center shadow-2xs font-bold text-[11px]">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 leading-tight">
                              {dayGroup.day ? `${dayGroup.day}, ` : ''}{dayGroup.date}
                            </p>
                            <p className="text-[10px] text-teal-700 font-medium mt-0.5">
                              {dayGroup.sessionCount} Sesi Mengajar ({dayGroup.tier})
                            </p>
                          </div>
                        </div>

                        <span className="font-black text-teal-800 text-xs px-2.5 py-1 rounded-xl bg-teal-100/80 border border-teal-200 flex-shrink-0">
                          +{formatRupiah(dayGroup.allowance)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-500">
                      Uang transport dihitung otomatis per hari berdasarkan sesi mengajar periode {selectedPeriod}.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* BREAKDOWN 3: Total Tunjangan Jabatan */}
            <div className="bg-white rounded-3xl p-4 shadow-soft-sm border border-emerald-200/80">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      3. Total Tunjangan Jabatan
                    </h4>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {activeJabatanList.length} Peran Aktif Terpilih
                    </p>
                  </div>
                </div>
                <span className="text-sm font-black text-emerald-700">
                  +{formatRupiah(totalTunjanganJabatan)}
                </span>
              </div>

              {/* Itemized List of Active Positions */}
              <div className="mt-3 space-y-2">
                {jabatanAllowancesList.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-slate-50/80 hover:bg-emerald-50/40 border border-slate-200/70 transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-xl bg-white border border-slate-200/80 text-emerald-700 flex items-center justify-center shadow-2xs">
                        <Award className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 leading-tight">
                          {item.role}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {item.role === 'Wk Kurikulum MTS' && 'Tunjangan Wakil Kurikulum MTs'}
                          {item.role === 'Wk Kurikulum SMAT' && 'Tunjangan Wakil Kurikulum SMA Terpadu'}
                          {item.role === 'WK Kesiswaan MTs' && 'Tunjangan Wakil Kesiswaan MTs'}
                          {item.role === 'Wk Kesiswaan SMAT' && 'Tunjangan Wakil Kesiswaan SMA Terpadu'}
                          {item.role === 'Wali Kelas' && 'Tunjangan Pengelolaan Wali Kelas'}
                          {item.role === 'Oprator' && 'Tunjangan Pengelolaan Data & Sistem'}
                          {item.role === 'Kepala Sekolah' && 'Pimpinan Utama (Standar)'}
                          {item.role === 'Wakil Kepsek' && 'Manajerial (Standar)'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                          item.amount > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.amount > 0 ? `+${formatRupiah(item.amount)}` : 'Rp 0'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* BREAKDOWN 4: Grand Total Calculation Formula Summary */}
            <div className="bg-white rounded-3xl p-4 shadow-soft-sm border border-slate-200/80">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-600" />
                  Ringkasan Grand Total Gaji ({selectedPeriod})
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  Rumus Baku
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>
                    1. Honor Sesi ({totalRegularSessions} Sesi)
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatRupiah(totalHonorSesi)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>
                    Honor Badal ({totalBadalSessions} Sesi)
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatRupiah(totalHonorBadal)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>
                    2. Uang Transport ({transportData.activeDaysCount} Hari)
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatRupiah(totalTransport)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-600">
                  <span>
                    3. Tunjangan Jabatan
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatRupiah(totalTunjanganJabatan)}
                  </span>
                </div>

                <div className="pt-2.5 mt-2 border-t-2 border-dashed border-slate-200 flex justify-between items-center bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100">
                  <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                    TOTAL DITERIMA
                  </span>
                  <span className="text-lg sm:text-xl font-black text-emerald-700">
                    {formatRupiah(grandTotalSalary)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Unduh Slip ({selectedPeriod})</span>
            </button>
            <button
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Official Print View Modal */}
      {isPrintModalOpen && (
        <PrintSlipModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          slip={{
            ...(activeSlip || {}),
            period: selectedPeriod,
            status: activeSlip?.status || (isCurrentMonthActive ? 'Sedang Berjalan' : 'Sudah Terbit'),
            teacherName: resolvedProfile?.name || activeSlip?.teacherName || teacherName,
            teacherPhone: resolvedProfile?.phone || activeSlip?.teacherPhone || cleanPhone,
            teachingHoursBonus: totalMengajar,
            totalHonorSesi,
            totalHonorBadal,
            totalRegularSessions,
            totalBadalSessions,
            teachingSessionsList: teacherSessions,
            totalSessionsCount: totalCheckedSessions,
            transportData,
            totalTransport,
            activeJabatanList,
            jabatanAllowancesList,
            totalTunjanganJabatan,
            grandTotalSalary,
          }}
        />
      )}
    </>
  );
}
