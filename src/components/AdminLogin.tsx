import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-900 font-sans relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Soft Blue Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-blue-400/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-indigo-300/15 rounded-full blur-[120px] pointer-events-none"></div>

      {/* TAPHUB Brand Header */}
      <div className="flex flex-col items-center mb-6 sm:mb-8 text-center relative z-10">
        <div className="relative mb-3 group">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur-xl opacity-20 group-hover:opacity-35 transition duration-500"></div>
          <img
            src="/conlog.jpeg"
            alt="TAPHUB Logo"
            className="relative h-16 sm:h-20 w-auto object-contain transition-transform duration-300 hover:scale-105 rounded-xl shadow-md border border-slate-200/80 bg-white p-1"
          />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-1.5">
          TAP<span className="text-blue-600">HUB</span>
        </h1>
        <div className="text-[11px] font-extrabold tracking-widest text-blue-600 uppercase mt-0.5">
          Smart QR & Review Routing System
        </div>
      </div>

      {/* Login Card */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-200/90 relative z-10 glow-on-hover">
        <div className="mb-6 text-center">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">Admin Portal Sign In</h2>
          <p className="text-xs text-slate-500 mt-1">Authenticate to manage places, QR codes & analytics</p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4.5" autoComplete="off">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
                required
                autoComplete="off"
                placeholder="Enter admin email"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
                required
                autoComplete="new-password"
                placeholder="Enter password"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 uppercase text-xs tracking-wider cursor-pointer active:scale-[0.99]"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'SIGN IN TO TAPHUB'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            256-bit SSL Encrypted
          </span>
          <span>v2.5.0</span>
        </div>
      </div>
    </div>
  );
}
