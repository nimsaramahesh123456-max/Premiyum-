import React from 'react';
import { Crown, Code2, FileJson, Plus, RefreshCw, GitCommit, LogOut, ExternalLink } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenJsonModal: () => void;
  onOpenIntegrationModal: () => void;
  onOpenGitHubModal: () => void;
  onResetData: () => void;
  totalBots: number;
  isSyncing: boolean;
  onManualRefresh: () => void;
  lastCommitUrl?: string | null;
  isAdmin: boolean;
  onLogout: () => void;
  onViewPortal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenJsonModal,
  onOpenIntegrationModal,
  onOpenGitHubModal,
  totalBots,
  isSyncing,
  onManualRefresh,
  isAdmin,
  onLogout,
  onViewPortal
}) => {
  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-2 sm:py-3.5 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-2 min-w-0 shrink">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-md shadow-amber-500/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
              <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm sm:text-lg font-bold tracking-tight text-slate-900 truncate">
                Premiyum
              </h1>
              <span className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold shrink-0">
                Admin
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 truncate">
              <span className="font-semibold text-slate-700">{totalBots} Bots</span>
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Live GitHub Sync Status Indicator (Ultra Compact on Mobile) */}
          <button
            type="button"
            onClick={onOpenGitHubModal}
            className={`inline-flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer border shrink-0 ${
              isSyncing
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
            }`}
            title="Every edit commits directly to GitHub automatically in real-time"
          >
            <span className="relative flex h-2 w-2 shrink-0">
              {isSyncing ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              )}
            </span>
            <GitCommit className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-600' : 'text-amber-400'}`} />
            <span className="hidden md:inline">
              {isSyncing ? 'Syncing to GitHub...' : 'Live GitHub Sync'}
            </span>
            <span className="hidden sm:inline md:hidden">
              {isSyncing ? 'Syncing...' : 'Live Sync'}
            </span>
          </button>

          {/* Quick manual fetch/refresh from GitHub */}
          <button
            type="button"
            onClick={onManualRefresh}
            disabled={isSyncing}
            className="p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-xl text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer shrink-0"
            title="Fetch and pull freshest Fuck.josn from GitHub"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          {/* Customer Portal Preview Link (Desktop only) */}
          <button
            type="button"
            onClick={onViewPortal}
            className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            title="View Buyer Access Pass Portal"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>Buyer Portal</span>
          </button>

          {/* Fuck.josn Raw View Modal (Desktop only) */}
          <button
            type="button"
            onClick={onOpenJsonModal}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition cursor-pointer"
            title="View / Edit Fuck.josn"
          >
            <FileJson className="w-3.5 h-3.5 text-amber-600" />
            <span>Fuck.josn</span>
          </button>

          {/* Integration SDK (Desktop only) */}
          <button
            type="button"
            onClick={onOpenIntegrationModal}
            className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-xl text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition cursor-pointer"
            title="Bot SDK Integration"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-600" />
            <span>SDK</span>
          </button>

          {/* Add Bot Button */}
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1 p-1.5 sm:px-3 sm:py-1.5 text-xs font-bold rounded-xl text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 transition shadow-xs active:scale-95 cursor-pointer shrink-0"
            title="Add New Bot"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 text-xs font-medium rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
            title="Logout from Admin"
          >
            <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
