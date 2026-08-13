import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LayoutDashboard, PlusCircle, QrCode, LogOut, Database, ShieldCheck, Menu, X } from 'lucide-react';

interface SystemStatus {
  dbMode: 'firestore' | 'local-fallback';
  dbErrorMessage: string | null;
  projectId: string;
}

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    fetch('/api/system/status')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => console.warn('Could not fetch system status', err));
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const navItems = [
    { name: 'Place Directory', path: '/admin/dashboard/list', icon: QrCode },
    { name: 'Add Place', path: '/admin/dashboard/add', icon: PlusCircle },
    { name: 'Analytics', path: '/admin/dashboard/analytics', icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2.5">
          <img src="/conlog.jpeg" alt="TAPHUB Logo" className="h-8 w-auto logo-glow rounded-md border border-slate-200" />
          <div>
            <div className="text-base font-black tracking-tight text-slate-900">
              TAP<span className="text-blue-600">HUB</span>
            </div>
            <div className="text-[9px] font-bold tracking-widest text-blue-600 uppercase">
              Command Suite
            </div>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-blue-600 focus:outline-none cursor-pointer active:scale-95"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar (Desktop Permanent + Mobile Drawer Off-Canvas) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-white backdrop-blur-xl border-r border-slate-200 flex flex-col justify-between p-5 shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 shadow-sm ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Sidebar Header with Logo */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center space-x-3">
              <img src="/conlog.jpeg" alt="TAPHUB Logo" className="h-10 w-auto logo-glow rounded-lg border border-slate-200 p-0.5 bg-white" />
              <div>
                <div className="text-xl font-black tracking-tight text-slate-900">
                  TAP<span className="text-blue-600">HUB</span>
                </div>
                <div className="text-[9px] font-bold tracking-widest text-blue-600 uppercase">
                  Enterprise Suite
                </div>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-900 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* System Status Card */}
          <div className="glass-card rounded-2xl p-3.5 border border-slate-200 space-y-2 bg-slate-50/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                Data Engine
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>{systemStatus?.dbMode === 'firestore' ? 'Cloud Firestore' : 'Local Store'}</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-100 text-blue-700 border border-blue-200">
                {systemStatus?.dbMode === 'firestore' ? 'LIVE' : 'ACTIVE'}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-semibold'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                  }`} />
                  <span className="text-sm tracking-wide">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin Info */}
        <div className="border-t border-slate-200 pt-4 space-y-4">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center font-bold text-xs text-blue-700">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-extrabold text-slate-800 truncate">System Admin</div>
              <div className="text-[10px] text-slate-500 font-mono">Super Administrator</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        {/* Header */}
        <header className="h-16 md:h-20 border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="h-3 w-3 rounded-full bg-blue-600 animate-pulse"></div>
            <div>
              <h1 className="text-base md:text-lg font-black text-slate-900 tracking-tight">TAPHUB Operations</h1>
              <p className="text-[11px] md:text-xs text-slate-500">Smart QR Routing & Review Intelligence Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center gap-2 font-mono font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Production Ready • v2.5.0</span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
