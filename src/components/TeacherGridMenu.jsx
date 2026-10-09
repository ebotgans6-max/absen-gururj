import React from 'react';
import {
  Clock,
  LogOut,
  Calendar,
  UserCheck,
  Briefcase,
  User,
  LayoutGrid,
} from 'lucide-react';

export default function TeacherGridMenu({
  onClockIn,
  onClockOut,
  onSchedule,
  onBadal,
  onJabatan,
  onProfile,
  onOtherMenu,
  todayRecord,
}) {
  const menuList = [
    {
      id: 'absen-masuk',
      label: 'Absen Masuk',
      bgClass: 'bg-green-100 hover:bg-green-200/80',
      icon: <Clock className="w-6 h-6 text-green-600" />,
      onClick: onClockIn,
      badge: todayRecord ? 'Sudah' : null,
    },
    {
      id: 'absen-pulang',
      label: 'Absen Pulang',
      bgClass: 'bg-orange-100 hover:bg-orange-200/80',
      icon: <LogOut className="w-6 h-6 text-orange-600" />,
      onClick: onClockOut,
      badge: todayRecord?.outTime ? 'Selesai' : null,
    },
    {
      id: 'jadwal-mengajar',
      label: 'Jadwal Mengajar',
      bgClass: 'bg-blue-100 hover:bg-blue-200/80',
      icon: <Calendar className="w-6 h-6 text-blue-600" />,
      onClick: onSchedule,
    },
    {
      id: 'klaim-jam-badal',
      label: 'Klaim Jam Badal',
      bgClass: 'bg-yellow-100 hover:bg-yellow-200/80',
      icon: <UserCheck className="w-6 h-6 text-amber-600" />,
      onClick: onBadal,
    },
    {
      id: 'kelola-jabatan',
      label: 'Kelola Jabatan',
      bgClass: 'bg-green-100 hover:bg-green-200/80',
      icon: <Briefcase className="w-6 h-6 text-green-600" />,
      onClick: onJabatan,
    },
    {
      id: 'profil-guru',
      label: 'Profil Guru',
      bgClass: 'bg-blue-100 hover:bg-blue-200/80',
      icon: <User className="w-6 h-6 text-blue-600" />,
      onClick: onProfile,
    },
    {
      id: 'menu-lainnya',
      label: 'Menu Lainnya',
      bgClass: 'bg-gray-100 hover:bg-gray-200/80',
      icon: <LayoutGrid className="w-6 h-6 text-gray-600" />,
      onClick: onOtherMenu,
    },
  ];

  return (
    <div className="w-full">
      {/* Teks Judul */}
      <h2 className="text-sm sm:text-base font-bold text-slate-800 mb-4 px-0.5">
        Menu Layanan Guru
      </h2>

      {/* Grid 4 Kolom */}
      <div className="grid grid-cols-4 gap-y-6 gap-x-2">
        {menuList.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={item.onClick}
            className="flex flex-col items-center group cursor-pointer focus:outline-none transition-all active:scale-95"
          >
            <div className="relative">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto transition-transform group-hover:scale-105 shadow-2xs ${item.bgClass}`}
              >
                {item.icon}
              </div>
              {item.badge && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-emerald-600 text-[8px] font-black text-white shadow-2xs">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] font-medium text-center mt-2 text-gray-700 leading-tight line-clamp-2">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
