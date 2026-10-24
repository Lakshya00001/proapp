import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { BillData, AnalyticsSummary } from '../types/bill';

/**
 * Calculates high-level analytics for the built-in Power BI dashboard
 */
export function calculateAnalytics(bills: BillData[]): AnalyticsSummary {
  if (bills.length === 0) {
    return {
      totalSpend: 0,
      totalBills: 0,
      totalTax: 0,
      averageBill: 0,
      topVendor: 'N/A',
      categoryTotals: {},
      monthlyTrends: [],
      vendorTotals: [],
      paymentMethodTotals: {}
    };
  }

  let totalSpend = 0;
  let totalTax = 0;
  const categoryTotals: Record<string, number> = {};
  const vendorTotalsMap: Record<string, { amount: number; count: number }> = {};
  const monthlyTrendsMap: Record<string, { amount: number; count: number }> = {};
  const paymentMethodTotals: Record<string, number> = {};

  bills.forEach((b) => {
    totalSpend += b.totalAmount;
    totalTax += b.taxAmount;

    // Categories
    const cat = b.category || 'Other';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + b.totalAmount;

    // Vendors
    const v = b.vendorName || 'Unknown Vendor';
    if (!vendorTotalsMap[v]) vendorTotalsMap[v] = { amount: 0, count: 0 };
    vendorTotalsMap[v].amount += b.totalAmount;
    vendorTotalsMap[v].count += 1;

    // Monthly trends (YYYY-MM)
    const month = b.date ? b.date.substring(0, 7) : 'Unknown';
    if (!monthlyTrendsMap[month]) monthlyTrendsMap[month] = { amount: 0, count: 0 };
    monthlyTrendsMap[month].amount += b.totalAmount;
    monthlyTrendsMap[month].count += 1;

    // Payment Methods
    const pm = b.paymentMethod || 'Other';
    paymentMethodTotals[pm] = (paymentMethodTotals[pm] || 0) + b.totalAmount;
  });

  const vendorTotals = Object.entries(vendorTotalsMap)
    .map(([vendor, data]) => ({ vendor, amount: data.amount, count: data.count }))
    .sort((a, b) => b.amount - a.amount);

  const topVendor = vendorTotals.length > 0 ? vendorTotals[0].vendor : 'N/A';

  const monthlyTrends = Object.entries(monthlyTrendsMap)
    .map(([month, data]) => ({ month, amount: data.amount, count: data.count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return {
    totalSpend: Number(totalSpend.toFixed(2)),
    totalBills: bills.length,
    totalTax: Number(totalTax.toFixed(2)),
    averageBill: Number((totalSpend / bills.length).toFixed(2)),
    topVendor,
    categoryTotals,
    monthlyTrends,
    vendorTotals,
    paymentMethodTotals
  };
}

/**
 * Generates relational Star Schema CSVs and packages them into a Power BI zip bundle
 */
export async function generatePowerBiPackage(bills: BillData[]): Promise<Blob> {
  const zip = new JSZip();

  // 1. Fact_Bills
  const factBills = bills.map((b) => ({
    BillKey: b.id,
    DateKey: b.date.replace(/-/g, ''),
    Date: b.date,
    Time: b.time || '',
    VendorKey: sanitizeKey(b.vendorName),
    CategoryKey: sanitizeKey(b.category),
    PaymentMethod: b.paymentMethod,
    Currency: b.currency,
    Subtotal: b.subtotal,
    TaxAmount: b.taxAmount,
    TipOrFee: b.tipOrFee || 0,
    Discount: b.discount || 0,
    TotalAmount: b.totalAmount,
    ItemCount: b.items.length,
    Status: b.status
  }));

  // 2. Fact_BillItems
  const factItems = bills.flatMap((b) =>
    b.items.map((item, idx) => ({
      ItemKey: item.id || `${b.id}_item_${idx + 1}`,
      BillKey: b.id,
      VendorKey: sanitizeKey(b.vendorName),
      CategoryKey: sanitizeKey(item.category || b.category),
      DateKey: b.date.replace(/-/g, ''),
      Description: item.description,
      Quantity: item.quantity,
      UnitPrice: item.unitPrice,
      LineTotal: item.totalPrice
    }))
  );

  // 3. Dim_Vendors (Deduplicated)
  const vendorMap = new Map<string, any>();
  bills.forEach((b) => {
    const key = sanitizeKey(b.vendorName);
    if (!vendorMap.has(key)) {
      vendorMap.set(key, {
        VendorKey: key,
        VendorName: b.vendorName,
        Address: b.vendorAddress || '',
        Phone: b.vendorPhone || '',
        TaxID: b.vendorTaxId || ''
      });
    }
  });
  const dimVendors = Array.from(vendorMap.values());

  // 4. Dim_Categories (Deduplicated)
  const categoryMap = new Map<string, any>();
  bills.forEach((b) => {
    const key = sanitizeKey(b.category);
    if (!categoryMap.has(key)) {
      categoryMap.set(key, {
        CategoryKey: key,
        CategoryName: b.category,
        ExpenseType: getExpenseType(b.category)
      });
    }
  });
  const dimCategories = Array.from(categoryMap.values());

  // Convert each dataset to CSV
  zip.file('Fact_Bills.csv', toCSV(factBills));
  zip.file('Fact_BillItems.csv', toCSV(factItems));
  zip.file('Dim_Vendors.csv', toCSV(dimVendors));
  zip.file('Dim_Categories.csv', toCSV(dimCategories));

  // Power Query M-Template Script
  const mScript = `// Power BI Power Query (M) Script for BillSnap ProApp
// 1. In Power BI Desktop, go to: Get Data -> Blank Query
// 2. Open 'Advanced Editor' and paste the M script below to load each CSV.

/* --- Fact_Bills Schema --- */
let
    Source = Csv.Document(File.Contents("C:\\path\\to\\Fact_Bills.csv"),[Delimiter=",", Columns=14, Encoding=65001, QuoteStyle=QuoteStyle.None]),
    #"Promoted Headers" = Table.PromoteHeaders(Source, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{
        {"BillKey", type text}, {"DateKey", Int64.Type}, {"Date", type date},
        {"Subtotal", type number}, {"TaxAmount", type number}, {"TotalAmount", type number}
    })
in
    #"Changed Type"

/* --- Suggested DAX Measures --- */
// Total Spend = SUM(Fact_Bills[TotalAmount])
// Total Tax Paid = SUM(Fact_Bills[TaxAmount])
// Average Bill Value = AVERAGE(Fact_Bills[TotalAmount])
// Total Bills Count = COUNTROWS(Fact_Bills)
// Spend MoM % = DIVIDE([Total Spend] - CALCULATE([Total Spend], DATEADD(Fact_Bills[Date], -1, MONTH)), CALCULATE([Total Spend], DATEADD(Fact_Bills[Date], -1, MONTH)))
`;
  zip.file('PowerBI_Template_and_Measures.txt', mScript);

  return await zip.generateAsync({ type: 'blob' });
}

function sanitizeKey(str: string): string {
  return (str || 'UNKNOWN').toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 30);
}

function getExpenseType(category: string): string {
  const cat = (category || '').toLowerCase();
  if (cat.includes('grocer') || cat.includes('food') || cat.includes('dining')) return 'Operating Expense (Daily)';
  if (cat.includes('elect') || cat.includes('hardw') || cat.includes('asset')) return 'Capital Expenditure / Asset';
  if (cat.includes('travel') || cat.includes('fuel')) return 'Travel & Logistics';
  return 'General Expense';
}

function toCSV(data: any[]): string {
  if (data.length === 0) return '';
  const ws = XLSX.utils.json_to_sheet(data);
  return XLSX.utils.sheet_to_csv(ws);
}
