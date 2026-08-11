import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { LayoutDashboard, Flame, QrCode, TrendingUp, Award, AlertTriangle, Tag, Smartphone, Monitor, Clock, ShieldCheck, Activity, RefreshCw } from 'lucide-react';
import { PLACE_TYPES } from '../constants';

interface AnalyticsData {
  name: string;
  type?: string;
  scans: number;
}

interface ScanLog {
  id: string;
  qrId: string;
  placeName: string;
  placeType: string;
  deviceType: string;
  ip: string;
  timestamp: string;
}

interface ScanLogResponse {
  totalScans: number;
  mobileScans: number;
  desktopScans: number;
  logs: ScanLog[];
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [scanLogData, setScanLogData] = useState<ScanLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAllAnalytics = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const [analyticsRes, logsRes] = await Promise.all([
        fetch('/api/admin/analytics', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/scan-logs', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!analyticsRes.ok) {
        const errorData = await analyticsRes.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch analytics');
      }

      const analyticsJson = await analyticsRes.json();
      setData(analyticsJson);

      if (logsRes.ok) {
        const logsJson = await logsRes.json();
        setScanLogData(logsJson);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllAnalytics();

    // Auto refresh scan logs every 4 seconds for real-time mobile scan detection
    const interval = setInterval(() => {
      fetchAllAnalytics();
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    fetchAllAnalytics();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aggregating Review Analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 bg-rose-950/50 border border-rose-800/50 rounded-2xl text-rose-300 text-xs font-medium flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-sm text-rose-200">Analytics Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  const totalScans = data.reduce((acc, curr) => acc + curr.scans, 0);
  const topPlace = data.length > 0 ? [...data].sort((a, b) => b.scans - a.scans)[0] : null;

  const mobileCount = scanLogData?.mobileScans || 0;
  const logs = scanLogData?.logs || [];

  // Category breakdown calculation
  const categoryMap: { [key: string]: number } = {};
  data.forEach(item => {
    const t = item.type || 'Hotel';
    categoryMap[t] = (categoryMap[t] || 0) + 1;
  });

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-cyan-500/15 pb-4 sm:pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-6 sm:w-7 h-6 sm:h-7 text-cyan-400 shrink-0" />
            Places & Review Analytics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time mobile scan events, device classification, and location review conversion intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleManualRefresh}
            className="px-3.5 py-2 rounded-xl bg-[#080d1a] border border-cyan-500/20 text-slate-300 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>

          <span className="px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs font-mono font-bold flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
            </span>
            <span>LIVE DETECTION ACTIVE</span>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-cyan-500/15 relative overflow-hidden space-y-2 glow-on-hover">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Scans</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">{totalScans}</div>
          <div className="text-[11px] text-teal-400 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Cumulative review redirects</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-cyan-500/15 relative overflow-hidden space-y-2 glow-on-hover">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Mobile Phone Scans</span>
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-400 tracking-tight">{mobileCount}</div>
          <div className="text-[11px] text-slate-400 font-medium">Verified smartphone scans</div>
        </div>

        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-cyan-500/15 relative overflow-hidden space-y-2 glow-on-hover">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered Places</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">{data.length}</div>
          <div className="text-[11px] text-slate-400 font-medium">Active business endpoints</div>
        </div>

        <div className="glass-card rounded-2xl p-5 sm:p-6 border border-cyan-500/15 relative overflow-hidden space-y-2 glow-on-hover">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Top Performing Place</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-slate-100 tracking-tight truncate">
            {topPlace ? topPlace.name : 'N/A'}
          </div>
          <div className="text-[11px] text-amber-400 font-mono font-bold">
            {topPlace ? `${topPlace.scans} total scans` : 'No activity recorded'}
          </div>
        </div>
      </div>

      {/* Real-Time Scan Event Activity Stream */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-cyan-500/20 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-400 shrink-0" />
              Live Mobile Scan Event Stream
            </h3>
            <p className="text-[11px] text-slate-400">Real-time log of smartphone camera scans and redirects</p>
          </div>
          <span className="self-start sm:self-center px-2.5 py-1 rounded-full text-[10px] font-mono bg-teal-500/10 text-teal-300 border border-teal-500/20">
            {logs.length} EVENTS RECORDED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[600px]">
            <thead>
              <tr className="bg-[#080d1a] border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">QR ID</th>
                <th className="py-3 px-4">Place / Business</th>
                <th className="py-3 px-4">Scanning Device</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No scan events detected yet. Scan a QR code from a mobile phone to see real-time detection!
                  </td>
                </tr>
              ) : (
                logs.slice(0, 15).map((log) => {
                  const isMobile = (log.deviceType || '').includes('Mobile');
                  const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  return (
                    <tr key={log.id} className="hover:bg-cyan-950/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{timeFormatted}</span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                        {log.qrId}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-100">
                        {log.placeName}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isMobile
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {isMobile ? <Smartphone className="w-3 h-3 text-teal-400" /> : <Monitor className="w-3 h-3 text-slate-400" />}
                          <span>{log.deviceType}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-teal-400 font-bold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Logged & Redirected</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Breakdown Cards */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-cyan-500/20 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Tag className="w-4 h-4 text-cyan-400" />
            Places by Category
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {Object.keys(categoryMap).length} Active Categories
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {PLACE_TYPES.map(type => {
            const count = categoryMap[type.id] || 0;
            const Icon = type.icon;
            return (
              <div
                key={type.id}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  count > 0 ? 'bg-[#080d1a] border-cyan-500/30' : 'bg-slate-900/30 border-slate-800/40 opacity-50'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-300 truncate">{type.label}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${type.color}`}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bar Chart Section */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-cyan-500/20 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">Scan Distribution by Place</h3>
            <p className="text-[11px] text-slate-400">Visual comparison of guest engagement per QR endpoint</p>
          </div>
          <span className="self-start sm:self-center px-2.5 py-1 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            LIVE ANALYTICS
          </span>
        </div>

        <div className="h-[300px] sm:h-[380px] w-full pt-4">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 font-bold uppercase tracking-widest text-xs">
              No scan activity recorded yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 20, left: 10, bottom: 65 }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00D2C2" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 'bold' }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(6, 182, 212, 0.15)' }}
                  contentStyle={{
                    backgroundColor: '#090e1c',
                    borderRadius: '12px',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.6)',
                    color: '#f8fafc',
                    fontWeight: 'bold',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="scans" radius={[8, 8, 0, 0]} maxBarSize={55} fill="url(#barGradient)">
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
