import { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { QrCode, ExternalLink, Search, Copy, Check, Eye, Download, X, AlertTriangle, Flame, Globe, Smartphone, CheckCircle2, Trash2, Wifi, Monitor, Info } from 'lucide-react';
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

  const handleTestScan = async (place: Place) => {
    try {
      const res = await fetch(`/api/scan/${place.id}`, {
        headers: { 'Accept': 'application/json' }
      });
      const data = await res.json();
      
      setPlaces(prev => prev.map(p => p.id === place.id ? { ...p, scanCount: p.scanCount + 1 } : p));
      
      const pName = place.placeName || place.hotelName || place.id;
      setScanNotice(`✅ SCAN IDENTIFIED & LOGGED! Registered mobile scan event for "${pName}". Scan count updated.`);
      setTimeout(() => setScanNotice(null), 5000);

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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
        <Icon className="w-3 h-3 text-blue-600" />
        <span>{matched.label}</span>
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <div className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Loading TAPHUB Places Directory...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-medium flex items-start gap-4 shadow-sm">
        <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-sm text-red-800">Failed to Load Directory</div>
          <div>{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Scan Notification Toast */}
      {scanNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 text-xs font-bold shadow-xl flex items-center justify-between animate-bounce">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{scanNotice}</span>
          </div>
          <button onClick={() => setScanNotice(null)} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header & Search */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <QrCode className="w-7 h-7 text-blue-600" />
              Places & Business QR Directory
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Manage tracked QR endpoints. Every mobile scan is logged in TAPHUB Analytics and redirected to Google Maps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Category Dropdown */}
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-600 cursor-pointer shadow-sm pr-8"
              >
                <option value="ALL">All Categories</option>
                {PLACE_TYPES.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search place or QR ID..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 font-medium shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Network Base Address Panel */}
        <div className="glass-panel rounded-3xl p-5 border border-slate-200 space-y-3 bg-white shadow-md shadow-slate-200/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center space-x-2 text-xs font-extrabold uppercase tracking-wider text-slate-800">
              <Wifi className="w-4 h-4 text-blue-600" />
              <span>Target Server Base URL (For Mobile Phone QR Scans)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-blue-600 font-mono font-bold">
              <Info className="w-3.5 h-3.5" />
              <span>Active Address: {activeBaseUrl}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setHostMode('network')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                hostMode === 'network'
                  ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md shadow-blue-500/10'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <Wifi className="w-3.5 h-3.5 text-blue-600" />
                  Local Wi-Fi Network IP
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-200 text-blue-900">
                  MOBILE WI-FI
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-1 truncate">
                {networkScanUrl || 'Detecting network IP...'}
              </div>
            </button>

            <button
              type="button"
              onClick={() => setHostMode('localhost')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                hostMode === 'localhost'
                  ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md shadow-blue-500/10'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-xs">
                <span className="flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-slate-500" />
                  Local Host
                </span>
                <span className="text-[10px] font-mono text-slate-400">DESKTOP ONLY</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-1 truncate">
                {window.location.origin}
              </div>
            </button>

            <div
              className={`p-3.5 rounded-2xl border text-left transition-all ${
                hostMode === 'custom'
                  ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md shadow-blue-500/10'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              <button
                type="button"
                onClick={() => setHostMode('custom')}
                className="flex items-center justify-between font-bold text-xs w-full mb-1 text-blue-700 cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  Public Domain / Render URL
                </span>
                <span className="text-[10px] font-mono font-bold text-indigo-600">CUSTOM</span>
              </button>
              <input
                type="text"
                value={customServerHost}
                onChange={(e) => {
                  setCustomServerHost(e.target.value);
                  setHostMode('custom');
                }}
                placeholder="https://connectix-sk2o.onrender.com"
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-900 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-panel rounded-3xl border border-slate-200 overflow-hidden shadow-xl bg-white">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">QR ID</th>
                <th className="py-4 px-6">Place / Business</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Google Review Target Link</th>
                <th className="py-4 px-6 text-right">Total Scans</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPlaces.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium">
                    No places or businesses registered yet.
                  </td>
                </tr>
              ) : (
                filteredPlaces.map((place) => {
                  const pName = place.placeName || place.hotelName || 'Unnamed Place';
                  const pType = place.placeType || place.type || 'Hotel';
                  return (
                    <tr key={place.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-4 px-6 font-mono font-extrabold text-blue-600">
                        <span className="px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                          {place.id}
                        </span>
                      </td>

                      <td className="py-4 px-6 font-black text-slate-900">
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
                          className="text-slate-600 hover:text-blue-600 transition-colors flex items-center space-x-1 max-w-[240px]"
                        >
                          <span className="truncate">{place.googleReviewUrl}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-blue-600" />
                        </a>
                      </td>

                      <td className="py-4 px-6 text-right font-mono font-bold text-slate-900">
                        <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 shadow-sm">
                          <Flame className="w-3.5 h-3.5 text-amber-500" />
                          <span className="text-sm font-extrabold text-blue-600">{place.scanCount}</span>
                        </div>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedPlace(place)}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                            title="View Scannable QR Code"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            <span>QR Code</span>
                          </button>

                          <button
                            onClick={() => handleCopyLink(place)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer border border-slate-200"
                            title="Copy Tracked QR URL"
                          >
                            {copiedId === place.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <button
                            onClick={() => handleTestScan(place)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] border border-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                            title="Test Mobile Scan & Log Event"
                          >
                            <Flame className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Test Scan</span>
                          </button>

                          <button
                            onClick={() => setPlaceToDelete(place)}
                            className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-3xl p-6 max-w-sm w-full border border-slate-200 bg-white shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Delete Place</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="font-mono text-blue-600 font-bold">{placeToDelete.id}</div>
              <div className="font-black text-slate-900">{placeToDelete.placeName || placeToDelete.hotelName}</div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently remove this place from TAPHUB?
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setPlaceToDelete(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-colors uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-lg shadow-red-500/25"
              >
                {isDeleting ? 'Deleting...' : 'Delete Place'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable QR Code Modal */}
      {selectedPlace && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel rounded-3xl p-6 max-w-md w-full border border-slate-200 bg-white shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-blue-600" />
                <div className="font-bold text-sm text-slate-900">Mobile Scannable QR Code</div>
              </div>
              <button
                onClick={() => setSelectedPlace(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center justify-center bg-slate-50 p-6 rounded-2xl border border-slate-200 text-slate-900 space-y-3 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(getTrackedQrUrl(selectedPlace))}`}
                alt={`QR Code for ${selectedPlace.placeName || selectedPlace.hotelName}`}
                className="w-56 h-56 rounded-xl border border-slate-200 bg-white p-2 shadow-md"
              />
              <div className="text-center w-full">
                <div className="text-xs font-mono font-extrabold text-blue-600">{selectedPlace.id}</div>
                <div className="text-base font-black text-slate-900 truncate px-2">{selectedPlace.placeName || selectedPlace.hotelName}</div>
                <div className="mt-1 flex justify-center">
                  {getTypeBadge(selectedPlace.placeType || selectedPlace.type)}
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate px-2 mt-1">
                  Target: {getTrackedQrUrl(selectedPlace)}
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
              <Smartphone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-blue-900">Real-Time Mobile Scan Logging</div>
                <div className="text-[11px] text-blue-700 mt-0.5">
                  Point any mobile phone camera at this QR code. It logs the scan event in TAPHUB Analytics and opens Google Maps!
                </div>
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <button
                onClick={() => handleTestScan(selectedPlace)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors uppercase tracking-wider shadow-lg shadow-blue-600/25 cursor-pointer"
              >
                <Flame className="w-4 h-4" />
                <span>Simulate Scan & Open Google Map</span>
              </button>

              <a
                href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(getTrackedQrUrl(selectedPlace))}`}
                target="_blank"
                download={`${selectedPlace.id}_${selectedPlace.placeName || selectedPlace.hotelName}.png`}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors uppercase tracking-wider text-center border border-slate-200"
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
