import React from 'react';
import { X, Sparkles, CheckCircle2 } from 'lucide-react';

export default function FeaturePreviewModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badgeText = 'Fitur Akademik',
  description,
  details = [],
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 text-center relative border-b border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-slate-50 border border-slate-100 shadow-xs mb-3">
            {icon}
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-100 mb-2">
            <Sparkles className="w-3 h-3 text-emerald-500" />
            {badgeText}
          </span>

          <h3 className="text-base font-extrabold text-slate-800 leading-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {subtitle}
          </p>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            {description}
          </p>

          {details && details.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Poin Integrasi:
              </p>
              {details.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer active:scale-98 shadow-sm"
          >
            Tutup & Kembali
          </button>
        </div>
      </div>
    </div>
  );
}
