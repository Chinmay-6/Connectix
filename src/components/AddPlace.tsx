import React, { useEffect, useState } from 'react';
import { auth } from '../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { MapPin, Link as LinkIcon, QrCode, PlusCircle, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink, Smartphone, Sparkles, Tag } from 'lucide-react';
import { PLACE_TYPES } from '../constants';

export default function AddPlace() {
  const [placeName, setPlaceName] = useState('');
  const [placeType, setPlaceType] = useState('Hotel');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [networkScanUrl, setNetworkScanUrl] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/system/status')
      .then(async res => {
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.networkScanUrl) setNetworkScanUrl(data.networkScanUrl);
        }
      })
      .catch(err => console.warn('Could not fetch network status', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Not authenticated");

      const response = await fetch('/api/admin/places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ placeName, placeType, googleReviewUrl })
      });

      const responseText = await response.text();
      let responseData: any = {};
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Server returned unexpected response (${response.status})`);
      }

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to add place');
      }

      navigate('/admin/dashboard/list');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const activeBaseUrl = networkScanUrl || window.location.origin;
  const previewTarget = `${activeBaseUrl}/scan/QR_PREVIEW`;
  const selectedTypeInfo = PLACE_TYPES.find(t => t.id === placeType) || PLACE_TYPES[0];
  const TypeIcon = selectedTypeInfo.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyan-500/15 pb-4 sm:pb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight flex items-center gap-2.5">
            <PlusCircle className="w-6 sm:w-7 h-6 sm:h-7 text-cyan-400 shrink-0" />
            Register New Business & Location
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Generate a tracked QR Code mapping that dynamically logs mobile scan events and redirects customers to Google Maps.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-500/20">
          <img src="/conlogo.png" alt="Connectix Logo" className="h-6 w-auto logo-glow" />
          <span className="text-[11px] font-bold text-cyan-300">Smart QR Generator</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Registration Form */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 sm:p-6 border border-cyan-500/20 space-y-6">
          {error && (
            <div className="p-4 bg-rose-950/50 border border-rose-800/50 rounded-xl text-rose-300 text-xs font-medium flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Registration Failed</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Place / Business Name
              </label>
              <input
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                className="w-full bg-[#080d1a] border border-slate-800/80 rounded-xl px-4 py-3 sm:py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-medium transition-all"
                required
                placeholder="e.g. Grand Palace Hotel or Bella Italia Cafe"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">Business name displayed in the directory and analytics.</p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-cyan-400" />
                Category / Place Type
              </label>
              <select
                value={placeType}
                onChange={(e) => setPlaceType(e.target.value)}
                className="w-full bg-[#080d1a] border border-slate-800/80 rounded-xl px-4 py-3 sm:py-3.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-medium transition-all cursor-pointer"
              >
                {PLACE_TYPES.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1.5">Categorize your business for specialized analytics.</p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-cyan-400" />
                Google Maps / Review Destination Link
              </label>
              <input
                type="url"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                className="w-full bg-[#080d1a] border border-slate-800/80 rounded-xl px-4 py-3 sm:py-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-medium transition-all"
                required
                placeholder="https://g.page/r/... or https://maps.google.com/..."
              />
              <p className="text-[11px] text-slate-400 mt-1.5">Direct Google Maps link where customers leave their review.</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-teal-500 via-cyan-500 to-indigo-600 hover:from-teal-400 hover:via-cyan-400 hover:to-indigo-500 text-white font-extrabold py-3.5 sm:py-4 px-6 rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 uppercase text-xs tracking-wider cursor-pointer active:scale-[0.99]"
              >
                <span>{loading ? 'PROVISIONING PLACE...' : 'GENERATE SMART TRACKED QR CODE'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Side Card */}
        <div className="lg:col-span-5 glass-card rounded-2xl p-5 sm:p-6 border border-cyan-500/15 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-cyan-400" />
              Tracked Live QR Preview
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30">
              LOGGING ACTIVE
            </span>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-900/90 p-5 rounded-2xl border border-slate-800 text-slate-100 space-y-3 relative overflow-hidden">
            {/* Branding Header inside preview */}
            <div className="flex items-center gap-2 mb-1">
              <img src="/conlogo.png" alt="Connectix Logo" className="h-6 w-auto logo-glow" />
              <span className="text-xs font-black tracking-widest text-cyan-400 uppercase">CONNECTIX</span>
            </div>

            <div className="p-3 bg-white rounded-xl shadow-md border border-slate-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(previewTarget)}`}
                alt="QR Preview"
                className="w-36 h-36 sm:w-40 sm:h-40 rounded shadow-sm"
              />
            </div>

            <div className="text-center w-full">
              <div className="text-xs font-mono font-bold text-cyan-400">ID: QR_AUTO_GEN</div>
              <div className="text-sm font-black text-slate-100 truncate px-2 mt-0.5">
                {placeName || 'Your Business Name'}
              </div>
              <div className="mt-1.5 flex justify-center">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${selectedTypeInfo.color}`}>
                  <TypeIcon className="w-3 h-3" />
                  {selectedTypeInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-teal-950/40 border border-teal-800/40 rounded-2xl text-xs text-teal-300 flex items-start gap-2.5">
            <Smartphone className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-teal-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Guaranteed Mobile Scan Logging
              </div>
              <div className="text-[11px] text-teal-300/90 mt-0.5">
                Encodes <code className="font-mono bg-teal-900/60 px-1 rounded text-teal-200">/scan/QR...</code>. When scanned, server logs scan event in Analytics and opens Google Maps!
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300 font-medium">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>Identifies smartphone device (iOS vs Android)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>Real-time scan counter and timestamp logging</span>
            </div>
          </div>

          {googleReviewUrl && (
            <div className="p-3 bg-[#080d1a] rounded-xl border border-slate-800 overflow-hidden">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Destination Review Link</div>
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-cyan-400 hover:underline truncate flex items-center gap-1.5"
              >
                <span className="truncate">{googleReviewUrl}</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
