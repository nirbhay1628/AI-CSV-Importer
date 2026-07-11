# GrowEasy: AI-Powered CRM CSV Importer

A high-performance, full-stack, AI-powered CSV lead importer designed for **GrowEasy**. This application intelligently extracts, normalizes, and maps arbitrary CSV data structures into a unified 15-field CRM contact scheme using Gemini 3.5 AI.

## 🚀 Key Features

### 1. Unified CRM Lead Extraction
The system utilizes server-side Gemini AI models to map raw headers and records into GrowEasy’s standard CRM fields:
- `created_at` (Auto-formatted, JS `Date` convertible)
- `name` (Lead name)
- `email` (Primary email, extracts first email if multiple exist)
- `country_code` & `mobile_without_country_code` (Separate country code & number, extracts first if multiple exist)
- `company` (Company Name)
- `city`, `state`, `country` (Location parameters)
- `lead_owner` (Assigned operator)
- `crm_status` (Enum: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`)
- `data_source` (Enum: `leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots`)
- `crm_note` (Aggregated remarks, additional emails/numbers, notes)
- `possession_time` (Real estate property possession schedule)
- `description` (Detailed summaries)

### 2. Client-Controlled Incremental Batch Syncer
- **Incremental Mapping**: Divides the CSV into highly optimized chunks of 15 records.
- **Progress Tracking**: Real-time progress indicators showing percentage completeness, active batch counts, and statistics (Imported vs. Skipped).
- **Auto-Validation**: Instantly filters out empty rows or rows lacking *both* email and phone contact details (satisfying strict skipping conditions).
- **Retry Mechanism**: Displays clear logs for each batch with individual action triggers, allowing users to restart failed batches on network hiccups with a single click.

### 3. Beautiful & Responsive CRM Interface
- **Drag & Drop and File Picker Upload**: Supports intuitive file drag actions or browse clicks.
- **Scrollable Table Preview**: Supports full horizontal and vertical scrolling with fixed/sticky headers so users can audit the raw structure before firing AI requests.
- **Dynamic Template Generation**: Download button triggers download of a perfectly structured CSV schema template.
- **Lead Profile Drawer**: Slidover modal displaying all 15 mapped CRM properties + original CSV row references for audited leads.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend**: Node.js, Express (Vite Middleware in Dev, Standalone statically served build in Production)
- **AI Engine**: `@google/genai` TypeScript SDK running server-side (`gemini-3.5-flash`)
- **Build System**: Vite, Esbuild (Bundles `server.ts` into a single CommonJS CJS file in `dist/server.cjs` for lightning-fast container cold-starts)

---

## ⚙️ Setup and Installation

### 1. Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### 2. Set environment secrets
Create a `.env` file in the root directory (using `.env.example` as reference):
```env
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
NODE_ENV="production"
```
*(Note: In Google AI Studio, the `GEMINI_API_KEY` is automatically managed and injected server-side via the **Settings > Secrets** panel.)*

### 3. Install Dependencies
```bash
npm install
```

### 4. Running in Development
```bash
npm run dev
```
The application will boot up at `http://localhost:3000`.

### 5. Production Compiling and Building
```bash
npm run build
```
This command compiles both the React client assets and compiles the backend server into a clean CJS bundle at `dist/server.cjs`.

### 6. Starting Production Server
```bash
npm start
```
This launches the bundled high-performance server.
