import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Toast() {
  const { toast, hideToast } = useApp();

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        hideToast();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  if (!toast.show) return null;

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-emerald-700 flex-shrink-0" />,
  };

  const borders = {
    success: 'border-emerald-500 bg-emerald-50 text-emerald-950',
    error: 'border-rose-500 bg-rose-50 text-rose-950',
    info: 'border-emerald-600 bg-emerald-50 text-emerald-950',
  };

  const badges = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-emerald-700',
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm transition-all duration-300 transform animate-in fade-in slide-in-from-top-4">
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 shadow-xl backdrop-blur-md ${
          borders[toast.type] || borders.info
        }`}
      >
        {/* Progress bar animation */}
        <div
          className={`absolute bottom-0 left-0 h-1 w-full opacity-60 ${
            badges[toast.type] || badges.info
          }`}
          style={{
            animation: 'shrinkWidth 4s linear forwards',
          }}
        />

        <div className="flex items-start gap-3">
          <div className="mt-0.5">{icons[toast.type] || icons.info}</div>
          <div className="flex-1 pr-2">
            <h4 className="text-sm font-bold tracking-tight">{toast.title}</h4>
            <p className="mt-0.5 text-xs text-slate-700 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={hideToast}
            className="rounded-lg p-1 text-slate-400 hover:text-slate-700 hover:bg-black/5 transition"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <style>{`
        @keyframes shrinkWidth {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
