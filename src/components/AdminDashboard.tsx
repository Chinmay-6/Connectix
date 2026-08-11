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

  // Close mobile drawer whenever location changes
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
    <div className="min-h-screen bg-[#060913] flex flex-col md:flex-row text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden sticky top-0 z-40 bg-[#0a0f1d]/90 backdrop-blur-xl border-b border-cyan-500/15 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center space-x-2.5">
          <img src="/conlogo.png" alt="Connectix Logo" className="h-8 w-auto logo-glow" />
          <div>
            <div className="text-base font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400">
              CONNECTIX
            </div>
            <div className="text-[9px] font-bold tracking-widest text-cyan-400 uppercase">
              Command Suite
            </div>
          </div>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-cyan-400 hover:text-white focus:outline-none cursor-pointer active:scale-95"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
        />
      )}

      {/* Sidebar (Desktop Permanent + Mobile Drawer Off-Canvas) */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#090e1c]/95 backdrop-blur-xl border-r border-cyan-500/15 flex flex-col justify-between p-5 shrink-0 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Sidebar Header with Logo */}
          <div className="flex items-center justify-between px-2 pt-1">
            <div className="flex items-center space-x-3">
              <img src="/conlogo.png" alt="Connectix Logo" className="h-10 w-auto logo-glow" />
              <div>
                <div className="text-lg font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-300">
                  CONNECTIX
                </div>
                <div className="text-[9px] font-bold tracking-widest text-cyan-400 uppercase">
                  Enterprise Suite
                </div>
              </div>
            </div>
            {/* Close button for mobile inside drawer */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* System Status Card */}
          <div className="glass-panel rounded-2xl p-3.5 border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Data Engine
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>{systemStatus?.dbMode === 'firestore' ? 'Cloud Firestore' : 'Local Micro-Store'}</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
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
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-600 text-white font-extrabold shadow-lg shadow-cyan-500/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-cyan-950/30'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-cyan-400'
                  }`} />
                  <span className="text-sm tracking-wide">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin Info */}
        <div className="border-t border-slate-800/80 pt-4 space-y-4">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500/20 to-cyan-500/30 border border-cyan-500/40 flex items-center justify-center font-bold text-xs text-cyan-300">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-bold text-slate-200 truncate">System Admin</div>
              <div className="text-[10px] text-slate-400 font-mono">Super Administrator</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#060913]">
        {/* Top Desktop Bar Header */}
        <header className="hidden md:flex h-20 border-b border-cyan-500/15 px-8 items-center justify-between shrink-0 bg-[#090e1c]/60 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="h-3 w-3 rounded-full bg-cyan-400 animate-pulse"></div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-100 tracking-tight">Places & Review Command Operations</h1>
              <p className="text-xs text-slate-400">Smart QR Routing & Location Review Intelligence</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="px-3.5 py-1.5 rounded-full bg-[#0d1424] border border-cyan-500/20 text-xs text-slate-300 flex items-center gap-2 font-mono">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Production Suite • v2.5.0</span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
