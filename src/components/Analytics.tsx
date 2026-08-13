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
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Aggregating TAPHUB Analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-medium flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-sm text-red-800">Analytics Error</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  const totalScans = data.reduce((acc, curr) => acc + curr.scans, 0);
  const avgScans = data.length > 0 ? (totalScans / data.length).toFixed(1) : '0';
  const topPlace = data.length > 0 ? [...data].sort((a, b) => b.scans - a.scans)[0] : null;

  const mobileCount = scanLogData?.mobileScans || 0;
  const logs = scanLogData?.logs || [];

  const categoryMap: { [key: string]: number } = {};
  data.forEach(item => {
    const t = item.type || 'Hotel';
    categoryMap[t] = (categoryMap[t] || 0) + 1;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-7 h-7 text-blue-600" />
            Places & Review Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time mobile scan events, device classification, and location review conversion intelligence.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleManualRefresh}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>

          <span className="px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-bold flex items-center gap-1.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>LIVE DETECTION ACTIVE</span>
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card rounded-3xl p-6 border border-slate-200 bg-white relative overflow-hidden space-y-2 glow-on-hover shadow-md shadow-slate-200/40">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Scans</span>
            <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{totalScans}</div>
          <div className="text-[11px] text-blue-600 flex items-center gap-1 font-bold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Cumulative review redirects</span>
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-slate-200 bg-white relative overflow-hidden space-y-2 glow-on-hover shadow-md shadow-slate-200/40">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Mobile Phone Scans</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 tracking-tight">{mobileCount}</div>
          <div className="text-[11px] text-slate-500 font-medium">Verified smartphone scans</div>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-slate-200 bg-white relative overflow-hidden space-y-2 glow-on-hover shadow-md shadow-slate-200/40">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Registered Places</span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <QrCode className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">{data.length}</div>
          <div className="text-[11px] text-slate-500 font-medium">Active business endpoints</div>
        </div>

        <div className="glass-card rounded-3xl p-6 border border-slate-200 bg-white relative overflow-hidden space-y-2 glow-on-hover shadow-md shadow-slate-200/40">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Top Performing Place</span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-slate-900 tracking-tight truncate">
            {topPlace ? topPlace.name : 'N/A'}
          </div>
          <div className="text-[11px] text-amber-600 font-mono font-bold">
            {topPlace ? `${topPlace.scans} total scans` : 'No activity recorded'}
          </div>
        </div>
      </div>

      {/* Real-Time Scan Event Activity Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white space-y-4 shadow-xl shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Live Mobile Scan Event Stream
            </h3>
            <p className="text-[11px] text-slate-500">Real-time log of smartphone camera scans and redirects</p>
          </div>
          <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
            {logs.length} EVENTS RECORDED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">QR ID</th>
                <th className="py-3 px-4">Place / Business</th>
                <th className="py-3 px-4">Scanning Device</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No scan events detected yet. Scan a QR code from a mobile phone to see real-time detection!
                  </td>
                </tr>
              ) : (
                logs.slice(0, 15).map((log) => {
                  const isMobile = (log.deviceType || '').includes('Mobile');
                  const timeFormatted = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  return (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{timeFormatted}</span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {log.qrId}
                      </td>

                      <td className="py-3 px-4 font-black text-slate-900">
                        {log.placeName}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          isMobile
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {isMobile ? <Smartphone className="w-3 h-3 text-emerald-600" /> : <Monitor className="w-3 h-3 text-slate-500" />}
                          <span>{log.deviceType}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600 font-bold">
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
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white space-y-4 shadow-xl shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-blue-600" />
            Places by Category
          </span>
          <span className="text-[11px] font-mono font-bold text-slate-500">
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
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  count > 0 ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-slate-200/60 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <Icon className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-bold text-slate-800 truncate">{type.label}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-700 border border-blue-200">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bar Chart Section */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-200 bg-white space-y-6 shadow-xl shadow-slate-200/50">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Scan Distribution by Place</h3>
            <p className="text-[11px] text-slate-500">Visual comparison of guest engagement per QR endpoint</p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-600 border border-blue-200">
            LIVE ANALYTICS
          </span>
        </div>

        <div className="h-[380px] w-full pt-4">
          {data.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">
              No scan activity recorded yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }}
                  angle={-30}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 'bold' }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(241, 245, 249, 0.8)' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    color: '#0f172a',
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
