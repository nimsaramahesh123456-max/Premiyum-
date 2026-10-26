import React, { useState } from 'react';
import { BotSubscription } from '../types';
import { formatReadableDate, formatPhoneNumber, addDaysToDate } from '../utils/phone';
import { Copy, Check, MessageSquare, Trash2, Calendar, Clock, Edit2, Share2, Receipt } from 'lucide-react';

interface BotCardMobileProps {
  bot: BotSubscription;
  onUpdateExpiry: (id: string, newDate: string | null) => void;
  onDeleteBot: (id: string) => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onOpenClientLink: (bot: BotSubscription) => void;
  onOpenRenewModal: (bot: BotSubscription) => void;
  onOpenBillModal: (bot: BotSubscription) => void;
}

export const BotCardMobile: React.FC<BotCardMobileProps> = ({
  bot,
  onUpdateExpiry,
  onDeleteBot,
  isSelected,
  onToggleSelect,
  onOpenClientLink,
  onOpenRenewModal,
  onOpenBillModal
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [dateValue, setDateValue] = useState(bot.expiryDate || '');

  const handleCopy = () => {
    navigator.clipboard.writeText(bot.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getOperatorName = (phoneNumber: string) => {
    const digits = phoneNumber.replace(/\D/g, '');
    let prefix = '';
    if (digits.startsWith('94')) {
      prefix = digits.slice(2, 4);
    } else if (digits.startsWith('0')) {
      prefix = digits.slice(1, 3);
    }
    switch (prefix) {
      case '77':
      case '76':
        return { name: 'Dialog', color: 'bg-red-50 text-red-700 border-red-200' };
      case '71':
      case '70':
        return { name: 'Mobitel', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case '75':
        return { name: 'Airtel', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      case '78':
      case '72':
        return { name: 'Hutch', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      default:
        return { name: 'LK Mobile', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const operator = getOperatorName(bot.id);
  const waNumber = formatPhoneNumber(bot.id).waNumber;

  return (
    <div
      className={`p-4 rounded-2xl border transition-all duration-200 ${
        isSelected
          ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-400'
          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
      }`}
    >
      {/* Top Row: Checkbox, Number, Operator Badge, Copy */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(bot.id)}
            className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-sm font-bold text-slate-900 tracking-tight">
              {bot.formattedNumber}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 rounded text-slate-400 hover:text-slate-800 transition cursor-pointer"
              title="Copy ID"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${operator.color}`}>
          {operator.name}
        </span>
      </div>

      {/* Middle Row: Status Badge & Dates */}
      <div className="py-2 border-y border-slate-100 my-2 text-xs space-y-1.5">
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              bot.status === 'active'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : bot.status === 'expiring_soon'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : bot.status === 'expired'
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-purple-50 text-purple-800 border-purple-200'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                bot.status === 'active'
                  ? 'bg-emerald-500'
                  : bot.status === 'expiring_soon'
                  ? 'bg-amber-500'
                  : bot.status === 'expired'
                  ? 'bg-rose-500'
                  : 'bg-purple-500'
              }`}
            />
            {bot.statusLabel}
          </span>

          {/* Expiry Date */}
          {isEditing ? (
            <div className="flex items-center gap-1">
              <input
                type="date"
                value={dateValue}
                onChange={(e) => setDateValue(e.target.value)}
                className="text-xs px-2 py-0.5 border border-amber-400 rounded-lg"
              />
              <button
                onClick={() => {
                  onUpdateExpiry(bot.id, dateValue || null);
                  setIsEditing(false);
                }}
                className="px-2 py-0.5 bg-amber-400 font-bold rounded text-slate-950 text-[10px]"
              >
                Save
              </button>
            </div>
          ) : (
            <div
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-slate-600 font-mono text-[11px] cursor-pointer"
              title="Click to edit expiration date"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{bot.expiryDate || 'Lifetime'}</span>
              <Edit2 className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
          <span>Purchase: <strong className="text-slate-600 font-mono">{formatReadableDate(bot.purchaseDate)}</strong></span>
          <span>{bot.daysLeft !== null ? `${bot.daysLeft}d left` : 'Permanent'}</span>
        </div>
      </div>

      {/* Bottom Row: Quick Renew & Action Buttons */}
      <div className="flex items-center justify-between gap-1.5 pt-1">
        {/* Renew & Bill Button */}
        <button
          onClick={() => onOpenRenewModal(bot)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition active:scale-95 cursor-pointer shadow-xs"
        >
          Renew & Bill
        </button>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {/* Bill / Receipt button */}
          <button
            onClick={() => onOpenBillModal(bot)}
            className="p-2 rounded-xl text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            title="Download Payment Bill"
          >
            <Receipt className="w-4 h-4 text-slate-700" />
          </button>

          {/* Buyer Link Button */}
          <button
            onClick={() => onOpenClientLink(bot)}
            className="p-2 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition cursor-pointer"
            title="Buyer Access Pass Link"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noreferrer"
            className="p-2 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
            title="WhatsApp Chat"
          >
            <MessageSquare className="w-4 h-4" />
          </a>

          <button
            onClick={() => onDeleteBot(bot.id)}
            className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
            title="Delete Bot"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
