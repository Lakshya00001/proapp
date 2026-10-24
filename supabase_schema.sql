-- BillSnap AI Pro - Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/hkfmfgdydyeyybnamcmo/sql

CREATE TABLE IF NOT EXISTS public.bills (
  id TEXT PRIMARY KEY,
  invoice_number TEXT,
  vendor_name TEXT NOT NULL,
  vendor_address TEXT,
  vendor_phone TEXT,
  date TEXT,
  time TEXT,
  currency TEXT DEFAULT '₹',
  subtotal NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  category TEXT,
  payment_method TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  raw_text TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Allow public read/write access via API key
CREATE POLICY "Allow public access to bills" ON public.bills
  FOR ALL
  USING (true)
  WITH CHECK (true);
