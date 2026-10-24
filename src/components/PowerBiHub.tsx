import React, { useState } from 'react';
import { BillData } from '../types/bill';
import { calculateAnalytics, generatePowerBiPackage } from '../services/powerBiService';
import { BarChart3, TrendingUp, DollarSign, Receipt, PieChart, Download, FileCode, Check, HelpCircle, ArrowUpRight } from 'lucide-react';

interface PowerBiHubProps {
  bills: BillData[];
}

export const PowerBiHub: React.FC<PowerBiHubProps> = ({ bills }) => {
  const analytics = calculateAnalytics(bills);
  const [isExporting, setIsExporting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [copiedMCode, setCopiedMCode] = useState(false);

  const primaryCurrency = bills[0]?.currency || '₹';

  const handleExportZip = async () => {
    try {
      setIsExporting(true);
      const blob = await generatePowerBiPackage(bills);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BillSnap_PowerBI_StarSchema_Package_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export Power BI package:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const copyMQuery = () => {
    const code = `// Power Query M Script for Fact_Bills
let
    Source = Csv.Document(File.Contents("Fact_Bills.csv"),[Delimiter=",", Columns=14, Encoding=65001, QuoteStyle=QuoteStyle.None]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{
        {"BillKey", type text}, {"DateKey", Int64.Type}, {"Date", type date},
        {"Subtotal", type number}, {"TaxAmount", type number}, {"TotalAmount", type number}
    })
in
    #"Changed Type"`;

    navigator.clipboard.writeText(code).then(() => {
      setCopiedMCode(true);
      setTimeout(() => setCopiedMCode(false), 2000);
    });
  };

  const categoryEntries = Object.entries(analytics.categoryTotals).sort((a, b) => b[1] - a[1]);
  const paymentEntries = Object.entries(analytics.paymentMethodTotals).sort((a, b) => b[1] - a[1]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-amber-500/30">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-2 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-white/10">
              <BarChart3 className="w-3.5 h-3.5 text-yellow-300" />
              <span>Advanced Business Intelligence</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Power BI Analytics & Star Schema Model
            </h2>
            <p className="text-sm text-yellow-100 opacity-95">
              Interactive financial dashboard built into dark theme, plus 1-click export of relational Star Schema datasets (Fact & Dimension tables) for Microsoft Power BI Desktop.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="px-4 py-2.5 rounded-xl bg-black/30 hover:bg-black/40 backdrop-blur-md text-white text-xs font-bold transition-all flex items-center space-x-2 border border-white/20"
            >
              <HelpCircle className="w-4 h-4" />
              <span>{showGuide ? 'Hide Power BI Guide' : 'Power BI Setup Guide'}</span>
            </button>

            <button
              onClick={handleExportZip}
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white text-xs font-black shadow-xl transition-all flex items-center space-x-2 border border-amber-400/40"
            >
              <Download className="w-4 h-4 text-amber-400" />
              <span>{isExporting ? 'Packaging...' : 'Export Power BI ZIP (.zip)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guide Accordion */}
      {showGuide && (
        <div className="bg-slate-900 rounded-3xl p-6 border border-amber-500/40 shadow-xl space-y-4 animate-fade-in text-white">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold flex items-center space-x-2">
              <FileCode className="w-5 h-5 text-amber-400" />
              <span>How to Import into Microsoft Power BI Desktop</span>
            </h3>
            <button
              onClick={copyMQuery}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center space-x-1"
            >
              {copiedMCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
              <span>{copiedMCode ? 'Copied M Code!' : 'Copy Power Query (M)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
              <div className="font-bold text-amber-400 mb-1">Step 1: Download ZIP</div>
              <p className="text-slate-400">
                Click "Export Power BI ZIP" to get <code className="text-indigo-400">Fact_Bills.csv</code>, <code className="text-indigo-400">Fact_BillItems.csv</code>, <code className="text-indigo-400">Dim_Vendors.csv</code>, and <code className="text-indigo-400">Dim_Categories.csv</code>.
              </p>
            </div>

            <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
              <div className="font-bold text-amber-400 mb-1">Step 2: Open Power BI</div>
              <p className="text-slate-400">
                Open Power BI Desktop. Choose <span className="font-semibold text-white">Get Data</span> &gt; <span className="font-semibold text-white">Folder / CSV</span> and select the extracted folder.
              </p>
            </div>

            <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
              <div className="font-bold text-amber-400 mb-1">Step 3: Relate Tables</div>
              <p className="text-slate-400">
                In Model View, connect:
                <br />• <code className="text-indigo-400">Fact_Bills[BillKey]</code> 1:* <code className="text-indigo-400">Fact_BillItems[BillKey]</code>
                <br />• <code className="text-indigo-400">Dim_Vendors[VendorKey]</code> 1:* <code className="text-indigo-400">Fact_Bills[VendorKey]</code>
              </p>
            </div>

            <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
              <div className="font-bold text-amber-400 mb-1">Step 4: DAX Measures</div>
              <p className="text-slate-400">
                Use built-in DAX measures included in the package:
                <br />• <code className="text-emerald-400">Total Spend = SUM(Fact_Bills[TotalAmount])</code>
                <br />• <code className="text-emerald-400">Total Tax = SUM(Fact_Bills[TaxAmount])</code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Spend */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Expenditure</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {primaryCurrency}{analytics.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
            <TrendingUp className="w-3 h-3" />
            <span>Open-Source OCR Data</span>
          </div>
        </div>

        {/* Total Bills */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Receipts Processed</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {analytics.totalBills} Bills
          </div>
          <div className="text-[11px] text-indigo-400 font-medium">
            Fact_Bills Database Entries
          </div>
        </div>

        {/* Average Bill */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Avg Bill Ticket</span>
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {primaryCurrency}{analytics.averageBill.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">Mean transaction value</div>
        </div>

        {/* Total Tax Paid */}
        <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Taxes & Duties</span>
            <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {primaryCurrency}{analytics.totalTax.toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500">
            {analytics.totalSpend > 0 ? ((analytics.totalTax / analytics.totalSpend) * 100).toFixed(1) : 0}% effective rate
          </div>
        </div>

        {/* Top Merchant */}
        <div className="col-span-2 lg:col-span-1 bg-slate-900 rounded-3xl p-5 border border-slate-800 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Top Merchant</span>
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-black text-white truncate" title={analytics.topVendor}>
            {analytics.topVendor}
          </div>
          <div className="text-[11px] text-purple-400 font-medium">
            Primary vendor by spend
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-6 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-indigo-400" />
              <span>Spend by Category</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Dim_Categories</span>
          </div>

          <div className="space-y-3 pt-2">
            {categoryEntries.map(([cat, amount], idx) => {
              const pct = analytics.totalSpend > 0 ? (amount / analytics.totalSpend) * 100 : 0;
              const colors = [
                'from-indigo-500 to-purple-600',
                'from-emerald-500 to-teal-600',
                'from-amber-500 to-yellow-600',
                'from-rose-500 to-pink-600',
                'from-cyan-500 to-blue-600'
              ];
              const barColor = colors[idx % colors.length];

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cat}</span>
                    <span className="font-mono text-slate-400">
                      {primaryCurrency}{amount.toFixed(2)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Vendors Ranking */}
        <div className="lg:col-span-6 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span>Top Vendors by Spend</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Dim_Vendors</span>
          </div>

          <div className="space-y-3 pt-2">
            {analytics.vendorTotals.slice(0, 5).map((v, idx) => {
              const pct = analytics.totalSpend > 0 ? (v.amount / analytics.totalSpend) * 100 : 0;
              return (
                <div key={v.vendor} className="p-3 bg-slate-800/60 rounded-2xl flex items-center justify-between border border-slate-750">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{v.vendor}</div>
                      <div className="text-[10px] text-slate-400">{v.count} invoice(s)</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-white font-mono">
                      {primaryCurrency}{v.amount.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-slate-500">{pct.toFixed(1)}% of total</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly Timeline & Trends */}
        <div className="lg:col-span-8 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Monthly Expenditure Timeline</span>
          </h3>

          <div className="pt-4 flex items-end justify-between gap-4 h-48 border-b border-slate-800 pb-2">
            {analytics.monthlyTrends.map((m) => {
              const maxMonthly = Math.max(...analytics.monthlyTrends.map((t) => t.amount), 1);
              const heightPct = Math.max((m.amount / maxMonthly) * 100, 15);

              return (
                <div key={m.month} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <div className="text-[11px] font-mono font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity mb-1">
                    {primaryCurrency}{m.amount.toFixed(0)}
                  </div>
                  <div
                    className="w-full max-w-[48px] bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-xl transition-all duration-500 group-hover:brightness-110"
                    style={{ height: `${heightPct}%` }}
                  ></div>
                  <div className="text-[11px] font-semibold text-slate-400 mt-2">{m.month}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Channels */}
        <div className="lg:col-span-4 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-lg space-y-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Receipt className="w-4 h-4 text-purple-400" />
            <span>Payment Channels</span>
          </h3>

          <div className="space-y-2 pt-2">
            {paymentEntries.map(([method, amount]) => (
              <div key={method} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 text-xs border border-slate-750">
                <span className="font-semibold text-slate-300">{method}</span>
                <span className="font-mono font-bold text-white">{primaryCurrency}{amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function CopyIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
    </svg>
  );
}
