import React from 'react';
import {
  Clock,
  LogOut,
  Calendar,
  BookOpen,
  FileText,
  GraduationCap,
  CalendarDays,
} from 'lucide-react';

export default function TeacherGridMenu({
  onClockIn,
  onClockOut,
  onSchedule,
  onStudentAssignments,
  onTeachingJournal,
  onStudentGrades,
  onAcademicCalendar,
  onOtherMenu,
  todayRecord,
}) {
  const menuList = [
    {
      id: 'absen-masuk',
      label: 'Absen Masuk',
      bgClass: 'bg-green-100 hover:bg-green-200/90',
      icon: <Clock className="w-6 h-6 text-green-700" />,
      onClick: onClockIn,
      badge: todayRecord ? 'Sudah' : null,
      badgeColor: 'bg-emerald-600',
    },
    {
      id: 'absen-pulang',
      label: 'Absen Pulang',
      bgClass: 'bg-orange-100 hover:bg-orange-200/90',
      icon: <LogOut className="w-6 h-6 text-orange-700" />,
      onClick: onClockOut,
      badge: todayRecord?.outTime ? 'Selesai' : null,
      badgeColor: 'bg-orange-600',
    },
    {
      id: 'jadwal-mengajar',
      label: 'Jadwal Mengajar',
      bgClass: 'bg-blue-100 hover:bg-blue-200/90',
      icon: <Calendar className="w-6 h-6 text-blue-700" />,
      onClick: onSchedule,
    },
    {
      id: 'tugas-siswa',
      label: 'Tugas Siswa',
      bgClass: 'bg-purple-100 hover:bg-purple-200/90',
      icon: <BookOpen className="w-6 h-6 text-purple-700" />,
      onClick: onStudentAssignments,
    },
    {
      id: 'jurnal-kbm',
      label: 'Jurnal KBM',
      bgClass: 'bg-yellow-100 hover:bg-yellow-200/90',
      icon: <FileText className="w-6 h-6 text-yellow-700" />,
      onClick: onTeachingJournal,
    },
    {
      id: 'nilai-siswa',
      label: 'Nilai Siswa',
      bgClass: 'bg-indigo-100 hover:bg-indigo-200/90',
      icon: <GraduationCap className="w-6 h-6 text-indigo-700" />,
      onClick: onStudentGrades,
    },
    {
      id: 'kalender-akademik',
      label: 'Kalender Akademik',
      bgClass: 'bg-cyan-100 hover:bg-cyan-200/90',
      icon: <CalendarDays className="w-6 h-6 text-cyan-700" />,
      onClick: onAcademicCalendar,
    },
    {
      id: 'menu-lainnya',
      label: 'Menu Lainnya',
      bgClass: 'bg-gray-100 hover:bg-gray-200/90',
      // Ikon 4 titik kotak abu-abu khas Gojek
      icon: (
        <div className="grid grid-cols-2 gap-1 w-5 h-5 place-items-center">
          <span className="w-2 h-2 rounded-[2.5px] bg-gray-500"></span>
          <span className="w-2 h-2 rounded-[2.5px] bg-gray-500"></span>
          <span className="w-2 h-2 rounded-[2.5px] bg-gray-500"></span>
          <span className="w-2 h-2 rounded-[2.5px] bg-gray-500"></span>
        </div>
      ),
      onClick: onOtherMenu,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-y-6 gap-x-2 mt-6">
      {menuList.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          className="flex flex-col items-center group cursor-pointer focus:outline-none transition-all active:scale-95"
        >
          <div className="relative">
            <div
              className={`w-[52px] h-[52px] rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-105 shadow-2xs ${item.bgClass}`}
            >
              {item.icon}
            </div>
            {item.badge && (
              <span
                className={`absolute -top-1 -right-1.5 px-1.5 py-0.2 rounded-full text-[8px] font-black text-white shadow-xs ${item.badgeColor}`}
              >
                {item.badge}
              </span>
            )}
          </div>
          <span className="text-[11px] font-medium text-center mt-2 text-gray-700 leading-tight">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
}
