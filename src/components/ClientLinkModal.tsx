import React, { useState } from 'react';
import { X, Share2, Copy, Check, MessageSquare, ExternalLink, Link2, Calendar, Clock } from 'lucide-react';
import { BotSubscription } from '../types';
import { formatPhoneNumber, formatReadableDate } from '../utils/phone';

interface ClientLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  bot: BotSubscription | null;
  onPreviewPortal: (botId: string) => void;
}

export const ClientLinkModal: React.FC<ClientLinkModalProps> = ({
  isOpen,
  onClose,
  bot,
  onPreviewPortal
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !bot) return null;

  const origin = window.location.origin;
  const clientUrl = `${origin}?portal=${encodeURIComponent(bot.id)}`;
  const waNumber = formatPhoneNumber(bot.id).waNumber;

  const handleCopy = () => {
    navigator.clipboard.writeText(clientUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `🖤 GHOST X MD ACCESS PASS ⚡\nHello! Here is your official Bot Subscription & Access Pass:\n${clientUrl}\n\n📞 Renew, Buy & Support Admin: +94 70 383 0990 (https://wa.me/94703830990)\nCheck your activation date, expiration date, and remaining days anytime!`;
  const waShareUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(shareText)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Buyer Subscription Access Pass</h3>
              <p className="text-[11px] text-slate-500">{bot.formattedNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-600">
              <span>Client Number:</span>
              <strong className="text-slate-900 font-mono">{bot.formattedNumber}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Purchase Date:</span>
              <strong className="text-slate-900 font-mono">{formatReadableDate(bot.purchaseDate)}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Expiration Date:</span>
              <strong className="text-slate-900 font-mono">{formatReadableDate(bot.expiryDate)}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Days Remaining:</span>
              <strong className="text-emerald-700">{bot.daysLeft !== null ? `${bot.daysLeft} days` : 'Lifetime'}</strong>
            </div>
          </div>

          {/* Generated URL Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Unique Buyer Portal Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={clientUrl}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              The buyer can open this link on any mobile phone or browser to see their activation pass without logging in.
            </p>
          </div>

          {/* Direct WhatsApp Share button */}
          <div className="space-y-2 pt-1">
            <a
              href={waShareUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Send Link to Client on WhatsApp</span>
            </a>

            <button
              onClick={() => {
                onPreviewPortal(bot.id);
                onClose();
              }}
              className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>Preview Customer View</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
