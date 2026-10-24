import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getApiKey, setApiKey } from '../services/aiService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  onClearAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  onClearAll
}) => {
  const [apiKey, setKeyValue] = useState(getApiKey());
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(apiKey);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">AI Engine & Configuration</h3>
              <p className="text-xs text-slate-400">Google Gemini Multimodal Vision API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Gemini API Key Section */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
            Google Gemini API Key (Optional for Live OCR)
          </label>
          <div className="relative">
            <input
              type="password"
              placeholder="AIzaSy..."
              value={apiKey}
              onChange={(e) => setKeyValue(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Key is stored only in your local browser</span>
            </span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-0.5"
            >
              <span>Get Free API Key</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
            💡 <strong>Demo Fallback Mode:</strong> If no API key is entered, BillSnap automatically runs in smart heuristic mode with realistic receipt extraction and mock multi-bill splitting.
          </p>
        </div>

        {/* Database Management */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Database & Sample Data Management
          </h4>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                onResetData();
                onClose();
              }}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
              <span>Reset Sample Bills</span>
            </button>

            <button
              onClick={() => {
                onClearAll();
                onClose();
              }}
              className="flex-1 py-2 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Bills</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center space-x-1.5 transition-all"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : null}
            <span>{isSaved ? 'Saved Settings!' : 'Save & Close'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
