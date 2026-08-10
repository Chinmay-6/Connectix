import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { QrCode, ExternalLink, Search, Copy, Check, Eye, Download, X, AlertTriangle, Flame, Globe, Sparkles, Smartphone, CheckCircle2, Trash2, Wifi, Monitor, Info, Camera } from 'lucide-react';
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
        <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Places Directory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-950/40 border border-red-800/50 rounded-2xl text-red-300 text-xs font-medium flex items-start gap-4">
        <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-sm text-red-200">Failed to Load Directory</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Scan Notification Toast */}
      {scanNotice && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl text-emerald-200 text-xs font-bold shadow-2xl flex items-center justify-between animate-bounce">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{scanNotice}</span>
          </div>
          <button onClick={() => setScanNotice(null)} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Search */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
              <QrCode className="w-7 h-7 text-blue-500" />
              Places & Business QR Directory
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Manage tracked QR endpoints. Every mobile scan is automatically logged in analytics and redirected to Google Maps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer pr-8"
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
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Network Base Address Configuration Panel for Mobile Phones */}
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
            <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-slate-200">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span>Target Server Base URL (For Mobile Phone QR Scans)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400 font-mono">
              <Info className="w-3.5 h-3.5" />
              <span>Active Address: {activeBaseUrl}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setHostMode('network')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                hostMode === 'network'
                  ? 'bg-blue-600/20 border-blue-500 text-slate-100 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-blue-400" />
                  Local Wi-Fi Network IP
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
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
                  ? 'bg-blue-600/20 border-blue-500 text-slate-100 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50'
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
                  ? 'bg-blue-600/20 border-blue-500 text-slate-100 shadow-md shadow-blue-500/10'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400'
              }`}
            >
              <button
                type="button"
                onClick={() => setHostMode('custom')}
                className="flex items-center justify-between font-bold text-xs w-full mb-1 text-indigo-300 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  Public Domain / Ngrok Tunnel
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
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
                    <tr key={place.id} className="hover:bg-slate-900/40 transition-colors group">
                      <td className="py-4 px-6 font-mono font-bold text-blue-400">
                        <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 rounded-md">
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
                          className="text-slate-300 hover:text-blue-400 transition-colors flex items-center space-x-1 max-w-[240px]"
                        >
                          <span className="truncate">{place.googleReviewUrl}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-blue-400" />
                        </a>
                      </td>

                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-200">
                        <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 shadow-sm">
                          <Flame className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-sm font-extrabold text-emerald-400">{place.scanCount}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedPlace(place)}
                            className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 font-bold text-[11px] border border-blue-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="View Scannable QR Code"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>QR Code</span>
                          </button>

                          <button
                            onClick={() => handleCopyLink(place)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                            title="Copy Tracked QR URL"
                          >
                            {copiedId === place.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleTestScan(place)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 font-bold text-[11px] border border-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-500/10"
                            title="Test Mobile Scan & Log Event"
                          >
                            <Flame className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Test Mobile Scan</span>
                          </button>

                          <button
                            onClick={() => setPlaceToDelete(place)}
                            className="p-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/30 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
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

      {/* Delete Confirmation Modal */}
      {placeToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-3xl p-6 max-w-sm w-full border border-red-900/50 shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">Delete Place</h3>
                <p className="text-xs text-slate-400">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-1">
              <div className="font-mono text-blue-400 font-bold">{placeToDelete.id}</div>
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
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-lg shadow-red-600/30"
              >
                {isDeleting ? 'Deleting...' : 'Delete Place'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Printable QR Code Modal */}
      {selectedPlace && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-3xl p-6 max-w-md w-full border border-slate-800 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <div className="font-bold text-sm text-slate-200">Mobile Scannable QR Code</div>
              </div>
              <button
                onClick={() => setSelectedPlace(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center bg-white p-6 rounded-2xl text-slate-900 space-y-3 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(getTrackedQrUrl(selectedPlace))}`}
                alt={`QR Code for ${selectedPlace.placeName || selectedPlace.hotelName}`}
                className="w-56 h-56 rounded-lg border border-slate-200"
              />
              <div className="text-center w-full">
                <div className="text-xs font-mono font-extrabold text-blue-600">{selectedPlace.id}</div>
                <div className="text-base font-black text-slate-900 truncate px-2">{selectedPlace.placeName || selectedPlace.hotelName}</div>
                <div className="mt-1 flex justify-center">
                  {getTypeBadge(selectedPlace.placeType || selectedPlace.type)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate px-2 mt-1">
                  Tracked Scan Target: {getTrackedQrUrl(selectedPlace)}
                </div>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl text-xs text-emerald-300 flex items-start gap-2.5">
              <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-200">Real-Time Mobile Scan Logging</div>
                <div className="text-[11px] text-emerald-300/90 mt-0.5">
                  Point your mobile phone camera at this QR code. It logs the scan event in your Analytics stream and opens Google Maps!
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={() => handleTestScan(selectedPlace)}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors uppercase tracking-wider shadow-lg shadow-emerald-600/20 cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>Test Mobile Scan & Redirect</span>
              </button>

              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(getTrackedQrUrl(selectedPlace))}`}
                target="_blank"
                download={`${selectedPlace.id}_${selectedPlace.placeName || selectedPlace.hotelName}.png`}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors uppercase tracking-wider text-center"
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
