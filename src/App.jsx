import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import MobileFrame from './components/MobileFrame';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import TeacherDashboard from './components/TeacherDashboard';
import AdminDashboard from './components/AdminDashboard';
import Toast from './components/Toast';
import { initDailyAttendanceReminder } from './utils/localNotifications';

function AppContent() {
  const { currentUser } = useApp();
  const [authPage, setAuthPage] = useState('login'); // 'login' | 'register' | 'forgot-password'

  // Requirement 44: Initialize daily attendance reminder on app startup
  useEffect(() => {
    initDailyAttendanceReminder();
  }, []);

  if (!currentUser) {
    return (
      <MobileFrame>
        {authPage === 'login' && (
          <Login
            onNavigateToRegister={() => setAuthPage('register')}
            onNavigateToForgotPassword={() => setAuthPage('forgot-password')}
          />
        )}
        {authPage === 'register' && (
          <Register onNavigateToLogin={() => setAuthPage('login')} />
        )}
        {authPage === 'forgot-password' && (
          <ForgotPassword onNavigateToLogin={() => setAuthPage('login')} />
        )}
      </MobileFrame>
    );
  }

  return (
    <MobileFrame>
      {currentUser.role === 'admin' ? (
        <AdminDashboard />
      ) : (
        <TeacherDashboard />
      )}
    </MobileFrame>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught rendering error:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Terjadi Kendala Memuat Aplikasi</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Aplikasi mendeteksi error pada tampilan. Silakan muat ulang halaman atau reset data lokal untuk memulihkan sesi.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
              >
                Muat Ulang Halaman
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                Reset Data & Mulai Baru
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
        <Toast />
      </AppProvider>
    </ErrorBoundary>
  );
}
