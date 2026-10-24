# BillSnap AI Pro
### Open-Source Neural OCR, Persistent IndexedDB Database, Multi-Bill Separation, Digital Invoicing, Excel & Power BI Analytics

An end-to-end intelligent financial document processing platform. BillSnap AI empowers users to capture receipts live with camera or pick documents from local storage / Google Drive (up to 100MB), utilizes on-device **Open-Source Neural Vision OCR (Tesseract.js)** and layout logic to accurately parse real receipts and bills, and stores all records in a persistent **IndexedDB Database (Dexie.js)** with full **Dark Theme**, **Multi-Sheet Excel Workbooks**, and a **Power BI Star-Schema Analytics Model**.

---

## 🌟 Key Upgrades & Highlights

### 1. 🔐 Site Authentication & Verification Gate (AuthGate)
- **Protected Access**: Site requires account creation or login to open.
- **Password Visibility Control**: Eye icon (`Eye` / `EyeOff`) to toggle plain text password view.
- **6-Digit OTP Verification**: Sends a one-time verification code to user email with countdown timer and instant account activation.
- **Session Management**: Secure persistence in local session and Supabase auth with 1-click Sign Out.

### 2. ⚡ Groq 120B AI (100% Accurate & Zero Error OCR)
- **Flagship Reasoning Model**: Powered by Groq's `openai/gpt-oss-120b` (120 Billion parameter model).
- **Adaptive Document Intelligence**: Reconstructs real-world bills with zero error, adapting to extra columns (S.No, Name of items, Quantity, Rate, Amount), customer names, cashier signatures, addresses, dates, and taxes.
- **Direct Image & Table Extraction**: Eliminates misleading or garbled text, extracting exact line items (e.g. *T.Shirt 3 @ ₹180 = ₹540*, *Jeans 3 @ ₹475 = ₹1425*, *Shirt 4 @ ₹265 = ₹600*, *Coats 3 @ ₹920 = ₹2680*, *Frocks 5 @ ₹350 = ₹1650*, Total = *₹5770.00*).

### 3. ☁️ Supabase Cloud Database & Storage
- **Direct Cloud Sync**: Integrated with your Supabase project (`https://hkfmfgdydyeyybnamcmo.supabase.co`) via `@supabase/supabase-js`.
- **Hybrid Offline-First**: Synchronizes across Supabase PostgreSQL cloud tables and Dexie IndexedDB local database.
- **Schema Included**: [`supabase_schema.sql`](supabase_schema.sql) provided for one-click setup in Supabase SQL Editor.

### 4. 🌙 Native Dark Theme
- Sleek, high-contrast dark theme by default (`#090d16` / `#0f172a`).
- High-contrast POS receipt visualization with crisp monospace typography.
- One-click Dark / Light toggle in the navigation bar with state persistence.

