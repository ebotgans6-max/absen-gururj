import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  INITIAL_TEACHERS,
  DEFAULT_TEACHER_PASSWORD,
  INITIAL_SCHEDULES,
  INITIAL_SALARY_SLIPS,
  INITIAL_ATTENDANCE,
  getTodayDateString,
  normalizePhone,
  ADMIN_PHONE,
  RATE_PER_SESSION,
  RATE_PER_BADAL_SESSION,
  INITIAL_COMPLETED_SESSIONS,
  calculateDailyTransport,
  getPeriodFromDate,
  isKepalaSekolah,
  getJabatanAllowance,
} from '../data/initialData';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // 1. Toast Notification State
  const [toast, setToast] = useState({
    show: false,
    message: '',
    title: '',
    type: 'success', // 'success' | 'error' | 'info'
  });

  const showToast = (message, type = 'success', title = '') => {
    setToast({
      show: true,
      message,
      title: title || (type === 'success' ? 'Berhasil' : type === 'error' ? 'Peringatan' : 'Informasi'),
      type,
    });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  const DUMMY_TEACHER_NAMES = ['Lilis Suryani', 'Anggita Rahmawati', 'Vanessa', 'Husnul Khotimah'];
  const DUMMY_TEACHER_PHONES = ['081234567890', '081398765432', '085711223344', '082155667788'];

  // 2. Teachers Master Data
  const [teachers, setTeachers] = useState(() => {
    const saved = localStorage.getItem('guru_rj_teachers_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter(
          (t) =>
            !DUMMY_TEACHER_NAMES.includes(t.name) &&
            !DUMMY_TEACHER_PHONES.includes(normalizePhone(t.phone))
        );
      } catch (e) {
        console.error('Error reading teachers', e);
      }
    }
    return INITIAL_TEACHERS;
  });

  useEffect(() => {
    localStorage.setItem('guru_rj_teachers_v2', JSON.stringify(teachers));
  }, [teachers]);

  // 3. Registered Users with Phone as primary credential
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('guru_rj_users_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Purge dummy demo teachers from registered users database
        return parsed.filter(
          (u) =>
            !DUMMY_TEACHER_NAMES.includes(u.name) &&
            !DUMMY_TEACHER_PHONES.includes(normalizePhone(u.phone))
        );
      } catch (e) {
        console.error('Error reading registered users from localStorage', e);
      }
    }

    return [];
  });

  useEffect(() => {
    localStorage.setItem('guru_rj_users_v2', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // 4. Current Logged-in User
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('guru_rj_current_user_v2');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        // If current user is a dummy teacher, clear from storage
        if (
          DUMMY_TEACHER_NAMES.includes(user.name) ||
          DUMMY_TEACHER_PHONES.includes(normalizePhone(user.phone))
        ) {
          localStorage.removeItem('guru_rj_current_user_v2');
          return null;
        }
        // Re-evaluate role strictly based on registered Jabatan (Kepala Sekolah -> admin, else teacher)
        const expectedRole = isKepalaSekolah(user.jabatan) ? 'admin' : 'teacher';
        if (user.role !== expectedRole) {
          user.role = expectedRole;
          localStorage.setItem('guru_rj_current_user_v2', JSON.stringify(user));
        }
        return user;
      } catch (e) {
        console.error('Error reading current user from localStorage', e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('guru_rj_current_user_v2', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('guru_rj_current_user_v2');
    }
  }, [currentUser]);

  // 5. Attendance Records
  const [attendance, setAttendance] = useState(() => {
    const saved = localStorage.getItem('guru_rj_attendance_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter(
          (a) =>
            !DUMMY_TEACHER_NAMES.includes(a.teacherName) &&
            !DUMMY_TEACHER_PHONES.includes(normalizePhone(a.teacherPhone))
        );
      } catch (e) {
        console.error('Error reading attendance', e);
      }
    }
    return INITIAL_ATTENDANCE;
  });

  useEffect(() => {
    localStorage.setItem('guru_rj_attendance_v2', JSON.stringify(attendance));
  }, [attendance]);

  // 6. Salary Slips
  const [salarySlips, setSalarySlips] = useState(() => {
    const saved = localStorage.getItem('guru_rj_salary_slips_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter(
          (s) =>
            !DUMMY_TEACHER_NAMES.includes(s.teacherName) &&
            !DUMMY_TEACHER_PHONES.includes(normalizePhone(s.teacherPhone))
        );
      } catch (e) {
        console.error('Error reading salary slips', e);
      }
    }
    return INITIAL_SALARY_SLIPS;
  });

  useEffect(() => {
    localStorage.setItem('guru_rj_salary_slips_v2', JSON.stringify(salarySlips));
  }, [salarySlips]);

  // 7. Teaching Schedules
  const [schedules, setSchedules] = useState(() => {
    const saved = localStorage.getItem('guru_rj_schedules_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const cleaned = { ...parsed };
        DUMMY_TEACHER_PHONES.forEach((p) => delete cleaned[p]);
        return cleaned;
      } catch (e) {
        console.error('Error reading schedules', e);
      }
    }
    return INITIAL_SCHEDULES;
  });

  useEffect(() => {
    localStorage.setItem('guru_rj_schedules_v2', JSON.stringify(schedules));
  }, [schedules]);

  // 8. Completed Teaching Sessions (Ceklis Mapel Selesai Diajar)
  const [completedSessions, setCompletedSessions] = useState(() => {
    const saved = localStorage.getItem('guru_rj_completed_sessions_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter(
          (cs) =>
            !DUMMY_TEACHER_NAMES.includes(cs.teacherName) &&
            !DUMMY_TEACHER_PHONES.includes(normalizePhone(cs.teacherPhone))
        );
      } catch (e) {
        console.error('Error reading completed sessions', e);
      }
    }
    return INITIAL_COMPLETED_SESSIONS;
  });

  useEffect(() => {
    localStorage.setItem('guru_rj_completed_sessions_v2', JSON.stringify(completedSessions));
  }, [completedSessions]);

  // Toggle Teaching Session Completion
  const toggleTeachingSession = (sessionParams, teacherUser) => {
    const teacher = teacherUser || currentUser;
    if (!teacher) {
      showToast('Silakan masuk terlebih dahulu untuk mengklaim sesi mengajar.', 'error', 'Perlu Masuk');
      return { success: false, error: 'Unauthorized' };
    }

    const {
      sessionId,
      level,
      day,
      time,
      className,
      subject,
      date = getTodayDateString(),
    } = sessionParams;

    // Validation for date being claimed: evaluate attendance specifically for that date
    const today = getTodayDateString();
    if (teacher.role !== 'admin') {
      const normTeacherPhone = normalizePhone(teacher.phone);
      const targetAtt = attendance.find(
        (a) => normalizePhone(a.teacherPhone) === normTeacherPhone && a.date === date
      );

      if (!targetAtt) {
        const isPast = date < today;
        showToast(
          isPast
            ? `Silakan lakukan Absen Susulan untuk tanggal ${date} terlebih dahulu sebelum mengklaim sesi mengajar.`
            : 'Silakan lakukan Absen Masuk terlebih dahulu sebelum mengklaim sesi mengajar.',
          'error',
          isPast ? 'Perlu Absen Susulan' : 'Belum Absen Masuk'
        );
        return { success: false, error: 'Belum absen' };
      }

      const attStatus =
        targetAtt.attendanceStatus ||
        (['Tepat Waktu', 'Terlambat'].includes(targetAtt.status) ? 'Hadir' : targetAtt.status);

      if (attStatus !== 'Hadir') {
        showToast(
          `🔒 Anda tidak dapat mengklaim sesi mengajar karena status absensi Anda pada ${date}: ${attStatus}.`,
          'error',
          'Klaim Terkunci'
        );
        return { success: false, error: `Status absensi: ${attStatus}` };
      }
    }

    // Check if slot is already claimed for this date
    const existingIndex = completedSessions.findIndex(
      (s) => s.sessionId === sessionId && s.date === date
    );

    if (existingIndex !== -1) {
      const existing = completedSessions[existingIndex];
      const isOwner = normalizePhone(existing.teacherPhone) === normalizePhone(teacher.phone) || teacher.role === 'admin';

      if (!isOwner) {
        showToast(
          `Sesi ini sudah diklaim oleh ${existing.teacherName}.`,
          'error',
          'Sesi Sudah Terisi'
        );
        return { success: false, error: 'Claimed by another teacher' };
      }

      // Unclaim / uncheck session
      const updated = [...completedSessions];
      updated.splice(existingIndex, 1);
      setCompletedSessions(updated);
      showToast(
        `Klaim sesi ${className} • ${subject} dibatalkan.`,
        'info',
        'Sesi Dibatalkan'
      );
      return { success: true, action: 'unclaimed' };
    }

    // Add new completed session
    const newSession = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId,
      level,
      day,
      time,
      className,
      subject,
      date,
      teacherPhone: teacher.phone,
      teacherName: teacher.name,
      rate: RATE_PER_SESSION,
      period: getPeriodFromDate(date) || 'September 2026',
      completedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    setCompletedSessions((prev) => [newSession, ...prev]);

    try {
      confetti({
        particleCount: 50,
        spread: 55,
        origin: { y: 0.8 },
        colors: ['#22c55e', '#16a34a', '#86efac', '#3b82f6'],
      });
    } catch (e) {}

    showToast(
      `Sesi ${className} • ${subject} selesai diajar! (+Rp 7.500 honor tercatat) 🎉`,
      'success',
      'Selesai Mengajar'
    );

    return { success: true, action: 'claimed', session: newSession };
  };

  // Claim Substitute Teaching Session (Klaim Jam Badal - Special Rate Rp 3.000)
  const claimBadalSession = (badalData, teacherUser) => {
    const teacher = teacherUser || currentUser;
    if (!teacher) {
      showToast('Silakan masuk terlebih dahulu untuk mengklaim jam badal.', 'error', 'Perlu Masuk');
      return { success: false, error: 'Unauthorized' };
    }

    const {
      date = getTodayDateString(),
      className,
      subject,
      notes = '',
    } = badalData;

    if (!className?.trim() || !subject?.trim()) {
      showToast('Mohon lengkapi Kelas dan Mata Pelajaran yang digantikan.', 'error', 'Data Belum Lengkap');
      return { success: false, error: 'Incomplete data' };
    }

    const cleanDate = date || getTodayDateString();
    const newBadalSession = {
      id: `badal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sessionId: `badal-${Date.now()}`,
      isBadal: true,
      type: 'badal',
      date: cleanDate,
      className: className.trim(),
      subject: subject.trim(),
      level: className.toLowerCase().includes('sma') || className.match(/1[0-2]|x|xi|xii/i) ? 'SMA' : 'MTs',
      day: new Date(cleanDate).toLocaleDateString('id-ID', { weekday: 'long' }),
      time: 'Jam Badal (Pengganti)',
      notes: notes.trim(),
      teacherPhone: teacher.phone,
      teacherName: teacher.name,
      rate: RATE_PER_BADAL_SESSION, // Rp 3.000
      period: getPeriodFromDate(cleanDate) || 'September 2026',
      completedAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    setCompletedSessions((prev) => [newBadalSession, ...prev]);

    try {
      confetti({
        particleCount: 50,
        spread: 55,
        origin: { y: 0.8 },
        colors: ['#f59e0b', '#d97706', '#fbbf24', '#22c55e'],
      });
    } catch (e) {}

    showToast(
      `Sesi Badal ${className.trim()} • ${subject.trim()} berhasil diklaim (+Rp 3.000 honor tercatat) 🎉`,
      'success',
      'Klaim Badal Berhasil'
    );

    return { success: true, session: newBadalSession };
  };

  // Delete / cancel a badal session
  const deleteBadalSession = (sessionId) => {
    setCompletedSessions((prev) => prev.filter((s) => s.id !== sessionId && s.sessionId !== sessionId));
    showToast('Klaim sesi badal berhasil dibatalkan.', 'info', 'Badal Dihapus');
    return { success: true };
  };

  // Helper to calculate teacher salary with separated regular & badal sessions
  const calculateTeacherSalary = (teacherPhone, period) => {
    const norm = normalizePhone(teacherPhone || currentUser?.phone);
    const teacher =
      teachers.find((t) => normalizePhone(t.phone) === norm) ||
      registeredUsers.find((u) => normalizePhone(u.phone) === norm) ||
      currentUser;

    const allSessions = completedSessions.filter((s) => {
      const matchesPhone = normalizePhone(s.teacherPhone) === norm;
      const matchesName =
        s.teacherName &&
        teacher?.name &&
        s.teacherName.toLowerCase() === teacher.name.toLowerCase();
      if (!matchesPhone && !matchesName) return false;
      const sessPeriod = s.period || getPeriodFromDate(s.date);
      return !period || sessPeriod === period;
    });

    const regularSessions = allSessions.filter((s) => !s.isBadal && s.type !== 'badal');
    const badalSessions = allSessions.filter((s) => s.isBadal || s.type === 'badal');

    const totalRegularSessions = regularSessions.length;
    const totalBadalSessions = badalSessions.length;

    const totalHonorSesi = totalRegularSessions * RATE_PER_SESSION;
    const totalHonorBadal = totalBadalSessions * RATE_PER_BADAL_SESSION;

    const transportData = calculateDailyTransport(allSessions);
    const totalTransport = transportData.totalTransport;

    const activeJabatan =
      Array.isArray(teacher?.jabatan) && teacher.jabatan.length > 0
        ? teacher.jabatan
        : ['Wali Kelas'];
    const totalTunjanganJabatan = activeJabatan.reduce(
      (sum, j) => sum + (getJabatanAllowance ? getJabatanAllowance(j) : 0),
      0
    );

    const grandTotalSalary =
      totalHonorSesi + totalHonorBadal + totalTransport + totalTunjanganJabatan;

    return {
      allSessions,
      regularSessions,
      badalSessions,
      totalRegularSessions,
      totalBadalSessions,
      totalHonorSesi,
      totalHonorBadal,
      transportData,
      totalTransport,
      totalTunjanganJabatan,
      grandTotalSalary,
    };
  };

  // Helper to get completed sessions for teacher
  const getTeacherCompletedSessions = (teacherPhone, period = 'September 2026') => {
    const norm = normalizePhone(teacherPhone || currentUser?.phone);
    return completedSessions.filter(
      (s) => normalizePhone(s.teacherPhone) === norm && (!period || s.period === period)
    );
  };

  // Helper to check user by phone
  const findUserByPhone = (rawPhone) => {
    const norm = normalizePhone(rawPhone);
    return registeredUsers.find((u) => normalizePhone(u.phone) === norm);
  };

  // Auth Functions - Unified Login
  // Requirement 24: Restrict Admin Access to "Kepala Sekolah"
  // - Stop checking against hardcoded Admin phone number
  // - Fetch user data from database upon login and check registered "Jabatan"
  // - If Jabatan includes "Kepala Sekolah", route to Admin Dashboard (role: 'admin')
  // - If Jabatan does NOT include "Kepala Sekolah", route to Teacher Dashboard (role: 'teacher')
  const login = (phone, password) => {
    const normPhone = normalizePhone(phone);
    if (!normPhone) {
      showToast('Silakan masukkan nomor HP yang valid.', 'error', 'Nomor HP Kosong');
      return { success: false, error: 'Silakan masukkan nomor HP yang valid.' };
    }

    if (!password) {
      showToast('Silakan masukkan password.', 'error', 'Password Kosong');
      return { success: false, error: 'Silakan masukkan password akun Anda.' };
    }

    let existing = registeredUsers.find((u) => normalizePhone(u.phone) === normPhone);
    let teacherMaster = teachers.find((t) => normalizePhone(t.phone) === normPhone);

    if (!existing && teacherMaster) {
      const teacherJabatan = teacherMaster.jabatan || ['Guru Mapel'];
      existing = {
        name: teacherMaster.name,
        phone: teacherMaster.phone,
        password: teacherMaster.password || DEFAULT_TEACHER_PASSWORD,
        role: isKepalaSekolah(teacherJabatan) ? 'admin' : 'teacher',
        jabatan: teacherJabatan,
      };
    }

    if (!existing) {
      showToast('Nomor HP belum terdaftar. Silakan daftar akun baru terlebih dahulu.', 'error', 'Akun Tidak Ditemukan');
      return { success: false, error: 'Nomor HP belum terdaftar. Silakan daftar akun terlebih dahulu.' };
    }

    const expectedPassword = existing.password || teacherMaster?.password || DEFAULT_TEACHER_PASSWORD;
    if (password !== expectedPassword) {
      showToast('Password yang Anda masukkan salah. Silakan coba lagi.', 'error', 'Gagal Masuk');
      return { success: false, error: 'Password yang Anda masukkan salah.' };
    }

    // Check user's registered Jabatan from database document
    const userJabatan = Array.isArray(existing.jabatan)
      ? existing.jabatan
      : (typeof existing.jabatan === 'string' ? [existing.jabatan] : []);

    const hasKepalaSekolah = isKepalaSekolah(userJabatan);
    const role = hasKepalaSekolah ? 'admin' : 'teacher';

    const userSession = {
      name: existing.name || (role === 'admin' ? 'Kepala Sekolah' : `Guru (${normPhone.slice(-4)})`),
      phone: normPhone,
      role,
      jabatan: userJabatan.length > 0 ? userJabatan : (role === 'admin' ? ['Kepala Sekolah'] : ['Guru Mapel']),
    };

    // Keep registered user role synchronized
    if (existing.role !== role) {
      setRegisteredUsers((prev) =>
        prev.map((u) =>
          normalizePhone(u.phone) === normPhone ? { ...u, role } : u
        )
      );
    }

    setCurrentUser(userSession);
    showToast(
      role === 'admin'
        ? `Selamat datang di Dashboard Admin, ${userSession.name}!`
        : `Selamat datang kembali, ${userSession.name}!`,
      'success',
      'Login Berhasil'
    );
    return { success: true, user: userSession };
  };

  // Requirement 17: Split Login Portal by Role (GTK vs Manajemen) via OTP
  const loginByRoleOTP = (phone, roleType = 'gtk') => {
    const normPhone = normalizePhone(phone);
    if (!normPhone) {
      showToast('Silakan masukkan nomor HP yang valid.', 'error', 'Nomor HP Kosong');
      return { success: false, error: 'Nomor HP tidak valid' };
    }

    let existing = registeredUsers.find((u) => normalizePhone(u.phone) === normPhone);
    let teacherMaster = teachers.find((t) => normalizePhone(t.phone) === normPhone);

    if (!existing && !teacherMaster) {
      showToast(
        'Akun belum terdaftar di database. Silakan beralih ke tab "Daftar" terlebih dahulu.',
        'error',
        'Belum Terdaftar'
      );
      return {
        success: false,
        error: 'Nomor HP belum terdaftar di database. Silakan daftar terlebih dahulu.',
      };
    }

    const userJabatan = existing?.jabatan || teacherMaster?.jabatan || ['Guru Mapel'];
    const hasKepalaSekolah = isKepalaSekolah(userJabatan);

    // Role: Login Manajemen (Admin / Operator) -> requires Kepala Sekolah
    if (roleType === 'manajemen') {
      if (!hasKepalaSekolah) {
        showToast(
          'Akses ditolak. Hanya pemegang jabatan "Kepala Sekolah" yang memiliki hak akses Admin / Manajemen.',
          'error',
          'Akses Ditolak'
        );
        return {
          success: false,
          error: 'Akses ditolak. Jabatan Anda tidak mencakup "Kepala Sekolah".',
        };
      }
    }

    const role = hasKepalaSekolah ? 'admin' : 'teacher';
    const userSession = {
      name: existing?.name || teacherMaster?.name || (role === 'admin' ? 'Kepala Sekolah' : `Guru (${normPhone.slice(-4)})`),
      phone: normPhone,
      role,
      jabatan: userJabatan,
    };

    setCurrentUser(userSession);
    showToast(
      role === 'admin'
        ? 'Selamat datang di Portal Manajemen Guru RJ.'
        : `Selamat datang di Dashboard GTK, ${userSession.name}!`,
      'success',
      role === 'admin' ? 'Login Manajemen Berhasil' : 'Login GTK Berhasil'
    );
    return { success: true, user: userSession };
  };

  // Requirement 19: Standard Login by Role using Phone Number and Password (No OTP)
  const loginByRolePassword = (phone, password, roleType = 'gtk') => {
    const normPhone = normalizePhone(phone);
    if (!normPhone) {
      showToast('Silakan masukkan nomor HP yang valid.', 'error', 'Nomor HP Kosong');
      return { success: false, error: 'Nomor HP tidak valid' };
    }

    if (!password) {
      showToast('Silakan masukkan kata sandi akun Anda.', 'error', 'Kata Sandi Kosong');
      return { success: false, error: 'Kata sandi wajib diisi' };
    }

    let existing = registeredUsers.find((u) => normalizePhone(u.phone) === normPhone);
    let teacherMaster = teachers.find((t) => normalizePhone(t.phone) === normPhone);

    if (!existing && !teacherMaster) {
      showToast(
        'Akun belum terdaftar di database. Silakan beralih ke tab "Daftar" terlebih dahulu.',
        'error',
        'Belum Terdaftar'
      );
      return {
        success: false,
        error: 'Nomor HP belum terdaftar di database. Silakan klik tab "Daftar" untuk membuat akun terlebih dahulu.',
      };
    }

    const targetUser = existing || {
      name: teacherMaster?.name,
      phone: normPhone,
      password: teacherMaster?.password || DEFAULT_TEACHER_PASSWORD,
      jabatan: teacherMaster?.jabatan || ['Guru Mapel'],
    };

    // Check password against registered password or default 'guru123'
    const expectedPassword = targetUser.password || DEFAULT_TEACHER_PASSWORD;
    if (expectedPassword && expectedPassword !== password) {
      showToast('Password yang Anda masukkan salah. Silakan coba lagi.', 'error', 'Gagal Masuk');
      return {
        success: false,
        error: 'Password salah. Silakan periksa kembali atau minta reset password ke Admin.',
      };
    }

    const userJabatan = targetUser.jabatan || ['Guru Mapel'];
    const hasKepalaSekolah = isKepalaSekolah(userJabatan);

    // Role: Login Manajemen -> requires Kepala Sekolah
    if (roleType === 'manajemen' && !hasKepalaSekolah) {
      showToast(
        'Akses ditolak. Hanya pemegang jabatan "Kepala Sekolah" yang memiliki hak akses Admin / Manajemen.',
        'error',
        'Akses Ditolak'
      );
      return {
        success: false,
        error: 'Akses ditolak. Akun Anda tidak memiliki jabatan "Kepala Sekolah".',
      };
    }

    const role = hasKepalaSekolah ? 'admin' : 'teacher';
    const userSession = {
      name: targetUser.name || (role === 'admin' ? 'Kepala Sekolah' : `Guru (${normPhone.slice(-4)})`),
      phone: normPhone,
      role,
      jabatan: userJabatan,
    };

    setCurrentUser(userSession);
    showToast(
      role === 'admin'
        ? 'Selamat datang di Portal Manajemen Guru RJ.'
        : `Selamat datang di Dashboard GTK, ${userSession.name}!`,
      'success',
      role === 'admin' ? 'Login Manajemen Berhasil' : 'Login GTK Berhasil'
    );
    return { success: true, user: userSession };
  };

  const register = (fullName, phone, password, jabatan = ['Guru Mapel'], autoLogin = false) => {
    const normPhone = normalizePhone(phone);
    if (!normPhone || normPhone.length < 9) {
      showToast('Silakan masukkan nomor HP Indonesia yang valid (minimal 10 digit).', 'error', 'Nomor HP Tidak Valid');
      return { success: false, error: 'Nomor HP tidak valid' };
    }

    // Validation Rules: A teacher MUST select a minimum of 1 position, and a MAXIMUM of 5 positions.
    const selectedJabatan = Array.isArray(jabatan) && jabatan.length > 0 ? jabatan : ['Guru Mapel'];
    if (selectedJabatan.length < 1 || selectedJabatan.length > 5) {
      showToast('Pilih minimal 1 jabatan dan maksimal 5 jabatan.', 'error', 'Validasi Jabatan');
      return { success: false, error: 'Jabatan harus 1-5' };
    }

    const existing = registeredUsers.find((u) => normalizePhone(u.phone) === normPhone);
    if (existing) {
      showToast('Nomor HP sudah terdaftar. Silakan langsung pilih tab "Masuk".', 'error', 'Registrasi Gagal');
      return { success: false, error: 'Nomor HP sudah terdaftar' };
    }

    // Determine role based on selected jabatan containing 'Kepala Sekolah' (Requirement 24)
    const hasKepalaSekolah = isKepalaSekolah(selectedJabatan);
    const role = hasKepalaSekolah ? 'admin' : 'teacher';

    const newUser = {
      name: fullName.trim(),
      phone: normPhone,
      password: password || '123456',
      role,
      jabatan: selectedJabatan,
    };

    // Correctly saves the selected Jabatan to the user's database document
    setRegisteredUsers((prev) => [...prev, newUser]);

    // If teacher, add to master teachers list
    if (role === 'teacher') {
      const newTeacher = {
        id: `t-${Date.now()}`,
        name: fullName.trim(),
        phone: normPhone,
        email: `${fullName.toLowerCase().replace(/[^a-z]/g, '')}@gururj.com`,
        nip: `19${Math.floor(1000000000000000 + Math.random() * 9000000000000000)}`,
        subject: selectedJabatan.join(', '),
        jabatan: selectedJabatan,
        joinedDate: getTodayDateString(),
        status: 'Tetap',
      };
      setTeachers((prev) => [...prev, newTeacher]);

      // Assign default sample schedule
      setSchedules((prev) => ({
        ...prev,
        [normPhone]: [
          { id: `s-${Date.now()}-1`, day: 'Senin', time: '08:00 - 09:30', subject: 'Mata Pelajaran Terpadu', class: 'Kelas X-A', room: 'R. 101' },
          { id: `s-${Date.now()}-2`, day: 'Rabu', time: '09:45 - 11:15', subject: 'Mata Pelajaran Terpadu', class: 'Kelas XI-B', room: 'R. 203' },
          { id: `s-${Date.now()}-3`, day: 'Kamis', time: '07:30 - 09:00', subject: 'Praktek Terbimbing', class: 'Kelas XII-A', room: 'Lab Serbaguna' },
        ],
      }));

      // Generate default salary slip for current month
      const newSlip = {
        id: `slip-${Date.now()}`,
        teacherPhone: normPhone,
        teacherName: fullName.trim(),
        period: 'September 2026',
        dateIssued: '2026-09-25',
        baseSalary: 4000000,
        functionalAllowance: 700000,
        transportAllowance: 400000,
        attendanceIncentive: 350000,
        teachingHoursBonus: 200000,
        bpjsDeduction: 100000,
        coopDeduction: 50000,
        taxDeduction: 35000,
        status: 'Sudah Terbit',
      };
      setSalarySlips((prev) => [newSlip, ...prev]);
    }

    const userSession = {
      name: newUser.name,
      phone: newUser.phone,
      role,
      jabatan: selectedJabatan,
    };

    if (autoLogin) {
      setCurrentUser(userSession);
      showToast(`Pendaftaran berhasil! Selamat datang, ${userSession.name}.`, 'success', 'Akun Berhasil Dibuat');
    }

    return { success: true, user: userSession };
  };

  // Update Teacher Profile (Name & Jabatan)
  const updateTeacherProfile = (phone, updatedFields) => {
    const norm = normalizePhone(phone);

    let roleUpdate = {};
    if (updatedFields.jabatan) {
      if (
        !Array.isArray(updatedFields.jabatan) ||
        updatedFields.jabatan.length < 1 ||
        updatedFields.jabatan.length > 5
      ) {
        showToast('Pilih minimal 1 jabatan dan maksimal 5 jabatan.', 'error', 'Validasi Jabatan');
        return { success: false, error: 'Pilih 1-5 jabatan' };
      }
      const hasKepalaSekolah = isKepalaSekolah(updatedFields.jabatan);
      roleUpdate.role = hasKepalaSekolah ? 'admin' : 'teacher';
    }

    setRegisteredUsers((prev) =>
      prev.map((u) => (normalizePhone(u.phone) === norm ? { ...u, ...updatedFields, ...roleUpdate } : u))
    );

    setTeachers((prev) =>
      prev.map((t) => (normalizePhone(t.phone) === norm ? { ...t, ...updatedFields, ...roleUpdate } : t))
    );

    if (currentUser && normalizePhone(currentUser.phone) === norm) {
      setCurrentUser((prev) => ({ ...prev, ...updatedFields, ...roleUpdate }));
    }

    showToast('Profil & jabatan berhasil diperbarui.', 'success', 'Profil Disimpan');
    return { success: true };
  };

  // Reset Password function (User self-service)
  const resetPassword = (phone, newPassword) => {
    const normPhone = normalizePhone(phone);
    const index = registeredUsers.findIndex((u) => normalizePhone(u.phone) === normPhone);

    if (index === -1) {
      showToast('Nomor HP tidak terdaftar dalam sistem.', 'error', 'Reset Gagal');
      return { success: false, error: 'Nomor HP tidak ditemukan' };
    }

    const updatedUsers = [...registeredUsers];
    updatedUsers[index] = {
      ...updatedUsers[index],
      password: newPassword,
    };

    setRegisteredUsers(updatedUsers);
    showToast('Password berhasil diperbarui! Silakan masuk dengan password baru Anda.', 'success', 'Reset Berhasil');
    return { success: true };
  };

  // Requirement 41: Admin Reset Password Feature
  // Resets teacher's password back to 'guru123' in the global state
  const adminResetPassword = (teacherPhone) => {
    const normPhone = normalizePhone(teacherPhone);
    let targetName = '';

    const teacherInMaster = teachers.find((t) => normalizePhone(t.phone) === normPhone);
    const teacherInRegistered = registeredUsers.find((u) => normalizePhone(u.phone) === normPhone);
    targetName = teacherInMaster?.name || teacherInRegistered?.name || teacherPhone;

    // 1. Update in registeredUsers
    setRegisteredUsers((prev) => {
      const exists = prev.some((u) => normalizePhone(u.phone) === normPhone);
      if (exists) {
        return prev.map((u) =>
          normalizePhone(u.phone) === normPhone ? { ...u, password: DEFAULT_TEACHER_PASSWORD } : u
        );
      } else if (teacherInMaster) {
        const userJabatan = teacherInMaster.jabatan || ['Guru Mapel'];
        return [
          ...prev,
          {
            name: teacherInMaster.name,
            phone: normPhone,
            password: DEFAULT_TEACHER_PASSWORD,
            role: isKepalaSekolah(userJabatan) ? 'admin' : 'teacher',
            jabatan: userJabatan,
          },
        ];
      }
      return prev;
    });

    // 2. Update in teachers master list
    setTeachers((prev) =>
      prev.map((t) =>
        normalizePhone(t.phone) === normPhone ? { ...t, password: DEFAULT_TEACHER_PASSWORD } : t
      )
    );

    // 3. Update current session if currently viewing as that teacher
    if (currentUser && normalizePhone(currentUser.phone) === normPhone) {
      setCurrentUser((prev) => ({ ...prev, password: DEFAULT_TEACHER_PASSWORD }));
    }

    showToast(`Password untuk ${targetName} berhasil di-reset ke "${DEFAULT_TEACHER_PASSWORD}".`, 'success', 'Password Direset');
    return { success: true };
  };

  // Update User Phone Number across all related collections
  const updateUserPhoneNumber = (oldPhone, newPhone) => {
    const normOld = normalizePhone(oldPhone);
    const normNew = normalizePhone(newPhone);

    if (!normNew || normNew.length < 9) {
      showToast('Nomor HP baru tidak valid.', 'error', 'Format Nomor Salah');
      return { success: false, error: 'Nomor HP tidak valid' };
    }

    if (normOld === normNew) {
      showToast('Nomor HP baru tidak boleh sama dengan nomor sebelumnya.', 'error', 'Nomor Sama');
      return { success: false, error: 'Nomor sama' };
    }

    // Check if new phone is already registered to another user
    const existing = registeredUsers.find((u) => normalizePhone(u.phone) === normNew);
    if (existing) {
      showToast('Nomor HP baru sudah terdaftar untuk pengguna lain.', 'error', 'Nomor Sudah Digunakan');
      return { success: false, error: 'Nomor HP sudah terdaftar' };
    }

    // 1. Update registeredUsers
    setRegisteredUsers((prev) =>
      prev.map((u) => (normalizePhone(u.phone) === normOld ? { ...u, phone: normNew } : u))
    );

    // 2. Update teachers master data
    setTeachers((prev) =>
      prev.map((t) => (normalizePhone(t.phone) === normOld ? { ...t, phone: normNew } : t))
    );

    // 3. Update attendance history
    setAttendance((prev) =>
      prev.map((a) => (normalizePhone(a.teacherPhone) === normOld ? { ...a, teacherPhone: normNew } : a))
    );

    // 4. Update completed teaching sessions
    setCompletedSessions((prev) =>
      prev.map((s) => (normalizePhone(s.teacherPhone) === normOld ? { ...s, teacherPhone: normNew } : s))
    );

    // 5. Update salary slips
    setSalarySlips((prev) =>
      prev.map((slip) => (normalizePhone(slip.teacherPhone) === normOld ? { ...slip, teacherPhone: normNew } : slip))
    );

    // 6. Update schedules map if keyed by phone
    setSchedules((prev) => {
      if (!prev[normOld]) return prev;
      const copy = { ...prev };
      copy[normNew] = copy[normOld];
      delete copy[normOld];
      return copy;
    });

    // 7. Update active currentUser session
    if (currentUser && normalizePhone(currentUser.phone) === normOld) {
      setCurrentUser((prev) => ({ ...prev, phone: normNew }));
    }

    showToast(`Nomor HP berhasil diperbarui menjadi ${normNew}!`, 'success', 'Nomor HP Diperbarui');
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Anda telah keluar dari aplikasi.', 'info', 'Logout Berhasil');
  };

  // Clock In (Absen Masuk: Hadir, Sakit, Izin, Lainnya, or Absen Susulan)
  const clockIn = (teacherUser, attendanceData = {}) => {
    const today = getTodayDateString();
    const user = teacherUser || currentUser;

    if (!user) return { success: false, error: 'Tidak ada pengguna aktif' };

    const normPhone = normalizePhone(user.phone);
    const targetDate = attendanceData.date || today;
    const isBackdated = targetDate < today;

    // Check if already clocked in for targetDate
    const existingIndex = attendance.findIndex(
      (a) => normalizePhone(a.teacherPhone) === normPhone && a.date === targetDate
    );
    const alreadyClockedIn = existingIndex >= 0 ? attendance[existingIndex] : null;

    if (alreadyClockedIn && !attendanceData.isUpdate) {
      showToast(
        `Anda sudah melakukan presensi pada ${targetDate} (${alreadyClockedIn.attendanceStatus || alreadyClockedIn.status}) pukul ${alreadyClockedIn.time} WIB.`,
        'info',
        'Sudah Presensi'
      );
      return { success: false, error: 'Sudah absen', record: alreadyClockedIn };
    }

    const now = new Date();
    const timeString = isBackdated
      ? (attendanceData.time || '07:15:00')
      : now.toTimeString().split(' ')[0];

    const attendanceStatus = attendanceData.attendanceStatus || 'Hadir';
    const note = (attendanceData.note || (isBackdated ? 'Absen Susulan' : '')).trim();

    // Validation: if status is Sakit, Izin, or Lainnya, note is required
    if (attendanceStatus !== 'Hadir' && !note) {
      showToast('Keterangan alasan wajib diisi untuk status Sakit, Izin, atau Lainnya.', 'error', 'Keterangan Wajib Diisi');
      return { success: false, error: 'Keterangan wajib diisi' };
    }

    // Hadir status simplified: pure timestamp recording without late/on-time calculations
    const finalStatus = attendanceStatus;

    // If updating existing record
    if (alreadyClockedIn && attendanceData.isUpdate) {
      const updatedRecord = {
        ...alreadyClockedIn,
        attendanceStatus,
        status: finalStatus,
        note: attendanceStatus === 'Hadir' ? (isBackdated ? 'Absen Susulan' : '') : note,
        updatedAt: now.toTimeString().split(' ')[0] + ' WIB',
      };

      setAttendance((prev) =>
        prev.map((rec) => (rec.id === alreadyClockedIn.id ? updatedRecord : rec))
      );

      showToast(
        `Status presensi tanggal ${targetDate} berhasil diubah menjadi "${attendanceStatus}".`,
        'success',
        'Status Presensi Diperbarui'
      );

      return { success: true, record: updatedRecord, updated: true };
    }

    const newRecord = {
      id: `att-${Date.now()}`,
      teacherPhone: user.phone,
      teacherName: user.name,
      date: targetDate,
      time: timeString,
      attendanceStatus, // 'Hadir' | 'Sakit' | 'Izin' | 'Lainnya'
      status: finalStatus,
      note, // Reason explanation
      method: isBackdated ? 'Absen Susulan (Aplikasi)' : 'Aplikasi Guru RJ',
    };

    setAttendance((prev) => [newRecord, ...prev]);

    if (attendanceStatus === 'Hadir') {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#22c55e', '#16a34a', '#86efac', '#ffffff'],
        });
      } catch (e) {}

      showToast(
        isBackdated
          ? `Absen Susulan (${targetDate}) berhasil dicatat sebagai Hadir! Jadwal dan uang transport kini aktif.`
          : `Absen Masuk (Hadir) berhasil tercatat pada ${timeString} WIB. Semangat mengajar hari ini!`,
        'success',
        isBackdated ? 'Absen Susulan Berhasil! 🎉' : 'Presensi Hadir Berhasil! 🎉'
      );
    } else {
      showToast(
        `Presensi (${attendanceStatus}) pada ${targetDate} berhasil disimpan.${note ? ` Keterangan: "${note}"` : ''}`,
        'info',
        `Status ${attendanceStatus} Tercatat`
      );
    }

    return { success: true, record: newRecord };
  };

  const isClockedInToday = (phone, date = getTodayDateString()) => {
    const targetDate = date || getTodayDateString();
    const targetPhone = normalizePhone(phone || currentUser?.phone);
    return attendance.find((a) => normalizePhone(a.teacherPhone) === targetPhone && a.date === targetDate);
  };

  // Admin Mark Attendance
  const adminMarkAttendance = (teacherPhone, teacherName, date = getTodayDateString(), statusData = {}) => {
    const norm = normalizePhone(teacherPhone);
    const existingIndex = attendance.findIndex(
      (a) => normalizePhone(a.teacherPhone) === norm && a.date === date
    );

    if (existingIndex >= 0) {
      const updated = [...attendance];
      updated.splice(existingIndex, 1);
      setAttendance(updated);
      showToast(`Status presensi ${teacherName} direset menjadi Belum Hadir.`, 'info', 'Presensi Dihapus');
    } else {
      const now = new Date();
      const timeString = now.toTimeString().split(' ')[0];
      const attendanceStatus = statusData.attendanceStatus || 'Hadir';
      const note = statusData.note || '';
      const newRec = {
        id: `att-${Date.now()}`,
        teacherPhone,
        teacherName,
        date,
        time: timeString,
        attendanceStatus,
        status: statusData.status || attendanceStatus,
        note,
        method: 'Verifikasi Admin',
      };
      setAttendance((prev) => [newRec, ...prev]);
      showToast(`Presensi ${teacherName} berhasil ditandai ${attendanceStatus} (${timeString} WIB).`, 'success', 'Presensi Berhasil');
    }
  };

  const updateSalarySlip = (slipId, updatedFields) => {
    setSalarySlips((prev) =>
      prev.map((slip) => (slip.id === slipId ? { ...slip, ...updatedFields } : slip))
    );
    showToast('Data slip gaji berhasil diperbarui.', 'success', 'Slip Gaji Disimpan');
  };

  const createSalarySlip = (newSlip) => {
    setSalarySlips((prev) => [newSlip, ...prev]);
    showToast('Slip gaji baru berhasil ditambahkan.', 'success', 'Slip Gaji Diterbitkan');
  };

  const resetAllData = () => {
    localStorage.removeItem('guru_rj_teachers_v2');
    localStorage.removeItem('guru_rj_users_v2');
    localStorage.removeItem('guru_rj_attendance_v2');
    localStorage.removeItem('guru_rj_salary_slips_v2');
    localStorage.removeItem('guru_rj_schedules_v2');
    localStorage.removeItem('guru_rj_completed_sessions_v2');
    setTeachers([]);
    setRegisteredUsers([]);
    setAttendance([]);
    setSalarySlips([]);
    setSchedules({});
    setCompletedSessions([]);
    showToast('Seluruh data demo telah dibersihkan untuk produksi.', 'info', 'Data Dibersihkan');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        teachers,
        attendance,
        salarySlips,
        schedules,
        completedSessions,
        toggleTeachingSession,
        claimBadalSession,
        deleteBadalSession,
        calculateTeacherSalary,
        getTeacherCompletedSessions,
        RATE_PER_SESSION,
        RATE_PER_BADAL_SESSION,
        calculateDailyTransport,
        toast,
        showToast,
        hideToast,
        login,
        loginByRoleOTP,
        loginByRolePassword,
        register,
        resetPassword,
        adminResetPassword,
        DEFAULT_TEACHER_PASSWORD,
        findUserByPhone,
        logout,
        clockIn,
        isClockedInToday,
        adminMarkAttendance,
        updateSalarySlip,
        createSalarySlip,
        updateTeacherProfile,
        updateUserPhoneNumber,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
