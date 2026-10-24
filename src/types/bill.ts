export interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  taxRate?: number;
}

export interface BillData {
  id: string;
  vendorName: string;
  vendorAddress?: string;
  vendorPhone?: string;
  vendorTaxId?: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  time?: string;
  currency: string;
  items: BillItem[];
  subtotal: number;
  taxAmount: number;
  tipOrFee?: number;
  discount?: number;
  totalAmount: number;
  category: string;
  paymentMethod: 'Cash' | 'Credit Card' | 'Debit Card' | 'UPI' | 'Bank Transfer' | 'Online' | 'Other';
  rawText?: string;
  notes?: string;
  confidenceScore?: number;
  sourceImage?: string; // Data URL or object URL
  sourceFileName?: string;
  createdAt: string;
  status: 'draft' | 'verified' | 'exported';
}

export interface SeparationResult {
  sourceFileName: string;
  billsCount: number;
  bills: BillData[];
  processingTimeMs: number;
  isMultiBill: boolean;
}

export interface AnalyticsSummary {
  totalSpend: number;
  totalBills: number;
  totalTax: number;
  averageBill: number;
  topVendor: string;
  categoryTotals: Record<string, number>;
  monthlyTrends: { month: string; amount: number; count: number }[];
  vendorTotals: { vendor: string; amount: number; count: number }[];
  paymentMethodTotals: Record<string, number>;
}
