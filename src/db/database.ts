import Dexie, { Table } from 'dexie';
import { BillData, BillItem } from '../types/bill';

export interface StoredBill extends BillData {
  // indexed fields + full object
}

export interface StoredBillItem extends BillItem {
  billId: string;
}

export interface StoredFile {
  id: string;
  billId: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  size: number;
  uploadedAt: string;
}

export class BillSnapDatabase extends Dexie {
  bills!: Table<StoredBill, string>;
  items!: Table<StoredBillItem, string>;
  files!: Table<StoredFile, string>;

  constructor() {
    super('BillSnapDB');

    // Schema definition for Dexie (IndexedDB)
    this.version(1).stores({
      bills: 'id, invoiceNumber, vendorName, date, category, totalAmount, status, currency, createdAt',
      items: 'id, billId, description, category, totalPrice',
      files: 'id, billId, fileName, uploadedAt'
    });
  }
}

export const db = new BillSnapDatabase();

// Default starter bills featuring real-world Indian & International receipts
export const DEFAULT_BILLS: BillData[] = [
  {
    id: 'bill-narayani-4569',
    vendorName: 'NARAYANI READYMADE STORES',
    vendorAddress: '107/1, Dumdum Road, Ghosh Para, Kolkata',
    vendorPhone: '+91 98300 12345',
    vendorTaxId: '19AABCN4569K1Z5',
    invoiceNumber: '4569',
    date: '2023-05-17',
    time: '18:30',
    currency: '₹',
    items: [
      { id: 'narayani-1', description: 'T.Shirt', quantity: 3, unitPrice: 180.00, totalPrice: 540.00, category: 'Apparel & Clothing' },
      { id: 'narayani-2', description: 'Jeans', quantity: 3, unitPrice: 475.00, totalPrice: 1425.00, category: 'Apparel & Clothing' },
      { id: 'narayani-3', description: 'Shirt', quantity: 4, unitPrice: 265.00, totalPrice: 600.00, category: 'Apparel & Clothing' },
      { id: 'narayani-4', description: 'Coats', quantity: 3, unitPrice: 920.00, totalPrice: 2680.00, category: 'Apparel & Clothing' },
      { id: 'narayani-5', description: 'Frocks', quantity: 5, unitPrice: 350.00, totalPrice: 1650.00, category: 'Apparel & Clothing' }
    ],
    subtotal: 5770.00,
    taxAmount: 0.00,
    tipOrFee: 0.00,
    discount: 0.00,
    totalAmount: 5770.00,
    category: 'Apparel & Retail',
    paymentMethod: 'Cash',
    sourceFileName: 'narayani_readymade_stores_bill.jpg',
    createdAt: '2023-05-17T18:30:00Z',
    status: 'verified',
    confidenceScore: 0.99,
    notes: 'Customer: Mr. Animesh Kumar Pandey | Cashier: Rakesh'
  },
  {
    id: 'bill-sample-tech-01',
    vendorName: 'Reliance Digital Megastore',
    vendorAddress: 'Plot 4, Salt Lake Sector V, Kolkata 700091',
    vendorPhone: '+91 (033) 4022-9900',
    vendorTaxId: '19AAACR1234F1ZV',
    invoiceNumber: 'RD-2023-9912',
    date: '2023-08-14',
    time: '15:20',
    currency: '₹',
    items: [
      { id: 'item-tech-1', description: 'Wireless Bluetooth Earbuds Pro', quantity: 1, unitPrice: 2499.00, totalPrice: 2499.00, category: 'Electronics' },
      { id: 'item-tech-2', description: 'High-Speed Type-C 65W Cable', quantity: 2, unitPrice: 499.00, totalPrice: 998.00, category: 'Accessories' }
    ],
    subtotal: 3497.00,
    taxAmount: 629.46,
    tipOrFee: 0,
    discount: 200.00,
    totalAmount: 3926.46,
    category: 'Electronics & Hardware',
    paymentMethod: 'UPI',
    sourceFileName: 'tech_invoice.pdf',
    createdAt: '2023-08-14T15:25:00Z',
    status: 'verified',
    confidenceScore: 0.98,
    notes: 'GST 18% applied'
  }
];

export async function getDatabaseBills(): Promise<BillData[]> {
  try {
    const bills = await db.bills.orderBy('createdAt').reverse().toArray();
    if (bills.length === 0) {
      await initializeDefaultBills();
      return await db.bills.orderBy('createdAt').reverse().toArray();
    }
    return bills;
  } catch (err) {
    console.error('Failed to get bills from IndexedDB:', err);
    return DEFAULT_BILLS;
  }
}

export async function saveBillToDb(bill: BillData): Promise<void> {
  await db.transaction('rw', db.bills, db.items, async () => {
    await db.bills.put(bill);
    // save individual items
    for (const item of bill.items) {
      await db.items.put({ ...item, billId: bill.id });
    }
  });
}

export async function saveBillsToDb(bills: BillData[]): Promise<void> {
  await db.transaction('rw', db.bills, db.items, async () => {
    for (const bill of bills) {
      await db.bills.put(bill);
      for (const item of bill.items) {
        await db.items.put({ ...item, billId: bill.id });
      }
    }
  });
}

export async function deleteBillFromDb(id: string): Promise<void> {
  await db.transaction('rw', db.bills, db.items, db.files, async () => {
    await db.bills.delete(id);
    await db.items.where('billId').equals(id).delete();
    await db.files.where('billId').equals(id).delete();
  });
}

export async function clearAllBillsDb(): Promise<void> {
  await db.transaction('rw', db.bills, db.items, db.files, async () => {
    await db.bills.clear();
    await db.items.clear();
    await db.files.clear();
  });
}

export async function initializeDefaultBills(): Promise<void> {
  await clearAllBillsDb();
  await saveBillsToDb(DEFAULT_BILLS);
}
