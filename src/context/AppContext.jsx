import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase/config';
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
  getScheduleHoursForDate,
  ATTENDANCE_SCHEDULE_HOURS,
} from '../data/initialData';

const AppContext = createContext();

// Helper to remove any `undefined` values before saving to Firestore
const sanitizeForFirestore = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      clean[k] = typeof v === 'object' && v !== null ? sanitizeForFirestore(v) : v;
    }
  }
  return clean;
};

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

  // 2. Teachers Master Data (Synced with Firestore 'teachers')
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

  // 3. Registered Users with Phone as primary credential (Synced with Firestore 'users')
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('guru_rj_users_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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

  // 4. Current Logged-in User (Per-device session in localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('guru_rj_current_user_v2');
    if (saved) {
      try {
        const user = JSON.parse(saved);
        if (
          DUMMY_TEACHER_NAMES.includes(user.name) ||
          DUMMY_TEACHER_PHONES.includes(normalizePhone(user.phone))
        ) {
          localStorage.removeItem('guru_rj_current_user_v2');
          return null;
        }
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

  // 5. Attendance Records (Synced with Firestore 'attendance')
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

  // 6. Salary Slips (Synced with Firestore 'salarySlips')
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

  // 7. Teaching Schedules (Synced with Firestore 'schedules')
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

  // 8. Completed Teaching Sessions (Synced with Firestore 'completedSessions')
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

  // =========================================================================
  // REAL-TIME FIRESTORE SYNCHRONIZATION (onSnapshot + Initial Auto-Migration)
  // =========================================================================
  useEffect(() => {
    // 1. One-time Migration from localStorage to Firestore (if local data exists)
    const runMigration = async () => {
      try {
        const savedUsers = localStorage.getItem('guru_rj_users_v2');
        if (savedUsers) {
          const list = JSON.parse(savedUsers);
          for (const u of list) {
            if (u.phone) {
              const norm = normalizePhone(u.phone);
              await setDoc(doc(db, 'users', norm), sanitizeForFirestore({ ...u, phone: norm }), { merge: true });
            }
          }
        }

        const savedTeachers = localStorage.getItem('guru_rj_teachers_v2');
        if (savedTeachers) {
          const list = JSON.parse(savedTeachers);
          for (const t of list) {
            if (t.phone) {
              const norm = normalizePhone(t.phone);
              await setDoc(doc(db, 'teachers', norm), sanitizeForFirestore({ ...t, phone: norm }), { merge: true });
            }
          }
        }

        const savedAtt = localStorage.getItem('guru_rj_attendance_v2');
        if (savedAtt) {
          const list = JSON.parse(savedAtt);
          for (const a of list) {
            if (a.id) {
              await setDoc(doc(db, 'attendance', a.id), sanitizeForFirestore(a), { merge: true });
            }
          }
        }

        const savedSessions = localStorage.getItem('guru_rj_completed_sessions_v2');
        if (savedSessions) {
          const list = JSON.parse(savedSessions);
          for (const s of list) {
            if (s.id) {
              await setDoc(doc(db, 'completedSessions', s.id), sanitizeForFirestore(s), { merge: true });
            }
          }
        }

        const savedSlips = localStorage.getItem('guru_rj_salary_slips_v2');
        if (savedSlips) {
          const list = JSON.parse(savedSlips);
          for (const slip of list) {
            if (slip.id) {
              await setDoc(doc(db, 'salarySlips', slip.id), sanitizeForFirestore(slip), { merge: true });
            }
          }
        }

        const savedSched = localStorage.getItem('guru_rj_schedules_v2');
        if (savedSched) {
          const map = JSON.parse(savedSched);
          for (const [phone, items] of Object.entries(map)) {
            const norm = normalizePhone(phone);
            await setDoc(doc(db, 'schedules', norm), sanitizeForFirestore({ phone: norm, items }), { merge: true });
          }
        }
      } catch (err) {
        console.warn('Initial Firestore sync/migration note:', err);
      }
    };

    runMigration();

    // 2. Real-time Firestore Listeners (Web & Android Sync in Real-Time)
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && !DUMMY_TEACHER_PHONES.includes(normalizePhone(data.phone))) {
            list.push(data);
          }
        });
        setRegisteredUsers(list);
      },
      (err) => console.warn('Firestore users listener error:', err)
    );

    const unsubTeachers = onSnapshot(
      collection(db, 'teachers'),
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && !DUMMY_TEACHER_PHONES.includes(normalizePhone(data.phone))) {
            list.push(data);
          }
        });
        setTeachers(list);
      },
      (err) => console.warn('Firestore teachers listener error:', err)
    );

    const unsubAttendance = onSnapshot(
      collection(db, 'attendance'),
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && !DUMMY_TEACHER_PHONES.includes(normalizePhone(data.teacherPhone))) {
            list.push(data);
          }
        });
        list.sort((a, b) => ((b.date || '') + (b.time || '')).localeCompare((a.date || '') + (a.time || '')));
        setAttendance(list);
      },
      (err) => console.warn('Firestore attendance listener error:', err)
    );

    const unsubSessions = onSnapshot(
      collection(db, 'completedSessions'),
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && !DUMMY_TEACHER_PHONES.includes(normalizePhone(data.teacherPhone))) {
            list.push(data);
          }
        });
        setCompletedSessions(list);
      },
      (err) => console.warn('Firestore completedSessions listener error:', err)
    );

    const unsubSlips = onSnapshot(
      collection(db, 'salarySlips'),
      (snapshot) => {
        const list = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && !DUMMY_TEACHER_PHONES.includes(normalizePhone(data.teacherPhone))) {
            list.push(data);
          }
        });
        setSalarySlips(list);
      },
      (err) => console.warn('Firestore salarySlips listener error:', err)
    );

    const unsubSchedules = onSnapshot(
      collection(db, 'schedules'),
      (snapshot) => {
        const map = {};
        snapshot.forEach((d) => {
          const data = d.data();
          if (data && data.phone) {
            map[data.phone] = data.items || [];
          }
        });
        setSchedules(map);
      },
      (err) => console.warn('Firestore schedules listener error:', err)
    );

    return () => {
      unsubUsers();
      unsubTeachers();
      unsubAttendance();
      unsubSessions();
      unsubSlips();
      unsubSchedules();
    };
  }, []);

  // =========================================================================
  // APP ACTIONS & FIRESTORE REAL-TIME MUTATIONS
  // =========================================================================

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
      const isOwner =
        normalizePhone(existing.teacherPhone) === normalizePhone(teacher.phone) ||
        teacher.role === 'admin';

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

      // Delete from Firestore
      deleteDoc(doc(db, 'completedSessions', existing.id)).catch((err) =>
        console.error('Firestore delete session error:', err)
      );

      showToast(`Klaim sesi ${className} • ${subject} dibatalkan.`, 'info', 'Sesi Dibatalkan');
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
      completedAt:
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    setCompletedSessions((prev) => [newSession, ...prev]);

    // Save to Firestore
    setDoc(doc(db, 'completedSessions', newSession.id), sanitizeForFirestore(newSession)).catch((err) =>
      console.error('Firestore save session error:', err)
    );

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

  // Claim Substitute Teaching Session (Jam Badal)
  const claimBadalSession = (badalData, teacherUser) => {
    const teacher = teacherUser || currentUser;
    if (!teacher) {
      showToast('Silakan masuk terlebih dahulu untuk mengklaim jam badal.', 'error', 'Perlu Masuk');
      return { success: false, error: 'Unauthorized' };
    }

    const { date = getTodayDateString(), className, subject, notes = '' } = badalData;

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
      completedAt:
        new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB',
    };

    setCompletedSessions((prev) => [newBadalSession, ...prev]);

    // Save to Firestore
    setDoc(doc(db, 'completedSessions', newBadalSession.id), sanitizeForFirestore(newBadalSession)).catch(
      (err) => console.error('Firestore save badal error:', err)
    );

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
    const target = completedSessions.find((s) => s.id === sessionId || s.sessionId === sessionId);
    setCompletedSessions((prev) => prev.filter((s) => s.id !== sessionId && s.sessionId !== sessionId));

    if (target) {
      deleteDoc(doc(db, 'completedSessions', target.id)).catch((err) =>
        console.error('Firestore delete badal error:', err)
      );
    }

    showToast('Klaim sesi badal berhasil dibatalkan.', 'info', 'Badal Dihapus');
    return { success: true };
  };

  // Helper to calculate teacher salary
  const calculateTeacherSalary = (teacherPhone, period) => {
    const norm = normalizePhone(teacherPhone || currentUser?.phone);
    const teacher =
      (teachers || []).find((t) => t && normalizePhone(t.phone) === norm) ||
      (registeredUsers || []).find((u) => u && normalizePhone(u.phone) === norm) ||
      currentUser;

    const allSessions = (completedSessions || []).filter((s) => {
      if (!s) return false;
      const matchesPhone = normalizePhone(s.teacherPhone) === norm;
      const matchesName =
        s.teacherName &&
        teacher?.name &&
        s.teacherName.toLowerCase() === teacher.name.toLowerCase();
      if (!matchesPhone && !matchesName) return false;
      const sessPeriod = s.period || getPeriodFromDate(s.date);
      return !period || sessPeriod === period;
    });

    const regularSessions = allSessions.filter((s) => !s?.isBadal && s?.type !== 'badal');
    const badalSessions = allSessions.filter((s) => s?.isBadal || s?.type === 'badal');

    const totalRegularSessions = regularSessions.length;
    const totalBadalSessions = badalSessions.length;

    const totalHonorSesi = totalRegularSessions * (RATE_PER_SESSION || 7500);
    const totalHonorBadal = totalBadalSessions * (RATE_PER_BADAL_SESSION || 3000);

    const transportData = calculateDailyTransport ? calculateDailyTransport(allSessions) : { totalTransport: 0, dailyBreakdown: [] };
    const totalTransport = transportData?.totalTransport || 0;

    const activeJabatan =
      Array.isArray(teacher?.jabatan) && teacher.jabatan.length > 0
        ? teacher.jabatan
        : typeof teacher?.jabatan === 'string'
        ? [teacher.jabatan]
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
      activeJabatan,
      totalTunjanganJabatan,
      grandTotalSalary,
    };
  };

  const getTeacherCompletedSessions = (teacherPhone, period) => {
    const norm = normalizePhone(teacherPhone || currentUser?.phone);
    return (completedSessions || []).filter(
      (s) => s && normalizePhone(s.teacherPhone) === norm && (!period || s.period === period)
    );
  };

  const findUserByPhone = (rawPhone) => {
    const norm = normalizePhone(rawPhone);
    return (registeredUsers || []).find((u) => u && normalizePhone(u.phone) === norm);
  };

  // Unified Login
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

    const userJabatan = Array.isArray(existing.jabatan)
      ? existing.jabatan
      : typeof existing.jabatan === 'string'
      ? [existing.jabatan]
      : [];

    const hasKepalaSekolah = isKepalaSekolah(userJabatan);
    const role = hasKepalaSekolah ? 'admin' : 'teacher';

    const userSession = {
      name: existing.name || (role === 'admin' ? 'Kepala Sekolah' : `Guru (${normPhone.slice(-4)})`),
      phone: normPhone,
      role,
      jabatan: userJabatan.length > 0 ? userJabatan : role === 'admin' ? ['Kepala Sekolah'] : ['Guru Mapel'],
    };

    if (existing.role !== role) {
      setRegisteredUsers((prev) =>
        prev.map((u) => (normalizePhone(u.phone) === normPhone ? { ...u, role } : u))
      );
      setDoc(doc(db, 'users', normPhone), { role }, { merge: true }).catch((err) =>
        console.error('Firestore update role error:', err)
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

    if (roleType === 'manajemen' && !hasKepalaSekolah) {
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

    const role = hasKepalaSekolah ? 'admin' : 'teacher';
    const userSession = {
      name:
        existing?.name ||
        teacherMaster?.name ||
        (role === 'admin' ? 'Kepala Sekolah' : `Guru (${normPhone.slice(-4)})`),
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

  // Register New User (Saves in Firestore 'users', 'teachers', 'schedules', 'salarySlips')
  const register = (fullName, phone, password, jabatan = ['Guru Mapel'], autoLogin = false) => {
    const normPhone = normalizePhone(phone);
    if (!normPhone || normPhone.length < 9) {
      showToast('Silakan masukkan nomor HP Indonesia yang valid (minimal 10 digit).', 'error', 'Nomor HP Tidak Valid');
      return { success: false, error: 'Nomor HP tidak valid' };
    }

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

    const hasKepalaSekolah = isKepalaSekolah(selectedJabatan);
    const role = hasKepalaSekolah ? 'admin' : 'teacher';

    const newUser = {
      name: fullName.trim(),
      phone: normPhone,
      password: password || '123456',
      role,
      jabatan: selectedJabatan,
      createdAt: new Date().toISOString(),
    };

    setRegisteredUsers((prev) => [...prev, newUser]);

    // Save user to Firestore
    setDoc(doc(db, 'users', normPhone), sanitizeForFirestore(newUser)).catch((err) =>
      console.error('Firestore register user error:', err)
    );

    // If teacher, add to master teachers list and create initial schedule & salary slip
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
      setDoc(doc(db, 'teachers', normPhone), sanitizeForFirestore(newTeacher)).catch((err) =>
        console.error('Firestore register teacher error:', err)
      );

      const defaultSchedules = [
        { id: `s-${Date.now()}-1`, day: 'Senin', time: '08:00 - 09:30', subject: 'Mata Pelajaran Terpadu', class: 'Kelas X-A', room: 'R. 101' },
        { id: `s-${Date.now()}-2`, day: 'Rabu', time: '09:45 - 11:15', subject: 'Mata Pelajaran Terpadu', class: 'Kelas XI-B', room: 'R. 203' },
        { id: `s-${Date.now()}-3`, day: 'Kamis', time: '07:30 - 09:00', subject: 'Praktek Terbimbing', class: 'Kelas XII-A', room: 'Lab Serbaguna' },
      ];
      setSchedules((prev) => ({
        ...prev,
        [normPhone]: defaultSchedules,
      }));
      setDoc(doc(db, 'schedules', normPhone), sanitizeForFirestore({ phone: normPhone, items: defaultSchedules })).catch((err) =>
        console.error('Firestore register schedule error:', err)
      );

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
      setDoc(doc(db, 'salarySlips', newSlip.id), sanitizeForFirestore(newSlip)).catch((err) =>
        console.error('Firestore register salary slip error:', err)
      );
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

    // Update in Firestore
    setDoc(doc(db, 'users', norm), sanitizeForFirestore({ ...updatedFields, ...roleUpdate }), { merge: true }).catch((err) =>
      console.error('Firestore update user profile error:', err)
    );
    setDoc(doc(db, 'teachers', norm), sanitizeForFirestore({ ...updatedFields, ...roleUpdate }), { merge: true }).catch((err) =>
      console.error('Firestore update teacher profile error:', err)
    );

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

    // Save in Firestore
    setDoc(doc(db, 'users', normPhone), { password: newPassword }, { merge: true }).catch((err) =>
      console.error('Firestore reset password error:', err)
    );

    showToast('Password berhasil diperbarui! Silakan masuk dengan password baru Anda.', 'success', 'Reset Berhasil');
    return { success: true };
  };

  // Admin Reset Password Feature
  const adminResetPassword = (teacherPhone) => {
    const normPhone = normalizePhone(teacherPhone);
    let targetName = '';

    const teacherInMaster = teachers.find((t) => normalizePhone(t.phone) === normPhone);
    const teacherInRegistered = registeredUsers.find((u) => normalizePhone(u.phone) === normPhone);
    targetName = teacherInMaster?.name || teacherInRegistered?.name || teacherPhone;

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

    setTeachers((prev) =>
      prev.map((t) =>
        normalizePhone(t.phone) === normPhone ? { ...t, password: DEFAULT_TEACHER_PASSWORD } : t
      )
    );

    if (currentUser && normalizePhone(currentUser.phone) === normPhone) {
      setCurrentUser((prev) => ({ ...prev, password: DEFAULT_TEACHER_PASSWORD }));
    }

    // Persist in Firestore
    setDoc(doc(db, 'users', normPhone), { password: DEFAULT_TEACHER_PASSWORD }, { merge: true }).catch((err) =>
      console.error('Firestore admin reset password user error:', err)
    );
    setDoc(doc(db, 'teachers', normPhone), { password: DEFAULT_TEACHER_PASSWORD }, { merge: true }).catch((err) =>
      console.error('Firestore admin reset password teacher error:', err)
    );

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

    const existing = registeredUsers.find((u) => normalizePhone(u.phone) === normNew);
    if (existing) {
      showToast('Nomor HP baru sudah terdaftar untuk pengguna lain.', 'error', 'Nomor Sudah Digunakan');
      return { success: false, error: 'Nomor HP sudah terdaftar' };
    }

    setRegisteredUsers((prev) =>
      prev.map((u) => (normalizePhone(u.phone) === normOld ? { ...u, phone: normNew } : u))
    );

    setTeachers((prev) =>
      prev.map((t) => (normalizePhone(t.phone) === normOld ? { ...t, phone: normNew } : t))
    );

    setAttendance((prev) =>
      prev.map((a) => (normalizePhone(a.teacherPhone) === normOld ? { ...a, teacherPhone: normNew } : a))
    );

    setCompletedSessions((prev) =>
      prev.map((s) => (normalizePhone(s.teacherPhone) === normOld ? { ...s, teacherPhone: normNew } : s))
    );

    setSalarySlips((prev) =>
      prev.map((slip) => (normalizePhone(slip.teacherPhone) === normOld ? { ...slip, teacherPhone: normNew } : slip))
    );

    setSchedules((prev) => {
      if (!prev[normOld]) return prev;
      const copy = { ...prev };
      copy[normNew] = copy[normOld];
      delete copy[normOld];
      return copy;
    });

    if (currentUser && normalizePhone(currentUser.phone) === normOld) {
      setCurrentUser((prev) => ({ ...prev, phone: normNew }));
    }

    // Asynchronously update in Firestore
    (async () => {
      try {
        const oldUser = await getDoc(doc(db, 'users', normOld));
        if (oldUser.exists()) {
          await setDoc(doc(db, 'users', normNew), sanitizeForFirestore({ ...oldUser.data(), phone: normNew }));
          await deleteDoc(doc(db, 'users', normOld));
        }
        const oldTeacher = await getDoc(doc(db, 'teachers', normOld));
        if (oldTeacher.exists()) {
          await setDoc(doc(db, 'teachers', normNew), sanitizeForFirestore({ ...oldTeacher.data(), phone: normNew }));
          await deleteDoc(doc(db, 'teachers', normOld));
        }
        const oldSched = await getDoc(doc(db, 'schedules', normOld));
        if (oldSched.exists()) {
          await setDoc(doc(db, 'schedules', normNew), sanitizeForFirestore({ ...oldSched.data(), phone: normNew }));
          await deleteDoc(doc(db, 'schedules', normOld));
        }
      } catch (e) {
        console.warn('Firestore phone migration error:', e);
      }
    })();

    showToast(`Nomor HP berhasil diperbarui menjadi ${normNew}.`, 'success', 'Nomor HP Berubah');
    return { success: true, newPhone: normNew };
  };

  const logout = () => {
    setCurrentUser(null);
    showToast('Anda telah berhasil keluar dari akun.', 'info', 'Logout');
  };

  // Clock In (Absen Masuk)
  const clockIn = (teacherUser, attendanceData = {}) => {
    const today = getTodayDateString();
    const user = teacherUser || currentUser;

    if (!user) {
      showToast('Silakan masuk terlebih dahulu untuk melakukan presensi.', 'error', 'Perlu Masuk');
      return { success: false, error: 'Tidak ada pengguna' };
    }

    const normPhone = normalizePhone(user.phone);
    const targetDate = attendanceData.date || today;
    const isBackdated = targetDate < today;

    const alreadyClockedIn = attendance.find(
      (a) => normalizePhone(a.teacherPhone) === normPhone && a.date === targetDate
    );

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
      ? attendanceData.time || '07:15:00'
      : now.toTimeString().split(' ')[0];

    const attendanceStatus = attendanceData.attendanceStatus || 'Hadir';
    const note = (attendanceData.note || (isBackdated ? 'Absen Susulan' : '')).trim();

    if (attendanceStatus !== 'Hadir' && !note) {
      showToast('Keterangan alasan wajib diisi untuk status Sakit, Izin, atau Lainnya.', 'error', 'Keterangan Wajib Diisi');
      return { success: false, error: 'Keterangan wajib diisi' };
    }

    const finalStatus = attendanceStatus;
    const scheduleHours = getScheduleHoursForDate(targetDate);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const isLate = !isBackdated && attendanceStatus === 'Hadir' && nowMinutes > scheduleHours.inMinutes;
    const lateMinutes = isLate ? nowMinutes - scheduleHours.inMinutes : 0;

    // If updating existing record
    if (alreadyClockedIn && attendanceData.isUpdate) {
      const updatedRecord = {
        ...alreadyClockedIn,
        attendanceStatus,
        status: finalStatus,
        note: attendanceStatus === 'Hadir' ? (isBackdated ? 'Absen Susulan' : '') : note,
        isLate,
        lateMinutes,
        targetInTime: scheduleHours.inLabel,
        updatedAt: now.toTimeString().split(' ')[0] + ' WIB',
      };

      setAttendance((prev) =>
        prev.map((rec) => (rec.id === alreadyClockedIn.id ? updatedRecord : rec))
      );

      // Save in Firestore
      setDoc(doc(db, 'attendance', alreadyClockedIn.id), sanitizeForFirestore(updatedRecord), { merge: true }).catch((err) =>
        console.error('Firestore update attendance error:', err)
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
      outTime: attendanceData.outTime || null,
      attendanceStatus,
      status: finalStatus,
      isLate,
      lateMinutes,
      targetInTime: scheduleHours.inLabel,
      note,
      method: isBackdated ? 'Absen Susulan (Aplikasi)' : 'Aplikasi Guru RJ',
    };

    setAttendance((prev) => [newRecord, ...prev]);

    // Save in Firestore
    setDoc(doc(db, 'attendance', newRecord.id), sanitizeForFirestore(newRecord)).catch((err) =>
      console.error('Firestore save attendance error:', err)
    );

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
          : isLate
          ? `Absen Masuk (Hadir) tercatat pukul ${timeString} WIB (${lateMinutes} mnt setelah jam ${scheduleHours.inLabel}). Semangat mengajar!`
          : `Absen Masuk (Hadir) tepat waktu tercatat pukul ${timeString} WIB. (Batas masuk: ${scheduleHours.inLabel}). Semangat mengajar!`,
        'success',
        isBackdated ? 'Absen Susulan Berhasil! 🎉' : isLate ? 'Presensi Masuk Tercatat ⏰' : 'Presensi Hadir Berhasil! 🎉'
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

  // Clock Out (Absen Pulang)
  const clockOut = (teacherUser, outData = {}) => {
    const today = getTodayDateString();
    const user = teacherUser || currentUser;

    if (!user) return { success: false, error: 'Tidak ada pengguna aktif' };

    const normPhone = normalizePhone(user.phone);
    const targetDate = outData.date || today;

    const existingIndex = attendance.findIndex(
      (a) => normalizePhone(a.teacherPhone) === normPhone && a.date === targetDate
    );

    if (existingIndex < 0) {
      showToast(
        'Silakan lakukan Absen Masuk terlebih dahulu sebelum melakukan Absen Pulang.',
        'error',
        'Belum Absen Masuk'
      );
      return { success: false, error: 'Belum absen masuk' };
    }

    const existing = attendance[existingIndex];
    if (existing.outTime && !outData.isUpdate) {
      showToast(
        `Anda sudah melakukan Absen Pulang pada pukul ${existing.outTime} WIB.`,
        'info',
        'Sudah Absen Pulang'
      );
      return { success: false, error: 'Sudah absen pulang', record: existing };
    }

    const now = new Date();
    const timeString = outData.time || now.toTimeString().split(' ')[0];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const scheduleHours = getScheduleHoursForDate(targetDate);

    const isEarly = !outData.isBackdated && currentMinutes < scheduleHours.outMinutes;

    if (isEarly && !outData.allowEarly) {
      showToast(
        `Belum memasuki jam pulang! Patokan jam pulang hari ${scheduleHours.isFriday ? 'Jumat' : 'Senin s/d Kamis'} adalah pukul ${scheduleHours.outLabel}.`,
        'warning',
        'Belum Waktunya Pulang'
      );
      return {
        success: false,
        error: 'Belum jam pulang',
        outMinutes: scheduleHours.outMinutes,
        outLabel: scheduleHours.outLabel,
      };
    }

    const updatedRecord = {
      ...existing,
      outTime: timeString,
      outStatus: isEarly ? 'Pulang Lebih Awal' : 'Selesai Bertugas',
      targetOutTime: scheduleHours.outLabel,
    };

    setAttendance((prev) =>
      prev.map((rec) => (rec.id === existing.id ? updatedRecord : rec))
    );

    // Save to Firestore
    setDoc(doc(db, 'attendance', existing.id), sanitizeForFirestore(updatedRecord), { merge: true }).catch((err) =>
      console.error('Firestore clockOut error:', err)
    );

    try {
      confetti({
        particleCount: 60,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#059669', '#10b981', '#34d399', '#ffffff'],
      });
    } catch (e) {}

    showToast(
      `Absen Pulang berhasil dicatat pada pukul ${timeString} WIB. Terima kasih atas dedikasi Anda hari ini!`,
      'success',
      'Absen Pulang Berhasil! 👋'
    );

    return { success: true, record: updatedRecord };
  };

  const isClockedInToday = (phone, date = getTodayDateString()) => {
    const targetDate = date || getTodayDateString();
    const targetPhone = normalizePhone(phone || currentUser?.phone);
    return (attendance || []).find((a) => a && normalizePhone(a.teacherPhone) === targetPhone && a.date === targetDate);
  };

  // Admin Mark Attendance
  const adminMarkAttendance = (teacherPhone, teacherName, date = getTodayDateString(), statusData = {}) => {
    const norm = normalizePhone(teacherPhone);
    const existingIndex = attendance.findIndex(
      (a) => normalizePhone(a.teacherPhone) === norm && a.date === date
    );

    if (existingIndex >= 0) {
      const existing = attendance[existingIndex];
      const updated = [...attendance];
      updated.splice(existingIndex, 1);
      setAttendance(updated);

      // Remove from Firestore
      deleteDoc(doc(db, 'attendance', existing.id)).catch((err) =>
        console.error('Firestore delete attendance error:', err)
      );

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

      // Save to Firestore
      setDoc(doc(db, 'attendance', newRec.id), sanitizeForFirestore(newRec)).catch((err) =>
        console.error('Firestore admin mark attendance error:', err)
      );

      showToast(`Presensi ${teacherName} berhasil ditandai ${attendanceStatus} (${timeString} WIB).`, 'success', 'Presensi Berhasil');
    }
  };

  const updateSalarySlip = (slipId, updatedFields) => {
    setSalarySlips((prev) =>
      prev.map((slip) => (slip.id === slipId ? { ...slip, ...updatedFields } : slip))
    );

    // Save in Firestore
    setDoc(doc(db, 'salarySlips', slipId), sanitizeForFirestore(updatedFields), { merge: true }).catch((err) =>
      console.error('Firestore update salary slip error:', err)
    );

    showToast('Data slip gaji berhasil diperbarui.', 'success', 'Slip Gaji Disimpan');
  };

  const createSalarySlip = (newSlip) => {
    setSalarySlips((prev) => [newSlip, ...prev]);

    // Save in Firestore
    setDoc(doc(db, 'salarySlips', newSlip.id), sanitizeForFirestore(newSlip)).catch((err) =>
      console.error('Firestore create salary slip error:', err)
    );

    showToast('Slip gaji baru berhasil ditambahkan.', 'success', 'Slip Gaji Diterbitkan');
  };

  const resetAllData = async () => {
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

    try {
      const collectionsToClean = ['attendance', 'completedSessions', 'salarySlips'];
      for (const colName of collectionsToClean) {
        const snap = await getDocs(collection(db, colName));
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      }
    } catch (e) {
      console.warn('Error clearing Firestore documents on reset:', e);
    }

    showToast('Seluruh data demo telah dibersihkan untuk produksi.', 'info', 'Data Dibersihkan');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        teachers: teachers || [],
        attendance: attendance || [],
        salarySlips: salarySlips || [],
        schedules: schedules || {},
        completedSessions: completedSessions || [],
        registeredUsers: registeredUsers || [],
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
        clockOut,
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
