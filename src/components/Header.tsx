import React from 'react';
import { Camera, FileSpreadsheet, BarChart3, Receipt, Settings, Sparkles, RefreshCw } from 'lucide-react';

interface HeaderProps {
  activeTab: 'upload' | 'bills' | 'excel' | 'powerbi';
  setActiveTab: (tab: 'upload' | 'bills' | 'excel' | 'powerbi') => void;
  billsCount: number;
  onOpenSettings: () => void;
  onResetSampleData: () => void;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  billsCount,
  onOpenSettings,
  onResetSampleData,
  hasApiKey
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('upload')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">BillSnap</span>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  AI Pro
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Camera OCR • Multi-Bill Split • Excel & Power BI
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Capture & Upload</span>
            </button>

            <button
              onClick={() => setActiveTab('bills')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all relative ${
                activeTab === 'bills'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Digital Bills</span>
              {billsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs font-bold rounded-full bg-indigo-600 text-white">
                  {billsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('excel')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'excel'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel Entry</span>
            </button>

            <button
              onClick={() => setActiveTab('powerbi')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'powerbi'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Power BI Hub</span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onResetSampleData}
              title="Reset sample receipts"
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSettings}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                hasApiKey
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{hasApiKey ? 'Gemini AI Active' : 'AI Settings'}</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar */}
        <div className="flex md:hidden border-t border-slate-200 dark:border-slate-800 py-2 justify-around">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex flex-col items-center text-xs ${
              activeTab === 'upload' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <Camera className="w-5 h-5 mb-0.5" />
            <span>Capture</span>
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`flex flex-col items-center text-xs relative ${
              activeTab === 'bills' ? 'text-indigo-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <Receipt className="w-5 h-5 mb-0.5" />
            <span>Bills ({billsCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className={`flex flex-col items-center text-xs ${
              activeTab === 'excel' ? 'text-emerald-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5 mb-0.5" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => setActiveTab('powerbi')}
            className={`flex flex-col items-center text-xs ${
              activeTab === 'powerbi' ? 'text-amber-600 font-semibold' : 'text-slate-500'
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
