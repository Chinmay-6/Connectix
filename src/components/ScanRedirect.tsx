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

        setHotelName(data.hotelName || 'Hotel');
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans selection:bg-blue-500 selection:text-white">
        <div className="glass-panel rounded-3xl p-8 max-w-md w-full border border-slate-800 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-100">Redirect Failed</h1>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
          </div>

          <div className="pt-2">
            <a
              href="/admin/login"
              className="inline-block px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors uppercase tracking-wider"
            >
              Return to Admin Portal
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans relative overflow-hidden selection:bg-blue-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="glass-panel rounded-3xl p-8 max-w-md w-full border border-slate-800 text-center space-y-6 shadow-2xl relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-cyan-400 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/25">
          <MapPin className="w-8 h-8 text-white animate-bounce" />
        </div>

        <div className="space-y-2">
          <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-mono font-bold uppercase inline-block tracking-wider">
            QR ID: {qrId}
          </div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">
            {hotelName ? `Redirecting to ${hotelName}` : 'Connecting to Map Location...'}
          </h1>
          <p className="text-xs text-slate-400">
            Transferring you directly to Google Maps & Review Destination
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-4 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="text-[11px] font-mono text-slate-400 animate-pulse">
            Logging Scan Event & Verifying Target Link...
          </span>
        </div>

        {targetUrl && (
          <div className="pt-2 border-t border-slate-800/80">
            <a
              href={targetUrl}
              className="text-xs text-blue-400 hover:underline inline-flex items-center gap-1.5 font-mono truncate max-w-[280px]"
            >
              <span>Click here if redirect does not start</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>
        )}

        <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-500 font-medium pt-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verified Direct Redirect Endpoint</span>
        </div>
      </div>
    </div>
  );
}
