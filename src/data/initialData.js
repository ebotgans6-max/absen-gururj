// Available positions list for validation (Requirement 23)
export const AVAILABLE_JABATAN = [
  'Guru Mapel',
  'Kepala Sekolah',
  'Wakil Kepsek',
  'Wk Kurikulum MTS',
  'Wk Kurikulum SMAT',
  'WK Kesiswaan MTs',
  'Wk Kesiswaan SMAT',
  'Wali Kelas',
  'Operator',
];

// Fixed monthly allowance for specific roles/jabatan
export const JABATAN_ALLOWANCES = {
  'Guru Mapel': 0,
  'Wk Kurikulum MTS': 300000,
  'Wk Kurikulum SMAT': 300000,
  'WK Kesiswaan MTs': 300000,
  'Wk Kesiswaan SMAT': 300000,
  'Wali Kelas': 100000,
  'Walas': 100000,
  'Operator': 300000,
  'Kepala Sekolah': 0,
  'Wakil Kepsek': 0,
};

export const getJabatanAllowance = (roleName) => {
  if (!roleName) return 0;
  if (JABATAN_ALLOWANCES[roleName] !== undefined) {
    return JABATAN_ALLOWANCES[roleName];
  }
  const clean = roleName.trim().toLowerCase();
  if (clean === 'oprator' || clean === 'operator') return 300000;
  if (clean.includes('kurikulum')) return 300000;
  if (clean.includes('kesiswaan')) return 300000;
  if (clean === 'wali kelas' || clean === 'walas') return 100000;
  return 0;
};

// Helper to check if a user or jabatan represents the "Operator" role
export const isOperator = (userOrJabatan) => {
  if (!userOrJabatan) return false;
  if (typeof userOrJabatan === 'object' && !Array.isArray(userOrJabatan)) {
    if (userOrJabatan.role && typeof userOrJabatan.role === 'string') {
      const cleanRole = userOrJabatan.role.trim().toLowerCase();
      if (cleanRole === 'operator' || cleanRole === 'oprator') return true;
    }
    return isOperator(userOrJabatan.jabatan);
  }
  if (Array.isArray(userOrJabatan)) {
    return userOrJabatan.some((j) => {
      if (typeof j !== 'string') return false;
      const clean = j.trim().toLowerCase();
      return clean === 'operator' || clean === 'oprator' || clean.includes('operator') || clean.includes('oprator');
    });
  }
  if (typeof userOrJabatan === 'string') {
    const clean = userOrJabatan.trim().toLowerCase();
    return clean === 'operator' || clean === 'oprator' || clean.includes('operator') || clean.includes('oprator');
  }
  return false;
};

// Helper to sanitize and filter jabatan list: removes typos like "Oprator", normalizes, and deduplicates
export const sanitizeJabatanList = (rawJabatan) => {
  if (!rawJabatan) return ['Wali Kelas'];
  const list = Array.isArray(rawJabatan)
    ? rawJabatan
    : typeof rawJabatan === 'string'
    ? [rawJabatan]
    : [];

  const seen = new Set();
  const cleaned = [];

  list.forEach((j) => {
    if (!j || typeof j !== 'string') return;
    const trimmed = j.trim();
    // Normalize typo "Oprator" -> "Operator"
    const normalized = trimmed.toLowerCase() === 'oprator' ? 'Operator' : trimmed;
    // Filter out explicit "Oprator" typo and deduplicate
    if (normalized.toLowerCase() !== 'oprator' && !seen.has(normalized)) {
      seen.add(normalized);
      cleaned.push(normalized);
    }
  });

  return cleaned.length > 0 ? cleaned : ['Wali Kelas'];
};

// Helper to check if a user's registered jabatan includes "Kepala Sekolah" (Requirement 24)
export const isKepalaSekolah = (jabatan) => {
  if (!jabatan) return false;
  if (Array.isArray(jabatan)) {
    return jabatan.some(
      (j) => typeof j === 'string' && j.trim().toLowerCase() === 'kepala sekolah'
    );
  }
  if (typeof jabatan === 'string') {
    return (
      jabatan.trim().toLowerCase() === 'kepala sekolah' ||
      jabatan.toLowerCase().includes('kepala sekolah')
    );
  }
  return false;
};

