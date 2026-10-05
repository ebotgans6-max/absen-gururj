import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  HeartPulse,
  HelpCircle,
  Send,
  RefreshCw,
  Edit3,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTodayDateString, getScheduleHoursForDate } from '../data/initialData';

export default function AttendanceModal({ isOpen, onClose, existingRecord, targetDate }) {
  const { currentUser, clockIn, showToast, isClockedInToday } = useApp();

  const today = getTodayDateString();
  const effectiveDate = targetDate || existingRecord?.date || today;
  const isBackdated = effectiveDate < today;
  const scheduleHours = getScheduleHoursForDate(effectiveDate);

  // Find active record for effectiveDate
  const currentRecord =
    existingRecord || (isClockedInToday ? isClockedInToday(currentUser?.phone, effectiveDate) : null);
  const isEditing = Boolean(currentRecord);

  const resolveStatus = (record) => {
    if (!record) return 'Hadir';
    if (record.attendanceStatus) return record.attendanceStatus;
    if (record.status === 'Tepat Waktu' || record.status === 'Terlambat') return 'Hadir';
    if (['Hadir', 'Sakit', 'Izin', 'Lainnya'].includes(record.status)) return record.status;
    return record.status || 'Hadir';
  };

  const [selectedStatus, setSelectedStatus] = useState(() => resolveStatus(currentRecord));
  const [note, setNote] = useState(() => currentRecord?.note || (isBackdated && !currentRecord ? 'Absen Susulan' : ''));
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state whenever modal opens or currentRecord changes
  useEffect(() => {
    if (isOpen) {
      if (currentRecord) {
        setSelectedStatus(resolveStatus(currentRecord));
        setNote(currentRecord.note || '');
      } else {
        setSelectedStatus('Hadir');
        setNote(isBackdated ? 'Absen Susulan' : '');
      }
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [isOpen, currentRecord, isBackdated]);

  const statusOptions = [
    {
      id: 'Hadir',
      label: 'Hadir',
      sublabel: 'Present',
      desc: isBackdated ? 'Hadir aktif bertugas pada tanggal ini' : 'Hadir aktif bertugas di sekolah hari ini',
      icon: CheckCircle2,
      activeColor: 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20',
      badgeColor: 'bg-emerald-600 text-white',
      iconColor: 'text-emerald-600',
    },
    {
      id: 'Sakit',
      label: 'Sakit',
      sublabel: 'Sick Leave',
      desc: 'Berhalangan hadir karena sakit / perawatan medis',
      icon: HeartPulse,
      activeColor: 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20',
      badgeColor: 'bg-amber-600 text-white',
      iconColor: 'text-amber-600',
    },
    {
      id: 'Izin',
      label: 'Izin',
      sublabel: 'Permitted Absence',
      desc: 'Izin tidak hadir karena dinas luar atau keperluan pribadi',
      icon: FileText,
      activeColor: 'bg-sky-50 border-sky-500 text-sky-900 ring-2 ring-sky-500/20',
      badgeColor: 'bg-sky-600 text-white',
      iconColor: 'text-sky-600',
    },
    {
      id: 'Lainnya',
      label: 'Lainnya',
      sublabel: 'Other Reasons',
      desc: 'Keperluan atau kondisi khusus lainnya',
      icon: HelpCircle,
      activeColor: 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20',
      badgeColor: 'bg-purple-600 text-white',
      iconColor: 'text-purple-600',
    },
  ];

  const handleStatusChange = (statusId) => {
    setSelectedStatus(statusId);
    setErrorMsg('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validation: If not Hadir, note MUST be filled manually
    if (selectedStatus !== 'Hadir' && !note.trim()) {
      setErrorMsg(`Wajib mengisi keterangan alasan untuk status "${selectedStatus}".`);
      showToast(
        `Keterangan alasan wajib diisi untuk status ${selectedStatus}.`,
        'error',
        'Keterangan Kosong'
      );
      return;
    }

    setIsSubmitting(true);

    const res = clockIn(currentUser, {
      date: effectiveDate,
      attendanceStatus: selectedStatus,
      note: selectedStatus === 'Hadir' ? (isBackdated ? 'Absen Susulan' : '') : note.trim(),
      isUpdate: isEditing,
    });

    setIsSubmitting(false);

    if (res?.success) {
      onClose();
    }
  };

  const isNoteRequired = selectedStatus !== 'Hadir';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              {isEditing ? (
                <Edit3 className="w-5 h-5 text-emerald-100" />
              ) : (
                <Clock className="w-5 h-5 text-emerald-100" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isEditing
                  ? 'Ubah Status Presensi'
                  : isBackdated
                  ? `Absen Susulan (${effectiveDate})`
                  : 'Presensi Masuk Hari Ini'}
              </h3>
              <p className="text-xs text-emerald-100/90 truncate max-w-[200px]">
                {currentUser?.name || 'Tenaga Pendidik'}
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

        {/* Operating Hours Info Banner */}
        <div className="mx-6 mt-3 px-3 py-2 bg-emerald-50/80 border border-emerald-200/70 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-[11px]">
              Patokan {scheduleHours.dayName}: Masuk <strong>{scheduleHours.inLabel}</strong> • Pulang <strong>{scheduleHours.outLabel}</strong>
            </span>
          </div>
        </div>

        {/* Backdated Mode Informational Banner */}
        {isBackdated && !isEditing && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-amber-950">Absen Susulan untuk Tanggal Lewat</span>
              <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                Anda sedang mencatat presensi untuk tanggal <strong>{effectiveDate}</strong>. Setelah disimpan, jadwal mengajar dan uang transport harian pada tanggal ini akan langsung dihitung.
              </p>
            </div>
          </div>
        )}

        {/* Edit Mode Alert Banner */}
        {isEditing && (
          <div className="mx-6 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center justify-between gap-1 flex-wrap">
                <span className="font-bold text-amber-950">Mode Ubah Status Presensi</span>
                <span className="text-[10px] font-bold bg-amber-200/90 text-amber-900 px-2 py-0.5 rounded-full">
                  Saat ini: {resolveStatus(currentRecord)}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                Anda sudah melakukan presensi hari ini. Silakan ubah pilihan jika terjadi kesalahan input (misal: ganti Hadir ke Sakit/Izin).
              </p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 bg-white">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              {isEditing ? 'Pilih Status Kehadiran Baru:' : 'Pilih Status Kehadiran Hari Ini:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {statusOptions.map((opt) => {
                const isSelected = selectedStatus === opt.id;
                const IconComponent = opt.icon;

                return (
                  <div
                    key={opt.id}
                    onClick={() => handleStatusChange(opt.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between select-none ${
                      isSelected
                        ? opt.activeColor
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                            isSelected ? opt.badgeColor : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-slate-800 leading-tight">
                            {opt.label}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {opt.sublabel}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center mt-1 ${
                          isSelected
                            ? 'border-brand-600 bg-brand-600'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                      {opt.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic "Keterangan" Input Field if Sakit, Izin, or Lainnya */}
          {isNoteRequired ? (
            <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Keterangan Alasan</span>
                  <span className="text-rose-500 font-black text-xs">* (Wajib Diisi)</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {note.length}/200 Karakter
                </span>
              </div>

              <textarea
                rows={3}
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                maxLength={200}
                required
                placeholder={
                  selectedStatus === 'Sakit'
                    ? 'Tuliskan sakit / gejala yang dialami (misal: Demam tinggi sejak semalam, flu berat)...'
                    : selectedStatus === 'Izin'
                    ? 'Tuliskan keperluan izin (misal: Menghadiri wisuda adik di luar kota, dinas luar)...'
                    : 'Tuliskan keterangan lengkap alasan berhalangan hadir hari ini...'
                }
                className="w-full px-3.5 py-2.5 text-xs rounded-2xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none transition bg-slate-50 focus:bg-white resize-none"
              />

              <p className="text-[10px] text-slate-400 italic">
                *Keterangan ini akan langsung diteruskan ke Admin / Pihak Sekolah pada rekap presensi harian.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-[11px] leading-snug">
                {isEditing ? (
                  <>
                    Mengubah status ke <strong>Hadir</strong> akan mencatat kehadiran aktif Anda hari ini.
                  </>
                ) : (
                  <>
                    Presensi <strong>Hadir</strong> akan mencatat jam masuk secara otomatis saat tombol dikirim.
                  </>
                )}
              </span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-xs text-rose-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="text-[11px] font-semibold">{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (isNoteRequired && !note.trim())}
              className={`flex-1 py-3 px-4 rounded-xl text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedStatus === 'Hadir'
                  ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/30'
                  : selectedStatus === 'Sakit'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                  : selectedStatus === 'Izin'
                  ? 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/30'
                  : 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/30'
              }`}
            >
              {isEditing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Ubah Status Absen</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {selectedStatus === 'Hadir'
                      ? 'Kirim Presensi Hadir'
                      : `Kirim Keterangan ${selectedStatus}`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
