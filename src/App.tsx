import React, { useState, useEffect } from 'react';
import { BillData, SeparationResult } from './types/bill';
import {
  loadStoredBills,
  saveStoredBills,
  processBillFile,
  SAMPLE_BILLS,
  getApiKey
} from './services/aiService';
import { Header } from './components/Header';
import { FileUploader } from './components/FileUploader';
import { DigitalBillView } from './components/DigitalBillView';
import { ExcelExportView } from './components/ExcelExportView';
import { PowerBiHub } from './components/PowerBiHub';
import { SettingsModal } from './components/SettingsModal';
import { CheckCircle2, Layers, Sparkles, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const [bills, setBills] = useState<BillData[]>([]);
  const [selectedBillId, setSelectedBillId] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'upload' | 'bills' | 'excel' | 'powerbi'>('upload');

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('');
  const [processingPercent, setProcessingPercent] = useState(0);

  // Settings & notification
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notification, setNotification] = useState<{ title: string; subtitle: string; isMulti: boolean } | null>(null);

  // Load initial bills from storage
  useEffect(() => {
    const loaded = loadStoredBills();
    setBills(loaded);
    if (loaded.length > 0) {
      setSelectedBillId(loaded[0].id);
    }
  }, []);

  // Update storage whenever bills change
  const updateBills = (newBills: BillData[]) => {
    setBills(newBills);
    saveStoredBills(newBills);
  };

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setProcessingStage('Validating file & preparing scanner...');
    setProcessingPercent(10);

    try {
      const result: SeparationResult = await processBillFile(file, (stage, percent) => {
        setProcessingStage(stage);
        setProcessingPercent(percent);
      });

      // Add newly separated bills to state
      const updated = [...result.bills, ...bills];
      updateBills(updated);

      if (result.bills.length > 0) {
        setSelectedBillId(result.bills[0].id);
      }

      // Show notification banner
      setNotification({
        title: result.isMultiBill
          ? `Multi-Bill Split: Separated ${result.billsCount} Receipts!`
          : `Extracted Digital Bill for ${result.bills[0]?.vendorName}`,
        subtitle: `Completed in ${(result.processingTimeMs / 1000).toFixed(1)}s. Digital bill and Excel row ready!`,
        isMulti: result.isMultiBill
      });

      // Switch to Digital Bills tab automatically
      setTimeout(() => {
        setIsProcessing(false);
        setActiveTab('bills');
      }, 500);

      // Auto dismiss notification after 6 seconds
      setTimeout(() => {
        setNotification(null);
      }, 6000);
    } catch (err: any) {
      console.error('File processing error:', err);
      setIsProcessing(false);
      alert(`Error processing file: ${err.message || 'Unknown error'}`);
    }
  };

  const handleUpdateBill = (updated: BillData) => {
    const newBills = bills.map((b) => (b.id === updated.id ? updated : b));
    updateBills(newBills);
  };

  const handleDeleteBill = (id: string) => {
    const newBills = bills.filter((b) => b.id !== id);
    updateBills(newBills);
    if (selectedBillId === id && newBills.length > 0) {
      setSelectedBillId(newBills[0].id);
    }
  };

  const handleResetData = () => {
    updateBills(SAMPLE_BILLS);
    setSelectedBillId(SAMPLE_BILLS[0].id);
  };

  const handleClearAll = () => {
    updateBills([]);
    setSelectedBillId(undefined);
  };

  const hasApiKey = !!getApiKey();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        billsCount={bills.length}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetSampleData={handleResetData}
        hasApiKey={hasApiKey}
      />

      {/* Main Notification Toast */}
      {notification && (
        <div className="max-w-4xl mx-auto px-4 mt-4 w-full">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                {notification.isMulti ? <Layers className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-sm font-bold">{notification.title}</h4>
                <p className="text-xs text-emerald-100 opacity-90">{notification.subtitle}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('excel')}
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition-colors"
            >
              <span>View Excel</span>
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
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">BillSnap AI (ProApp)</span>
            <span>•</span>
            <span>Web Camera & Local Library OCR Pipeline</span>
          </div>
          <div>
            Built with Gemini Multimodal Vision • SheetJS Excel • Power BI Star Schema
          </div>
        </div>
      </footer>
    </div>
  );
};
