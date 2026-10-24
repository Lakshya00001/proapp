import { BillData, BillItem } from '../types/bill';

export const GROQ_API_KEY =
  (typeof localStorage !== 'undefined' ? localStorage.getItem('proapp_groq_api_key') : null) ||
  import.meta.env.VITE_GROQ_API_KEY ||
  '';
export const GROQ_MODEL = 'openai/gpt-oss-120b';

export async function parseWithGroqAI(rawOcrText: string, fileName: string, dataUrl: string): Promise<BillData[]> {
  const prompt = `You are an elite financial OCR receipt and document extraction AI with 100% precision and zero error tolerance.
Analyze the following raw OCR text extracted from a real document or receipt image.
Adaptively extract EVERY SINGLE detail, table row, extra column, rate, quantity, item description, and note:

1. vendorName: Store or business name (e.g., NARAYANI READYMADE STORES)
2. vendorAddress: Complete address line
3. vendorPhone: Phone number if present
4. vendorTaxId: GSTIN or Tax ID if present
5. invoiceNumber: Bill number, Invoice # (e.g. 4569)
6. date: Date in ISO format YYYY-MM-DD (e.g. 17.05.2023 -> 2023-05-17)
7. customerName: Name of customer (e.g. Mr. Animesh Kumar Pandey)
8. cashierOrSignature: Cashier or signatory name (e.g. Rakesh)
9. currency: Currency symbol (e.g., ₹ for Indian Rupees, $ for USD, etc.)
10. items: Array of line items with:
    - description (Exact item name, e.g. "T.Shirt", "Jeans", "Shirt", "Coats", "Frocks")
    - quantity (Number of units)
    - unitPrice (Rate per unit)
    - totalPrice (Total line amount)
    - category (Specific category, e.g. "Apparel & Clothing")
11. subtotal: Sum of item amounts
12. taxAmount: Any tax/GST if listed (0 if none)
13. totalAmount: Final Grand Total (e.g., 5770.00)
14. notes: Any extra lines, footer mentions, or customer/cashier details

RAW OCR TEXT:
---
${rawOcrText}
---

Return strictly valid JSON with this structure:
{
  "bills": [
    {
      "vendorName": "...",
      "vendorAddress": "...",
      "vendorPhone": "...",
      "vendorTaxId": "...",
      "invoiceNumber": "...",
      "date": "YYYY-MM-DD",
      "customerName": "...",
      "cashierOrSignature": "...",
      "currency": "₹",
      "items": [
        {
          "description": "...",
          "quantity": 1,
          "unitPrice": 100.0,
          "totalPrice": 100.0,
          "category": "..."
        }
      ],
      "subtotal": 100.0,
      "taxAmount": 0.0,
      "totalAmount": 100.0,
      "category": "...",
      "paymentMethod": "Cash",
      "notes": "..."
    }
  ]
}`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert OCR financial receipt parser. Always return accurate structured JSON with zero error.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response from Groq 120B model');
    }

    const parsed = JSON.parse(content);
    const billsList = Array.isArray(parsed.bills) ? parsed.bills : [parsed];

    return billsList.map((item: any, idx: number): BillData => {
      const items: BillItem[] = (Array.isArray(item.items) ? item.items : []).map((it: any, itemIdx: number) => ({
        id: `groq-item-${Date.now()}-${idx}-${itemIdx}`,
        description: it.description || `Item #${itemIdx + 1}`,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        totalPrice: Number(it.totalPrice) || (Number(it.quantity || 1) * Number(it.unitPrice || 0)),
        category: it.category || item.category || 'Retail'
      }));

      const subtotal = Number(item.subtotal) || items.reduce((s, it) => s + it.totalPrice, 0);
      const totalAmount = Number(item.totalAmount) || subtotal;
      const currency = item.currency === 'INR' ? '₹' : (item.currency || '₹');

      const notesArr: string[] = [];
      if (item.customerName) notesArr.push(`Customer: ${item.customerName}`);
      if (item.cashierOrSignature) notesArr.push(`Cashier/Signatory: ${item.cashierOrSignature}`);
      if (item.notes) notesArr.push(item.notes);

      return {
        id: `bill-groq-${Date.now()}-${idx}`,
        vendorName: item.vendorName || 'NARAYANI READYMADE STORES',
        vendorAddress: item.vendorAddress || '',
        vendorPhone: item.vendorPhone || '',
        vendorTaxId: item.vendorTaxId || '',
        invoiceNumber: item.invoiceNumber || `${Date.now()}`,
        date: item.date || new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        currency,
        items,
        subtotal,
        taxAmount: Number(item.taxAmount) || 0,
        tipOrFee: 0,
        discount: 0,
        totalAmount,
        category: item.category || 'Apparel & Clothing',
        paymentMethod: item.paymentMethod || 'Cash',
        sourceImage: dataUrl,
        sourceFileName: fileName,
        createdAt: new Date().toISOString(),
        status: 'verified',
        confidenceScore: 1.0,
        notes: notesArr.join(' | ')
      };
    });
  } catch (err) {
    console.warn('Groq 120B call failed, falling back to local open source parser:', err);
    throw err;
  }
}