// Default teacher password for production and password reset
export const DEFAULT_TEACHER_PASSWORD = 'guru123';

// Initial master data for Guru RJ App in production (clean state without dummy teachers)
export const INITIAL_TEACHERS = [];

// Helper to normalize phone numbers (e.g. "+62 812-3456-7890" -> "081234567890")
export const normalizePhone = (rawPhone) => {
  if (!rawPhone) return '';
  let cleaned = rawPhone.replace(/\D/g, ''); // strip non-digits
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.slice(2);
  } else if (!cleaned.startsWith('0') && cleaned.length >= 8) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
};

// Format phone for Indonesian standard display
export const formatPhoneDisplay = (phone) => {
  const norm = normalizePhone(phone);
  if (norm.length >= 10) {
    return `${norm.slice(0, 4)}-${norm.slice(4, 8)}-${norm.slice(8)}`;
  }
  return phone;
};

// Admin phone definition: 081111111111
export const ADMIN_PHONE = '081111111111';

// Initial master schedules (empty for production)
export const INITIAL_SCHEDULES = {};

// Re-export master schedules from scheduleData
export { scheduleData, jadwalMts, jadwalSmat, jadwalSma } from './scheduleData';

// Initial Salary Slips (empty for production)
export const INITIAL_SALARY_SLIPS = [];

export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Initial Attendance Records (empty for production)
export const INITIAL_ATTENDANCE = [];

// Honor Rate per Completed Teaching Session (Rp 7.500 per jam/sesi)
export const RATE_PER_SESSION = 7500;

// Honor Rate per Substitute Teaching Session (Badal: Rp 3.000 per sesi)
export const RATE_PER_BADAL_SESSION = 3000;

// Calculate session duration (JP) based on time string (e.g. "09.30 - 10.50" -> 2 JP) or explicit duration
export const calculateSessionDuration = (timeStr, explicitDuration) => {
  if (explicitDuration !== undefined && explicitDuration !== null && !isNaN(Number(explicitDuration)) && Number(explicitDuration) > 0) {
    return Number(explicitDuration);
  }
  if (!timeStr || typeof timeStr !== 'string') return 1;

  // Split start and end times, e.g. "09.30 - 10.50" or "09:30 - 10:50"
  const parts = timeStr.split('-').map((p) => p.trim().replace('.', ':'));
  if (parts.length === 2) {
    const startParts = parts[0].split(':').map(Number);
    const endParts = parts[1].split(':').map(Number);
    if (!isNaN(startParts[0]) && !isNaN(startParts[1]) && !isNaN(endParts[0]) && !isNaN(endParts[1])) {
      const startMin = startParts[0] * 60 + startParts[1];
      const endMin = endParts[0] * 60 + endParts[1];
      const diffMin = endMin - startMin;
      if (diffMin >= 105) return 3;
      if (diffMin >= 60) return 2;
      return 1;
    }
  }
  return 1;
};

// Rate Uang Transport Operator per Hari Kerja (Rp 25.000)
// Aturan: Hanya dihitung Senin sampai Jumat (Sabtu dan Minggu Rp 0)
export const OPERATOR_DAILY_TRANSPORT = 25000;

// Helper aman untuk parse tanggal tanpa timezone drift
export const parseDateSafe = (dateInput) => {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;
  if (typeof dateInput === 'string') {
    const isoMatch = dateInput.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return new Date(
        parseInt(isoMatch[1], 10),
        parseInt(isoMatch[2], 10) - 1,
        parseInt(isoMatch[3], 10)
      );
    }
    return new Date(dateInput);
  }
  return new Date(dateInput);
};

// Cek apakah tanggal jatuh pada hari kerja (Senin s/d Jumat)
// JavaScript getDay(): 0: Minggu, 1: Senin, 2: Selasa, 3: Rabu, 4: Kamis, 5: Jumat, 6: Sabtu
export const isWorkday = (dateInput) => {
  const d = parseDateSafe(dateInput);
  if (isNaN(d.getTime())) return false;
  const day = d.getDay();
  return day >= 1 && day <= 5; // HANYA Senin - Jumat
};

