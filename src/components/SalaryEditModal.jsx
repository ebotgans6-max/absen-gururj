import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, DollarSign, Calculator } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatRupiah } from './PrintSlipModal';

export default function SalaryEditModal({ isOpen, onClose, slip }) {
  if (!isOpen || !slip) return null;

  const { updateSalarySlip } = useApp();

  const [formData, setFormData] = useState({
    baseSalary: slip.baseSalary || 0,
    functionalAllowance: slip.functionalAllowance || 0,
    transportAllowance: slip.transportAllowance || 0,
    attendanceIncentive: slip.attendanceIncentive || 0,
    teachingHoursBonus: slip.teachingHoursBonus || 0,
    bpjsDeduction: slip.bpjsDeduction || 0,
    coopDeduction: slip.coopDeduction || 0,
    taxDeduction: slip.taxDeduction || 0,
    period: slip.period || 'September 2026',
  });

  useEffect(() => {
    if (slip) {
      setFormData({
        baseSalary: slip.baseSalary || 0,
        functionalAllowance: slip.functionalAllowance || 0,
        transportAllowance: slip.transportAllowance || 0,
        attendanceIncentive: slip.attendanceIncentive || 0,
        teachingHoursBonus: slip.teachingHoursBonus || 0,
        bpjsDeduction: slip.bpjsDeduction || 0,
        coopDeduction: slip.coopDeduction || 0,
        taxDeduction: slip.taxDeduction || 0,
        period: slip.period || 'September 2026',
      });
    }
  }, [slip]);

  const handleChange = (field, value) => {
    const num = parseInt(value, 10);
    setFormData((prev) => ({
      ...prev,
      [field]: isNaN(num) ? 0 : num,
    }));
  };

  const calculatedTotalEarnings =
    (formData.baseSalary || 0) +
    (formData.functionalAllowance || 0) +
    (formData.transportAllowance || 0) +
    (formData.attendanceIncentive || 0) +
    (formData.teachingHoursBonus || 0);

  const calculatedTotalDeductions =
    (formData.bpjsDeduction || 0) +
    (formData.coopDeduction || 0) +
    (formData.taxDeduction || 0);

  const calculatedTHP = calculatedTotalEarnings - calculatedTotalDeductions;

  const handleSave = (e) => {
    e.preventDefault();
    updateSalarySlip(slip.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-brand-700 to-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Edit3 className="w-5 h-5 text-emerald-100" />
            <div>
              <h3 className="font-bold text-sm">Kelola Data Slip Gaji</h3>
              <p className="text-[11px] text-emerald-100/90">{slip.teacherName} • {slip.period}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Calculation Preview Banner */}
        <div className="bg-emerald-50 px-6 py-3 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-emerald-800">
            <Calculator className="w-4 h-4 text-brand-600" />
            <span>Estimasi THP:</span>
          </div>
          <span className="text-base font-extrabold text-brand-700">
            {formatRupiah(calculatedTHP)}
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div>
            <h4 className="font-bold text-slate-800 mb-2 uppercase text-[10px] tracking-wider text-emerald-700">
              Komponen Penghasilan
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Gaji Pokok (Rp)</label>
                <input
                  type="number"
                  step="50000"
                  value={formData.baseSalary}
                  onChange={(e) => handleChange('baseSalary', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tunj. Fungsional</label>
                  <input
                    type="number"
                    step="25000"
                    value={formData.functionalAllowance}
                    onChange={(e) => handleChange('functionalAllowance', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tunj. Transport & Makan</label>
                  <input
                    type="number"
                    step="25000"
                    value={formData.transportAllowance}
                    onChange={(e) => handleChange('transportAllowance', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 font-medium outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Insentif Presensi</label>
                  <input
                    type="number"
                    step="25000"
                    value={formData.attendanceIncentive}
                    onChange={(e) => handleChange('attendanceIncentive', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Bonus Jam Tambahan</label>
                  <input
                    type="number"
                    step="25000"
                    value={formData.teachingHoursBonus}
                    onChange={(e) => handleChange('teachingHoursBonus', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 font-medium outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 mb-2 uppercase text-[10px] tracking-wider text-rose-600">
              Komponen Potongan
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Iuran BPJS (Rp)</label>
                <input
                  type="number"
                  step="5000"
                  value={formData.bpjsDeduction}
                  onChange={(e) => handleChange('bpjsDeduction', e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Koperasi Guru</label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.coopDeduction}
                    onChange={(e) => handleChange('coopDeduction', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 font-medium outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Pajak PPh 21</label>
                  <input
                    type="number"
                    step="5000"
                    value={formData.taxDeduction}
                    onChange={(e) => handleChange('taxDeduction', e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 font-medium outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold shadow-md shadow-brand-600/30 transition"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
