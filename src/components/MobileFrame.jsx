import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Wifi, Battery, Sparkles } from 'lucide-react';

export default function MobileFrame({ children }) {
  const [isMobileMode, setIsMobileMode] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 flex flex-col items-center justify-start sm:p-4 md:p-6 transition-all duration-300">
      {/* Top Desktop Controls Bar */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-4xl mb-4 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-white shadow-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-emerald-300">Guru RJ App</span>
          <span className="text-white/40">|</span>
          <span className="text-white/70">Mobile-First Attendance & Administration</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white/60 mr-1">Tampilan:</span>
          <button
            onClick={() => setIsMobileMode(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
              isMobileMode
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/50'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mockup Smartphone</span>
          </button>
          <button
            onClick={() => setIsMobileMode(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium transition ${
              !isMobileMode
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/50'
                : 'bg-white/10 text-white/80 hover:bg-white/20'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Layar Lebar</span>
          </button>
        </div>
      </div>

      {/* Main Container / Mobile Device Wrapper */}
      <div
        className={`relative w-full transition-all duration-300 ease-in-out ${
          isMobileMode
            ? 'max-w-[420px] rounded-[44px] sm:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] sm:border-[8px] sm:border-slate-800 bg-white overflow-hidden sm:min-h-[844px] flex flex-col'
            : 'max-w-2xl rounded-3xl shadow-2xl bg-white overflow-hidden min-h-[800px] border border-slate-200'
        }`}
      >
        {/* Dynamic Island / Smartphone Header Bar (Only in Mobile Mockup) */}
        {isMobileMode && (
          <div className="hidden sm:flex items-center justify-between px-7 pt-3 pb-1 bg-white select-none z-30 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 tracking-tight">{currentTime || '08:00'}</span>
            <div className="w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-2" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/60" />
            </div>
            <div className="flex items-center gap-1.5 text-slate-700">
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* Inner Content Area */}
        <div className="flex-1 flex flex-col bg-slate-50 min-h-screen sm:min-h-[780px] overflow-y-auto">
          {children}
        </div>

        {/* Smartphone Home Bar at bottom (Only in Mobile Mockup) */}
        {isMobileMode && (
          <div className="hidden sm:flex justify-center items-center py-2 bg-white border-t border-slate-100 select-none">
            <div className="w-32 h-1 bg-slate-300 rounded-full hover:bg-slate-400 transition" />
          </div>
        )}
      </div>
    </div>
  );
}
