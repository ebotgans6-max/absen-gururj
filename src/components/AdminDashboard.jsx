import React, { useState } from 'react';
import {
  Users,
  CalendarCheck,
  Calendar,
  Wallet,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  LogOut,
  Edit3,
  Printer,
  ChevronRight,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Plus,
  HeartPulse,
  FileText,
  HelpCircle,
  Download,
  BookOpen,
  ArrowRight,
  Eye,
  GraduationCap,
  KeyRound,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  getTodayDateString,
  normalizePhone,
  getJabatanAllowance,
  calculateDailyTransport,
  RATE_PER_SESSION,
  RATE_PER_BADAL_SESSION,
  AVAILABLE_JABATAN,
} from '../data/initialData';
import PrintSlipModal, { formatRupiah } from './PrintSlipModal';
import SalaryEditModal from './SalaryEditModal';
import ScheduleModal from './ScheduleModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export default function AdminDashboard() {
  const {
    currentUser,
    logout,
    teachers,
    registeredUsers,
    attendance,
    salarySlips,
    completedSessions = [],
    adminMarkAttendance,
    adminResetPassword,
    resetAllData,
    showToast,
  } = useApp();

  // Navigation Menu: 3 Main Sections per Requirement 21
  // 'attendance' (Rekap Absensi) | 'payroll' (Rekap Gaji) | 'detail' (Detail Guru & Mengajar)
  const [activeTab, setActiveTab] = useState('attendance');

  // Filter States
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [selectedMonth, setSelectedMonth] = useState('September 2026');
  const [attendanceViewMode, setAttendanceViewMode] = useState('date'); // 'date' | 'month'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'hadir' | 'sakit' | 'izin' | 'lainnya' | 'belum'

  // Selected Teacher for Section 3: "Detail Guru & Mengajar"
  const [selectedTeacherForDetail, setSelectedTeacherForDetail] = useState(teachers?.[0] || null);

  // Modals state
  const [selectedSlipForPrint, setSelectedSlipForPrint] = useState(null);
  const [selectedSlipForEdit, setSelectedSlipForEdit] = useState(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Requirement 41: Confirmation Dialog state for Admin Password Reset
  const [resetTargetTeacher, setResetTargetTeacher] = useState(null);

  const handleConfirmResetPassword = () => {
    if (!resetTargetTeacher) return;
    if (resetTargetTeacher?.phone) adminResetPassword(resetTargetTeacher.phone);
    setResetTargetTeacher(null);
  };

  const availableMonths = [
    'September 2026',
    'Agustus 2026',
    'Juli 2026',
    'Juni 2026',
    'Mei 2026',
  ];

  // ==============================================================
  // 1. REKAP ABSENSI (GLOBAL ATTENDANCE) COMPUTATIONS
  // ==============================================================
  const attendanceForSelectedDate = (attendance || []).filter((a) => a && a.date === selectedDate);

  const teacherAttendanceStatusList = (teachers || []).map((t) => {
    if (!t) return null;
    const record = attendanceForSelectedDate.find((a) => {
      if (!a) return false;
      if (a.teacherPhone && t.phone && normalizePhone(a.teacherPhone) === normalizePhone(t.phone)) return true;
      if (a.teacherName && t.name && a.teacherName.toLowerCase() === t.name.toLowerCase()) return true;
      return false;
    });

    const attStatus = record?.attendanceStatus || (record ? record.status : 'Belum Presensi');

    return {
      teacher: t,
      hasAttended: !!record,
      date: selectedDate,
      time: record?.time || '-',
      status: attStatus,
      note: record?.note || '-',
      record: record || null,
    };
  }).filter(Boolean);

  // Filtered by status and search query
  const filteredAttendanceList = teacherAttendanceStatusList.filter((item) => {
    if (!item || !item.teacher) return false;
    const query = (searchQuery || '').toLowerCase();
    const teacherName = (item.teacher?.name || '').toLowerCase();
    const teacherPhone = item.teacher?.phone || '';
    const note = (item.note || '').toLowerCase();
    const matchesSearch =
      teacherName.includes(query) ||
      teacherPhone.includes(query) ||
      note.includes(query);
    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'hadir') return item.status === 'Hadir';
    if (statusFilter === 'sakit') return item.status === 'Sakit';
    if (statusFilter === 'izin') return item.status === 'Izin';
    if (statusFilter === 'lainnya') return item.status === 'Lainnya';
    if (statusFilter === 'belum') return item.status === 'Belum Presensi' || !item.hasAttended;
    return true;
  });

  const hadirCount = teacherAttendanceStatusList.filter((i) => i.status === 'Hadir').length;
  const sakitCount = teacherAttendanceStatusList.filter((i) => i.status === 'Sakit').length;
  const izinCount = teacherAttendanceStatusList.filter((i) => i.status === 'Izin').length;
  const lainnyaCount = teacherAttendanceStatusList.filter((i) => i.status === 'Lainnya').length;
  const belumCount = teacherAttendanceStatusList.filter((i) => i.status === 'Belum Presensi' || !i.hasAttended).length;

  // ==============================================================
  // 2. REKAP GAJI (GLOBAL PAYROLL) COMPUTATIONS
  // ==============================================================
  const payrollDataList = (teachers || []).map((teacher) => {
    if (!teacher) return null;
    // 1. Filter completed sessions for this teacher in selected month
    const teacherSessions = (completedSessions || []).filter((s) => {
      if (!s) return false;
      const matchPhone = normalizePhone(s.teacherPhone) === normalizePhone(teacher.phone);
      const matchName = s.teacherName && teacher.name && s.teacherName.toLowerCase() === teacher.name.toLowerCase();
      const matchPeriod = !s.period || !selectedMonth || s.period === selectedMonth;
      return (matchPhone || matchName) && matchPeriod;
    });

    const sessionsCount = teacherSessions.length;
    const regularSessions = teacherSessions.filter((s) => !s?.isBadal && s?.type !== 'badal');
    const badalSessions = teacherSessions.filter((s) => s?.isBadal || s?.type === 'badal');
    const sessionEarnings =
      regularSessions.length * (RATE_PER_SESSION || 7500) +
      badalSessions.length * (RATE_PER_BADAL_SESSION || 3000);

    // 2. Uang Transport (calculated dynamically per day)
    const transportData = calculateDailyTransport ? calculateDailyTransport(teacherSessions) : { totalTransport: 0, dailyBreakdown: [] };
    const totalTransport = transportData?.totalTransport || 0;

    // 3. Tunjangan Jabatan
    const activeJabatanList = Array.isArray(teacher.jabatan) && teacher.jabatan.length > 0
      ? teacher.jabatan
      : typeof teacher.jabatan === 'string'
      ? [teacher.jabatan]
      : ['Wali Kelas'];
    const totalTunjanganJabatan = activeJabatanList.reduce((sum, j) => sum + (getJabatanAllowance ? getJabatanAllowance(j) : 0), 0);

    // 4. Grand Total
    const grandTotal = sessionEarnings + totalTransport + totalTunjanganJabatan;

    return {
      teacher,
      name: teacher.name || 'Guru',
      phone: teacher.phone || '-',
      activeJabatanList,
      sessionsCount,
      regularSessionsCount: regularSessions.length,
      badalSessionsCount: badalSessions.length,
      sessionEarnings,
      transportData,
      totalTransport,
      totalTunjanganJabatan,
      grandTotal,
      teacherSessions,
    };
  }).filter(Boolean);

  const totalPayrollBudget = payrollDataList.reduce((acc, curr) => acc + curr.grandTotal, 0);
  const totalSchoolSessions = payrollDataList.reduce((acc, curr) => acc + curr.sessionsCount, 0);
  const totalSchoolTransport = payrollDataList.reduce((acc, curr) => acc + curr.totalTransport, 0);

  // Export Rekap Gaji ke PDF (Requirement 36 & 45: Android Capacitor Support)
  const exportRekapGajiPDF = async () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Title & Header Information
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(22, 101, 52); // Brand Emerald (#166534)
      doc.text('Rekapitulasi Gaji Guru - MTs Riyadlul Jannah', 14, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // Slate 600
      doc.text(`Periode: ${selectedMonth} | Total Guru: ${payrollDataList.length} Orang`, 14, 22);

      const printDateStr = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      doc.text(`Dicetak pada: ${printDateStr}`, 283, 22, { align: 'right' });

      // Table Headers
      // Table Headers (Requirement 37)
      const tableHeaders = [
        [
          'No',
          'Nama Guru',
          'Jabatan',
          'Sesi Reguler',
          'Sesi Badal',
          'Transport',
          'Tunjangan',
          'Grand Total',
        ],
      ];

      // Table Body
      const tableData = payrollDataList.map((item, idx) => {
        const jabatanStr = Array.isArray(item.activeJabatanList)
          ? item.activeJabatanList.join(', ')
          : (item.activeJabatanList || '-');

        return [
          idx + 1,
          item.name || '-',
          jabatanStr,
          `${item.regularSessionsCount ?? 0} Sesi`,
          `${item.badalSessionsCount ?? 0} Sesi`,
          `${formatRupiah(item.totalTransport ?? 0)} (${item.transportData?.activeDaysCount ?? 0} Hari)`,
          formatRupiah(item.totalTunjanganJabatan ?? 0),
          formatRupiah(item.grandTotal ?? 0),
        ];
      });

      // Table Summary Footer
      const totalRegularSessionsAll = payrollDataList.reduce((sum, item) => sum + (item.regularSessionsCount || 0), 0);
      const totalBadalSessionsAll = payrollDataList.reduce((sum, item) => sum + (item.badalSessionsCount || 0), 0);
      const totalJabatanAllowanceAll = payrollDataList.reduce((sum, item) => sum + (item.totalTunjanganJabatan || 0), 0);

      const tableFoot = [
        [
          { content: 'TOTAL KESELURUHAN', colSpan: 3, styles: { halign: 'center', fontStyle: 'bold' } },
          { content: `${totalRegularSessionsAll} Sesi`, styles: { halign: 'center', fontStyle: 'bold' } },
          { content: `${totalBadalSessionsAll} Sesi`, styles: { halign: 'center', fontStyle: 'bold' } },
          { content: formatRupiah(totalSchoolTransport), styles: { halign: 'center', fontStyle: 'bold' } },
          { content: formatRupiah(totalJabatanAllowanceAll), styles: { halign: 'right', fontStyle: 'bold' } },
          { content: formatRupiah(totalPayrollBudget), styles: { halign: 'right', fontStyle: 'bold' } },
        ],
      ];

      autoTable(doc, {
        head: tableHeaders,
        body: tableData,
        foot: tableFoot,
        startY: 26,
        theme: 'grid',
        styles: {
          font: 'helvetica',
          fontSize: 8.5,
          cellPadding: 2.8,
          textColor: [30, 41, 59], // Slate 800
          lineColor: [226, 232, 240], // Slate 200
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [22, 101, 52], // Emerald 800
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9,
        },
        footStyles: {
          fillColor: [236, 253, 245], // Emerald 50
          textColor: [6, 78, 59], // Emerald 900
          fontStyle: 'bold',
          fontSize: 9,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Slate 50
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 46, fontStyle: 'bold' },
          2: { cellWidth: 44 },
          3: { cellWidth: 26, halign: 'center' },
          4: { cellWidth: 24, halign: 'center' },
          5: { cellWidth: 28, halign: 'center' },
          6: { cellWidth: 40, halign: 'right' },
          7: { cellWidth: 48, halign: 'right', fontStyle: 'bold', textColor: [22, 101, 52] },
        },
        didDrawPage: (data) => {
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184); // Slate 400
          doc.text(
            `Dokumen Resmi Sistem Penggajian Guru RJ • Halaman ${data.pageNumber} dari ${doc.internal.getNumberOfPages()}`,
            14,
            202
          );
        },
      });

      const fileName = `Rekapitulasi_Gaji_Guru_RJ_${selectedMonth.replace(/\s+/g, '_')}.pdf`;
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // Requirement 45: Android Device (Capacitor) Filesystem & Share Support
      if (Capacitor.isNativePlatform() || (Capacitor.isPluginAvailable('Filesystem') && Capacitor.getPlatform() !== 'web')) {
        // 1. Write Base64 string to device Cache directory as .pdf file
        const writeResult = await Filesystem.writeFile({
          path: fileName,
          data: pdfBase64,
          directory: Directory.Cache,
        });

        // 2. Trigger native Android share sheet with file's URI
        await Share.share({
          title: 'Rekapitulasi Gaji Guru RJ',
          text: `Dokumen Rekapitulasi Gaji Guru MTs Riyadlul Jannah Periode ${selectedMonth}`,
          url: writeResult.uri,
          dialogTitle: 'Simpan atau Bagikan Rekap Gaji (PDF)',
        });

        showToast(
          `Dokumen PDF Rekap Gaji (${selectedMonth}) siap dibagikan / disimpan.`,
          'success',
          'PDF Berhasil Dibuat'
        );
      } else {
        // Fallback for regular web browser preview
        doc.save(fileName);
        showToast(
          `Dokumen PDF Rekap Gaji (${selectedMonth}) berhasil diunduh.`,
          'success',
          'PDF Berhasil Dibuat'
        );
      }
    } catch (err) {
      console.error('Error generating/sharing PDF:', err);
      showToast('Gagal memproses dokumen PDF. Silakan coba kembali.', 'error', 'Gagal Ekspor');
    }
  };

  // Helper to open salary slip modal for print (used by both card and table)
  const handleOpenPrintSlip = (item) => {
    const slipDummy = {
      id: `slip-${Date.now()}`,
      teacherName: item.name,
      teacherPhone: item.phone,
      period: selectedMonth,
      status: 'Diterbitkan',
      baseSalary: 0,
      functionalAllowance: item.totalTunjanganJabatan,
      bpjsDeduction: 0,
      coopDeduction: 0,
      taxDeduction: 0,
    };

    setSelectedSlipForPrint({
      ...slipDummy,
      teachingHoursBonus: item.sessionEarnings,
      teachingSessionsList: item.teacherSessions,
      totalSessionsCount: item.sessionsCount,
      transportData: item.transportData,
      totalTransport: item.totalTransport,
      activeJabatanList: item.activeJabatanList,
      jabatanAllowancesList: item.activeJabatanList.map((r) => ({
        role: r,
        amount: getJabatanAllowance(r),
      })),
      totalTunjanganJabatan: item.totalTunjanganJabatan,
      grandTotalSalary: item.grandTotal,
    });
  };

  // ==============================================================
  // 3. DETAIL GURU & MENGAJAR (TEACHING HISTORY LOG) COMPUTATIONS
  // ==============================================================
  const isAllTeachers = selectedTeacherForDetail === 'all';
  const currentDetailTeacher = isAllTeachers
    ? null
    : (selectedTeacherForDetail || (teachers && teachers.length > 0 ? teachers[0] : null));

  const currentTeacherSessions = (completedSessions || []).filter((s) => {
    if (!s) return false;
    const matchPeriod = !s.period || !selectedMonth || s.period === selectedMonth;
    if (!matchPeriod) return false;
    if (isAllTeachers) return true;
    if (!currentDetailTeacher) return false;
    const matchPhone = normalizePhone(s.teacherPhone) === normalizePhone(currentDetailTeacher?.phone);
    const matchName = s.teacherName && currentDetailTeacher?.name && s.teacherName.toLowerCase() === currentDetailTeacher.name.toLowerCase();
    return matchPhone || matchName;
  });

  const detailRegularSessions = currentTeacherSessions.filter((s) => !s?.isBadal && s?.type !== 'badal');
  const detailBadalSessions = currentTeacherSessions.filter((s) => s?.isBadal || s?.type === 'badal');
  const detailSessionEarnings =
    detailRegularSessions.length * (RATE_PER_SESSION || 7500) +
    detailBadalSessions.length * (RATE_PER_BADAL_SESSION || 3000);
  const detailTransportData = calculateDailyTransport ? calculateDailyTransport(currentTeacherSessions) : { totalTransport: 0, dailyBreakdown: [] };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-full pb-10">
      {/* 1. Official Header */}
      <div className="bg-gradient-to-b from-brand-900 via-brand-800 to-emerald-800 text-white p-4 sm:p-6 pt-6 rounded-b-[32px] shadow-soft-lg border-b-2 border-emerald-400 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 relative z-10">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
              Dashboard Manajemen & Admin
            </h1>
            <p className="text-xs text-emerald-100/90 font-medium mt-1 truncate">
              Pengelola: <strong>{currentUser?.name || 'Administrator RJ'}</strong> ({currentUser?.phone || '-'})
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportRekapGajiPDF}
              title="Export Rekap Gaji ke Dokumen PDF"
              className="h-9 px-3 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 active:scale-95 border border-emerald-300/40 flex items-center gap-1.5 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-200" />
              <span>Export Rekap Gaji (PDF)</span>
            </button>
            <button
              onClick={() => setIsScheduleOpen(true)}
              title="Lihat Master Jadwal"
              className="h-9 px-3 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center gap-1.5 text-white text-xs font-bold transition cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-200" />
              <span>Jadwal</span>
            </button>
            <button
              onClick={logout}
              title="Keluar dari akun admin"
              className="w-9 h-9 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/20 flex items-center justify-center text-white transition cursor-pointer flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Summary Stats - Requirement 22: Only TOTAL GURU and HADIR HARI INI */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center">
            <p className="text-[10px] text-emerald-200 uppercase font-semibold">Total Guru</p>
            <p className="text-xl font-black text-white">{teachers.length}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-center">
            <p className="text-[10px] text-emerald-200 uppercase font-semibold">Hadir Hari Ini</p>
            <p className="text-xl font-black text-emerald-300">{hadirCount}</p>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Menu (3 Main Sections per Requirement 21) */}
      <div className="p-4 sm:p-5 -mt-3 space-y-4">
        <div className="bg-white rounded-2xl p-1.5 shadow-soft-sm border border-slate-200 flex gap-1">
          {/* TAB 1: Rekap Absensi */}
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'attendance'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Rekap Absensi</span>
          </button>

          {/* TAB 2: Rekap Gaji */}
          <button
            type="button"
            onClick={() => setActiveTab('payroll')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'payroll'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Rekap Gaji</span>
          </button>

          {/* TAB 3: Detail Guru & Mengajar */}
          <button
            type="button"
            onClick={() => setActiveTab('detail')}
            className={`flex-1 py-2.5 px-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'detail'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Data & Detail Guru</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* SECTION 1: REKAP ABSENSI (GLOBAL ATTENDANCE)                   */}
        {/* ============================================================== */}
        {activeTab === 'attendance' && (
          <div className="space-y-3.5">
            {/* Filter Card */}
            <div className="bg-white rounded-2xl p-4 shadow-soft-sm border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    Rekap Presensi Guru Seluruh Sekolah
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Daftar absensi harian seluruh GTK dengan status & alasan
                  </p>
                </div>

                {/* Date Picker Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">Filter Tanggal:</span>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-brand-500 outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Status Badges Filter */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({teacherAttendanceStatusList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('hadir')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    statusFilter === 'hadir'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Hadir ({hadirCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('sakit')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    statusFilter === 'sakit'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  <HeartPulse className="w-3 h-3" />
                  <span>Sakit ({sakitCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('izin')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    statusFilter === 'izin'
                      ? 'bg-sky-600 text-white'
                      : 'bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span>Izin ({izinCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('lainnya')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                    statusFilter === 'lainnya'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-800 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Lainnya ({lainnyaCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('belum')}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                    statusFilter === 'belum'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Belum Absen ({belumCount})
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white rounded-2xl shadow-soft-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-3 px-3.5">Nama Guru</th>
                      <th className="py-3 px-3">Tanggal</th>
                      <th className="py-3 px-3">Jam Masuk</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3.5">Keterangan</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredAttendanceList.length > 0 ? (
                      filteredAttendanceList.map((item, idx) => {
                        const isHadir = item.status === 'Hadir';
                        const isSakit = item.status === 'Sakit';
                        const isIzin = item.status === 'Izin';
                        const isLainnya = item.status === 'Lainnya';
                        const isBelum = item.status === 'Belum Presensi' || !item.hasAttended;

                        return (
                          <tr key={item.teacher?.phone || item.teacher?.name || idx} className="hover:bg-slate-50/80 transition">
                            {/* Column 1: Nama Guru & Reset Password Button */}
                            <td className="py-3 px-3.5">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedTeacherForDetail(item.teacher);
                                      setActiveTab('detail');
                                    }}
                                    className="font-bold text-slate-900 hover:text-brand-600 text-left hover:underline block leading-tight cursor-pointer"
                                  >
                                    {item.teacher?.name || 'Guru'}
                                  </button>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    📱 {item.teacher?.phone || '-'}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setResetTargetTeacher(item.teacher)}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-2xs flex-shrink-0"
                                  title={`Reset password ${item.teacher?.name || 'Guru'} ke default (guru123)`}
                                >
                                  <KeyRound className="w-3 h-3 text-amber-600" />
                                  <span className="hidden sm:inline">Reset Password</span>
                                </button>
                              </div>
                            </td>

                            {/* Column 2: Tanggal */}
                            <td className="py-3 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                              {item.date}
                            </td>

                            {/* Column 3: Jam Masuk */}
                            <td className="py-3 px-3 text-slate-700 font-mono text-xs whitespace-nowrap">
                              {item.time !== '-' ? (
                                <span className="inline-flex items-center gap-1 font-bold text-brand-700">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {item.time} WIB
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* Column 4: Status (Hadir/Sakit/Izin/Lainnya) */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                  isHadir
                                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                    : isSakit
                                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                                    : isIzin
                                    ? 'bg-sky-100 text-sky-900 border-sky-300'
                                    : isLainnya
                                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                              >
                                {isHadir && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                {isSakit && <HeartPulse className="w-3 h-3 text-amber-600" />}
                                {isIzin && <FileText className="w-3 h-3 text-sky-600" />}
                                {isLainnya && <HelpCircle className="w-3 h-3 text-purple-600" />}
                                {isBelum && <AlertCircle className="w-3 h-3 text-slate-400" />}
                                <span>{item.status}</span>
                              </span>
                            </td>

                            {/* Column 5: Keterangan */}
                            <td className="py-3 px-3.5 max-w-xs text-slate-600 text-xs">
                              {item.note !== '-' ? (
                                <span className="italic font-medium text-slate-800 block">
                                  "{item.note}"
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>

                            {/* Column 6: Action */}
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTeacherForDetail(item.teacher);
                                  setActiveTab('detail');
                                }}
                                className="text-[11px] font-bold text-brand-700 hover:text-brand-800 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Detail</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-xs text-slate-400">
                          Tidak ada catatan absensi yang sesuai filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 2: REKAP GAJI (GLOBAL PAYROLL)                         */}
        {/* ============================================================== */}
        {activeTab === 'payroll' && (
          <div className="space-y-3">
            {/* Filter and Export Action Bar (Requirement 43: Simple, Clean, Modern Header) */}
            <div className="bg-white rounded-2xl p-3.5 sm:p-4 shadow-soft-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="font-black text-sm sm:text-base text-slate-800">
                Rekap Gaji
              </h3>

              <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                {/* Month/Year Filter */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="flex-1 sm:flex-initial sm:w-auto px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-500 outline-none cursor-pointer"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>

                {/* Export PDF Button (Requirement 43) */}
                <button
                  type="button"
                  onClick={exportRekapGajiPDF}
                  className="flex-1 sm:flex-initial sm:w-auto justify-center px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 cursor-pointer whitespace-nowrap"
                  title="Unduh Rekap Gaji Bulanan ke Dokumen PDF"
                >
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* School Payroll Budget Card (Requirement 43: Simplified Label) */}
            <div className="bg-gradient-to-r from-emerald-800 via-brand-850 to-slate-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-soft-sm">
              <div className="flex items-center justify-between text-xs text-emerald-200">
                <span className="font-bold text-xs sm:text-sm">Total Gaji Bulan Ini</span>
                <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold">
                  {payrollDataList.length} Guru Aktif
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                {formatRupiah(totalPayrollBudget)}
              </h2>
              <div className="grid grid-cols-2 gap-2 mt-2.5 pt-2.5 border-t border-white/10 text-xs">
                <div>
                  <span className="text-[10px] text-emerald-200/80 block">Total Sesi Diajar:</span>
                  <span className="font-extrabold text-white text-xs">{totalSchoolSessions} Sesi (@ Rp 7.500)</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-200/80 block">Total Uang Transport:</span>
                  <span className="font-extrabold text-emerald-300 text-xs">{formatRupiah(totalSchoolTransport)}</span>
                </div>
              </div>
            </div>

            {/* Requirement 42: Mobile-Friendly "Card" Layout for Each Teacher (< md screens) */}
            <div className="md:hidden space-y-3">
              {payrollDataList.length > 0 ? (
                payrollDataList.map((item) => (
                  <div
                    key={`card-${item?.phone || item?.name}`}
                    className="bg-white rounded-2xl p-3.5 shadow-soft-sm border border-slate-200/90 space-y-3"
                  >
                    {/* Card Header: Teacher Info & Reset Password Button */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeacherForDetail(item?.teacher);
                            setActiveTab('detail');
                          }}
                          className="font-black text-xs text-slate-900 hover:text-brand-600 text-left truncate block leading-tight cursor-pointer"
                        >
                          {item?.name || 'Guru'}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          📱 {item?.phone || '-'}
                        </span>
                        {/* Jabatan Badges */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(item?.activeJabatanList || []).map((j) => (
                            <span
                              key={j}
                              className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-semibold"
                            >
                              {j}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setResetTargetTeacher(item?.teacher || { name: item?.name, phone: item?.phone })}
                        className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-2xs flex-shrink-0"
                        title={`Reset password ${item?.name || 'Guru'} ke default "guru123"`}
                      >
                        <KeyRound className="w-3 h-3 text-amber-600" />
                        <span>Reset PW</span>
                      </button>
                    </div>

                    {/* Card Body: Stacked Breakdown of Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Stat 1: Jam Mengajar */}
                      <div className="p-2.5 rounded-xl bg-brand-50/70 border border-brand-100/80">
                        <span className="text-[10px] text-brand-700 font-bold block">
                          Honor Mengajar
                        </span>
                        <span className="text-xs font-black text-brand-950 block mt-0.5">
                          {formatRupiah(item.sessionEarnings)}
                        </span>
                        <span className="text-[9px] text-brand-600 block mt-0.5 leading-tight">
                          {item.sessionsCount} Jam ({item.regularSessionsCount} Reguler, {item.badalSessionsCount} Badal)
                        </span>
                      </div>

                      {/* Stat 2: Uang Transport */}
                      <div className="p-2.5 rounded-xl bg-teal-50/70 border border-teal-100/80">
                        <span className="text-[10px] text-teal-700 font-bold block">
                          Uang Transport
                        </span>
                        <span className="text-xs font-black text-teal-900 block mt-0.5">
                          {formatRupiah(item.totalTransport)}
                        </span>
                        <span className="text-[9px] text-teal-600 block mt-0.5 leading-tight">
                          {item.transportData.activeDaysCount} Hari Kehadiran
                        </span>
                      </div>

                      {/* Stat 3: Tunjangan Jabatan */}
                      <div className="col-span-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold block">
                            Tunjangan Jabatan
                          </span>
                          <span className="text-xs font-extrabold text-slate-800 block mt-0.5">
                            {formatRupiah(item.totalTunjanganJabatan)}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-medium max-w-[150px] text-right truncate">
                          {item.activeJabatanList.join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* Card Footer: Grand Total & Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          TOTAL DITERIMA
                        </span>
                        <span className="text-sm font-black text-emerald-700">
                          {formatRupiah(item.grandTotal)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPrintSlip(item)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                          title="Cetak Slip Gaji Guru Ini"
                        >
                          <Printer className="w-3.5 h-3.5 text-brand-700" />
                          <span>Slip</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeacherForDetail(item.teacher);
                            setActiveTab('detail');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-bold inline-flex items-center gap-1 cursor-pointer transition"
                        >
                          <span>Detail</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white rounded-2xl p-6 text-center text-xs text-slate-400 border border-slate-200">
                  Belum ada data guru terdaftar untuk rekap gaji.
                </div>
              )}
            </div>

            {/* Desktop View: Global Payroll Table (>= md screens) */}
            <div className="hidden md:block bg-white rounded-2xl shadow-soft-sm border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-3 px-3.5">Nama Guru</th>
                      <th className="py-3 px-3">Total Jam Mengajar</th>
                      <th className="py-3 px-3">Uang Transport</th>
                      <th className="py-3 px-3">Tunjangan Jabatan</th>
                      <th className="py-3 px-3.5 text-right">Grand Total</th>
                      <th className="py-3 px-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {payrollDataList.length > 0 ? (
                      payrollDataList.map((item) => (
                      <tr key={item?.phone || item?.name} className="hover:bg-slate-50/80 transition">
                        {/* Column 1: Nama Guru & Reset Password Button */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedTeacherForDetail(item?.teacher);
                                  setActiveTab('detail');
                                }}
                                className="font-bold text-slate-900 hover:text-brand-600 text-left hover:underline block leading-tight cursor-pointer"
                              >
                                {item?.name || 'Guru'}
                              </button>
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                📱 {item?.phone || '-'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setResetTargetTeacher(item?.teacher || { name: item?.name, phone: item?.phone })}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer shadow-2xs flex-shrink-0"
                              title={`Reset password ${item?.name || 'Guru'} ke default (guru123)`}
                            >
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span className="hidden sm:inline">Reset Password</span>
                            </button>
                          </div>
                        </td>

                        {/* Column 2: Total Jam Mengajar */}
                        <td className="py-3 px-3">
                          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-xl shadow-2xs">
                            <Clock className="w-4 h-4 text-brand-600 flex-shrink-0" />
                            <div>
                              <span className="font-black text-brand-950 text-xs block leading-tight">
                                {item.sessionsCount} Jam Mengajar
                              </span>
                              <span className="text-[10px] text-brand-700 font-semibold block mt-0.5">
                                {item.sessionsCount} Sesi • {formatRupiah(item.sessionEarnings)}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Column 3: Uang Transport */}
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-teal-700">
                            {formatRupiah(item.totalTransport)}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {item.transportData.activeDaysCount} hari aktif
                          </span>
                        </td>

                        {/* Column 4: Tunjangan Jabatan */}
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-brand-700">
                            {formatRupiah(item.totalTunjanganJabatan)}
                          </span>
                          <span className="text-[9px] text-slate-400 block truncate max-w-[120px]">
                            {item.activeJabatanList.join(', ')}
                          </span>
                        </td>

                        {/* Column 5: Grand Total */}
                        <td className="py-3 px-3.5 text-right font-black text-slate-900 text-sm">
                          {formatRupiah(item.grandTotal)}
                        </td>

                        {/* Column 6: Action */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleOpenPrintSlip(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                            title="Cetak Slip Gaji Guru Ini"
                          >
                            <Printer className="w-3.5 h-3.5 text-brand-700" />
                          </button>
                        </td>
                      </tr>
                    ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-xs text-slate-400">
                          <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="font-bold text-slate-600">Belum Ada Data Guru Terdaftar</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Rekapitulasi gaji akan muncul otomatis setelah akun guru didaftarkan.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION 3: DETAIL GURU & MENGAJAR (TEACHING HISTORY LOG)       */}
        {/* ============================================================== */}
        {activeTab === 'detail' && (
          <div className="space-y-3.5">
            {/* Teacher Selection Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-soft-sm border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm text-slate-800">
                  Log Riwayat Mengajar Terperinci
                </h3>
                <p className="text-[11px] text-slate-500">
                  Daftar seluruh sesi mengajar yang telah diceklis & diklaim oleh guru
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Select Teacher Dropdown */}
                <select
                  value={isAllTeachers ? 'all' : (currentDetailTeacher?.phone || '')}
                  onChange={(e) => {
                    if (e.target.value === 'all') {
                      setSelectedTeacherForDetail('all');
                    } else {
                      const found = (teachers || []).find((t) => t?.phone === e.target.value);
                      if (found) setSelectedTeacherForDetail(found);
                    }
                  }}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-500 outline-none cursor-pointer max-w-[200px]"
                >
                  <option value="all">👥 Semua Guru</option>
                  {teachers && teachers.length > 0 ? (
                    teachers.map((t) => (
                      <option key={t?.phone || t?.name} value={t?.phone}>
                        {t?.name || 'Guru'}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>(Belum Ada Guru)</option>
                  )}
                </select>

                {/* Period Selector */}
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-brand-500 outline-none cursor-pointer"
                >
                  {availableMonths.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Teacher Profile Overview Card */}
            {isAllTeachers ? (
              <div className="bg-white rounded-2xl p-4 shadow-soft-sm border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-700 via-brand-600 to-emerald-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-base text-slate-800">
                        Semua Guru (Rekap Log Kolektif)
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Menampilkan seluruh sesi mengajar GTK • Periode {selectedMonth}
                      </p>
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                          {(teachers || []).length} Guru Terdaftar
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                          Log Gabungan Seluruh GTK
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activity Stats for the Month with Prominent Total Jam Mengajar Indicator */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                  <div className="p-2.5 bg-brand-50/90 border border-brand-200 rounded-xl">
                    <span className="text-[10px] text-brand-700 font-bold uppercase tracking-wider block">
                      Total Jam Mengajar
                    </span>
                    <span className="text-lg font-black text-brand-900 inline-flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-brand-600" />
                      {currentTeacherSessions.length} Jam
                    </span>
                    <span className="text-[10px] text-brand-600 font-semibold block">
                      ({currentTeacherSessions.length} Sesi Terklaim)
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Total Honor Mengajar
                    </span>
                    <span className="text-base font-black text-slate-800 mt-1 block">
                      {formatRupiah(detailSessionEarnings)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Reguler + Badal
                    </span>
                  </div>
                  <div className="p-2.5 bg-teal-50/80 border border-teal-200/80 rounded-xl">
                    <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block">
                      Total Transport
                    </span>
                    <span className="text-base font-black text-teal-800 mt-1 block">
                      {formatRupiah(detailTransportData.totalTransport)}
                    </span>
                    <span className="text-[10px] text-teal-600 font-semibold block">
                      {detailTransportData.activeDaysCount} hari aktif
                    </span>
                  </div>
                </div>
              </div>
            ) : currentDetailTeacher ? (
              <div className="bg-white rounded-2xl p-4 shadow-soft-sm border border-slate-200 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-emerald-500 text-white flex items-center justify-center font-black text-base shadow-sm">
                      {currentDetailTeacher?.name?.charAt(0) || 'G'}
                    </div>
                    <div>
                      <h4 className="font-black text-base text-slate-800">
                        {currentDetailTeacher?.name || 'Guru'}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        📱 {currentDetailTeacher?.phone || '-'} • NIP: {currentDetailTeacher?.nip || '-'}
                      </p>
                      {/* Active Jabatan Badges */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5">
                        {(Array.isArray(currentDetailTeacher?.jabatan) && currentDetailTeacher?.jabatan?.length > 0
                          ? currentDetailTeacher.jabatan
                          : typeof currentDetailTeacher?.jabatan === 'string'
                          ? [currentDetailTeacher.jabatan]
                          : ['Wali Kelas']
                        ).map((j) => (
                          <span
                            key={j}
                            className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold"
                          >
                            {j}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 text-[10px] font-black">
                      {currentDetailTeacher?.status || 'Pendidik Tetap'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setResetTargetTeacher(currentDetailTeacher)}
                      className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      title={`Reset password ${currentDetailTeacher?.name || 'Guru'} ke default (guru123)`}
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                      <span>Reset Password</span>
                    </button>
                  </div>
                </div>

                {/* Activity Stats for the Month with Prominent Total Jam Mengajar Indicator */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                  <div className="p-2.5 bg-brand-50/90 border border-brand-200 rounded-xl">
                    <span className="text-[10px] text-brand-700 font-bold uppercase tracking-wider block">
                      Total Jam Mengajar
                    </span>
                    <span className="text-lg font-black text-brand-900 inline-flex items-center gap-1 mt-0.5">
                      <Clock className="w-3.5 h-3.5 text-brand-600" />
                      {currentTeacherSessions.length} Jam
                    </span>
                    <span className="text-[10px] text-brand-600 font-semibold block">
                      ({currentTeacherSessions.length} Sesi Terklaim)
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                      Honor Mengajar
                    </span>
                    <span className="text-base font-black text-slate-800 mt-1 block">
                      {formatRupiah(detailSessionEarnings)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      Total Sesi Terklaim × Rp 7.500
                    </span>
                  </div>
                  <div className="p-2.5 bg-teal-50/80 border border-teal-200/80 rounded-xl">
                    <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider block">
                      Uang Transport
                    </span>
                    <span className="text-base font-black text-teal-800 mt-1 block">
                      {formatRupiah(detailTransportData.totalTransport)}
                    </span>
                    <span className="text-[10px] text-teal-600 font-semibold block">
                      {detailTransportData.activeDaysCount} hari aktif
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Teacher Account Management Section (Requirement 41) */}
            <div className="bg-white rounded-2xl shadow-soft-sm border border-slate-200 overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-brand-600" />
                  <h4 className="font-bold text-xs text-slate-800">
                    Manajemen Akun Guru ({(teachers || []).length} Guru Terdaftar)
                  </h4>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">
                  Password Default: <code className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">guru123</code>
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3.5">Nama Guru</th>
                      <th className="py-2.5 px-3">Nomor HP</th>
                      <th className="py-2.5 px-3">Jabatan</th>
                      <th className="py-2.5 px-3.5 text-right">Aksi Akun</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {(teachers || []).length > 0 ? (
                      teachers.map((t) => (
                        <tr key={t?.phone || t?.name} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3.5 font-bold text-slate-800">
                            <button
                              type="button"
                              onClick={() => setSelectedTeacherForDetail(t)}
                              className="hover:text-brand-600 hover:underline text-left cursor-pointer"
                            >
                              {t?.name || 'Guru'}
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                            📱 {t?.phone || '-'}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[11px] text-slate-700 font-medium">
                              {Array.isArray(t?.jabatan) ? t.jabatan.join(', ') : (t?.jabatan || 'Guru Mapel')}
                            </span>
                          </td>
                          <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setResetTargetTeacher(t)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                              title={`Reset password ${t?.name || 'Guru'} ke default "guru123"`}
                            >
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Reset Password</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-6 text-xs text-slate-400">
                          Belum ada data guru terdaftar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {!currentDetailTeacher && !isAllTeachers && (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 shadow-soft-sm">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">Belum Ada Data Guru Terdaftar</h4>
                <p className="text-xs text-slate-500 mt-1">Data guru dan rekap sesi mengajar akan muncul di sini setelah akun GTK didaftarkan.</p>
              </div>
            )}

            {/* Teaching History Log Table (Requirement 21 & 22) */}
            <div className="bg-white rounded-2xl shadow-soft-sm border border-slate-200 overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                  <BookOpen className="w-4 h-4 text-brand-600" />
                  <span>
                    Log Sesi Mengajar Terklaim: <strong>{isAllTeachers ? 'Semua Guru' : (currentDetailTeacher?.name || 'Semua Guru')}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-brand-900 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-full">
                    <Clock className="w-3 h-3 text-brand-600" />
                    <span>Total: {currentTeacherSessions.length} Jam Mengajar ({currentTeacherSessions.length} Sesi)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Real-time
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-extrabold uppercase text-[10px] border-b border-slate-200">
                      <th className="py-3 px-3.5">No</th>
                      {isAllTeachers && <th className="py-3 px-3">Nama Guru</th>}
                      <th className="py-3 px-3">Tanggal (Date)</th>
                      <th className="py-3 px-3">Waktu (Time)</th>
                      <th className="py-3 px-3">Kelas (Class)</th>
                      <th className="py-3 px-3.5">Mata Pelajaran (Subject)</th>
                      <th className="py-3 px-3 text-center">Durasi / Jam</th>
                      <th className="py-3 px-3 text-right">Honor Sesi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {currentTeacherSessions.length > 0 ? (
                      currentTeacherSessions.map((session, index) => (
                        <tr key={session.id || index} className="hover:bg-slate-50/80 transition">
                          {/* No */}
                          <td className="py-3 px-3.5 text-slate-400 font-mono text-[11px]">
                            {index + 1}
                          </td>

                          {/* Nama Guru (jika opsi Semua Guru) */}
                          {isAllTeachers && (
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="font-extrabold text-slate-900 text-xs block">
                                {session.teacherName || 'Guru'}
                              </span>
                              {session.teacherPhone && (
                                <span className="text-[10px] text-slate-400 font-mono block">
                                  📱 {session.teacherPhone}
                                </span>
                              )}
                            </td>
                          )}

                          {/* 1. Tanggal (Date) */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-extrabold text-slate-800 font-mono text-xs">
                              {session.date}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-medium">
                              {session.day || 'Hari Mengajar'}
                            </span>
                          </td>

                          {/* 2. Waktu (Time) */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-bold text-slate-700 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {session.time} WIB
                            </span>
                          </td>

                          {/* 3. Kelas (Class) */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-extrabold text-brand-900 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/80 text-[11px]">
                              {session.className}
                            </span>
                            {session.level && (
                              <span className="text-[10px] text-slate-400 ml-1.5 font-bold">
                                ({session.level})
                              </span>
                            )}
                          </td>

                          {/* 4. Mata Pelajaran (Subject) */}
                          <td className="py-3 px-3.5">
                            <span className="font-bold text-slate-800 block text-xs">
                              {session.subject}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-medium inline-flex items-center gap-1 mt-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              {session.isBadal || session.type === 'badal' ? 'Guru Badal' : 'Tuntas diajar'}
                            </span>
                          </td>

                          {/* 5. Durasi / Jam */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 font-bold text-brand-900 bg-brand-50 border border-brand-200/80 px-2 py-0.5 rounded-md text-[11px]">
                              <Clock className="w-3 h-3 text-brand-600" />
                              <span>1 Jam (1 Sesi)</span>
                            </span>
                          </td>

                          {/* 6. Honor Sesi */}
                          <td className="py-3 px-3 text-right whitespace-nowrap font-extrabold text-slate-800 font-mono">
                            +{formatRupiah(session.rate || RATE_PER_SESSION)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isAllTeachers ? 8 : 7} className="text-center py-10 text-xs text-slate-400">
                          <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <span>
                            {isAllTeachers
                              ? `Belum ada sesi mengajar yang diceklis/diklaim oleh guru manapun untuk periode ${selectedMonth}.`
                              : currentDetailTeacher
                              ? `Belum ada sesi mengajar yang diceklis/diklaim oleh ${currentDetailTeacher?.name || 'guru ini'} untuk periode ${selectedMonth}.`
                              : 'Belum ada data guru terdaftar.'}
                          </span>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Salary Modal */}
      {selectedSlipForEdit && (
        <SalaryEditModal
          isOpen={!!selectedSlipForEdit}
          onClose={() => setSelectedSlipForEdit(null)}
          slip={selectedSlipForEdit}
        />
      )}

      {/* Print Slip Modal */}
      {selectedSlipForPrint && (
        <PrintSlipModal
          isOpen={!!selectedSlipForPrint}
          onClose={() => setSelectedSlipForPrint(null)}
          slip={selectedSlipForPrint}
        />
      )}

      {/* Master Schedule Modal */}
      {isScheduleOpen && (
        <ScheduleModal
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          teacherName="Administrator (Master Jadwal MTS & SMAT)"
        />
      )}

      {/* Confirmation Dialog: Reset Password Modal (Requirement 41) */}
      {resetTargetTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 shadow-xl border border-slate-200 max-w-sm w-full space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
              <KeyRound className="w-6 h-6 text-amber-600" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-800">
                Konfirmasi Reset Password
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin mereset password untuk guru:
              </p>
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200/80 mt-2 text-left">
                <p className="font-extrabold text-xs text-slate-900">
                  {resetTargetTeacher?.name || 'Guru'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  📱 {resetTargetTeacher?.phone || '-'}
                </p>
                <p className="text-[11px] text-amber-800 font-medium mt-1">
                  Password akan di-reset kembali ke: <strong className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-amber-300">guru123</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setResetTargetTeacher(null)}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white font-bold text-xs shadow-sm shadow-amber-600/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Ya, Reset Password</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
