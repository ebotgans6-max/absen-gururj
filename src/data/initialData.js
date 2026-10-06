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
  'Oprator',
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
  'Oprator': 300000,
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

// Daily Transport Allowance calculation based on sessions per date
// 1 to 2 sessions in a day -> Rp 17.000
// > 2 sessions in a day -> Rp 25.000
export const calculateDailyTransport = (sessions = []) => {
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
    };
  });

  const totalTransport = dailyBreakdown.reduce((sum, d) => sum + d.allowance, 0);

  return {
    dailyBreakdown,
    totalTransport,
    activeDaysCount: dailyBreakdown.length,
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