// Cek apakah tanggal jatuh pada akhir pekan (Sabtu atau Minggu)
export const isWeekend = (dateInput) => {
  const d = parseDateSafe(dateInput);
  if (isNaN(d.getTime())) return false;
  const day = d.getDay();
  return day === 0 || day === 6; // Minggu (0) atau Sabtu (6)
};

// Helper mendapatkan nama hari Bahasa Indonesia
export const getIndoDayName = (dateInput) => {
  const d = parseDateSafe(dateInput);
  if (isNaN(d.getTime())) return '';
  const names = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return names[d.getDay()] || '';
};

// Parse string nama periode (misal "Oktober 2026") menjadi { monthIndex, year }
export const parsePeriod = (periodStr) => {
  const now = new Date();
  if (!periodStr || typeof periodStr !== 'string') {
    return { monthIndex: now.getMonth(), year: now.getFullYear() };
  }
  for (let i = 0; i < INDO_MONTHS.length; i++) {
    const m = INDO_MONTHS[i].toLowerCase();
    if (periodStr.toLowerCase().includes(m)) {
      const yearMatch = periodStr.match(/\d{4}/);
      const year = yearMatch ? parseInt(yearMatch[0], 10) : now.getFullYear();
      return { monthIndex: i, year };
    }
  }
  const yyyyMm = periodStr.match(/^(\d{4})-(\d{1,2})/);
  if (yyyyMm) {
    return { monthIndex: parseInt(yyyyMm[2], 10) - 1, year: parseInt(yyyyMm[1], 10) };
  }
  return { monthIndex: now.getMonth(), year: now.getFullYear() };
};

// Mendapatkan daftar seluruh hari kerja valid (Senin s/d Jumat) dalam satu bulan kalender
export const getWorkdaysInMonth = (monthIndex, year = new Date().getFullYear()) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const workdays = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthIndex, day);
    const dayOfWeek = d.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      workdays.push({
        date: `${yyyy}-${mm}-${dd}`,
        day: getIndoDayName(d),
        dayNumber: day,
        dayOfWeek,
      });
    }
  }
  return workdays;
};

// Mendapatkan daftar hari kerja (Senin s/d Jumat) berdasarkan string periode (e.g. "Oktober 2026")
export const getWorkdaysInPeriod = (periodStr) => {
  const { monthIndex, year } = parsePeriod(periodStr);
  return getWorkdaysInMonth(monthIndex, year);
};

// Helper format nominal ke Rupiah standar (contoh: "Rp 3.500.000")
export const formatRupiah = (val) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val || 0);
};

// Mendapatkan nama periode bulan berjalan standar Indonesia (contoh: "Oktober 2026")
export const getCurrentPeriod = (dateInput = new Date()) => {
  const d = parseDateSafe(dateInput);
  const monthIdx = d.getMonth();
  const year = d.getFullYear();
  return `${INDO_MONTHS[monthIdx]} ${year}`;
};

