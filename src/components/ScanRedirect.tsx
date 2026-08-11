import { useEffect, useState } from 'react';
import { useParams } from 'react';
import { ExternalLink, AlertTriangle, ShieldCheck, MapPin, Loader2 } from 'lucide-react';

export default function ScanRedirect() {
  const { qrId } = useParams<{ qrId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hotelName, setHotelName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');

  useEffect(() => {
    if (!qrId) {
      setError('Invalid QR Code ID');
      setLoading(false);
      return;
    }

    const processScan = async () => {
      try {
        const response = await fetch(`/api/scan/${qrId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('QR Code not found or has been deactivated.');
          }
          const text = await response.text();
          throw new Error(text || 'Failed to process QR Code scan.');
        }

        const data = await response.json();
        if (!data.googleReviewUrl) {
          throw new Error('Review URL not configured for this QR Code.');
        }

        setHotelName(data.hotelName || data.placeName || 'Hotel');
        setTargetUrl(data.googleReviewUrl);

        // Immediate safe redirect to the Google Review / Map location
        setTimeout(() => {
          window.location.href = data.googleReviewUrl;
        }, 800);
      } catch (err: any) {
        console.error('Scan redirect error:', err);
        setError(err.message || 'An error occurred while redirecting.');
        setLoading(false);
      }
    };

    processScan();
  }, [qrId]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#060913] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
        <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-cyan-500/20 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-extrabold text-slate-100">Redirect Failed</h1>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          </div>

          <div className="pt-2">
            <a
              href="/admin/login"
              className="inline-block px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-bold text-xs transition-colors uppercase tracking-wider"
            >
              Return to Admin Portal
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060913] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 font-sans relative overflow-hidden selection:bg-cyan-500 selection:text-slate-950">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-cyan-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-cyan-500/20 text-center space-y-6 shadow-2xl relative z-10">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center space-y-2">
          <img src="/conlogo.png" alt="Connectix Logo" className="h-14 sm:h-16 w-auto logo-glow" />
          <div className="text-[10px] font-extrabold tracking-widest text-cyan-400 uppercase">
            CONNECTIX ROUTING ENGINE
          </div>
        </div>

        <div className="space-y-2">
          <div className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold uppercase inline-block tracking-wider">
            QR ID: {qrId}
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-100 tracking-tight">
            {hotelName ? `Redirecting to ${hotelName}` : 'Connecting to Map Location...'}
          </h1>
          <p className="text-xs text-slate-400">
            Transferring you directly to Google Maps & Review Destination
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-3 space-y-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-[11px] font-mono text-slate-400 animate-pulse">
            Logging Scan Event & Verifying Target Link...
          </span>
        </div>

        {targetUrl && (
          <div className="pt-2 border-t border-slate-800/80">
            <a
              href={targetUrl}
              className="text-xs text-cyan-400 hover:underline inline-flex items-center gap-1.5 font-mono truncate max-w-[280px]"
            >
              <span>Click here if redirect does not start</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        )}

        <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-500 font-medium pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>Verified Direct Redirect Endpoint</span>
        </div>
      </div>
    </div>
  );
}
