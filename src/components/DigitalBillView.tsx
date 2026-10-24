import React, { useState } from 'react';
import { BillData, BillItem } from '../types/bill';
import { Printer, Download, Trash2, Edit3, Check, Plus, FileText, Layers, Calendar, CreditCard, Tag, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  if (!currentBill) {
    return (
      <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8">
        <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Digital Bills Found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Capture a receipt with your camera or upload a file to automatically generate your first digital bill!
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
    const taxRate = editedBill.subtotal > 0 ? editedBill.taxAmount / editedBill.subtotal : 0.08;
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
      unitPrice: 10.00,
      totalPrice: 10.00,
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
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 190;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      pdf.save(`Digital_Bill_${billToDisplay.invoiceNumber || 'Export'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Bar / Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Bill selector dropdown */}
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div className="flex-1 sm:w-64">
            <select
              value={currentBill.id}
              onChange={(e) => {
                if (isEditing) cancelEditing();
                onSelectBill(e.target.value);
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {bills.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.vendorName} • {b.currency}{b.totalAmount.toFixed(2)} ({b.date})
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap">
            {bills.indexOf(currentBill) + 1} of {bills.length}
          </span>
        </div>

        {/* View mode toggle & action buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Format Toggle */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center space-x-1 text-xs">
            <button
              onClick={() => setViewStyle('thermal')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewStyle === 'thermal'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              POS Receipt
            </button>
            <button
              onClick={() => setViewStyle('modern')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                viewStyle === 'modern'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
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
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={saveEditing}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </button>
            </>
          ) : (
            <button
              onClick={startEditing}
              className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Bill</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            title="Print receipt"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            title="Download PDF"
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center space-x-1 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingPdf ? 'Exporting...' : 'PDF'}</span>
          </button>

          <button
            onClick={() => onDeleteBill(currentBill.id)}
            title="Delete bill"
            className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
            className={`w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl transition-all ${
              viewStyle === 'thermal' ? 'font-mono' : 'font-sans'
            }`}
          >
            {/* Receipt Header */}
            <div className="text-center pb-6 border-b-2 border-dashed border-slate-300 dark:border-slate-700 space-y-2">
              <div className="inline-flex items-center space-x-1 px-3 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold tracking-wider uppercase mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Verified Digital Bill</span>
              </div>

              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={billToDisplay.vendorName}
                    onChange={(e) => setEditedBill({ ...editedBill!, vendorName: e.target.value })}
                    className="w-full text-center text-xl font-bold bg-slate-50 dark:bg-slate-800 border rounded-lg p-1 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Merchant Address"
                    value={billToDisplay.vendorAddress || ''}
                    onChange={(e) => setEditedBill({ ...editedBill!, vendorAddress: e.target.value })}
                    className="w-full text-center text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg p-1 text-slate-600 dark:text-slate-400"
                  />
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                    {billToDisplay.vendorName}
                  </h2>
                  {billToDisplay.vendorAddress && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">{billToDisplay.vendorAddress}</p>
                  )}
                  {billToDisplay.vendorPhone && (
                    <p className="text-xs text-slate-400">Tel: {billToDisplay.vendorPhone}</p>
                  )}
                  {billToDisplay.vendorTaxId && (
                    <p className="text-[11px] text-slate-400">TAX / GST ID: {billToDisplay.vendorTaxId}</p>
                  )}
                </>
              )}
            </div>

            {/* Bill Metadata Grid */}
            <div className="py-4 border-b border-dashed border-slate-300 dark:border-slate-700 grid grid-cols-2 gap-y-2 text-xs">
              <div>
                <span className="text-slate-400">Receipt #:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {billToDisplay.invoiceNumber}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Date:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {billToDisplay.date} {billToDisplay.time}
                </span>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {billToDisplay.category}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400">Payment:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {billToDisplay.paymentMethod}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="py-4">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 pb-2">
                    <th className="text-left font-medium pb-2">ITEM DESCRIPTION</th>
                    <th className="text-center font-medium pb-2 w-12">QTY</th>
                    <th className="text-right font-medium pb-2 w-16">PRICE</th>
                    <th className="text-right font-medium pb-2 w-20">TOTAL</th>
                    {isEditing && <th className="w-8"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {billToDisplay.items.map((item, idx) => (
                    <tr key={item.id || idx} className="group">
                      <td className="py-2.5 text-slate-800 dark:text-slate-200 font-medium">
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800 border rounded px-1.5 py-0.5 text-xs"
                          />
                        ) : (
                          <div>
                            <div>{item.description}</div>
                            {item.category && item.category !== billToDisplay.category && (
                              <span className="text-[10px] text-slate-400">{item.category}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">
                        {isEditing ? (
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-12 text-center bg-slate-50 dark:bg-slate-800 border rounded px-1 py-0.5 text-xs"
                          />
                        ) : (
                          item.quantity
                        )}
                      </td>
                      <td className="py-2.5 text-right text-slate-600 dark:text-slate-400">
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            className="w-16 text-right bg-slate-50 dark:bg-slate-800 border rounded px-1 py-0.5 text-xs"
                          />
                        ) : (
                          `${billToDisplay.currency}${item.unitPrice.toFixed(2)}`
                        )}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-slate-900 dark:text-white">
                        {billToDisplay.currency}{item.totalPrice.toFixed(2)}
                      </td>
                      {isEditing && (
                        <td className="text-right pl-2">
                          <button
                            onClick={() => removeItem(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
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
                  className="mt-3 w-full py-1.5 border border-dashed border-indigo-400 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              )}
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t-2 border-dashed border-slate-300 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span>{billToDisplay.currency}{billToDisplay.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Estimated Tax (GST/VAT):</span>
                <span>{billToDisplay.currency}{billToDisplay.taxAmount.toFixed(2)}</span>
              </div>
              {billToDisplay.tipOrFee ? (
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tip / Delivery Fee:</span>
                  <span>{billToDisplay.currency}{billToDisplay.tipOrFee.toFixed(2)}</span>
                </div>
              ) : null}
              {billToDisplay.discount ? (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Discount / Offer:</span>
                  <span>-{billToDisplay.currency}{billToDisplay.discount.toFixed(2)}</span>
                </div>
              ) : null}

              {/* Grand Total */}
              <div className="flex justify-between items-center text-base sm:text-lg font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>TOTAL AMOUNT:</span>
                <span className="text-indigo-600 dark:text-indigo-400">
                  {billToDisplay.currency}{billToDisplay.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Simulated Barcode & Footer */}
            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-center space-y-3">
              {/* Monospace Barcode pattern */}
              <div className="h-10 flex items-center justify-center space-x-1 opacity-70">
                {[...Array(32)].map((_, i) => (
                  <div
                    key={i}
                    className="h-full bg-slate-800 dark:bg-slate-200"
                    style={{ width: `${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px` }}
                  ></div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400 tracking-widest font-mono">
                *{billToDisplay.invoiceNumber}*
              </p>
              <p className="text-[10px] text-slate-400">
                Thank you for your business! Powered by BillSnap AI
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Bill Metadata & Inspector */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Tag className="w-4 h-4 text-indigo-500" />
              <span>Bill Breakdown & Insights</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1">
                <span className="text-slate-400">Confidence Score</span>
                <div className="flex items-center justify-between">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mr-3 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${(billToDisplay.confidenceScore || 0.95) * 100}%` }}
                    ></div>
                  </div>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {Math.round((billToDisplay.confidenceScore || 0.95) * 100)}%
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Payment Channel</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {billToDisplay.paymentMethod}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                <span className="text-slate-400 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Date Processed</span>
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {billToDisplay.date}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl flex items-center justify-between">
                <span className="text-slate-400">Total Items Count</span>
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {billToDisplay.items.length} Items
                </span>
              </div>
            </div>

            {/* Original Source Image Preview if available */}
            {billToDisplay.sourceImage && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block mb-2">Original Captured Photo</span>
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-48 bg-black flex items-center justify-center">
                  <img
                    src={billToDisplay.sourceImage}
                    alt="Receipt source"
                    className="max-h-48 object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
