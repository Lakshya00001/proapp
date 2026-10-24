import React, { useState } from 'react';
import { BillData, BillItem } from '../types/bill';
import { Printer, Download, Trash2, Edit3, Check, Plus, FileText, Layers, Calendar, CreditCard, Tag, Sparkles, Mail } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { EmailModal } from './EmailModal';

interface DigitalBillViewProps {
  bills: BillData[];
  selectedBillId?: string;
  onSelectBill: (id: string) => void;
  onUpdateBill: (updated: BillData) => void;
  onDeleteBill: (id: string) => void;
}

export const DigitalBillView: React.FC<DigitalBillViewProps> = ({
  bills,
  selectedBillId,
  onSelectBill,
  onUpdateBill,
  onDeleteBill
}) => {
  const currentBill = bills.find((b) => b.id === selectedBillId) || bills[0];
  const [viewStyle, setViewStyle] = useState<'thermal' | 'modern'>('thermal');
  const [isEditing, setIsEditing] = useState(false);
  const [editedBill, setEditedBill] = useState<BillData | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  if (!currentBill) {
    return (
      <div className="text-center py-16 bg-slate-900 rounded-3xl border border-slate-800 p-8">
        <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">No Digital Bills in Database</h3>
        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
          Capture a receipt or upload a file to automatically generate your first digital bill using open-source AI!
        </p>
      </div>
    );
  }

  const billToDisplay = isEditing && editedBill ? editedBill : currentBill;

  const startEditing = () => {
    setEditedBill(JSON.parse(JSON.stringify(currentBill)));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditedBill(null);
  };

  const saveEditing = () => {
    if (editedBill) {
      onUpdateBill(editedBill);
      setIsEditing(false);
      setEditedBill(null);
    }
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: any) => {
    if (!editedBill) return;
    const items = [...editedBill.items];
    items[index] = { ...items[index], [field]: value };

    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) : items[index].quantity;
      const p = field === 'unitPrice' ? Number(value) : items[index].unitPrice;
      items[index].totalPrice = Number((q * p).toFixed(2));
    }

    const newSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const taxRate = editedBill.subtotal > 0 ? editedBill.taxAmount / editedBill.subtotal : 0;
    const newTax = Number((newSubtotal * taxRate).toFixed(2));
    const newTotal = Number((newSubtotal + newTax + (editedBill.tipOrFee || 0) - (editedBill.discount || 0)).toFixed(2));

    setEditedBill({
      ...editedBill,
      items,
      subtotal: newSubtotal,
      taxAmount: newTax,
      totalAmount: newTotal
    });
  };

  const addNewItem = () => {
    if (!editedBill) return;
    const newItem: BillItem = {
      id: `item-new-${Date.now()}`,
      description: 'New Item',
      quantity: 1,
      unitPrice: 100.00,
      totalPrice: 100.00,
      category: editedBill.category
    };

    const items = [...editedBill.items, newItem];
    const newSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const newTotal = Number((newSubtotal + editedBill.taxAmount).toFixed(2));

    setEditedBill({
      ...editedBill,
      items,
      subtotal: newSubtotal,
      totalAmount: newTotal
    });
  };

  const removeItem = (index: number) => {
    if (!editedBill || editedBill.items.length <= 1) return;
    const items = editedBill.items.filter((_, i) => i !== index);
    const newSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const newTotal = Number((newSubtotal + editedBill.taxAmount).toFixed(2));

    setEditedBill({
      ...editedBill,
      items,
      subtotal: newSubtotal,
      totalAmount: newTotal
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const element = document.getElementById('digital-receipt-printable');
    if (!element) return;

    try {
      setIsDownloadingPdf(true);
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#0f172a' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Digital_Bill_${billToDisplay.invoiceNumber || 'Export'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-lg">
        {/* Bill selector dropdown */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Layers className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="flex-1 sm:w-72">
            <select
              value={currentBill.id}
              onChange={(e) => {
                if (isEditing) cancelEditing();
                onSelectBill(e.target.value);
              }}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-indigo-500"
            >
              {bills.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.vendorName} • {b.currency}{b.totalAmount.toFixed(2)} ({b.date})
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-400 font-bold whitespace-nowrap">
            {bills.indexOf(currentBill) + 1} of {bills.length}
          </span>
        </div>

        {/* View mode toggle & action buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Format Toggle */}
          <div className="bg-slate-800 p-1 rounded-xl flex items-center space-x-1 text-xs border border-slate-700">
            <button
              onClick={() => setViewStyle('thermal')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                viewStyle === 'thermal'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              POS Receipt
            </button>
            <button
              onClick={() => setViewStyle('modern')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                viewStyle === 'modern'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Modern Invoice
            </button>
          </div>

          {/* Action buttons */}
          {isEditing ? (
            <>
              <button
                onClick={cancelEditing}
                className="px-3 py-1.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={saveEditing}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              className="px-3 py-1.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-200 flex items-center space-x-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Bill</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            title="Print receipt"
            className="p-2 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            title="Download PDF"
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingPdf ? 'PDF...' : 'PDF'}</span>
          </button>

          <button
            onClick={() => setIsEmailModalOpen(true)}
            title="Send Invoice via Zoho Mail"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-white text-xs font-bold flex items-center space-x-1 shadow-sm transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Zoho Email</span>
          </button>

          <button
            onClick={() => onDeleteBill(currentBill.id)}
            title="Delete bill"
            className="p-2 rounded-xl border border-rose-900/40 text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Presentation Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Receipt Presentation */}
        <div className="lg:col-span-8 flex justify-center">
          <div
            id="digital-receipt-printable"
            className={`w-full max-w-xl bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl transition-all ${
              viewStyle === 'thermal' ? 'font-mono' : 'font-sans'
            }`}
          >
            {/* Receipt Header */}
            <div className="text-center pb-6 border-b-2 border-dashed border-slate-700 space-y-2">
              <div className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wider uppercase mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Verified Digital Bill</span>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={billToDisplay.vendorName}
                    onChange={(e) => setEditedBill({ ...editedBill!, vendorName: e.target.value })}
                    className="w-full text-center text-xl font-bold bg-slate-800 border border-slate-700 rounded-lg p-1 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Merchant Address"
                    value={billToDisplay.vendorAddress || ''}
                    onChange={(e) => setEditedBill({ ...editedBill!, vendorAddress: e.target.value })}
                    className="w-full text-center text-xs bg-slate-800 border border-slate-700 rounded-lg p-1 text-slate-300"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                    {billToDisplay.vendorName}
                  </h2>
                  {billToDisplay.vendorAddress && (
                    <p className="text-xs text-slate-400">{billToDisplay.vendorAddress}</p>
                  )}
                  {billToDisplay.vendorPhone && (
                    <p className="text-xs text-slate-400">Tel: {billToDisplay.vendorPhone}</p>
                  )}
                  {billToDisplay.vendorTaxId && (
                    <p className="text-[11px] text-slate-500">GST / Tax ID: {billToDisplay.vendorTaxId}</p>
                  )}
                  {billToDisplay.notes && (
                    <p className="text-xs text-indigo-400 font-semibold">{billToDisplay.notes}</p>
                  )}
                </>
              )}
            </div>

            {/* Bill Metadata Grid */}
            <div className="py-4 border-b border-dashed border-slate-700 grid grid-cols-2 gap-y-2 text-xs">
              <div>
                <span className="text-slate-400">Receipt / Bill #:</span>{' '}
                <span className="font-bold text-white font-mono">{billToDisplay.invoiceNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Date:</span>{' '}
                <span className="font-bold text-white font-mono">
                  {billToDisplay.date} {billToDisplay.time}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>{' '}
                <span className="font-bold text-indigo-400">{billToDisplay.category}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Payment:</span>{' '}
                <span className="font-bold text-emerald-400">{billToDisplay.paymentMethod}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 text-slate-400 pb-2">
                    <th className="text-left font-bold pb-2">ITEM DESCRIPTION</th>
                    <th className="text-center font-bold pb-2 w-12">QTY</th>
                    <th className="text-right font-bold pb-2 w-16">RATE</th>
                    <th className="text-right font-bold pb-2 w-24">AMOUNT</th>
                    {isEditing && <th className="w-8"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {billToDisplay.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 text-slate-200 font-medium">
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white"
                          />
                        ) : (
                          <div>
                            <span className="text-white font-semibold">{item.description}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 text-center text-slate-300 font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-12 text-center bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-xs text-white"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="py-2.5 text-right text-slate-300 font-mono">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            className="w-16 text-right bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-xs text-white"
                          />
                        ) : (
                          `${billToDisplay.currency}${item.unitPrice.toFixed(2)}`
                        )}
                      </td>
                      <td className="py-2.5 text-right font-bold text-white font-mono">
                        {billToDisplay.currency}{item.totalPrice.toFixed(2)}
                      </td>
                      {isEditing && (
                        <td className="text-right pl-2">
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-rose-400 hover:text-rose-300 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>

              {isEditing && (
                <button
                  onClick={addNewItem}
                  className="mt-3 w-full py-1.5 border border-dashed border-indigo-500 text-indigo-400 text-xs font-semibold rounded-lg hover:bg-indigo-950/40 flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              )}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t-2 border-dashed border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono text-white">
                  {billToDisplay.currency}{billToDisplay.subtotal.toFixed(2)}
                </span>
              </div>
              {billToDisplay.taxAmount > 0 && (
                <div className="flex justify-between text-slate-400">
                  <span>Taxes (GST/VAT):</span>
                  <span className="font-mono text-white">
                    {billToDisplay.currency}{billToDisplay.taxAmount.toFixed(2)}
                  </span>
                </div>
              )}

              {/* Grand Total */}
              <div className="flex justify-between items-center text-base sm:text-lg font-black text-white pt-2 border-t border-slate-700">
                <span>TOTAL AMOUNT:</span>
                <span className="text-emerald-400 font-mono">
                  {billToDisplay.currency}{billToDisplay.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Simulated Barcode */}
            <div className="mt-8 pt-4 border-t border-slate-800 text-center space-y-2">
              <div className="h-9 flex items-center justify-center space-x-1 opacity-70">
                {[...Array(32)].map((_, i) => (
                  <div
                    key={i}
                    className="h-full bg-slate-300"
                    style={{ width: `${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px` }}
                  ></div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 tracking-widest font-mono">
                *{billToDisplay.invoiceNumber}*
              </p>
              <p className="text-[10px] text-slate-500">
                Digital Invoice verified with Open-Source Tesseract AI
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Metadata & Source Image */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 text-white">
            <h3 className="text-sm font-bold flex items-center space-x-2">
              <Tag className="w-4 h-4 text-indigo-400" />
              <span>Bill Metadata & Inspector</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-800/60 rounded-xl space-y-1 border border-slate-750">
                <span className="text-slate-400">OCR Confidence</span>
                <div className="flex items-center justify-between">
                  <div className="w-full bg-slate-700 h-2 rounded-full mr-3 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${(billToDisplay.confidenceScore || 0.96) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-emerald-400 font-mono">
                    {Math.round((billToDisplay.confidenceScore || 0.96) * 100)}%
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-750">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Payment Method</span>
                </span>
                <span className="font-semibold text-white font-mono">{billToDisplay.paymentMethod}</span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-750">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Invoice Date</span>
                </span>
                <span className="font-semibold text-white font-mono">{billToDisplay.date}</span>
              </div>

              <div className="p-3 bg-slate-800/60 rounded-xl flex items-center justify-between border border-slate-750">
                <span className="text-slate-400">Item Count</span>
                <span className="font-bold text-indigo-400 font-mono">
                  {billToDisplay.items.length} Items
                </span>
              </div>
            </div>

            {/* Original Source Image Preview */}
            {billToDisplay.sourceImage && (
              <div className="pt-2 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-2">Original Captured Photo</span>
                <div className="relative rounded-xl overflow-hidden border border-slate-750 max-h-56 bg-black flex items-center justify-center">
                  <img
                    src={billToDisplay.sourceImage}
                    alt="Receipt source"
                    className="max-h-56 object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zoho Email Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        bill={billToDisplay}
      />
    </div>
  );
};
