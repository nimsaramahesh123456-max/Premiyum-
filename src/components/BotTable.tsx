import React, { useState } from 'react';
import { BotSubscription, SubscriptionStatus, SortField, SortOrder } from '../types';
import { formatReadableDate, formatPhoneNumber, addDaysToDate } from '../utils/phone';
import { BotCardMobile } from './BotCardMobile';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Copy, 
  Check, 
  MessageSquare, 
  Trash2, 
  Calendar, 
  Clock, 
  Share2,
  Receipt,
  RefreshCw
} from 'lucide-react';

interface BotTableProps {
  bots: BotSubscription[];
  selectedFilter: string;
  onSelectFilter: (filter: 'all' | SubscriptionStatus) => void;
  onUpdateExpiry: (id: string, newDate: string | null) => void;
  onDeleteBot: (id: string) => void;
  onBatchExtend: (ids: string[], days: number) => void;
  onBatchDelete: (ids: string[]) => void;
  onOpenClientLink: (bot: BotSubscription) => void;
  onOpenRenewModal: (bot: BotSubscription) => void;
  onOpenBillModal: (bot: BotSubscription) => void;
}

export const BotTable: React.FC<BotTableProps> = ({
  bots,
  selectedFilter,
  onSelectFilter,
  onUpdateExpiry,
  onDeleteBot,
  onBatchExtend,
  onBatchDelete,
  onOpenClientLink,
  onOpenRenewModal,
  onOpenBillModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('expiryDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState<string>('');
  const [botToDelete, setBotToDelete] = useState<string | null>(null);
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredBots = bots.filter((bot) => {
    if (selectedFilter !== 'all' && bot.status !== selectedFilter) {
      return false;
    }
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      const cleanTerm = term.replace(/\D/g, '');
      const cleanBot = bot.id.replace(/\D/g, '');
      const matchPhone = bot.id.includes(term) || (cleanTerm && cleanBot.includes(cleanTerm));
      const matchDate = bot.expiryDate?.includes(term);
      const matchStatus = bot.statusLabel.toLowerCase().includes(term);
      return matchPhone || matchDate || matchStatus;
    }
    return true;
  });

  const sortedBots = [...filteredBots].sort((a, b) => {
    let comparison = 0;
    if (sortField === 'expiryDate') {
      const dateA = a.expiryDate || '9999-99-99';
      const dateB = b.expiryDate || '9999-99-99';
      comparison = dateA.localeCompare(dateB);
    } else if (sortField === 'daysLeft') {
      const daysA = a.daysLeft === null ? 999999 : a.daysLeft;
      const daysB = b.daysLeft === null ? 999999 : b.daysLeft;
      comparison = daysA - daysB;
    } else if (sortField === 'phoneNumber') {
      comparison = a.id.localeCompare(b.id);
    } else if (sortField === 'status') {
      comparison = a.status.localeCompare(b.status);
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(sortedBots.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
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

  const isAllSelected = sortedBots.length > 0 && selectedIds.length === sortedBots.length;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-3.5 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50/50">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => onSelectFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              selectedFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All Bots ({bots.length})
          </button>
          <button
            onClick={() => onSelectFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              selectedFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Active ({bots.filter((b) => b.status === 'active').length})
          </button>
          <button
            onClick={() => onSelectFilter('expiring_soon')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              selectedFilter === 'expiring_soon'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Expiring Soon ({bots.filter((b) => b.status === 'expiring_soon').length})
          </button>
          <button
            onClick={() => onSelectFilter('expired')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              selectedFilter === 'expired'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Expired ({bots.filter((b) => b.status === 'expired').length})
          </button>
          <button
            onClick={() => onSelectFilter('lifetime')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-colors whitespace-nowrap cursor-pointer ${
              selectedFilter === 'lifetime'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Lifetime ({bots.filter((b) => b.status === 'lifetime').length})
          </button>
        </div>

        {/* Search Field & Mobile select all bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search phone number, status..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400"
            />
          </div>

          <div className="sm:hidden flex items-center justify-end">
            <label className="text-xs text-slate-600 flex items-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                className="rounded border-slate-300 text-amber-500 w-3.5 h-3.5"
              />
              <span>Select All</span>
            </label>
          </div>
        </div>
      </div>

      {/* Batch Actions Bar (when items selected) */}
      {selectedIds.length > 0 && (
        <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-900 font-semibold">
            <span>{selectedIds.length} bot{selectedIds.length > 1 ? 's' : ''} selected</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => onBatchExtend(selectedIds, 30)}
              className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold transition shadow-xs cursor-pointer text-xs"
            >
              Extend +30 Days
            </button>
            <button
              onClick={() => onBatchExtend(selectedIds, 7)}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition cursor-pointer text-xs"
            >
              +7 Days
            </button>
            <button
              onClick={() => setIsBatchDeleteModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 border border-rose-200 font-medium transition cursor-pointer text-xs"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="text-slate-500 hover:text-slate-800 underline ml-1 cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* 1. MOBILE VIEW: Touch-Friendly Bot Cards (< 640px) */}
      <div className="sm:hidden p-3 space-y-3 bg-slate-50/50">
        {sortedBots.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No premium bots found</p>
            <p className="text-xs text-slate-400">Try adjusting your search or filter</p>
          </div>
        ) : (
          sortedBots.map((bot) => (
            <BotCardMobile
              key={bot.id}
              bot={bot}
              isSelected={selectedIds.includes(bot.id)}
              onToggleSelect={handleToggleSelect}
              onUpdateExpiry={onUpdateExpiry}
              onDeleteBot={(id) => setBotToDelete(id)}
              onOpenClientLink={onOpenClientLink}
              onOpenRenewModal={onOpenRenewModal}
              onOpenBillModal={onOpenBillModal}
            />
          ))
        )}
      </div>

      {/* 2. DESKTOP VIEW: Full Table (>= 640px) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200 select-none">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                />
              </th>
              <th
                onClick={() => handleSort('phoneNumber')}
                className="p-3.5 cursor-pointer hover:text-slate-900 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Phone Number / Bot ID</span>
                  {sortField === 'phoneNumber' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-600" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('expiryDate')}
                className="p-3.5 cursor-pointer hover:text-slate-900 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Purchase & Expiry</span>
                  {sortField === 'expiryDate' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-600" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>
              <th
                onClick={() => handleSort('daysLeft')}
                className="p-3.5 cursor-pointer hover:text-slate-900 transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Status & Countdown</span>
                  {sortField === 'daysLeft' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-amber-600" /> : <ArrowDown className="w-3.5 h-3.5 text-amber-600" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </th>
              <th className="p-3.5 text-center">Renew & Bill</th>
              <th className="p-3.5 text-right pr-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {sortedBots.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No premium bots found</p>
                    <p className="text-xs text-slate-400">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            ) : (
              sortedBots.map((bot) => {
                const isSelected = selectedIds.includes(bot.id);
                const isCopied = copiedId === bot.id;
                const isEditing = editingId === bot.id;
                const operator = getOperatorName(bot.id);
                const waNumber = formatPhoneNumber(bot.id).waNumber;

                return (
                  <tr
                    key={bot.id}
                    className={`transition-colors hover:bg-slate-50/80 ${
                      isSelected ? 'bg-amber-50/50' : ''
                    }`}
                  >
                    <td className="p-3.5 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(bot.id)}
                        className="rounded border-slate-300 text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          {bot.formattedNumber}
                        </span>
                        <button
                          onClick={() => handleCopy(bot.id)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Copy Raw ID"
                        >
                          {isCopied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${operator.color}`}
                        >
                          {operator.name}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            value={editDateValue}
                            onChange={(e) => setEditDateValue(e.target.value)}
                            className="bg-white border border-amber-400 rounded-lg px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                          />
                          <button
                            onClick={() => {
                              onUpdateExpiry(bot.id, editDateValue || null);
                              setEditingId(null);
                            }}
                            className="px-2.5 py-1 bg-amber-400 text-slate-950 rounded-lg font-bold text-xs cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingId(bot.id);
                            setEditDateValue(bot.expiryDate || '');
                          }}
                          className="cursor-pointer group flex flex-col gap-0.5"
                          title="Click to edit expiry date"
                        >
                          <div className="flex items-center gap-1.5 text-slate-800 font-mono font-medium group-hover:text-amber-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500" />
                            <span>Expires: {bot.expiryDate || 'Lifetime'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono pl-5">
                            Purchased: {formatReadableDate(bot.purchaseDate)}
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
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
                      </div>
                    </td>

                    {/* Renew with Bill Trigger */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onOpenRenewModal(bot)}
                        className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 transition active:scale-95 cursor-pointer shadow-xs"
                      >
                        Renew & Bill
                      </button>
                    </td>

                    <td className="p-3.5 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Bill / Receipt Generator */}
                        <button
                          onClick={() => onOpenBillModal(bot)}
                          className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="Generate & Download Payment Bill"
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-700" />
                        </button>

                        {/* Buyer Link Button */}
                        <button
                          onClick={() => onOpenClientLink(bot)}
                          className="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition cursor-pointer"
                          title="Generate Buyer Access Link"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>

                        <a
                          href={`https://wa.me/${waNumber}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition"
                          title="Open WhatsApp Chat"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => setBotToDelete(bot.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Bot"
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

      {/* Table Footer */}
      <div className="p-3 sm:p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing {sortedBots.length} of {bots.length} registered bots
        </span>
        <span className="hidden sm:inline">
          Sorted by: {sortField} ({sortOrder})
        </span>
      </div>

      {/* Delete Confirmation Modal for Single Bot */}
      <DeleteConfirmModal
        isOpen={Boolean(botToDelete)}
        onClose={() => setBotToDelete(null)}
        onConfirm={() => {
          if (botToDelete) {
            onDeleteBot(botToDelete);
            setBotToDelete(null);
          }
        }}
        botId={botToDelete}
        isBatch={false}
      />

      {/* Delete Confirmation Modal for Batch Delete */}
      <DeleteConfirmModal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        onConfirm={() => {
          onBatchDelete(selectedIds);
          setSelectedIds([]);
          setIsBatchDeleteModalOpen(false);
        }}
        botCount={selectedIds.length}
        isBatch={true}
      />
    </div>
  );
};
