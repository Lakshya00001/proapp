import React from 'react';
import { Camera, FileSpreadsheet, BarChart3, Receipt, Settings, Sparkles, RefreshCw, Moon, Sun, Database, LogOut, UserCheck } from 'lucide-react';

interface HeaderProps {
  activeTab: 'upload' | 'bills' | 'excel' | 'powerbi';
  setActiveTab: (tab: 'upload' | 'bills' | 'excel' | 'powerbi') => void;
  billsCount: number;
  onOpenSettings: () => void;
  onResetSampleData: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  aiEngine: 'groq' | 'opensource' | 'gemini';
  userEmail?: string;
  onSignOut: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  billsCount,
  onOpenSettings,
  onResetSampleData,
  isDark,
  onToggleTheme,
  aiEngine,
  userEmail,
  onSignOut
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('upload')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold tracking-tight text-white">BillSnap</span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Groq 120B AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:flex items-center space-x-1.5">
                <span className="text-emerald-400 font-semibold">100% Accurate OCR</span>
                <span>•</span>
                <span className="text-indigo-400 flex items-center">
                  <Database className="w-3 h-3 inline mr-0.5" />
                  Supabase Cloud DB
                </span>
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Capture & OCR</span>
            </button>

            <button
              onClick={() => setActiveTab('bills')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all relative ${
                activeTab === 'bills'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Digital Bills</span>
              {billsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs font-bold rounded-full bg-emerald-500 text-white">
                  {billsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('excel')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'excel'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Export</span>
            </button>

            <button
              onClick={() => setActiveTab('powerbi')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'powerbi'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Power BI Hub</span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2">
            {/* Dark / Light Toggle */}
            <button
              onClick={onToggleTheme}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 transition-colors"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Reset / Sample */}
            <button
              onClick={onResetSampleData}
              title="Reset Sample Bills in Supabase / Local DB"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Settings</span>
              <Sparkles className="w-3 h-3 text-indigo-400" />
            </button>

            {/* User Avatar & Sign Out */}
            {userEmail && (
              <div className="flex items-center space-x-2 pl-1 border-l border-slate-800">
                <div
                  className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 bg-slate-800/80 rounded-xl text-xs text-slate-300 border border-slate-750"
                  title={userEmail}
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="max-w-[110px] truncate">{userEmail}</span>
                </div>
                <button
                  onClick={onSignOut}
                  title="Sign out / Lock site"
                  className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-750 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="flex md:hidden border-t border-slate-800 py-2 justify-around">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex flex-col items-center text-xs ${
              activeTab === 'upload' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Camera className="w-5 h-5 mb-0.5" />
            <span>Capture</span>
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`flex flex-col items-center text-xs relative ${
              activeTab === 'bills' ? 'text-indigo-400 font-bold' : 'text-slate-400'
            }`}
          >
            <Receipt className="w-5 h-5 mb-0.5" />
            <span>Bills ({billsCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className={`flex flex-col items-center text-xs ${
              activeTab === 'excel' ? 'text-emerald-400 font-bold' : 'text-slate-400'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 mb-0.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => setActiveTab('powerbi')}
            className={`flex flex-col items-center text-xs ${
              activeTab === 'powerbi' ? 'text-amber-400 font-bold' : 'text-slate-400'
            }`}
          >
            <BarChart3 className="w-5 h-5 mb-0.5" />
            <span>Power BI</span>
          </button>
        </div>
      </div>
    </header>
  );
};
