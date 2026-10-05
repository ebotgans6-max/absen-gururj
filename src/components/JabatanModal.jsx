import React, { useState, useEffect } from 'react';
import {
  X,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Save,
  Shield,
  Award,
  Layers,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AVAILABLE_JABATAN } from '../data/initialData';

export default function JabatanModal({ isOpen, onClose }) {
  const { currentUser, updateTeacherProfile, showToast } = useApp();

  // Initialize selected positions from current user's profile
  const [selectedJabatan, setSelectedJabatan] = useState(() => {
    return Array.isArray(currentUser?.jabatan) && currentUser.jabatan.length > 0
      ? currentUser.jabatan
      : ['Wali Kelas'];
  });

  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (currentUser?.jabatan) {
      setSelectedJabatan(currentUser.jabatan);
    }
  }, [currentUser]);

  const handleToggle = (item) => {
    setErrorMsg('');
    if (selectedJabatan.includes(item)) {
      // Validation: Minimum 1 position
      if (selectedJabatan.length <= 1) {
        setErrorMsg('Minimal wajib memilih 1 jabatan.');
        showToast('Minimal wajib memilih 1 jabatan.', 'error', 'Validasi Gagal');
        return;
      }
      setSelectedJabatan((prev) => prev.filter((j) => j !== item));
    } else {
      // Validation: Maximum 5 positions
      if (selectedJabatan.length >= 5) {
        setErrorMsg('Maksimal hanya dapat memilih 5 jabatan.');
        showToast('Maksimal hanya dapat memilih 5 jabatan.', 'error', 'Batas Maksimal');
        return;
      }
      setSelectedJabatan((prev) => [...prev, item]);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (selectedJabatan.length < 1 || selectedJabatan.length > 5) {
      setErrorMsg('Pilih minimal 1 jabatan dan maksimal 5 jabatan.');
      return;
    }

    const res = updateTeacherProfile(currentUser.phone, {
      jabatan: selectedJabatan,
    });

    if (res.success) {
      onClose();
    }
  };

  const isMaxReached = selectedJabatan.length >= 5;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-700 via-brand-600 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Briefcase className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Kelola Jabatan</h3>
              <p className="text-xs text-emerald-100/90 truncate max-w-[200px]">
                {currentUser?.name}
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

        {/* Status Counter Bar */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Status Pilihan:</span>
            <span
              className={`font-extrabold px-2.5 py-0.5 rounded-full text-[11px] ${
                isMaxReached
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {selectedJabatan.length} / 5 Jabatan
            </span>
          </div>

          <span className="text-[11px] text-slate-400 font-medium">
            (Min. 1, Maks. 5)
          </span>
        </div>

        {/* Validation Info Box if max reached */}
        {isMaxReached && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 text-xs text-amber-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-[11px] leading-tight">
              Batas 5 jabatan tercapai. Batalkan salah satu pilihan jika ingin memilih opsi lain.
            </span>
          </div>
        )}

        {/* Error message if any */}
        {errorMsg && (
          <div className="px-6 py-2 bg-rose-50 border-b border-rose-100 flex items-center gap-2 text-xs text-rose-700 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="text-[11px] font-semibold">{errorMsg}</span>
          </div>
        )}

        {/* Checkbox Options Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-2.5 flex-1 bg-white">
          <p className="text-xs text-slate-500 mb-2 font-medium">
            Pilih peran dan tugas tambahan Anda di lingkungan sekolah:
          </p>

          <div className="space-y-2">
            {AVAILABLE_JABATAN.map((item) => {
              const isChecked = selectedJabatan.includes(item);
              // Disable if 3 positions are already selected and this item is NOT checked
              const isDisabled = isMaxReached && !isChecked;

              return (
                <div
                  key={item}
                  onClick={() => !isDisabled && handleToggle(item)}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between select-none ${
                    isChecked
                      ? 'bg-emerald-50/80 border-emerald-300 shadow-soft-sm cursor-pointer'
                      : isDisabled
                      ? 'bg-slate-50 border-slate-200 opacity-45 cursor-not-allowed'
                      : 'bg-white border-slate-200 hover:border-emerald-200 hover:bg-slate-50/80 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={isDisabled}
                      onChange={() => handleToggle(item)}
                      className="w-4 h-4 text-brand-600 rounded-md border-slate-300 focus:ring-brand-500 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div>
                      <h4
                        className={`text-sm font-bold leading-tight ${
                          isChecked
                            ? 'text-emerald-950 font-black'
                            : isDisabled
                            ? 'text-slate-400'
                            : 'text-slate-700'
                        }`}
                      >
                        {item}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {item === 'Kepala Sekolah' && 'Pimpinan utama satuan pendidikan'}
                        {item === 'Wakil Kepsek' && 'Wakil kepala sekolah bidang manajerial'}
                        {item === 'Wk Kurikulum MTS' && 'Wakil kepala bidang kurikulum MTs'}
                        {item === 'Wk Kurikulum SMAT' && 'Wakil kepala bidang kurikulum SMA Terpadu'}
                        {item === 'WK Kesiswaan MTs' && 'Wakil kepala bidang kesiswaan MTs'}
                        {item === 'Wk Kesiswaan SMAT' && 'Wakil kepala bidang kesiswaan SMA Terpadu'}
                        {item === 'Wali Kelas' && 'Membina & mengelola rombongan belajar kelas'}
                        {item === 'Oprator' && 'Operator data Dapodik, EMIS & sistem sekolah'}
                      </p>
                    </div>
                  </div>

                  {isChecked && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-bold">
                      Aktif
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action buttons inside form */}
          <div className="pt-4 mt-2 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={selectedJabatan.length < 1 || selectedJabatan.length > 5}
              className="flex-1 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Jabatan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
