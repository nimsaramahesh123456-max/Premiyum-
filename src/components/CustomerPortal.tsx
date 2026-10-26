import React, { useState, useEffect } from 'react';
import { Crown, Calendar, Clock, MessageSquare, CheckCircle2, AlertTriangle, XCircle, Infinity as InfinityIcon, Copy, Check, Lock, ArrowRight, ShieldCheck, Share2 } from 'lucide-react';
import { formatPhoneNumber, formatReadableDate, calculateSubscriptionDetails } from '../utils/phone';

interface CustomerPortalProps {
  botId: string;
  onOpenAdminLogin: () => void;
  onClearPortal?: () => void;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  botId,
  onOpenAdminLogin,
  onClearPortal
}) => {
  const [data, setData] = useState<{
    botId: string;
    expiryDate: string | null;
    purchaseDate: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState(botId);

  const fetchClientData = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/client-portal/${encodeURIComponent(id)}`);
      const json = await res.json();
      if (res.ok && json.success) {
        setData({
          botId: json.botId,
          expiryDate: json.expiryDate,
          purchaseDate: json.purchaseDate
        });
      } else {
        setError(json.error || 'No active subscription found for this phone number.');
        setData(null);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to connect to verification server');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (botId) {
      fetchClientData(botId);
    } else {
      setLoading(false);
    }
  }, [botId]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?portal=${encodeURIComponent(data?.botId || botId)}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchClientData(searchQuery.trim());
    }
  };

  const phoneInfo = data ? formatPhoneNumber(data.botId) : null;
  const subDetails = data ? calculateSubscriptionDetails(data.expiryDate) : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 text-slate-900 flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Top Header */}
      <header className="max-w-xl w-full mx-auto flex items-center justify-between pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-400 p-0.5 shadow-sm flex items-center justify-center">
            <Crown className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-slate-900">Premiyum</span>
            <span className="text-[11px] block text-slate-500 font-medium">Customer Access Portal</span>
          </div>
        </div>

        <button
          onClick={onOpenAdminLogin}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition shadow-xs cursor-pointer"
        >
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>Admin Login</span>
          <ArrowRight className="w-3 h-3 text-slate-400" />
        </button>
      </header>

      {/* Main Card */}
      <main className="max-w-md w-full mx-auto my-auto space-y-4">
        {/* Search input if no bot or user wants to check another */}
        <form onSubmit={handleSearchSubmit} className="relative shadow-xs">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter your registered phone number..."
            className="w-full pl-4 pr-24 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Verify
          </button>
        </form>

        {loading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-md animate-pulse">
            <div className="w-12 h-12 bg-amber-100 rounded-2xl mx-auto mb-3" />
            <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto mb-2" />
            <div className="h-3 bg-slate-100 rounded w-1/3 mx-auto" />
          </div>
        ) : error ? (
          <div className="bg-white border border-rose-200 rounded-3xl p-6 text-center shadow-md space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Subscription Not Found</h3>
            <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
              {error}
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contact Admin on WhatsApp</span>
              </a>
            </div>
          </div>
        ) : data && subDetails && phoneInfo ? (
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Top Pass Banner */}
            <div className="bg-gradient-to-r from-amber-500 to-yellow-400 p-5 text-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shadow-sm">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold tracking-tight">Verified Premium Pass</h2>
                  <p className="text-[11px] font-semibold text-slate-900/80">Premiyum Bot License</p>
                </div>
              </div>
              <span className="text-[10px] px-2.5 py-1 bg-slate-950/20 backdrop-blur-xs text-slate-950 rounded-full font-bold uppercase tracking-wider">
                Active Tier
              </span>
            </div>

            {/* Subscriber Details */}
            <div className="p-6 space-y-5">
              {/* Phone / Bot ID display */}
              <div className="text-center pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Registered Number
                </span>
                <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                  {phoneInfo.formatted}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      subDetails.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : subDetails.status === 'expiring_soon'
                        ? 'bg-amber-100 text-amber-900'
                        : subDetails.status === 'expired'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        subDetails.status === 'active'
                          ? 'bg-emerald-500'
                          : subDetails.status === 'expiring_soon'
                          ? 'bg-amber-500'
                          : subDetails.status === 'expired'
                          ? 'bg-rose-500'
                          : 'bg-purple-500'
                      }`}
                    />
                    {subDetails.statusLabel}
                  </span>
                </div>
              </div>

              {/* Grid with Buy Date, Expiry Date & Days Left */}
              <div className="grid grid-cols-2 gap-3">
                {/* Buy Date Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium mb-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>Purchase Date</span>
                  </div>
                  <div className="text-sm font-bold text-slate-800 font-mono">
                    {formatReadableDate(data.purchaseDate)}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Initial Activation</span>
                </div>

                {/* Expiry Date Card */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium mb-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Expiration Date</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900 font-mono">
                    {formatReadableDate(data.expiryDate)}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Valid Until 23:59:59</span>
                </div>
              </div>

              {/* Days Remaining Big Visual Counter */}
              {subDetails.daysLeft !== null && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-200/80 text-center">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block mb-0.5">
                    Remaining Subscription Duration
                  </span>
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-950 font-mono tracking-tight">
                      {Math.max(0, subDetails.daysLeft)}
                    </span>
                    <span className="text-sm font-bold text-slate-600">
                      {subDetails.daysLeft === 1 ? 'Day Left' : 'Days Left'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900/80 mt-1">
                    {subDetails.daysLeft > 0
                      ? 'Your bot commands and features are fully operational.'
                      : 'Subscription has expired. Contact support to renew.'}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <a
                  href={`https://wa.me/94703830990?text=Hello%20Admin,%20I%20would%20like%20to%20renew%20or%20buy%20my%20Ghost%20X%20MD%20premium%20bot%20subscription%20for%20${phoneInfo.waNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Renew or Buy on WhatsApp (+94 70 383 0990)</span>
                </a>

                <button
                  onClick={handleCopyLink}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Pass Link Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4 text-slate-500" />
                      <span>Share / Copy My Access Pass Link</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Footer */}
      <footer className="max-w-xl w-full mx-auto text-center pt-4 text-xs text-slate-400">
        <p>Premiyum Bot Subscription Verification System • Apache 2.0</p>
      </footer>
    </div>
  );
};
