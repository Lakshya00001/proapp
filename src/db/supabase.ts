import { createClient } from '@supabase/supabase-js';
import { BillData } from '../types/bill';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://hkfmfgdydyeyybnamcmo.supabase.co';
export const SUPABASE_KEY =
  (typeof localStorage !== 'undefined' ? localStorage.getItem('proapp_supabase_key') : null) ||
  import.meta.env.VITE_SUPABASE_KEY ||
  '';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

/**
 * Saves a bill to Supabase cloud database
 */
export async function syncBillToSupabase(bill: BillData): Promise<boolean> {
  try {
    const { error } = await supabase.from('bills').upsert({
      id: bill.id,
      invoice_number: bill.invoiceNumber,
      vendor_name: bill.vendorName,
      vendor_address: bill.vendorAddress || '',
      date: bill.date,
      time: bill.time || '',
      currency: bill.currency || '₹',
      subtotal: bill.subtotal,
      tax_amount: bill.taxAmount,
      total_amount: bill.totalAmount,
      category: bill.category,
      payment_method: bill.paymentMethod,
      items: bill.items,
      raw_text: bill.rawText || '',
      notes: bill.notes || '',
      created_at: bill.createdAt
    });

    if (error) {
      console.warn('Supabase sync note (using local cache if table pending):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase offline or table pending, preserved in IndexedDB:', err);
    return false;
  }
}

/**
 * Fetches all bills from Supabase
 */
export async function fetchBillsFromSupabase(): Promise<BillData[] | null> {
  try {
    const { data, error } = await supabase.from('bills').select('*').order('created_at', { ascending: false });
    if (error || !data) return null;

    return data.map((row: any) => ({
      id: row.id,
      vendorName: row.vendor_name,
      vendorAddress: row.vendor_address,
      invoiceNumber: row.invoice_number,
      date: row.date,
      time: row.time,
      currency: row.currency || '₹',
      items: row.items || [],
      subtotal: Number(row.subtotal),
      taxAmount: Number(row.tax_amount),
      tipOrFee: 0,
      discount: 0,
      totalAmount: Number(row.total_amount),
      category: row.category,
      paymentMethod: row.payment_method,
      rawText: row.raw_text,
      notes: row.notes,
      sourceFileName: 'Supabase Cloud Sync',
      createdAt: row.created_at,
      status: 'verified',
      confidenceScore: 0.99
    }));
  } catch (err) {
    return null;
  }
}
