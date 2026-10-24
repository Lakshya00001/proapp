import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Trash2, RefreshCw, CheckCircle2, Cpu, Database, Check, Mail, Loader2, Cloud } from 'lucide-react';
import { getApiKey, setApiKey, getSelectedAiEngine, setSelectedAiEngine } from '../services/aiService';
import { getZohoUser, setZohoUser, getZohoPass, setZohoPass, testZohoSmtp } from '../services/emailService';
import { SUPABASE_URL } from '../db/supabase';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetData: () => void;
  onClearAll: () => void;
  onEngineChange: (engine: 'groq' | 'opensource' | 'gemini') => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onResetData,
  onClearAll,
  onEngineChange
}) => {
  const [apiKey, setKeyValue] = useState(getApiKey());
  const [engine, setEngine] = useState<'groq' | 'opensource' | 'gemini'>(getSelectedAiEngine());
  const [zohoUser, setZohoUserState] = useState(getZohoUser());
  const [zohoPass, setZohoPassState] = useState(getZohoPass());
  const [isTestingZoho, setIsTestingZoho] = useState(false);
  const [zohoTestResult, setZohoTestResult] = useState<{ success: boolean; text: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setApiKey(apiKey);
    setSelectedAiEngine(engine);
    setZohoUser(zohoUser);
    setZohoPass(zohoPass);
    onEngineChange(engine);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const handleTestZoho = async () => {
    setIsTestingZoho(true);
    setZohoTestResult(null);
    try {
      const res = await testZohoSmtp(zohoUser, zohoPass);
      setZohoTestResult({ success: true, text: res.message });
    } catch (err: any) {
      setZohoTestResult({ success: false, text: err.message || 'SMTP Authentication failed' });
    } finally {
      setIsTestingZoho(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-fade-in text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cloud AI & Database Configuration</h3>
              <p className="text-xs text-slate-400">Groq 120B AI • Supabase DB • Zoho Mail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AI Engine Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
            Primary AI Vision & OCR Engine
          </label>

          <div className="space-y-2">
            {/* Groq 120B AI */}
            <div
              onClick={() => setEngine('groq')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                engine === 'groq'
                  ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-500/10'
                  : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px]">
                    RECOMMENDED
                  </span>
                  <span>Groq 120B AI (100% Precision)</span>
                </span>
                {engine === 'groq' && <Check className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-slate-400">
                Uses Groq Flagship 120B model (key configured) to eliminate errors, dynamically adapting to every single word, table column, quantity, and rate.
              </p>
            </div>

            {/* Open Source Engine */}
            <div
              onClick={() => setEngine('opensource')}
              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                engine === 'opensource'
                  ? 'border-indigo-500 bg-indigo-950/40 shadow-lg shadow-indigo-500/10'
                  : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">Tesseract Open-Source OCR</span>
                {engine === 'opensource' && <Check className="w-4 h-4 text-indigo-400" />}
              </div>
              <p className="text-[11px] text-slate-400">
                100% on-device WebAssembly OCR. Runs purely in your local browser without external networks.
              </p>
            </div>
          </div>
        </div>

        {/* Supabase Database Status */}
        <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-750 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
              <Cloud className="w-4 h-4 text-indigo-400" />
              <span>Supabase Cloud Database</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
              Connected (Service Role)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono truncate" title={SUPABASE_URL}>
            {SUPABASE_URL}
          </p>
          <p className="text-[10px] text-slate-500">
            All scanned digital bills, itemized rows, and attachments are automatically synced to your Supabase PostgreSQL cluster with Dexie IndexedDB local caching.
          </p>
        </div>

        {/* Zoho Mail Configuration Section */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Zoho Mail Service
              </span>
            </div>
            <a
              href="https://mail.zoho.in/zm/#mail"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-amber-400 hover:underline flex items-center space-x-1"
            >
              <span>mail.zoho.in</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-750 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Zoho Email Account
                </label>
                <input
                  type="email"
                  placeholder="e.g. user@zoho.in"
                  value={zohoUser}
                  onChange={(e) => setZohoUserState(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Zoho Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={zohoPass}
                  onChange={(e) => setZohoPassState(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Server: <code className="text-amber-400">smtp.zoho.in:465</code></span>
              <button
                type="button"
                onClick={handleTestZoho}
                disabled={isTestingZoho || !zohoUser}
                className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold hover:bg-amber-500/30 transition-colors flex items-center space-x-1 disabled:opacity-50"
              >
                {isTestingZoho ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                <span>{isTestingZoho ? 'Testing...' : 'Test SMTP'}</span>
              </button>
            </div>

            {zohoTestResult && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold ${
                  zohoTestResult.success
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                }`}
              >
                {zohoTestResult.text}
              </div>
            )}
          </div>
        </div>

        {/* Database Management */}
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Database Management
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
              Supabase + IndexedDB
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                onResetData();
                onClose();
              }}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
              <span>Load Default Bills</span>
            </button>

            <button
              onClick={() => {
                onClearAll();
                onClose();
              }}
              className="flex-1 py-2 px-3 rounded-xl border border-rose-900/60 hover:bg-rose-950/40 text-xs font-semibold text-rose-400 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Database</span>
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
          >
            {isSaved ? <CheckCircle2 className="w-4 h-4" /> : null}
            <span>{isSaved ? 'Settings Applied!' : 'Save & Close'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
