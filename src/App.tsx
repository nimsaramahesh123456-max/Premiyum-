import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { RawPremiyumConfig, initialPremiyumData } from './data/rawInitialData';
import { BotSubscription, PremiyumStats, SubscriptionStatus } from './types';
import { buildBotSubscription, addDaysToDate } from './utils/phone';
import { Header } from './components/Header';
import { StatsCards } from './components/StatsCards';
import { AccessChecker } from './components/AccessChecker';
import { BotTable } from './components/BotTable';
import { AddBotModal, AddBotFormResult } from './components/AddBotModal';
import { JsonSyncModal } from './components/JsonSyncModal';
import { IntegrationGuideModal } from './components/IntegrationGuideModal';
import { GitHubSyncModal } from './components/GitHubSyncModal';
import { MobileBottomNav, MobileTab } from './components/MobileBottomNav';
import { CustomerPortal } from './components/CustomerPortal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ClientLinkModal } from './components/ClientLinkModal';
import { BillReceiptModal, BillDetails } from './components/BillReceiptModal';
import { RenewBotModal } from './components/RenewBotModal';
import { ShieldCheck, GitCommit, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';

const STORAGE_KEY = 'premiyum_bot_registry_data';

export interface LiveDeltaPayload {
  action: 'add' | 'renew' | 'update-expiry' | 'delete' | 'batch-extend' | 'batch-delete' | 'save';
  botId?: string;
  phoneNumber?: string;
  expiryDate?: string | null;
  purchaseDate?: string | null;
  days?: number;
  botIds?: string[];
  fullData?: any;
  commitMessage?: string;
}

export const App: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const portalParam = urlParams.get('portal') || urlParams.get('client');

  const [activePortalBotId, setActivePortalBotId] = useState<string | null>(portalParam);
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem('premiyum_admin_auth') === 'true';
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [selectedClientLinkBot, setSelectedClientLinkBot] = useState<BotSubscription | null>(null);

  // Bill Generation States
  const [currentBill, setCurrentBill] = useState<BillDetails | null>(null);
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [selectedRenewBot, setSelectedRenewBot] = useState<BotSubscription | null>(null);

  const [config, setConfig] = useState<RawPremiyumConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.premiumBots && parsed._expiry) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse stored configuration', e);
    }
    return initialPremiyumData;
  });

  const [selectedFilter, setSelectedFilter] = useState<'all' | SubscriptionStatus>('all');
  const [mobileTab, setMobileTab] = useState<MobileTab>('bots');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [prefilledPhone, setPrefilledPhone] = useState('');
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [diskSaved, setDiskSaved] = useState<boolean>(true);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [lastCommitUrl, setLastCommitUrl] = useState<string | null>(null);
  const [isLiveSyncing, setIsLiveSyncing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; url?: string; type: 'success' | 'error' } | null>(null);

  const initialLoadRef = useRef(false);

  // 1. Fetch current Fuck.josn from server (which pulls latest from GitHub)
  const fetchServerData = useCallback(async (notifyUser: boolean = false) => {
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setConfig(json.data);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data));
          setDiskSaved(true);
          setLastSavedTime(new Date().toISOString());
          if (notifyUser) {
            setToastMessage({
              type: 'success',
              text: `Pulled latest data from GitHub! (${json.data.premiumBots?.length || 0} bots registered)`
            });
          }
        }
      }
    } catch (err) {
      console.warn('Backend /api/data not reachable yet, using cache', err);
    } finally {
      initialLoadRef.current = true;
    }
  }, []);

  useEffect(() => {
    fetchServerData(false);

    // Auto-refresh when tab regains focus
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchServerData(false);
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);
    return () => window.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchServerData]);

  // 2. ATOMIC REAL-TIME LIVE UPDATE ENGINE
  // Whenever any edit occurs on web, this immediately updates server & pushes to GitHub repos!
  const executeLiveUpdate = async (delta: LiveDeltaPayload, successText: string) => {
    setIsLiveSyncing(true);
    setToastMessage(null);

    // Optimistic UI update so deleted bot disappears immediately without lag
    if (delta.action === 'delete' && delta.botId) {
      const targetId = delta.botId;
      const cleanTarget = targetId.replace(/\D/g, '');
      setConfig((prev) => ({
        ...prev,
        premiumBots: prev.premiumBots.filter((b) => {
          if (b === targetId) return false;
          const bClean = b.replace(/\D/g, '');
          if (cleanTarget && bClean === cleanTarget) return false;
          if (cleanTarget.startsWith('0') && bClean === '94' + cleanTarget.slice(1)) return false;
          if (cleanTarget.startsWith('94') && bClean === '0' + cleanTarget.slice(2)) return false;
          return true;
        }),
        _expiry: Object.fromEntries(
          Object.entries(prev._expiry).filter(([k]) => {
            if (k === targetId) return false;
            const kClean = k.replace(/\D/g, '');
            if (cleanTarget && kClean === cleanTarget) return false;
            return true;
          })
        ),
        _purchased: Object.fromEntries(
          Object.entries(prev._purchased || {}).filter(([k]) => {
            if (k === targetId) return false;
            const kClean = k.replace(/\D/g, '');
            if (cleanTarget && kClean === cleanTarget) return false;
            return true;
          })
        )
      }));
    } else if (delta.action === 'batch-delete' && delta.botIds) {
      const set = new Set(delta.botIds);
      setConfig((prev) => ({
        ...prev,
        premiumBots: prev.premiumBots.filter((b) => !set.has(b)),
        _expiry: Object.fromEntries(Object.entries(prev._expiry).filter(([k]) => !set.has(k))),
        _purchased: Object.fromEntries(Object.entries(prev._purchased || {}).filter(([k]) => !set.has(k)))
      }));
    }

    try {
      const res = await fetch('/api/live-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(delta)
      });

      const result = await res.json();
      if (res.ok && result.success && result.data) {
        setConfig(result.data);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data));
        setDiskSaved(true);
        setLastSavedTime(result.timestamp || new Date().toISOString());
        if (result.commitUrl) {
          setLastCommitUrl(result.commitUrl);
        }

        setToastMessage({
          type: 'success',
          text: `${successText} (Live GitHub Synced)`,
          url: result.commitUrl
        });
      } else {
        throw new Error(result.error || 'Server live update failed');
      }
    } catch (err: any) {
      console.error('Live sync error:', err);
      // Fallback: save locally
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      } catch (_) {}
      setToastMessage({
        type: 'error',
        text: `Live Sync Notice: ${err.message || 'Connection error'}. Changes stored locally.`
      });
    } finally {
      setIsLiveSyncing(false);
      setTimeout(() => {
        setToastMessage((prev) => (prev?.type === 'success' ? null : prev));
      }, 5000);
    }
  };

  // Transform raw configuration into rich BotSubscription array
  const botList: BotSubscription[] = useMemo(() => {
    const list: BotSubscription[] = [];
    const seen = new Set<string>();

    for (const id of config.premiumBots) {
      if (seen.has(id)) continue;
      seen.add(id);
      const expiry = config._expiry[id];
      const purchase = config._purchased?.[id];
      list.push(buildBotSubscription(id, expiry, purchase));
    }

    for (const [id, expiry] of Object.entries(config._expiry)) {
      if (!seen.has(id)) {
        seen.add(id);
        const purchase = config._purchased?.[id];
        list.push(buildBotSubscription(id, expiry, purchase));
      }
    }

    return list;
  }, [config]);

  // Compute summary stats
  const stats: PremiyumStats = useMemo(() => {
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    let lifetime = 0;

    for (const bot of botList) {
      if (bot.status === 'active') active++;
      else if (bot.status === 'expiring_soon') expiringSoon++;
      else if (bot.status === 'expired') expired++;
      else if (bot.status === 'lifetime') lifetime++;
    }

    return {
      total: botList.length,
      active,
      expiringSoon,
      expired,
      lifetime
    };
  }, [botList]);

  // Helper to generate Invoice ID
  const generateInvoiceNumber = () => {
    const random = Math.floor(100000 + Math.random() * 900000);
    return `INV-${new Date().getFullYear()}-${random}`;
  };

  // HANDLERS — All hooked up to atomic real-time live GitHub sync!
  const handleAddBotWithBill = (form: AddBotFormResult): boolean => {
    const clean = form.phoneNumber.trim();
    if (config.premiumBots.includes(clean)) {
      return false;
    }

    // Live update directly to GitHub and disk
    executeLiveUpdate(
      {
        action: 'add',
        phoneNumber: clean,
        expiryDate: form.expiryDate,
        purchaseDate: form.purchaseDate
      },
      `Added bot ${clean}`
    );

    // If generateBill is selected, show bill receipt modal immediately
    if (form.generateBill) {
      const invNo = generateInvoiceNumber();
      setCurrentBill({
        invoiceNo: invNo,
        botId: clean,
        formattedNumber: clean,
        purchaseDate: form.purchaseDate || new Date().toISOString().split('T')[0],
        expiryDate: form.expiryDate || 'Lifetime Access',
        durationLabel: form.durationLabel,
        price: form.price,
        paymentMethod: form.paymentMethod
      });
      setIsBillModalOpen(true);
    }

    return true;
  };

  const handleConfirmRenewWithBill = (
    botId: string,
    newExpiryDate: string,
    price: string,
    paymentMethod: string,
    durationLabel: string
  ) => {
    executeLiveUpdate(
      {
        action: 'renew',
        botId,
        expiryDate: newExpiryDate
      },
      `Renewed bot ${botId}`
    );

    // Generate bill for renewal
    const invNo = generateInvoiceNumber();
    const purchaseDate = config._purchased?.[botId] || new Date().toISOString().split('T')[0];

    setCurrentBill({
      invoiceNo: invNo,
      botId,
      formattedNumber: botId,
      purchaseDate,
      expiryDate: newExpiryDate,
      durationLabel,
      price,
      paymentMethod
    });
    setIsBillModalOpen(true);
  };

  const handleOpenDirectBill = (bot: BotSubscription) => {
    const invNo = generateInvoiceNumber();
    setCurrentBill({
      invoiceNo: invNo,
      botId: bot.id,
      formattedNumber: bot.formattedNumber,
      purchaseDate: bot.purchaseDate || new Date().toISOString().split('T')[0],
      expiryDate: bot.expiryDate || 'Lifetime Access',
      durationLabel: bot.expiryDate ? 'Standard Subscription' : 'Lifetime Access',
      price: 'Rs. 1,500',
      paymentMethod: 'eZ Cash'
    });
    setIsBillModalOpen(true);
  };

  const handleUpdateExpiry = (id: string, newDate: string | null) => {
    executeLiveUpdate(
      {
        action: 'update-expiry',
        botId: id,
        expiryDate: newDate
      },
      `Updated expiry for bot ${id}`
    );
  };

  const handleDeleteBot = (id: string) => {
    executeLiveUpdate(
      {
        action: 'delete',
        botId: id
      },
      `Removed bot ${id}`
    );
  };

  const handleRenewBot = (id: string, days: number) => {
    executeLiveUpdate(
      {
        action: 'renew',
        botId: id,
        days
      },
      `Extended bot ${id} by ${days} days`
    );
  };

  const handleBatchExtend = (ids: string[], days: number) => {
    executeLiveUpdate(
      {
        action: 'batch-extend',
        botIds: ids,
        days
      },
      `Batch extended ${ids.length} bots`
    );
  };

  const handleBatchDelete = (ids: string[]) => {
    executeLiveUpdate(
      {
        action: 'batch-delete',
        botIds: ids
      },
      `Batch removed ${ids.length} bots`
    );
  };

  const handleResetData = () => {
    if (window.confirm('Reset all bots back to the initial Fuck.josn dataset from repository?')) {
      executeLiveUpdate(
        {
          action: 'save',
          fullData: initialPremiyumData,
          commitMessage: 'Reset Fuck.josn to initial repository dataset'
        },
        'Reset bot database'
      );
    }
  };

  const handleImportConfig = (newConfig: RawPremiyumConfig) => {
    executeLiveUpdate(
      {
        action: 'save',
        fullData: newConfig,
        commitMessage: 'Synced Fuck.josn config via Web Manager'
      },
      'Updated configuration'
    );
  };

  const handleQuickAdd = (phone: string) => {
    setPrefilledPhone(phone);
    setIsAddModalOpen(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('premiyum_admin_auth');
    setIsAdmin(false);
    setActivePortalBotId(botList[0]?.id || '94772160189');
  };

  // IF NOT ADMIN: Render Customer Portal with Admin Login Modal accessible
  if (!isAdmin) {
    return (
      <>
        <CustomerPortal
          botId={activePortalBotId || portalParam || botList[0]?.id || '94772160189'}
          onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
        />
        <AdminLoginModal
          isOpen={isAdminLoginModalOpen}
          onClose={() => setIsAdminLoginModalOpen(false)}
          onSuccessLogin={() => {
            setIsAdmin(true);
            setActivePortalBotId(null);
          }}
        />
      </>
    );
  }

  // ADMIN DASHBOARD VIEW
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Header */}
      <Header
        onOpenAddModal={() => {
          setPrefilledPhone('');
          setIsAddModalOpen(true);
        }}
        onOpenJsonModal={() => setIsJsonModalOpen(true)}
        onOpenIntegrationModal={() => setIsIntegrationModalOpen(true)}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
        onResetData={handleResetData}
        totalBots={stats.total}
        isSyncing={isLiveSyncing}
        onManualRefresh={() => fetchServerData(true)}
        lastCommitUrl={lastCommitUrl}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onViewPortal={() => {
          setActivePortalBotId(botList[0]?.id || '94772160189');
          setIsAdmin(false);
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-top duration-300 max-w-sm">
          <div
            className={`p-3.5 rounded-2xl border shadow-xl flex items-center justify-between gap-3 text-xs ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span className="font-semibold">{toastMessage.text}</span>
            </div>
            {toastMessage.url && (
              <a
                href={toastMessage.url}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 underline font-mono shrink-0 flex items-center gap-0.5"
              >
                View <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2.5 sm:px-6 lg:px-8 py-3 sm:py-6 space-y-3.5 sm:space-y-6 pb-24 sm:pb-12 min-w-0 overflow-x-hidden">
        {/* Welcome & Live Auto-Sync Status Banner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 overflow-hidden w-full max-w-full">
          <div className="space-y-1 min-w-0 w-full md:w-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`flex h-2.5 w-2.5 rounded-full ${isLiveSyncing ? 'bg-amber-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`} />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Premiyum Bot License Database
              </h2>
              <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-medium border border-slate-200">
                Fuck.josn
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Live GitHub Sync Active
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 max-w-2xl leading-relaxed">
              Every addition, renewal, or deletion commits directly to your GitHub repository in real time. 
              Existing bots and previous edits are safely preserved.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start shrink-0 flex-wrap">
            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
              {isLiveSyncing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                  <div className="text-[11px] font-mono font-bold text-amber-700">Syncing to GitHub...</div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <div className="text-[11px] font-mono font-bold text-emerald-700">Live Synced</div>
                </>
              )}
            </div>

            <button
              onClick={() => fetchServerData(true)}
              disabled={isLiveSyncing}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Pull fresh data from GitHub repository"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isLiveSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh from GitHub</span>
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>

        {/* MOBILE VIEW SWITCHING (< 640px) */}
        <div className="sm:hidden space-y-4">
          {mobileTab === 'bots' && (
            <BotTable
              bots={botList}
              selectedFilter={selectedFilter}
              onSelectFilter={(f) => setSelectedFilter(f)}
              onUpdateExpiry={handleUpdateExpiry}
              onDeleteBot={handleDeleteBot}
              onBatchExtend={handleBatchExtend}
              onBatchDelete={handleBatchDelete}
              onOpenClientLink={(bot) => setSelectedClientLinkBot(bot)}
              onOpenRenewModal={(bot) => setSelectedRenewBot(bot)}
              onOpenBillModal={handleOpenDirectBill}
            />
          )}

          {mobileTab === 'checker' && (
            <AccessChecker
              bots={botList}
              onRenewBot={handleRenewBot}
              onQuickAdd={handleQuickAdd}
              onOpenClientLink={(bot) => setSelectedClientLinkBot(bot)}
            />
          )}

          {mobileTab === 'stats' && (
            <div className="space-y-4">
              <StatsCards
                stats={stats}
                selectedFilter={selectedFilter}
                onSelectFilter={(f) => {
                  setSelectedFilter(f);
                  setMobileTab('bots');
                }}
              />
              <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2">
                <h4 className="font-bold text-slate-800">Registry Overview</h4>
                <p>Total Registered: <strong>{stats.total}</strong></p>
                <p>Active Subscriptions: <strong className="text-emerald-700">{stats.active}</strong></p>
                <p>Expiring in &le; 7 days: <strong className="text-amber-700">{stats.expiringSoon}</strong></p>
                <p>Expired Subscriptions: <strong className="text-rose-700">{stats.expired}</strong></p>
                <p>Lifetime / Permanent: <strong className="text-purple-700">{stats.lifetime}</strong></p>
              </div>
            </div>
          )}

          {mobileTab === 'github' && (
            <div className="p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-4">
              <div className="flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">Live GitHub Auto-Sync</h3>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] leading-relaxed">
                Live update is enabled. Edits you make from the web automatically commit to GitHub immediately. No manual push button is needed!
              </div>
              <div className="space-y-1.5 text-slate-600">
                <p>Target File: <strong className="text-slate-900 font-mono">Fuck.josn</strong></p>
                <p>Status: <strong className="text-emerald-700">Auto-Commits Active</strong></p>
                <p>Registered Bots: <strong className="text-slate-900">{botList.length}</strong></p>
                {lastCommitUrl && (
                  <p>
                    <a href={lastCommitUrl} target="_blank" rel="noreferrer" className="text-emerald-700 underline font-mono">
                      View Latest Commit on GitHub &rarr;
                    </a>
                  </p>
                )}
              </div>
              <button
                onClick={() => fetchServerData(true)}
                disabled={isLiveSyncing}
                className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLiveSyncing ? 'animate-spin' : ''}`} />
                <span>Pull Fresh from GitHub</span>
              </button>
            </div>
          )}
        </div>

        {/* DESKTOP VIEW (>= 640px) */}
        <div className="hidden sm:block space-y-6">
          <StatsCards
            stats={stats}
            selectedFilter={selectedFilter}
            onSelectFilter={(f) => setSelectedFilter(f)}
          />

          <AccessChecker
            bots={botList}
            onRenewBot={handleRenewBot}
            onQuickAdd={handleQuickAdd}
            onOpenClientLink={(bot) => setSelectedClientLinkBot(bot)}
          />

          <BotTable
            bots={botList}
            selectedFilter={selectedFilter}
            onSelectFilter={(f) => setSelectedFilter(f)}
            onUpdateExpiry={handleUpdateExpiry}
            onDeleteBot={handleDeleteBot}
            onBatchExtend={handleBatchExtend}
            onBatchDelete={handleBatchDelete}
            onOpenClientLink={(bot) => setSelectedClientLinkBot(bot)}
            onOpenRenewModal={(bot) => setSelectedRenewBot(bot)}
            onOpenBillModal={handleOpenDirectBill}
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (< 640px) */}
      <MobileBottomNav
        activeTab={mobileTab}
        onTabChange={(tab) => setMobileTab(tab)}
        botCount={stats.total}
        onOpenAddModal={() => {
          setPrefilledPhone('');
          setIsAddModalOpen(true);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 bg-white text-slate-500 text-xs hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span className="font-bold text-slate-800">Premiyum-</span>
            <span>• WhatsApp & Telegram Bot Licensing and Access Control</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span>Live Sync: Premiyum- & shenal-Timira</span>
            <span>File: Fuck.josn</span>
            <span>Procfile & Heroku Ready</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddBotModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddBotWithBill={handleAddBotWithBill}
        initialPhoneNumber={prefilledPhone}
      />

      <JsonSyncModal
        isOpen={isJsonModalOpen}
        onClose={() => setIsJsonModalOpen(false)}
        rawConfig={config}
        onImportConfig={handleImportConfig}
      />

      <IntegrationGuideModal
        isOpen={isIntegrationModalOpen}
        onClose={() => setIsIntegrationModalOpen(false)}
      />

      <GitHubSyncModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
        rawConfig={config}
        diskLastSaved={lastSavedTime}
        lastCommitUrl={lastCommitUrl}
        onRefreshFromGitHub={() => fetchServerData(true)}
        onSuccessPush={(url) => {
          setLastCommitUrl(url);
          setToastMessage({
            type: 'success',
            text: 'Committed to GitHub successfully!',
            url
          });
        }}
      />

      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccessLogin={() => {
          setIsAdmin(true);
          setActivePortalBotId(null);
        }}
      />

      <ClientLinkModal
        isOpen={Boolean(selectedClientLinkBot)}
        onClose={() => setSelectedClientLinkBot(null)}
        bot={selectedClientLinkBot}
        onPreviewPortal={(id) => {
          setActivePortalBotId(id);
          setIsAdmin(false);
        }}
      />

      <RenewBotModal
        isOpen={Boolean(selectedRenewBot)}
        onClose={() => setSelectedRenewBot(null)}
        bot={selectedRenewBot}
        onConfirmRenewWithBill={handleConfirmRenewWithBill}
      />

      <BillReceiptModal
        isOpen={isBillModalOpen}
        onClose={() => {
          setIsBillModalOpen(false);
          setCurrentBill(null);
        }}
        bill={currentBill}
      />
    </div>
  );
};
