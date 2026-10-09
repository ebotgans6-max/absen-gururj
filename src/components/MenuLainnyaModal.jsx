import React from 'react';
import {
  X,
  UserCheck,
  Briefcase,
  User,
  FileText,
  Bell,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';

export default function MenuLainnyaModal({
  isOpen,
  onClose,
  onOpenBadal,
  onOpenJabatan,
  onOpenProfile,
  onOpenSalarySlip,
  onTestNotification,
}) {
  if (!isOpen) return null;

  const extraMenus = [
    {
      title: 'Klaim Jam Badal',
      desc: 'Klaim honor guru pengganti kelas (Rp 3.000 / sesi)',
      icon: <UserCheck className="w-5 h-5 text-amber-600" />,
      bgIcon: 'bg-amber-100',
      badge: 'Rp 3.000/sesi',
      action: () => {
        onClose();
        onOpenBadal();
      },
    },
    {
      title: 'Kelola Jabatan',
      desc: 'Pilih dan ubah jabatan penugasan di sekolah',
      icon: <Briefcase className="w-5 h-5 text-emerald-600" />,
      bgIcon: 'bg-emerald-100',
      action: () => {
        onClose();
        onOpenJabatan();
      },
    },
    {
      title: 'Profil Guru & Keamanan',
      desc: 'Informasi akun, reset PIN/sandi, dan kontak',
      icon: <User className="w-5 h-5 text-blue-600" />,
      bgIcon: 'bg-blue-100',
      action: () => {
        onClose();
        onOpenProfile();
      },
    },
    {
      title: 'Slip Gaji Bulanan',
      desc: 'Rekap kehadiran, tunjangan jabatan & unduh slip',
      icon: <FileText className="w-5 h-5 text-indigo-600" />,
      bgIcon: 'bg-indigo-100',
      action: () => {
        onClose();
        onOpenSalarySlip();
      },
    },
    {
      title: 'Tes Notifikasi Pengingat',
      desc: 'Jadwal alarm pengingat absen masuk otomatis 09:00 WIB',
      icon: <Bell className="w-5 h-5 text-purple-600" />,
      bgIcon: 'bg-purple-100',
      action: () => {
        onClose();
        onTestNotification();
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid grid-cols-2 gap-1 w-6 h-6 place-items-center bg-slate-100 p-1 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-[2px] bg-slate-600"></span>
              <span className="w-1.5 h-1.5 rounded-[2px] bg-slate-600"></span>
              <span className="w-1.5 h-1.5 rounded-[2px] bg-slate-600"></span>
              <span className="w-1.5 h-1.5 rounded-[2px] bg-slate-600"></span>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                Menu & Layanan Lainnya
              </h3>
              <p className="text-[11px] text-slate-500">
                Fitur tambahan terintegrasi Absen Guru RJ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List Menu */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-2.5">
          {extraMenus.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={item.action}
              className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-slate-100/90 active:scale-[0.99] border border-slate-100 transition-all flex items-center justify-between text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0 pr-2">
                <div
                  className={`w-11 h-11 rounded-2xl ${item.bgIcon} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
                >
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-800 truncate">
                      {item.title}
                    </h4>
                    {item.badge && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-extrabold border border-amber-200">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {item.desc}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Absensi Guru RJ • Sistem Manajemen Presensi & Honor
          </p>
        </div>
      </div>
    </div>
  );
}