// Fungsi perhitungan transport otomatis khusus role Operator
// 1. Operator mendapatkan uang transport otomatis Rp 25.000 per hari.
// 2. HANYA berlaku untuk hari kerja: Senin sampai Jumat (Sabtu dan Minggu Rp 0).
// 3. Mengalikan jumlah hari kerja (Senin-Jumat) yang valid dengan Rp 25.000.
export const calculateOperatorTransport = ({
  period,
  attendanceRecords = [],
  sessions = [],
  useCalendarMonth = false,
} = {}) => {
  const ratePerDay = OPERATOR_DAILY_TRANSPORT; // Rp 25.000 per hari kerja

  // 1. Kumpulkan seluruh record tanggal unik dari presensi atau sesi
  const dateMap = new Map();

  (attendanceRecords || []).forEach((att) => {
    if (!att || !att.date) return;
    if (period) {
      const recPeriod = att.period || getPeriodFromDate(att.date);
      if (recPeriod && recPeriod !== period) return;
    }
    const dateKey = att.date;
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, { date: dateKey, attendance: att, sessions: [] });
    }
  });

  (sessions || []).forEach((sess) => {
    if (!sess || !sess.date) return;
    if (period) {
      const sessPeriod = sess.period || getPeriodFromDate(sess.date);
      if (sessPeriod && sessPeriod !== period) return;
    }
    const dateKey = sess.date;
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, { date: dateKey, attendance: null, sessions: [sess] });
    } else {
      dateMap.get(dateKey).sessions.push(sess);
    }
  });

  // Jika useCalendarMonth ATAU tidak ada tanggal spesifik (misal perhitungan estimasi saldo bulanan standar)
  if (dateMap.size === 0 || useCalendarMonth) {
    const calendarWorkdays = getWorkdaysInPeriod(period);
    const dailyBreakdown = calendarWorkdays.map((item) => ({
      date: item.date,
      day: item.day,
      dayOfWeek: item.dayOfWeek,
      sessionCount: 0,
      allowance: ratePerDay, // Rp 25.000
      tier: 'Transport Operator (Senin-Jumat • Rp 25.000)',
      isValidWorkday: true,
      sessions: [],
    }));

    const validDaysCount = dailyBreakdown.length;
    const totalTransport = validDaysCount * ratePerDay;

    return {
      dailyBreakdown,
      totalTransport,
      validDaysCount,
      activeDaysCount: validDaysCount,
      ratePerDay,
      isOperator: true,
      calculationBasis: 'calendar_workdays',
    };
  }

  // Jika ada record kehadiran/sesi:
  // Validasi hari: HANYA Senin - Jumat yang dapat Rp 25.000, Sabtu dan Minggu Rp 0
  const sortedDates = Array.from(dateMap.keys()).sort();
  const dailyBreakdown = sortedDates.map((dateStr) => {
    const d = parseDateSafe(dateStr);
    const dayOfWeek = d.getDay();
    const dayName = getIndoDayName(d);
    const isValid = dayOfWeek >= 1 && dayOfWeek <= 5; // Senin s/d Jumat
    const entry = dateMap.get(dateStr);

    let allowance = 0;
    let tier = '';

    if (isValid) {
      allowance = ratePerDay; // Rp 25.000
      tier = 'Transport Operator (Senin-Jumat • Rp 25.000)';
    } else {
      allowance = 0; // Sabtu atau Minggu tidak dapat
      tier = 'Weekend (Sabtu/Minggu • Tidak Dapat Transport)';
    }

    return {
      date: dateStr,
      day: dayName,
      dayOfWeek,
      sessionCount: entry?.sessions?.length || 0,
      allowance,
      tier,
      isValidWorkday: isValid,
      sessions: entry?.sessions || [],
      attendance: entry?.attendance || null,
    };
  });

  const validDays = dailyBreakdown.filter((d) => d.isValidWorkday);
  const validDaysCount = validDays.length;
  const totalTransport = validDaysCount * ratePerDay;

  return {
    dailyBreakdown,
    totalTransport,
    validDaysCount,
    activeDaysCount: dailyBreakdown.length,
    ratePerDay,
    isOperator: true,
    calculationBasis: 'recorded_workdays',
  };
};

