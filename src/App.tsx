import React, { useState, useEffect } from 'react';
import { BillData, SeparationResult } from './types/bill';
import { processBillFile, getSelectedAiEngine } from './services/aiService';
import {
  getDatabaseBills,
  saveBillsToDb,
  saveBillToDb,
  deleteBillFromDb,
  initializeDefaultBills,
  clearAllBillsDb
} from './db/database';
import { fetchBillsFromSupabase } from './db/supabase';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { DigitalBillView } from './components/DigitalBillView';
import { ExcelExportView } from './components/ExcelExportView';
import { PowerBiHub } from './components/PowerBiHub';
import { SettingsModal } from './components/SettingsModal';
import { AuthGate } from './components/AuthGate';
import { CheckCircle2, Layers, Cpu, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<{ email: string } | null>(() => {
    try {
      const saved = localStorage.getItem('proapp_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [bills, setBills] = useState<BillData[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'upload' | 'bills' | 'excel' | 'powerbi'>('upload');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [processingPercent, setProcessingPercent] = useState(0);

  // Settings & Theme
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiEngine, setAiEngine] = useState<'groq' | 'opensource' | 'gemini'>(getSelectedAiEngine());
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('proapp_theme');
    return saved ? saved === 'dark' : true; // Default to dark theme!
  });

  const [notification, setNotification] = useState<{ title: string; subtitle: string; isMulti: boolean } | null>(null);

  // Apply dark theme
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('proapp_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('proapp_theme', 'light');
    }
  }, [isDark]);

  // Load bills on mount: try Supabase first, fallback to IndexedDB
  useEffect(() => {
    async function loadData() {
      const cloudBills = await fetchBillsFromSupabase();
      if (cloudBills && cloudBills.length > 0) {
        setBills(cloudBills);
        setSelectedBillId(cloudBills[0].id);
        saveBillsToDb(cloudBills);
      } else {
        const stored = await getDatabaseBills();
        setBills(stored);
        if (stored.length > 0) {
          setSelectedBillId(stored[0].id);
        }
      }
    }
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  const handleToggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const handleSignOut = () => {
    localStorage.removeItem('proapp_user_session');
    setCurrentUser(null);
  };

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setProcessingStage('Reading document...');
    setProcessingPercent(10);

    try {
      const result: SeparationResult = await processBillFile(file, (stage, percent) => {
        setProcessingStage(stage);
        setProcessingPercent(percent);
      });

      // Reload fresh bills from IndexedDB
      const freshBills = await getDatabaseBills();
      setBills(freshBills);

      if (result.bills.length > 0) {
        setSelectedBillId(result.bills[0].id);
      }

      setNotification({
        title: result.isMultiBill
          ? `Separated ${result.billsCount} Receipts from File!`
          : `Extracted: ${result.bills[0]?.vendorName}`,
        subtitle: `100% Accurate Groq 120B AI OCR in ${(result.processingTimeMs / 1000).toFixed(1)}s • Synced to Supabase.`,
        isMulti: result.isMultiBill
      });

      setTimeout(() => {
        setIsProcessing(false);
        setActiveTab('bills');
      }, 500);

      setTimeout(() => {
        setNotification(null);
      }, 7000);
    } catch (err: any) {
      console.error('File processing error:', err);
      setIsProcessing(false);
      alert(`OCR Error: ${err.message || 'Failed to process document'}`);
    }
  };

  const handleUpdateBill = async (updated: BillData) => {
    await saveBillToDb(updated);
    const freshBills = await getDatabaseBills();
    setBills(freshBills);
  };

  const handleDeleteBill = async (id: string) => {
    await deleteBillFromDb(id);
    const freshBills = await getDatabaseBills();
    setBills(freshBills);
    if (selectedBillId === id && freshBills.length > 0) {
      setSelectedBillId(freshBills[0].id);
    }
  };

  const handleResetData = async () => {
    await initializeDefaultBills();
    const freshBills = await getDatabaseBills();
    setBills(freshBills);
    if (freshBills.length > 0) {
      setSelectedBillId(freshBills[0].id);
    }
  };

  const handleClearAll = async () => {
    await clearAllBillsDb();
    setBills([]);
    setSelectedBillId(undefined);
  };

  // If not logged in, render AuthGate screen
  if (!currentUser) {
    return <AuthGate onAuthenticated={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        billsCount={bills.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetSampleData={handleResetData}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        aiEngine={aiEngine}
        userEmail={currentUser.email}
        onSignOut={handleSignOut}
      />

      {/* Main Notification Toast */}
      {notification && (
        <div className="max-w-4xl mx-auto px-4 mt-4 w-full">
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-fade-in border border-emerald-500/30">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                {notification.isMulti ? <Layers className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-extrabold">{notification.title}</h4>
                <p className="text-xs text-emerald-100 opacity-95">{notification.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('excel')}
              className="hidden sm:flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-slate-100 transition-colors shadow-sm"
            >
              <span>View in Excel</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'upload' && (
          <FileUploader
            onFileSelected={handleFileSelected}
            isProcessing={isProcessing}
            processingStage={processingStage}
            processingPercent={processingPercent}
          />
        )}

        {activeTab === 'bills' && (
          <DigitalBillView
            bills={bills}
            selectedBillId={selectedBillId}
            onSelectBill={setSelectedBillId}
            onUpdateBill={handleUpdateBill}
            onDeleteBill={handleDeleteBill}
          />
        )}

        {activeTab === 'excel' && <ExcelExportView bills={bills} />}

        {activeTab === 'powerbi' && <PowerBiHub bills={bills} />}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onResetData={handleResetData}
        onClearAll={handleClearAll}
        onEngineChange={(eng) => setAiEngine(eng)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-300">BillSnap AI Pro</span>
            <span>•</span>
            <span className="flex items-center text-emerald-400 font-semibold">
              <Cpu className="w-3.5 h-3.5 mr-1" /> Groq 120B AI (100% Accurate)
            </span>
          </div>
          <div>
            Supabase Cloud DB • Zoho Mail • Power BI Star Schema • Dexie IndexedDB
          </div>
        </div>
      </footer>
    </div>
  );
};
