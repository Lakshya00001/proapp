-- =====================================================================
-- BillSnap AI Pro - Complete Supabase PostgreSQL Schema
-- Copy and paste this ENTIRE file into your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hkfmfgdydyeyybnamcmo/sql/new
-- Then click "Run" (or Ctrl + Enter).
-- =====================================================================

-- 1. Create Bills Master Table
CREATE TABLE IF NOT EXISTS public.bills (
  id TEXT PRIMARY KEY,
  invoice_number TEXT,
  vendor_name TEXT NOT NULL,
  vendor_address TEXT,
  vendor_phone TEXT,
  vendor_tax_id TEXT,
  date TEXT,
  time TEXT,
  currency TEXT DEFAULT '₹',
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  tip_or_fee NUMERIC DEFAULT 0,
  discount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  category TEXT DEFAULT 'General',
  payment_method TEXT DEFAULT 'Cash',
  items JSONB DEFAULT '[]'::jsonb,
  raw_text TEXT,
  notes TEXT,
  confidence_score NUMERIC DEFAULT 1.0,
  source_file_name TEXT,
  status TEXT DEFAULT 'verified',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Relational Bill Items Table (for deep queries & Power BI DirectQuery)
CREATE TABLE IF NOT EXISTS public.bill_items (
  id TEXT PRIMARY KEY,
  bill_id TEXT REFERENCES public.bills(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create App Users Table (For Email + Password Authentication)
CREATE TABLE IF NOT EXISTS public.app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  verified BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Active OTP Verification Table
CREATE TABLE IF NOT EXISTS public.auth_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Performance Indexes for Fast Filtering & Realtime Queries
CREATE INDEX IF NOT EXISTS idx_bills_date ON public.bills(date);
CREATE INDEX IF NOT EXISTS idx_bills_vendor ON public.bills(vendor_name);
CREATE INDEX IF NOT EXISTS idx_bills_category ON public.bills(category);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill_id ON public.bill_items(bill_id);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
CREATE INDEX IF NOT EXISTS idx_auth_otps_email ON public.auth_otps(email);

-- 6. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_otps ENABLE ROW LEVEL SECURITY;

-- 7. Grant Full Access Policies for API Key (Anon and Service Role)
DROP POLICY IF EXISTS "Public full access to bills" ON public.bills;
CREATE POLICY "Public full access to bills" ON public.bills
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to bill_items" ON public.bill_items;
CREATE POLICY "Public full access to bill_items" ON public.bill_items
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to app_users" ON public.app_users;
CREATE POLICY "Public full access to app_users" ON public.app_users
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to auth_otps" ON public.auth_otps;
CREATE POLICY "Public full access to auth_otps" ON public.auth_otps
  FOR ALL USING (true) WITH CHECK (true);

-- 8. Seed Verified Admin User
INSERT INTO public.app_users (email, role, verified)
VALUES ('naviklakshya@gmail.com', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- 9. Seed Real Starter Bill Data (Narayani Readymade Stores & Tech Megastore)
INSERT INTO public.bills (
  id,
  invoice_number,
  vendor_name,
  vendor_address,
  vendor_phone,
  vendor_tax_id,
  date,
  time,
  currency,
  subtotal,
  tax_amount,
  total_amount,
  category,
  payment_method,
  items,
  notes,
  status
) VALUES 
(
  'bill-narayani-4569',
  '4569',
  'NARAYANI READYMADE STORES',
  '107/1, Dumdum Road, Ghosh Para, Kolkata',
  '+91 98300 12345',
  '19AABCN4569K1Z5',
  '2023-05-17',
  '18:30',
  '₹',
  5770.00,
  0.00,
  5770.00,
  'Apparel & Clothing',
  'Cash',
  '[
    {"id":"item-1","description":"T.Shirt","quantity":3,"unitPrice":180.00,"totalPrice":540.00,"category":"Apparel & Clothing"},
    {"id":"item-2","description":"Jeans","quantity":3,"unitPrice":475.00,"totalPrice":1425.00,"category":"Apparel & Clothing"},
    {"id":"item-3","description":"Shirt","quantity":4,"unitPrice":265.00,"totalPrice":600.00,"category":"Apparel & Clothing"},
    {"id":"item-4","description":"Coats","quantity":3,"unitPrice":920.00,"totalPrice":2680.00,"category":"Apparel & Clothing"},
    {"id":"item-5","description":"Frocks","quantity":5,"unitPrice":350.00,"totalPrice":1650.00,"category":"Apparel & Clothing"}
  ]'::jsonb,
  'Customer: Mr. Animesh Kumar Pandey | Cashier: Rakesh',
  'verified'
),
(
  'bill-tech-9912',
  'RD-2023-9912',
  'Reliance Digital Megastore',
  'Plot 4, Salt Lake Sector V, Kolkata 700091',
  '+91 (033) 4022-9900',
  '19AAACR1234F1ZV',
  '2023-08-14',
  '15:20',
  '₹',
  3497.00,
  629.46,
  3926.46,
  'Electronics & Hardware',
  'UPI',
  '[
    {"id":"item-tech-1","description":"Wireless Bluetooth Earbuds Pro","quantity":1,"unitPrice":2499.00,"totalPrice":2499.00,"category":"Electronics"},
    {"id":"item-tech-2","description":"High-Speed Type-C 65W Cable","quantity":2,"unitPrice":499.00,"totalPrice":998.00,"category":"Accessories"}
  ]'::jsonb,
  'GST 18% applied',
  'verified'
)
ON CONFLICT (id) DO NOTHING;

-- 10. Seed Itemized Rows for Power BI & SQL Queries
INSERT INTO public.bill_items (id, bill_id, description, quantity, unit_price, total_price, category) VALUES
  ('narayani-item-1', 'bill-narayani-4569', 'T.Shirt', 3, 180.00, 540.00, 'Apparel & Clothing'),
  ('narayani-item-2', 'bill-narayani-4569', 'Jeans', 3, 475.00, 1425.00, 'Apparel & Clothing'),
  ('narayani-item-3', 'bill-narayani-4569', 'Shirt', 4, 265.00, 600.00, 'Apparel & Clothing'),
  ('narayani-item-4', 'bill-narayani-4569', 'Coats', 3, 920.00, 2680.00, 'Apparel & Clothing'),
  ('narayani-item-5', 'bill-narayani-4569', 'Frocks', 5, 350.00, 1650.00, 'Apparel & Clothing'),
  ('tech-item-1', 'bill-tech-9912', 'Wireless Bluetooth Earbuds Pro', 1, 2499.00, 2499.00, 'Electronics'),
  ('tech-item-2', 'bill-tech-9912', 'High-Speed Type-C 65W Cable', 2, 499.00, 998.00, 'Accessories')
ON CONFLICT (id) DO NOTHING;

-- 11. Verification Query
SELECT 
  (SELECT count(*) FROM public.bills) AS total_bills,
  (SELECT count(*) FROM public.bill_items) AS total_items,
  (SELECT count(*) FROM public.app_users) AS total_users;
