import React, { useState, useMemo } from 'react';
import { BillData } from '../types/bill';
import { exportBillsToExcel, exportBillsToCSV } from '../services/excelService';
import { FileSpreadsheet, Download, Search, Copy, Check, Mail } from 'lucide-react';
import { EmailModal } from './EmailModal';

interface ExcelExportViewProps {
  bills: BillData[];
}

export const ExcelExportView: React.FC<ExcelExportViewProps> = ({ bills }) => {
  const [activeSheet, setActiveSheet] = useState<'summary' | 'items'>('summary');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [copied, setCopied] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Extract categories for filter
  const categories = useMemo(() => {
    const set = new Set<string>();
    bills.forEach((b) => {
      if (b.category) set.add(b.category);
    });
    return Array.from(set);
  }, [bills]);

  // Filter bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchSearch =
        b.vendorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.items.some((item) => item.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchCategory = categoryFilter === 'ALL' || b.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [bills, searchTerm, categoryFilter]);

  // Flattened itemized rows for items sheet
  const itemizedRows = useMemo(() => {
    return filteredBills.flatMap((b) =>
      b.items.map((item) => ({
        billId: b.id,
        invoiceNumber: b.invoiceNumber,
        date: b.date,
        vendor: b.vendorName,
        category: item.category || b.category,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        currency: b.currency
      }))
    );
  }, [filteredBills]);

  const totalFilteredAmount = useMemo(() => {
    return filteredBills.reduce((sum, b) => sum + b.totalAmount, 0);
  }, [filteredBills]);

  const copyTableToClipboard = () => {
    let tsv = '';
    if (activeSheet === 'summary') {
      tsv = ['Date', 'Merchant', 'Invoice #', 'Category', 'Payment', 'Subtotal', 'Tax', 'Total'].join('\t') + '\n';
      filteredBills.forEach((b) => {
        tsv += [b.date, b.vendorName, b.invoiceNumber, b.category, b.paymentMethod, b.subtotal, b.taxAmount, b.totalAmount].join('\t') + '\n';
      });
    } else {
      tsv = ['Date', 'Merchant', 'Item', 'Category', 'Qty', 'Unit Price', 'Total'].join('\t') + '\n';
      itemizedRows.forEach((r) => {
        tsv += [r.date, r.vendor, r.description, r.category, r.quantity, r.unitPrice, r.totalPrice].join('\t') + '\n';
      });
    }

    navigator.clipboard.writeText(tsv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Excel Spreadsheet Generator</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Production-grade multi-sheet workbook generation with auto-sum formulas, categorized items, and currency support.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyTableToClipboard}
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied TSV!' : 'Copy for Excel'}</span>
          </button>

          <button
            onClick={() => exportBillsToCSV(filteredBills)}
            className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-slate-200 flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>CSV Export</span>
          </button>

          <button
            onClick={() => exportBillsToExcel(filteredBills)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-emerald-600/25 flex items-center space-x-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download .XLSX Workbook</span>
          </button>

          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-amber-600/25 flex items-center space-x-1.5 transition-all"
          >
            <Mail className="w-4 h-4" />
            <span>Email Report (Zoho)</span>
          </button>
        </div>
      </div>

      {/* Sheet Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Workbook Sheet Tabs */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveSheet('summary')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSheet === 'summary'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sheet 1: Bills Summary ({filteredBills.length})
          </button>
          <button
            onClick={() => setActiveSheet('items')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSheet === 'items'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sheet 2: Itemized Breakdown ({itemizedRows.length})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search merchant, item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 font-semibold focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Spreadsheet Grid Container */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        {/* Banner */}
        <div className="bg-emerald-700 text-white px-6 py-2.5 flex items-center justify-between text-xs font-bold">
          <div className="flex items-center space-x-2">
            <span>Microsoft Excel Live Grid</span>
            <span className="opacity-75">•</span>
            <span className="opacity-90">{activeSheet === 'summary' ? 'Bills Summary' : 'Itemized Line Items'}</span>
          </div>
          <div className="text-right font-mono">
            Total Value: ₹{totalFilteredAmount.toFixed(2)}
          </div>
        </div>

        {/* Scrollable Data Table */}
        <div className="overflow-x-auto">
          {activeSheet === 'summary' ? (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center text-slate-500">#</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Merchant / Vendor</th>
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">Tax</th>
                  <th className="py-3 px-4 text-right">Total Amount</th>
                  <th className="py-3 px-4 text-center">Items</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {filteredBills.map((b, idx) => (
                  <tr key={b.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-500 font-sans">{idx + 1}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300">{b.date}</td>
                    <td className="py-3 px-4 font-sans font-bold text-white">{b.vendorName}</td>
                    <td className="py-3 px-4 text-slate-400">{b.invoiceNumber}</td>
                    <td className="py-3 px-4 font-sans">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700 text-indigo-300">
                        {b.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300">{b.paymentMethod}</td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {b.currency}{b.subtotal.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {b.currency}{b.taxAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm">
                      {b.currency}{b.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-950/60 border border-indigo-800 text-indigo-400 text-[11px] font-bold">
                        {b.items.length}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-800 font-bold border-t-2 border-slate-700">
                  <td colSpan={6} className="py-3 px-4 font-sans text-right uppercase tracking-wider text-slate-300">
                    Formula Total =SUM(...)
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    ₹{filteredBills.reduce((s, b) => s + b.subtotal, 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    ₹{filteredBills.reduce((s, b) => s + b.taxAmount, 0).toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400 text-base">
                    ₹{totalFilteredAmount.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center text-slate-500">#</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Merchant</th>
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Rate</th>
                  <th className="py-3 px-4 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {itemizedRows.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-2.5 px-4 text-center text-slate-500 font-sans">{idx + 1}</td>
                    <td className="py-2.5 px-4 text-slate-400">{r.date}</td>
                    <td className="py-2.5 px-4 font-sans font-semibold text-slate-200">{r.vendor}</td>
                    <td className="py-2.5 px-4 font-sans text-white font-semibold">{r.description}</td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center text-slate-300 font-sans">{r.quantity}</td>
                    <td className="py-2.5 px-4 text-right text-slate-400">
                      {r.currency}{r.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-400">
                      {r.currency}{r.totalPrice.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        defaultSubject={`Expense Summary Report (${filteredBills.length} Bills)`}
      />
    </div>
  );
};
