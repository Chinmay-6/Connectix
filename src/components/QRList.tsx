import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { QrCode, ExternalLink, Search, Copy, Check, Eye, Download, X, AlertTriangle, Flame, Globe, Sparkles, Smartphone, CheckCircle2, Trash2, Wifi, Monitor, Info } from 'lucide-react';
import { PLACE_TYPES } from '../constants';

interface Place {
  id: string;
  placeName?: string;
  hotelName?: string;
  placeType?: string;
  type?: string;
  googleReviewUrl: string;
  scanCount: number;
  createdAt: string;
}

export default function QRList() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [placeToDelete, setPlaceToDelete] = useState<Place | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  // Network host setup for multi-device scanning
  const [networkScanUrl, setNetworkScanUrl] = useState<string>('');
  const [hostMode, setHostMode] = useState<'network' | 'localhost' | 'custom'>('network');
  const [customServerHost, setCustomServerHost] = useState<string>('');

  useEffect(() => {
    // Fetch system status to get Local Network IP (e.g. http://192.168.x.x:3000)
    fetch('/api/system/status')
      .then(res => res.json())
      .then(data => {
        if (data.networkScanUrl) {
          setNetworkScanUrl(data.networkScanUrl);
        }
      })
      .catch(err => console.warn('Could not fetch network status', err));

    fetchPlaces();
  }, []);

  const fetchPlaces = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch('/api/admin/places', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to fetch places');
      }

      const data = await response.json();
      setPlaces(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getActiveBaseUrl = () => {
    if (hostMode === 'custom' && customServerHost.trim()) {
      let host = customServerHost.trim();
      if (!host.startsWith('http://') && !host.startsWith('https://')) {
        host = `https://${host}`;
      }
      return host.replace(/\/$/, '');
    }
    if (hostMode === 'network' && networkScanUrl) {
      return networkScanUrl;
    }
    return window.location.origin;
  };

  const activeBaseUrl = getActiveBaseUrl();

  // Every QR Code encodes the tracked endpoint so scans are ALWAYS identified and logged
  const getTrackedQrUrl = (place: Place) => {
    return `${activeBaseUrl}/scan/${place.id}`;
  };

  const handleDelete = async () => {
    if (!placeToDelete) return;
    setIsDeleting(true);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch(`/api/admin/places/${placeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || 'Failed to delete place');
      }

      setPlaces(prev => prev.filter(p => p.id !== placeToDelete.id));
      setPlaceToDelete(null);
    } catch (err: any) {
      alert(err.message || 'Error deleting place');
    } finally {
      setIsDeleting(false);
    }
  };

  // Test scan simulation that calls the server API, logs the scan event, and opens Google Maps
  const handleTestScan = async (place: Place) => {
    try {
      const res = await fetch(`/api/scan/${place.id}`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      
      // Update place scan count in state
      setPlaces(prev => prev.map(p => p.id === place.id ? { ...p, scanCount: p.scanCount + 1 } : p));
      
      const pName = place.placeName || place.hotelName || place.id;
      setScanNotice(`✅ SCAN IDENTIFIED & LOGGED! Registered mobile scan event for "${pName}". Scan count updated.`);
      setTimeout(() => setScanNotice(null), 5000);

      // Open Google Review / Map location
      const targetUrl = data.googleReviewUrl || place.googleReviewUrl;
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    } catch (e) {
      window.open(place.googleReviewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCopyLink = (place: Place) => {
    const url = getTrackedQrUrl(place);
    navigator.clipboard.writeText(url);
    setCopiedId(place.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPlaces = places.filter(p => {
    const name = p.placeName || p.hotelName || '';
    const category = p.placeType || p.type || 'Hotel';
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const getTypeBadge = (typeStr?: string) => {
    const matched = PLACE_TYPES.find(t => t.id.toLowerCase() === (typeStr || 'hotel').toLowerCase()) || PLACE_TYPES[0];
    const Icon = matched.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${matched.color}`}>
        <Icon className="w-3 h-3" />
        <span>{matched.label}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-400 rounded-full animate-spin"></div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Places Directory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 bg-rose-950/50 border border-rose-800/50 rounded-2xl text-rose-300 text-xs font-medium flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-sm text-rose-200">Failed to Load Directory</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Scan Notification Toast */}
      {scanNotice && (
        <div className="p-4 bg-teal-950/90 border border-teal-500/60 rounded-2xl text-teal-200 text-xs font-bold shadow-2xl flex items-center justify-between animate-bounce">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
            <span>{scanNotice}</span>
          </div>
          <button onClick={() => setScanNotice(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Search */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/15 pb-4 sm:pb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
              <QrCode className="w-6 sm:w-7 h-6 sm:h-7 text-cyan-400 shrink-0" />
              Places & Business QR Directory
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Manage tracked QR endpoints. Every mobile scan is automatically logged in analytics and redirected to Google Maps.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto bg-[#080d1a] border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer pr-8"
              >
                <option value="ALL">All Categories</option>
                {PLACE_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search place or QR ID..."
                className="w-full bg-[#080d1a] border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Network Base Address Configuration Panel for Mobile Phones */}
        <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-200">
              <Wifi className="w-4 h-4 text-teal-400" />
              <span>Target Server Base URL (For Mobile Phone QR Scans)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-teal-300 font-mono">
              <Info className="w-3.5 h-3.5" />
              <span className="truncate max-w-[260px] sm:max-w-none">Active Address: {activeBaseUrl}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setHostMode('network')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                hostMode === 'network'
                  ? 'bg-cyan-500/20 border-cyan-500 text-slate-100 shadow-md shadow-cyan-500/10'
                  : 'bg-[#080d1a]/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  Local Wi-Fi Network IP
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  MOBILE WI-FI
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                {networkScanUrl || 'Detecting network IP...'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setHostMode('localhost')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                hostMode === 'localhost'
                  ? 'bg-cyan-500/20 border-cyan-500 text-slate-100 shadow-md shadow-cyan-500/10'
                  : 'bg-[#080d1a]/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-slate-400" />
                  Local Host
                </span>
                <span className="text-[10px] font-mono text-slate-500">DESKTOP ONLY</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                {window.location.origin}
              </div>
            </button>

            <div
              className={`p-3 rounded-xl border text-left transition-all ${
                hostMode === 'custom'
                  ? 'bg-cyan-500/20 border-cyan-500 text-slate-100 shadow-md shadow-cyan-500/10'
                  : 'bg-[#080d1a]/60 border-slate-800 text-slate-400'
              }`}
            >
              <button
                type="button"
                onClick={() => setHostMode('custom')}
                className="flex items-center justify-between font-bold text-xs w-full mb-1 text-indigo-300 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  Public Domain / Tunnel
                </span>
                <span className="text-[10px] font-mono text-indigo-300">CUSTOM</span>
              </button>
              <input
                type="text"
                value={customServerHost}
                onChange={(e) => {
                  setCustomServerHost(e.target.value);
                  setHostMode('custom');
                }}
                placeholder="https://connectix.ngrok.app"
                className="w-full bg-[#060913] border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Directory Content: Desktop Table & Mobile Responsive Cards */}
      <div className="space-y-4">
        {/* Mobile View: Cards Layout for phones (< md breakpoint) */}
        <div className="md:hidden space-y-3">
          {filteredPlaces.length === 0 ? (
            <div className="glass-panel p-8 rounded-2xl text-center text-slate-500 text-xs font-medium">
              No places or businesses registered yet.
            </div>
          ) : (
            filteredPlaces.map((place) => {
              const pName = place.placeName || place.hotelName || 'Unnamed Place';
              const pType = place.placeType || place.type || 'Hotel';
              return (
                <div key={place.id} className="glass-panel rounded-2xl p-4 border border-cyan-500/20 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded font-mono font-bold text-cyan-400 text-xs">
                        {place.id}
                      </span>
                      {getTypeBadge(pType)}
                    </div>
                    <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#080d1a] border border-slate-800">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      <span className="text-xs font-extrabold text-teal-400">{place.scanCount} scans</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-100 text-base">{pName}</h3>
                    <a
                      href={place.googleReviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-cyan-400 text-xs font-mono truncate flex items-center gap-1 mt-1"
                    >
                      <span className="truncate">{place.googleReviewUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => setSelectedPlace(place)}
                      className="py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold text-xs border border-cyan-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View QR</span>
                    </button>

                    <button
                      onClick={() => handleTestScan(place)}
                      className="py-2.5 px-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 font-bold text-xs border border-teal-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                    >
                      <Flame className="w-3.5 h-3.5 text-teal-400" />
                      <span>Test Scan</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleCopyLink(place)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === place.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-teal-400" />
                          <span className="text-teal-400 font-bold">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Scan URL</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setPlaceToDelete(place)}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop View Table (md:block) */}
        <div className="hidden md:block glass-panel rounded-2xl border border-cyan-500/20 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-[#080d1a] border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">QR ID</th>
                  <th className="py-4 px-6">Place / Business</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Google Review Target Link</th>
                  <th className="py-4 px-6 text-right">Total Scans</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredPlaces.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500 font-medium">
                      No places or businesses registered yet.
                    </td>
                  </tr>
                ) : (
                  filteredPlaces.map((place) => {
                    const pName = place.placeName || place.hotelName || 'Unnamed Place';
                    const pType = place.placeType || place.type || 'Hotel';
                    return (
                      <tr key={place.id} className="hover:bg-cyan-950/20 transition-colors group">
                        <td className="py-4 px-6 font-mono font-bold text-cyan-400">
                          <span className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-md">
                            {place.id}
                          </span>
                        </td>

                        <td className="py-4 px-6 font-extrabold text-slate-100">
                          {pName}
                        </td>

                        <td className="py-4 px-6">
                          {getTypeBadge(pType)}
                        </td>

                        <td className="py-4 px-6 font-medium">
                          <a
                            href={place.googleReviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-300 hover:text-cyan-400 transition-colors flex items-center space-x-1 max-w-[240px]"
                          >
                            <span className="truncate">{place.googleReviewUrl}</span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-cyan-400" />
                          </a>
                        </td>

                        <td className="py-4 px-6 text-right font-mono font-bold text-slate-200">
                          <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-[#080d1a] border border-slate-800 shadow-sm">
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-sm font-extrabold text-teal-400">{place.scanCount}</span>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setSelectedPlace(place)}
                              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 font-bold text-[11px] border border-cyan-500/30 transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                              title="View Scannable QR Code"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>QR Code</span>
                            </button>

                            <button
                              onClick={() => handleCopyLink(place)}
                              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer active:scale-95"
                              title="Copy Tracked QR URL"
                            >
                              {copiedId === place.id ? (
                                <Check className="w-3.5 h-3.5 text-teal-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              onClick={() => handleTestScan(place)}
                              className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/40 text-teal-300 font-bold text-[11px] border border-teal-500/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-teal-500/10 active:scale-95"
                              title="Test Mobile Scan & Log Event"
                            >
                              <Flame className="w-3.5 h-3.5 text-teal-400" />
                              <span>Test Scan</span>
                            </button>

                            <button
                              onClick={() => setPlaceToDelete(place)}
                              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/30 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer active:scale-95"
                              title="Delete Place"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {placeToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-rose-900/50 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Delete Place</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-[#080d1a] border border-slate-800 rounded-xl text-xs space-y-1">
              <div className="font-mono text-cyan-400 font-bold">{placeToDelete.id}</div>
              <div className="font-extrabold text-slate-200">{placeToDelete.placeName || placeToDelete.hotelName}</div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently remove this place from the directory?
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setPlaceToDelete(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-lg shadow-rose-600/30"
              >
                {isDeleting ? 'Deleting...' : 'Delete Place'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Printable QR Code Modal with conlogo.png Logo */}
      {selectedPlace && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="glass-panel rounded-3xl p-5 sm:p-6 max-w-md w-full border border-cyan-500/20 shadow-2xl relative space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <img src="/conlogo.png" alt="Connectix Logo" className="h-6 w-auto logo-glow" />
                <div className="font-extrabold text-sm text-slate-200">Mobile Scannable QR Code</div>
              </div>
              <button
                onClick={() => setSelectedPlace(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center bg-slate-900/90 p-5 rounded-2xl text-slate-100 space-y-3 border border-slate-800 shadow-inner">
              <div className="flex items-center gap-2">
                <img src="/conlogo.png" alt="Connectix Logo" className="h-7 w-auto logo-glow" />
                <span className="text-xs font-black tracking-widest text-cyan-400 uppercase">CONNECTIX</span>
              </div>

              <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(getTrackedQrUrl(selectedPlace))}`}
                  alt={`QR Code for ${selectedPlace.placeName || selectedPlace.hotelName}`}
                  className="w-48 h-48 sm:w-56 sm:h-56 rounded border border-slate-200"
                />
              </div>

              <div className="text-center w-full">
                <div className="text-xs font-mono font-extrabold text-cyan-400">{selectedPlace.id}</div>
                <div className="text-base font-black text-slate-100 truncate px-2">{selectedPlace.placeName || selectedPlace.hotelName}</div>
                <div className="mt-1 flex justify-center">
                  {getTypeBadge(selectedPlace.placeType || selectedPlace.type)}
                </div>
                <div className="text-[11px] text-slate-400 font-mono truncate px-2 mt-1">
                  Tracked Scan Target: {getTrackedQrUrl(selectedPlace)}
                </div>
              </div>
            </div>

            <div className="p-3 bg-teal-950/40 border border-teal-800/40 rounded-2xl text-xs text-teal-300 flex items-start gap-2.5">
              <Smartphone className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-teal-200">Real-Time Mobile Scan Logging</div>
                <div className="text-[11px] text-teal-300/90 mt-0.5">
                  Point your mobile phone camera at this QR code. It logs the scan event in your Analytics stream and opens Google Maps!
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={() => handleTestScan(selectedPlace)}
                className="w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-extrabold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors uppercase tracking-wider shadow-lg shadow-cyan-500/20 cursor-pointer active:scale-95"
              >
                <Flame className="w-4 h-4" />
                <span>Test Mobile Scan & Redirect</span>
              </button>

              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(getTrackedQrUrl(selectedPlace))}`}
                target="_blank"
                download={`${selectedPlace.id}_${selectedPlace.placeName || selectedPlace.hotelName}.png`}
                className="w-full bg-[#080d1a] border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors uppercase tracking-wider text-center"
              >
                <Download className="w-4 h-4" />
                <span>Download Printable HD QR Code</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
