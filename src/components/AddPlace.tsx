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
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <PlusCircle className="w-7 h-7 text-blue-600" />
            Register New Place or Business
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate a tracked QR Code mapping that dynamically logs mobile scan events and redirects to Google Maps.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Registration Form */}
        <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 border border-slate-200 space-y-6 shadow-xl shadow-slate-200/50 bg-white">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-medium flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">Registration Failed</div>
                <div>{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                Place / Business Name
              </label>
              <input
                type="text"
                value={placeName}
                onChange={(e) => setPlaceName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
                required
                placeholder="e.g. Grand Palace Hotel or Bella Italia Cafe"
              />
              <p className="text-[11px] text-slate-400 mt-1.5">Business name displayed in the directory and analytics.</p>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-600" />
                Category / Place Type
              </label>
              <select
                value={placeType}
                onChange={(e) => setPlaceType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-medium transition-all cursor-pointer"
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
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-600" />
                Google Maps / Review Destination Link
              </label>
              <input
                type="url"
                value={googleReviewUrl}
                onChange={(e) => setGoogleReviewUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
                required
                placeholder="https://g.page/r/... or https://maps.google.com/..."
              />
              <p className="text-[11px] text-slate-400 mt-1.5">Direct Google Maps link where customers leave their review.</p>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold py-4 px-6 rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 uppercase text-xs tracking-wider cursor-pointer"
              >
                <span>{loading ? 'PROVISIONING PLACE...' : 'GENERATE SMART TRACKED QR CODE'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Side Card */}
        <div className="lg:col-span-5 glass-card rounded-3xl p-6 border border-slate-200 space-y-6 bg-white shadow-xl shadow-slate-200/40">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-blue-600" />
              Tracked Live QR Preview
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
              LOGGING ACTIVE
            </span>
          </div>

          <div className="flex flex-col items-center justify-center bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-slate-900 space-y-3 shadow-inner">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(previewTarget)}`}
              alt="QR Preview"
              className="w-40 h-40 rounded-xl shadow-md border border-slate-200 bg-white p-2"
            />
            <div className="text-center w-full">
              <div className="text-xs font-mono font-bold text-blue-600">ID: QR_AUTO_GEN</div>
              <div className="text-sm font-black text-slate-900 truncate px-2">
                {placeName || 'Your Business Name'}
              </div>
              <div className="mt-1 flex justify-center">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${selectedTypeInfo.color}`}>
                  <TypeIcon className="w-3 h-3" />
                  {selectedTypeInfo.label}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
            <Smartphone className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-blue-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Guaranteed Mobile Scan Logging
              </div>
              <div className="text-[11px] text-blue-700 mt-0.5">
                Encodes <code className="font-mono bg-blue-100 px-1 rounded text-blue-900">/scan/QR...</code>. When scanned, server logs scan event in TAPHUB Analytics and opens Google Maps!
              </div>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 font-medium">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Identifies smartphone device (iOS vs Android)</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Real-time scan counter and timestamp logging</span>
            </div>
          </div>

          {googleReviewUrl && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Destination Review Link</div>
              <a
                href={googleReviewUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-blue-600 hover:underline truncate flex items-center gap-1.5 font-bold"
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
