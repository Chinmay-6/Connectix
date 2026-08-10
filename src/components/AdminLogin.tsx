import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { Zap, KeyRound, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/admin/dashboard/list');
    } catch (err: any) {
      console.error("Login error:", err);
      let msg = err.message || 'Failed to login';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/user-not-found') || msg.includes('auth/wrong-password')) {
        msg = 'Invalid email or password. Please verify credentials.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const autofillDefault = () => {
    setEmail('admin@connectix.com');
    setPassword('Password@1234');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans relative overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Brand Badge */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-xl shadow-blue-500/30">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-400">
            CONNECTIX
          </div>
          <div className="text-xs font-bold tracking-widest text-blue-400 uppercase">
            Smart QR Routing System
          </div>
        </div>
      </div>

      {/* Login Card */}
      <div className="glass-panel rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-800 relative z-10 glow-on-hover">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">Admin Portal Sign In</h1>
          <p className="text-xs text-slate-400 mt-1">Authenticate to access the operational command center</p>
        </div>

        {/* Quick Demo Autofill Notice */}
        <div className="mb-6 p-3.5 bg-blue-950/40 border border-blue-800/50 rounded-2xl flex items-center justify-between text-xs text-blue-300">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <div>
              <div className="font-bold text-slate-200">Default Admin Account</div>
              <div className="text-[11px] text-blue-400 font-mono">admin@connectix.com</div>
            </div>
          </div>
          <button
            type="button"
            onClick={autofillDefault}
            className="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 font-bold text-[11px] border border-blue-500/30 transition-colors uppercase tracking-wider"
          >
            Auto-fill
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-950/40 border border-red-800/50 rounded-2xl text-red-300 text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition-all"
                required
                placeholder="admin@connectix.com"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition-all"
                required
                placeholder="••••••••••••"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 uppercase text-xs tracking-wider"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN TO DASHBOARD'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            256-bit SSL Encrypted
          </span>
          <span>Build 2.4.0</span>
        </div>
      </div>
    </div>
  );
}
