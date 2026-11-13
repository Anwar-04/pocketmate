# SpendWise — Salary-to-Salary Financial Coach
> **“Don’t just track where your salary went. Know what you can safely spend next.”**

SpendWise is an AI-powered personal finance web application built for salaried working professionals in India. It transforms monthly salary cycles, recorded expenses, committed essentials (Rent, EMIs, Bills), and upfront savings targets into one real-time daily decision metric: **Safe Daily Spend** (e.g. **₹708/day**).

---

## 🚀 Live Demo 

SpendWise features a **1-click Zero-Dependency Demo Mode** designed for instant evaluation without setting up external bank or database credentials:

1. **Open the App**: Click **"Get Started"** or **"Explore Demo as Rahul Sharma (₹708/day)"**.
2. **Dashboard**: Instantly view the reference benchmark:
   - **Monthly Net Salary**: ₹60,000 (credited on the 1st)
   - **Spent This Cycle**: ₹38,500 across 11 Indian transactions
   - **Upcoming Committed Essentials**: ₹8,000 (Rent/Bills)
   - **Protected Monthly Savings Goal**: ₹5,000
   - **Remaining Flexible Money**: ₹8,500
   - **Days Left Until Payday**: 12 days
   - **Safe Daily Spend**: **₹708 / day**
3. **Transparent Math Drawer**: Tap **"How this is calculated"** on the hero card to see the full formula breakdown.
4. **Expense Ledger (`/transactions`)**:
   - Add a manual expense (e.g. ₹450 Swiggy dinner) and watch the safe daily spend update in real-time.
   - Click **"Import CSV"** and use **"Load Sample CSV (20 Transactions)"** to test batch parsing and auto-categorization.
5. **Spending Insights & Leaks (`/insights`)**:
   - Inspect detected leaks (Chai micro-expenses, Netflix/Spotify subscriptions, and food delivery velocity spikes) with quantified budget impact tags and remediation actions.
6. **AI Financial Coach (`/coach`)**:
   - Ask: *“Can I afford a ₹2,000 purchase?”*
   - The AI evaluates the query strictly against your precomputed ₹8,500 flexible buffer, warns of the daily spend drop from ₹708 to ₹504/day, and gives a concrete action step with zero math hallucinations.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5 with strict typing (`noImplicitAny`, strict null checks)
- **Styling**: Tailwind CSS + shadcn/ui design patterns + Lucide Icons
- **Charts**: Recharts (Donut & Bar charts)
- **Database & ORM**: PostgreSQL via Supabase + Prisma ORM
- **Authentication**: Supabase Auth (`@supabase/ssr`) + Secure Demo Sessions
- **AI Engine**: OpenAI API (`gpt-4o-mini`) with strict context injection & zero-token deterministic fallback
- **Validation**: Zod runtime schema validation
- **CSV Ingestion**: PapaParse with fuzzy column alias matching
- **Deployment**: Vercel-ready serverless architecture

---

## 📐 Core Architecture Rule: Deterministic Math vs. Guarded AI

SpendWise enforces a strict separation of concerns:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      DETERMINISTIC TYPESCRIPT CORE                     │
│  - Salary cycle dates & leap year date snapping                        │
│  - Total spent & Category aggregations                                 │
│  - Flexible Money = Salary - Spent - Essentials - Savings Goal         │
│  - Safe Daily Spend = max(0, floor(Flexible Money / Days Left))        │
│  - Daily burn rate & Pace velocity ratio                               │
│  - Spending leak detection thresholds                                  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Precomputed Snapshot Context
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                               AI LAYER                                 │
│  - Interprets spending patterns and explains active leaks in English   │
│  - Evaluates conversational affordability queries (yes / caution / no)  │
│  - PROHIBITION: Never calculates balances or invents financial figures │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Environment Variables

Create a `.env` or `.env.local` file using [`.env.example`](./.env.example) as reference:

```env
# Database (PostgreSQL via Supabase Transaction Pooler)
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct URL for Prisma Migrations (Session Port 5432)
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Supabase Auth Configuration
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# OpenAI API Key (Server-side only)
OPENAI_API_KEY="sk-proj-..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

> **Note**: Even without live Supabase or OpenAI credentials, SpendWise operates completely in **Demo Mode**, allowing judges to test every screen, calculation, and feature locally or on Vercel immediately.

---

## 💻 Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Run Automated Tests
```bash
npm run type-check
```

### 4. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deploying to Vercel

SpendWise is pre-configured for one-click deployment on Vercel:

1. Push this repository to GitHub.
2. Import the project into your [Vercel Dashboard](https://vercel.com/new).
3. Under **Environment Variables**, add the variables from `.env.example`.
4. Click **Deploy**. Vercel will run `npm run build` and launch the app globally.

---

## 📁 Project Structure

```text
spenzbuddy/
├── prisma/
│   ├── schema.prisma           # Relational PostgreSQL schema (User, Profile, Transaction)
│   └── seed.ts                 # Rahul Sharma benchmark seed script
│
├── src/
│   ├── app/
│   │   ├── page.tsx            # Marketing Landing Page (Hero & ₹708 concept)
│   │   ├── login/page.tsx      # Auth screen (Supabase + 1-Click Demo)
│   │   ├── onboarding/page.tsx # Interactive salary cycle configuration wizard
│   │   ├── dashboard/page.tsx  # Core decision screen (₹708 Hero card & stats)
│   │   ├── transactions/       # Ledger, manual add modal, CSV dropzone
│   │   ├── insights/page.tsx   # Category charts & spending leak audits
│   │   ├── coach/page.tsx      # Context-bounded conversational AI coach
│   │   └── api/                # Next.js Route Handlers (dashboard, transactions, coach)
│   │
│   ├── components/
│   │   ├── layout/             # Sticky Navbar, footer, user profile
│   │   ├── dashboard/          # HeroSafeSpendCard, StatCards, PaceVisualizer, DonutChart
│   │   ├── transactions/       # TransactionTable, AddModal, EditModal, CsvDropzone
│   │   └── insights/           # CategoryBarChart, LeakAuditCards
│   │
│   ├── lib/
│   │   ├── financial/          # DETERMINISTIC FINANCIAL ARITHMETIC
│   │   │   ├── salaryCycle.ts  # Cycle dates, days until payday, month snapping
│   │   │   ├── budget.ts       # Flexible money, safe daily spend, burn rate
│   │   │   ├── categorizer.ts  # 100+ Indian merchant keyword rules
│   │   │   └── leaks.ts        # Micro-expense, subscription, and spike heuristics
│   │   ├── csv/                # PapaParse wrapper & column normalizer
│   │   └── ai/                 # Context builder & dual-engine coach service
│   │
│   └── types/                  # Strict TypeScript domain interfaces
```

---

## 📄 License
MIT © 2026 SpendWise. Designed for Salaried Working Professionals in India.
