import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LayoutDashboard, PlusCircle, QrCode, LogOut, Database, ShieldCheck, Zap } from 'lucide-react';

interface SystemStatus {
  dbMode: 'firestore' | 'local-fallback';
  dbErrorMessage: string | null;
  projectId: string;
}

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);

  useEffect(() => {
    fetch('/api/system/status')
      .then(res => res.json())
      .then(data => setSystemStatus(data))
      .catch(err => console.warn('Could not fetch system status', err));
  }, []);

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
    <div className="min-h-screen bg-slate-950 flex text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900/80 backdrop-blur-xl border-r border-slate-800 flex flex-col justify-between p-6 shrink-0 relative z-20">
        <div className="space-y-8">
          {/* Logo Header */}
          <div className="flex items-center space-x-3 px-2 pt-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                CONNECTIX
              </div>
              <div className="text-[10px] font-bold tracking-widest text-blue-400 uppercase">
                Enterprise Suite
              </div>
            </div>
          </div>

          {/* System Status Card */}
          <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                Data Engine
              </span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span>{systemStatus?.dbMode === 'firestore' ? 'Cloud Firestore' : 'Local Micro-Store'}</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
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
                  className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-lg shadow-blue-600/30'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`} />
                  <span className="text-sm font-semibold tracking-wide">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin Info */}
        <div className="border-t border-slate-800/80 pt-4 space-y-4">
          <div className="flex items-center space-x-3 px-2">
            <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400">
              AD
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-bold text-slate-200 truncate">System Admin</div>
              <div className="text-[10px] text-slate-400 font-mono">Super Administrator</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-950">
        {/* Header */}
        <header className="h-20 border-b border-slate-800/80 px-8 flex items-center justify-between shrink-0 bg-slate-900/40 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="h-3 w-3 rounded-full bg-blue-500 animate-pulse"></div>
            <div>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">Places & Review Operations</h1>
              <p className="text-xs text-slate-400">Smart QR Routing & Location Review Intelligence</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Production Ready • v2.5.0</span>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
