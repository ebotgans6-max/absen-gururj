import React, { useState } from 'react';
import {
  X,
  Calendar,
  BookOpen,
  GraduationCap,
  Sparkles,
  Clock,
  Trash2,
  AlertCircle,
  CheckCircle2,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTodayDateString, RATE_PER_BADAL_SESSION, normalizePhone } from '../data/initialData';

export default function BadalModal({ isOpen, onClose }) {
  const {
    currentUser,
    completedSessions = [],
    claimBadalSession,
    deleteBadalSession,
  } = useApp();

  const [date, setDate] = useState(getTodayDateString());
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Filter teacher's badal sessions for this month / all
  const cleanPhone = normalizePhone(currentUser?.phone);
  const myBadalSessions = completedSessions.filter((s) => {
    const isOwner =
      normalizePhone(s.teacherPhone) === cleanPhone ||
      (currentUser?.name && s.teacherName?.toLowerCase() === currentUser.name.toLowerCase());
    return isOwner && (s.isBadal || s.type === 'badal');
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!className.trim() || !subject.trim()) {
      return;
    }

    setIsSubmitting(true);
    const result = claimBadalSession({
      date,
      className: className.trim(),
      subject: subject.trim(),
      notes: notes.trim(),
    });

    setIsSubmitting(false);
    if (result?.success) {
      // Reset form but keep date
      setClassName('');
      setSubject('');
      setNotes('');
    }
  };

  const quickClasses = ['Kelas 7', 'Kelas 8', 'Kelas 9', 'Kelas 10', 'Kelas 11'];
  const quickSubjects = ['Matematika', 'B. Indonesia', 'B. Inggris', 'IPA', 'IPS', 'PAI', 'PJOK', 'Informatika'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md shadow-xs border border-white/20">
              <UserCheck className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">Klaim Jam Badal</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-black/20 text-amber-100 border border-white/20">
                  Rp 3.000 / Sesi
                </span>
              </div>
              <p className="text-xs text-amber-100/90 truncate max-w-[220px]">
                Guru Pengganti • {currentUser?.name || 'Tenaga Pendidik'}
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

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Rate Notice Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-extrabold text-amber-900 leading-tight">
                Tarif Khusus Jam Badal: Rp 3.000 / Sesi
              </p>
              <p className="text-slate-600 mt-1 leading-relaxed text-[11px]">
                Klaim sesi mengajar guru pengganti secara mandiri. Setiap sesi badal yang disimpan otomatis tercatat dan ditambahkan ke kalkulasi slip gaji Anda.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Date Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Tanggal Menggantikan (Badal)</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              />
            </div>

            {/* 2. Class Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
                <span>Kelas yang Digantikan</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Kelas 7, Kelas 10"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              />
              {/* Quick Class Chips */}
              <div className="flex flex-wrap gap-1 mt-2">
                {quickClasses.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setClassName(c)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition ${
                      className === c
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Subject Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                <span>Mata Pelajaran yang Digantikan</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Matematika, Bahasa Indonesia, PAI"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              />
              {/* Quick Subject Chips */}
              <div className="flex flex-wrap gap-1 mt-2">
                {quickSubjects.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg border transition ${
                      subject === s
                        ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Optional Note Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Keterangan Tambahan (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Menggantikan Pak Budi (Izin Dinas)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-normal text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !className.trim() || !subject.trim()}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 disabled:opacity-50 disabled:pointer-events-none text-white font-bold text-xs shadow-md shadow-amber-600/30 transition flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <UserCheck className="w-4 h-4" />
              <span>Simpan Klaim Badal (+Rp 3.000)</span>
            </button>
          </form>

          {/* Teacher's Claimed Badal Sessions List */}
          <div className="pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Daftar Klaim Badal Saya
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {myBadalSessions.length} Sesi Terklaim
              </span>
            </div>

            {myBadalSessions.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {myBadalSessions.map((badal) => (
                  <div
                    key={badal.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 hover:bg-amber-50/50 transition flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                        ⭐
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-800">
                            {badal.className} • {badal.subject}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-amber-200 text-amber-900">
                            Badal
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {badal.date} {badal.notes ? `• "${badal.notes}"` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-700 text-xs">
                        +Rp 3.000
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteBadalSession(badal.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition"
                        title="Batalkan klaim badal ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-500">
                  Belum ada sesi badal yang diklaim.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
