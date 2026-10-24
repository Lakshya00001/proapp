import * as XLSX from 'xlsx';
import { BillData } from '../types/bill';

/**
 * Generates and downloads a multi-sheet, production-grade Excel workbook (.xlsx)
 */
export function exportBillsToExcel(bills: BillData[], fileName = 'Bills_Expense_Report.xlsx') {
  // 1. Prepare Sheet 1: Bills Summary
  const summaryRows = bills.map((b) => ({
    'Bill ID': b.id,
    'Date': b.date,
    'Time': b.time || 'N/A',
    'Merchant / Vendor': b.vendorName,
    'Invoice / Receipt #': b.invoiceNumber,
    'Category': b.category,
    'Payment Method': b.paymentMethod,
    'Currency': b.currency,
    'Subtotal': b.subtotal,
    'Tax Amount': b.taxAmount,
    'Tip / Fees': b.tipOrFee || 0,
    'Discount': b.discount || 0,
    'Grand Total': b.totalAmount,
    'Items Count': b.items.length,
    'Status': b.status.toUpperCase(),
    'Source File': b.sourceFileName || 'Direct Capture'
  }));

  // 2. Prepare Sheet 2: Itemized Line Items
  const itemizedRows = bills.flatMap((b) =>
    b.items.map((item, idx) => ({
      'Item ID': item.id || `${b.id}-${idx + 1}`,
      'Bill ID': b.id,
      'Date': b.date,
      'Merchant / Vendor': b.vendorName,
      'Item Description': item.description,
      'Item Category': item.category || b.category,
      'Quantity': item.quantity,
      'Unit Price': item.unitPrice,
      'Line Total': item.totalPrice,
      'Currency': b.currency
    }))
  );

  // Create workbook and worksheets
  const wb = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  const wsItems = XLSX.utils.json_to_sheet(itemizedRows);

  // Set column widths for readability
  wsSummary['!cols'] = [
    { wch: 18 }, // Bill ID
    { wch: 12 }, // Date
    { wch: 8 },  // Time
    { wch: 28 }, // Merchant
    { wch: 18 }, // Invoice #
    { wch: 20 }, // Category
    { wch: 16 }, // Payment Method
    { wch: 8 },  // Currency
    { wch: 12 }, // Subtotal
    { wch: 12 }, // Tax Amount
    { wch: 12 }, // Tip / Fees
    { wch: 10 }, // Discount
    { wch: 14 }, // Grand Total
    { wch: 12 }, // Items Count
    { wch: 12 }, // Status
    { wch: 22 }  // Source File
  ];

  wsItems['!cols'] = [
    { wch: 18 }, // Item ID
    { wch: 18 }, // Bill ID
    { wch: 12 }, // Date
    { wch: 26 }, // Merchant
    { wch: 32 }, // Item Description
    { wch: 18 }, // Item Category
    { wch: 10 }, // Quantity
    { wch: 12 }, // Unit Price
    { wch: 14 }, // Line Total
    { wch: 8 }   // Currency
  ];

  // Append sheets
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Bills Summary');
  XLSX.utils.book_append_sheet(wb, wsItems, 'Itemized Breakdown');

  // Trigger download
  XLSX.writeFile(wb, fileName);
}

/**
 * Exports summary as pure CSV
 */
export function exportBillsToCSV(bills: BillData[], fileName = 'Bills_Summary.csv') {
  const summaryRows = bills.map((b) => ({
    'Bill ID': b.id,
    'Date': b.date,
    'Merchant': b.vendorName,
    'Invoice Number': b.invoiceNumber,
    'Category': b.category,
    'Payment Method': b.paymentMethod,
    'Currency': b.currency,
    'Subtotal': b.subtotal,
    'Tax': b.taxAmount,
    'Total': b.totalAmount
  }));

  const ws = XLSX.utils.json_to_sheet(summaryRows);
  const csv = XLSX.utils.sheet_to_csv(ws);
  downloadBlob(csv, fileName, 'text/csv;charset=utf-8;');
}

function downloadBlob(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