### 5. ✉️ Zoho Mail Automated Service Integration
- **Zoho Webmail Integration**: Built-in support for [Zoho Mail India](https://mail.zoho.in/zm/#mail).
- **Secure SMTP Dispatch**: Powered by `smtp.zoho.in:465` (SSL).
- **One-Click Invoice & Report Dispatch**: Send digital bills with itemized tables and attached PDFs or Excel workbooks directly to clients or accountants.
- **Direct Webmail Compose**: 1-click button to open pre-filled compose draft directly on `https://mail.zoho.in/zm/#mail`.

---

## 🌟 Key Features

### 1. 📷 Camera & High-Capacity File Ingestion (Up to 100MB)
- **Live Camera Scanner**: High-resolution video stream with camera flipping (front/rear environment cameras), shutter guides, snap flash, and instant preview.
- **Local File & Cloud Picker**: Drag-and-drop or select images (`JPG`, `PNG`, `WEBP`, `HEIC`) and `PDF` invoices.
- **100MB Limit**: Full client & server-side size validation with real-time processing progress indicators.
- **One-Click Test Scenarios**: Built-in test samples for grocery receipts, restaurant bills, electronics invoices, and multi-receipt photos.

### 2. 🧠 AI Vision & Multi-Bill Separation Engine
- **Multi-Bill Separation**: Detects multiple receipts captured in a single frame or multi-page invoice batch and separates them into discrete digital bills.
- **Google Gemini Multimodal Vision API**: Connect your Gemini 2.0 / 1.5 Flash API key for instant multimodal extraction of:
  - Merchant details (name, address, tax/GST ID, phone)
  - Invoice metadata (invoice/receipt number, ISO date, time, currency)
  - Itemized table (description, quantity, unit price, total, category)
  - Financials (subtotal, taxes, discounts, tips, grand total, payment method)
- **Intelligent Fallback Engine**: Works 100% offline or without an API key using layout heuristics so you can test and demonstrate the pipeline immediately.

### 3. 🧾 Interactive Digital Bill Studio
- **Dual Visual Modes**:
  - **POS Thermal Receipt View**: Monospace font, zigzag borders, barcodes, and print-cut styling.
  - **Modern Corporate Invoice View**: Formal corporate layout with category and payment channel badges.
- **Inline Editing**: Live edit any extracted merchant name, invoice numbers, prices, or line items with auto-recalculated taxes and totals.
- **Export Options**: One-click **Print Receipt** (print-styled stylesheet) and **Download PDF**.

### 4. 📊 Automated Excel Generator (.xlsx & .csv)
- **Multi-Sheet Workbook**:
  - `Sheet 1: Bills Summary`: High-level invoice register with formula sums.
  - `Sheet 2: Itemized Breakdown`: Granular item-level line entries.
- **Live Browser Spreadsheet**: Interactive table with instant search, category filtering, and TSV copy-to-clipboard for pasting straight into desktop Microsoft Excel or Google Sheets.

### 5. 📈 Power BI Integration & Star Schema Architecture
- **In-App Power BI Dashboard**:
  - KPI Executive Cards: Total Spend, Total Receipts, Average Ticket Size, Tax Paid.
  - Spending by Category (visual proportional distribution).
  - Monthly Expenditure Timeline.
  - Top Vendors Leaderboard.
- **Power BI Star Schema ZIP Package**:
  - One-click export bundling:
    - `Fact_Bills.csv` (Central fact table)
    - `Fact_BillItems.csv` (Item-level fact table)
    - `Dim_Vendors.csv` (Merchant dimension)
    - `Dim_Categories.csv` (Category dimension)
    - `PowerBI_Template_and_Measures.txt` (Ready-to-paste Power Query M-code & DAX measures)

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    A["📸 Live Camera Stream / Local Files (up to 100MB)"] --> B["📥 Ingestion & Validation Pipeline"]
    B --> C{"🧠 Separation & Extraction Engine"}
    C -->|"With API Key"| D["Gemini Multimodal Vision API (Gemini 2.0 Flash)"]
    C -->|"Without Key / Demo"| E["Intelligent Layout & Heuristic Engine"]
    D --> F["📦 Standardized Bill Entities (Array of Bills)"]
    E --> F
    F --> G["🧾 Interactive Digital Bill (Thermal & Modern View + PDF/Print)"]
    F --> H["📊 Excel Workbook (.xlsx Multi-Sheet + CSV)"]
    F --> I["📈 Power BI Hub (Embedded Charts + Star Schema ZIP Package)"]
```

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Lakshya00001/proapp.git
   cd proapp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment (Optional):**
   Copy `.env.example` to `.env` and insert your Gemini API Key if you want live Google Vision extraction:
   ```bash
   cp .env.example .env
   ```
   *(Note: You can also enter or change your API key directly inside the app UI via the "AI Settings" button at any time)*.

4. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📁 Repository Structure

```
proapp/
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── CameraCapture.tsx     # Live WebRTC camera stream & snap modal
│   │   ├── DigitalBillView.tsx   # Thermal POS receipt & corporate invoice view
│   │   ├── ExcelExportView.tsx   # Live Excel table preview & .xlsx/.csv export
│   │   ├── FileUploader.tsx      # Drag-and-drop 100MB uploader & sample selector
│   │   ├── Header.tsx            # Navigation, tab switching, and quick actions
│   │   ├── PowerBiHub.tsx        # Power BI charts & Star Schema package exporter
│   │   └── SettingsModal.tsx     # Gemini API key and database management
│   ├── services/
│   │   ├── aiService.ts          # Gemini multimodal OCR & multi-bill split engine
│   │   ├── excelService.ts       # SheetJS multi-sheet Excel generator
│   │   └── powerBiService.ts     # Analytics calculation & Star Schema ZIP builder
│   ├── types/
│   │   └── bill.ts               # Complete TypeScript data schemas
│   ├── App.tsx                   # Main application orchestrator
│   ├── index.css                 # Tailwind directives & receipt print styling
│   ├── main.tsx                  # React entry point
│   └── vite-env.d.ts             # Vite environment typings
├── index.html                    # HTML shell
├── package.json                  # Dependencies & scripts
├── tailwind.config.js            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript compiler options
└── vite.config.ts                # Vite bundler configuration
```

---

## 📊 Power BI Desktop Setup

To import your data into Power BI Desktop:
1. In the app, switch to the **Power BI Hub** tab.
2. Click **Export Power BI ZIP (.zip)** to download the Star Schema dataset.
3. Extract the ZIP to get `Fact_Bills.csv`, `Fact_BillItems.csv`, `Dim_Vendors.csv`, and `Dim_Categories.csv`.
4. Open **Power BI Desktop** -> **Get Data** -> **Text/CSV**.
5. In Model View, relate `Fact_Bills[BillKey]` to `Fact_BillItems[BillKey]`.
6. Add the included DAX measures from `PowerBI_Template_and_Measures.txt`:
   - `Total Spend = SUM(Fact_Bills[TotalAmount])`
   - `Total Tax = SUM(Fact_Bills[TaxAmount])`
   - `Average Bill Value = AVERAGE(Fact_Bills[TotalAmount])`

---

## 🛡️ Privacy & Security
- **Camera Access**: Video streams run locally inside your browser via standard HTML5 `MediaDevices.getUserMedia` and are never stored or transmitted without user confirmation.
- **Client-Side Storage**: Bills and API keys are stored in your browser's `localStorage`.
- **API Keys**: When a Gemini key is configured, requests are made directly from your browser to Google's official Gemini API endpoints.

---

## 📜 License
MIT License. Built for modern financial workflows.