// Daily Transport Allowance calculation
// Mendukung kalkulasi reguler (berdasarkan sesi mengajar) dan kalkulasi khusus role "Operator"
export const calculateDailyTransport = (sessions = [], optionsOrUser = {}) => {
  // Cek apakah target adalah Operator
  let isOp = false;
  let period = null;
  let attendanceRecords = [];
  let useCalendarMonth = false;

  if (typeof optionsOrUser === 'string' || Array.isArray(optionsOrUser)) {
    isOp = isOperator(optionsOrUser);
  } else if (optionsOrUser && typeof optionsOrUser === 'object') {
    isOp = Boolean(
      optionsOrUser.isOperator ||
      isOperator(optionsOrUser.user) ||
      isOperator(optionsOrUser.jabatan) ||
      isOperator(optionsOrUser.role) ||
      isOperator(optionsOrUser)
    );
    period = optionsOrUser.period || null;
    attendanceRecords = optionsOrUser.attendance || optionsOrUser.attendanceRecords || [];
    useCalendarMonth = Boolean(optionsOrUser.useCalendarMonth);
  }

  // Jika role Operator: Terpanggil logika transport khusus Operator
  if (isOp) {
    return calculateOperatorTransport({
      period,
      attendanceRecords,
      sessions,
      useCalendarMonth,
    });
  }

  // Jika bukan Operator (Guru Reguler): Berdasarkan sesi mengajar
  // 1-2 sesi -> Rp 17.000, >2 sesi -> Rp 25.000
  const groupsByDate = {};

  sessions.forEach((s) => {
    const dateKey = s.date || 'Hari Ini';
    if (!groupsByDate[dateKey]) {
      groupsByDate[dateKey] = [];
    }
    groupsByDate[dateKey].push(s);
  });

  const dailyBreakdown = Object.entries(groupsByDate).map(([date, daySessions]) => {
    const sessionCount = daySessions.length;
    let allowance = 0;
    let tier = '';

    if (sessionCount >= 1 && sessionCount <= 2) {
      allowance = 17000;
      tier = '1-2 Sesi (Rp 17.000)';
    } else if (sessionCount > 2) {
      allowance = 25000;
      tier = '>2 Sesi (Rp 25.000)';
    }

    return {
      date,
      day: daySessions[0]?.day || '',
      sessionCount,
      allowance,
      tier,
      sessions: daySessions,
      isValidWorkday: isWorkday(date),
    };
  });

  const totalTransport = dailyBreakdown.reduce((sum, d) => sum + d.allowance, 0);

  return {
    dailyBreakdown,
    totalTransport,
    activeDaysCount: dailyBreakdown.length,
    validDaysCount: dailyBreakdown.length,
    isOperator: false,
  };
};

// Initial Completed Teaching Sessions (empty for production)
export const INITIAL_COMPLETED_SESSIONS = [];

export const INDO_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const getPeriodFromDate = (dateStr) => {
  if (!dateStr) return null;
  const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthIdx = parseInt(isoMatch[2], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${INDO_MONTHS[monthIdx]} ${year}`;
    }
  }
  const lower = dateStr.toLowerCase();
  for (let i = 0; i < INDO_MONTHS.length; i++) {
    const fullM = INDO_MONTHS[i].toLowerCase();
    const shortM = fullM.substring(0, 3);
    if (lower.includes(fullM) || lower.includes(shortM)) {
      const yearMatch = dateStr.match(/\d{4}/);
      const year = yearMatch ? yearMatch[0] : new Date().getFullYear();
      return `${INDO_MONTHS[i]} ${year}`;
    }
  }
  return null;
};

// Target Jam Masuk dan Jam Pulang Guru RJ
// Senin s/d Kamis: Masuk 09.30 WIB, Pulang 13.45 WIB
// Jumat: Masuk 07.00 WIB, Pulang 11.35 WIB
export const ATTENDANCE_SCHEDULE_HOURS = {
  weekday: {
    inTime: '09:30',
    outTime: '13:45',
    inMinutes: 9 * 60 + 30, // 570
    outMinutes: 13 * 60 + 45, // 825
    inLabel: '09.30 WIB',
    outLabel: '13.45 WIB',
    dayName: 'Senin - Kamis',
  },
  friday: {
    inTime: '07:00',
    outTime: '11:35',
    inMinutes: 7 * 60, // 420
    outMinutes: 11 * 60 + 35, // 695
    inLabel: '07.00 WIB',
    outLabel: '11.35 WIB',
    dayName: 'Jumat',
  },
};

export const getScheduleHoursForDate = (dateParam = new Date()) => {
  let d;
  if (typeof dateParam === 'string') {
    // If format is YYYY-MM-DD
    const parts = dateParam.split('-');
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      d = new Date(dateParam);
    }
  } else {
    d = dateParam;
  }

  const dayOfWeek = d.getDay(); // 0: Minggu, 1: Senin, ..., 5: Jumat, 6: Sabtu
  const isFriday = dayOfWeek === 5;

  return {
    isFriday,
    dayOfWeek,
    ...(isFriday ? ATTENDANCE_SCHEDULE_HOURS.friday : ATTENDANCE_SCHEDULE_HOURS.weekday),
  };
};

