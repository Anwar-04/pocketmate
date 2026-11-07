# SpendWise — Product Requirements Document (PRD)
**Product Version:** MVP (v1.0 — Lean Architectural Core)  
**Role:** Senior SaaS Product Architect  
**Target Market:** Salaried Working Professionals in India  
**Date:** November 2026  
**Document Status:** Architecture Baseline (Approved for Incremental Build)

---

## 1. Product Overview

### 1.1 Product Vision & Core Positioning
**SpendWise** is a personal finance SaaS application tailored for salaried working professionals in India.

Traditional personal finance apps act as retroactive bookkeeping ledgers (*"Here is where your ₹42,000 went last month"*). SpendWise inverts this paradigm by serving as a forward-looking **Salary-to-Salary Financial Coach**:

> **“Don’t just track where your salary went. Know what you can safely spend next.”**

SpendWise continuously synthesizes a user’s monthly salary cycle, logged expenses, upcoming committed fixed essentials, and upfront savings goal into one actionable daily decision metric: **Safe Daily Spend** (e.g., *₹708/day*).

### 1.2 Architecture Strategy: Incremental, Deterministic, Secure
To ensure high reliability, bank-grade data security, and rapid time-to-market, the MVP is strictly architected around a **pure deterministic calculation engine**:
1. **Zero External AI / LLM Dependencies in Core MVP**: All budgeting math, dates, category aggregations, and daily allowances run in predictable, auditable, high-performance TypeScript code.
2. **Lean & Resilient Data Ingestion**: Clean manual entry and lightweight, deterministic CSV import.
3. **Phased Roadmap**: Experimental capabilities (Bank SMS parsing, AI auto-categorization, automated spending leak heuristics, and conversational AI coaching) are cleanly isolated into the post-MVP roadmap.

---

## 2. Target Users

### 2.1 Primary Persona: "Salaried Indian White-Collar Professional"
* **Demographics**: 22–38 years old, urban Tier-1 & Tier-2 hubs (Bengaluru, Mumbai, Pune, Delhi NCR, Hyderabad, Chennai).
* **Income Range**: ₹35,000 – ₹2,50,000 monthly take-home salary.
* **Salary Cadence**: Fixed monthly credit date (typically 1st of month, or 25th–31st).
* **Spending Habits**: High-frequency UPI payments (Google Pay, PhonePe, Paytm), food delivery (Swiggy, Zomato), quick-commerce (Blinkit, Zepto), and card subscriptions.
* **Core Pain Point**: Lacks clarity on how much discretionary cash is truly safe to spend on any given day without falling short on rent, EMIs, or monthly savings before the next payday.

---

## 3. Main User Problems

1. **Rear-View Mirror Tracking**: Existing tools provide retroactive reports after the money is already spent, offering zero operational guidance for daily purchase decisions.
2. **End-of-Month (EOM) Cash Crunch**: Unplanned mid-month spending exhausts discretionary funds, forcing users to compromise savings or rely on credit cards before payday.
3. **Hidden Fixed Obligations**: Users often look at their gross bank balance and spend under the illusion of wealth, forgetting upcoming rent, EMIs, and utility bills due later in the cycle.
4. **Savings Treated as Leftover Scraps**: Savings are traditionally calculated on Day 30 (often resulting in ₹0). SpendWise reserves the monthly savings target upfront on Day 1.
5. **App Complexity & Friction**: Complex multi-account aggregators and steep onboarding curves cause high abandonment. Users need a clean, immediate tool that gives them a single daily spending number.

---

## 4. Financial Domain Model & Mathematical Foundations

### 4.1 Interaction Model: Salary, Fixed Expenses, Savings, and Flexible Spending
SpendWise models personal finance around an isolated, predictable salary cycle:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MONTHLY TAKE-HOME SALARY (S)                    │
│                                ₹60,000                                 │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
         ┌──────────────────────────┼──────────────────────────┐
         ▼                          ▼                          ▼
┌─────────────────┐        ┌─────────────────┐        ┌──────────────────┐
│ FIXED ESSENTIALS│        │  SAVINGS GOAL   │        │ FLEXIBLE BUDGET  │
│ (Committed)     │   +    │  (Protected)    │   +    │ (Discretionary)  │
│     ₹18,000     │        │     ₹5,000      │        │     ₹37,000      │
└─────────────────┘        └─────────────────┘        └────────┬─────────┘
                                                               │
                                         ┌─────────────────────┴─────────────────────┐
                                         ▼                                           ▼
                               ┌───────────────────┐                       ┌───────────────────┐
                               │ ALREADY SPENT     │                       │ REMAINING BUDGET  │
                               │ Discretionary     │                       │ ₹8,500            │
                               │ ₹28,500           │                       └─────────┬─────────┘
                               └───────────────────┘                                 │
                                                                                     ▼
                                                                           ┌───────────────────┐
                                                                           │ SAFE DAILY SPEND  │
                                                                           │ (₹8,500 ÷ 12 Days)│
                                                                           │ ₹708 / day        │
                                                                           └───────────────────┘
```

1. **Monthly Net Salary ($S$)**: The total regular take-home pay credited per cycle.
2. **Committed Fixed Essentials ($E_{\text{fixed}}$)**: Non-negotiable obligations that must be met every cycle (Rent, Maintenance, EMIs, Insurance, Children's Fees, Base Utilities).
   * Total Committed Essentials: $E_{\text{fixed, total}}$
   * Already Paid Essentials: $E_{\text{fixed, paid}}$
   * Upcoming / Pending Essentials: $E_{\text{fixed, upcoming}} = \max(0, E_{\text{fixed, total}} - E_{\text{fixed, paid}})$
3. **Protected Savings Goal ($S_{\text{goal}}$)**: Upfront wealth allocation deducted prior to calculating spendable allowances (*Pay Yourself First*).
4. **Flexible / Discretionary Budget Pool ($B_{\text{flex}}$)**: Total pool allocated for variable lifestyle spending over the entire cycle:
   $$B_{\text{flex}} = S - E_{\text{fixed, total}} - S_{\text{goal}}$$
5. **Flexible Spent to Date ($E_{\text{flex, spent}}$)**: Sum of all discretionary expenses logged in the current cycle.
6. **Total Spent This Cycle ($E_{\text{total}}$)**:
   $$E_{\text{total}} = E_{\text{fixed, paid}} + E_{\text{flex, spent}}$$

---

### 4.2 Precise Mathematical Formulas

#### Formula 1: Remaining Flexible Balance ($M_{\text{flex, rem}}$)
The uncommitted discretionary funds remaining for the rest of the cycle:
$$M_{\text{flex, rem}} = B_{\text{flex}} - E_{\text{flex, spent}}$$
Or equivalently, expressed from the primary salary inputs:
$$M_{\text{flex, rem}} = S - E_{\text{total}} - E_{\text{fixed, upcoming}} - S_{\text{goal}}$$

#### Formula 2: Salary Cycle Days & Countdown
Given a configured salary credit day $D_{\text{sal}} \in [1, 31]$ and the current date $T$:
* Let $\text{CycleStart}$ be the latest occurrence of $D_{\text{sal}}$ on or before $T$.
* Let $\text{NextPayday}$ be the earliest occurrence of $D_{\text{sal}}$ strictly after $T$.
* **Total Days in Cycle ($D_{\text{cycle}}$)**:
  $$D_{\text{cycle}} = \text{DateDiffInDays}(\text{CycleStart}, \text{NextPayday})$$
* **Days Elapsed ($D_{\text{elapsed}}$)**:
  $$D_{\text{elapsed}} = \max(1, \text{DateDiffInDays}(\text{CycleStart}, T))$$
* **Days Remaining Until Payday ($D_{\text{rem}}$)** (inclusive of current day):
  $$D_{\text{rem}} = \max(1, \text{DateDiffInDays}(T, \text{NextPayday}))$$

#### Formula 3: Safe Daily Spending ($SDS$)
The maximum amount the user can spend per day on discretionary purchases without exhausting their flexible budget or dipping into committed essentials/savings:
$$SDS = \begin{cases} 
\max\left(0, \left\lfloor \frac{M_{\text{flex, rem}}}{D_{\text{rem}}} \right\rfloor\right) & \text{if } M_{\text{flex, rem}} > 0 \\
0 & \text{if } M_{\text{flex, rem}} \le 0
\end{cases}$$
*Note: We floor to the nearest integer for integer rupee simplicity in the UI.*

#### Formula 4: Current Daily Burn Rate ($R_{\text{burn}}$)
The average rate of discretionary spend per day since cycle inception:
$$R_{\text{burn}} = \frac{E_{\text{flex, spent}}}{D_{\text{elapsed}}}$$

#### Formula 5: Budget Usage & Pace Metrics
* **Flexible Budget Utilization ($U_{\text{flex}}$)**:
  $$U_{\text{flex}} = \left(\frac{E_{\text{flex, spent}}}{B_{\text{flex}}}\right) \times 100\%$$
* **Cycle Time Elapsed ($P_{\text{cycle}}$)**:
  $$P_{\text{cycle}} = \left(\frac{D_{\text{elapsed}}}{D_{\text{cycle}}}\right) \times 100\%$$
* **Spending Pace Ratio ($\rho$)**:
  $$\rho = \frac{U_{\text{flex}}}{P_{\text{cycle}}}$$
  * $\rho \le 1.00$: **Healthy** (spending at or below time progression).
  * $1.00 < \rho \le 1.25$: **Watch / Caution** (spending slightly outpacing calendar).
  * $\rho > 1.25$ or $M_{\text{flex, rem}} \le 0$: **Risk / Deficit** (projected to run out before payday).

#### Formula 6: Projected End-of-Cycle Discretionary Spend ($E_{\text{flex, proj}}$)
$$E_{\text{flex, proj}} = E_{\text{flex, spent}} + (R_{\text{burn}} \times D_{\text{rem}})$$

---

## 5. MVP Feature Scope

The MVP contains the following 6 core modules:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SPENDWISE MVP MODULES                           │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ 1. Income & Salary │ 2. Expense & Fixed │ 3. Category                  │
│    Profile Setup   │    Obligation Log  │    Management                │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ 4. Deterministic   │ 5. Core Dashboard  │ 6. Lightweight CSV           │
│    Budget Engine   │    & Safe-to-Spend │    Import                    │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

---

## 6. Functional Requirements

### 6.1 User Profile & Salary Cycle Configuration
* **FR-1.1**: The system shall collect:
  * Full Name and Email (Supabase Auth).
  * Monthly Take-Home Salary ($S$, in INR, e.g., ₹60,000).
  * Salary Credit Day ($D_{\text{sal}}$, 1–31, default: 1st of month).
  * Monthly Protected Savings Goal ($S_{\text{goal}}$, in INR, e.g., ₹5,000).
  * Expected Monthly Committed Fixed Essentials ($E_{\text{fixed, total}}$, in INR, e.g., ₹18,000).
* **FR-1.2 Budget Validation**: During setup, the system shall validate that $S \ge E_{\text{fixed, total}} + S_{\text{goal}}$. If total commitments exceed salary, a blocking validation warning must be displayed.
* **FR-1.3 Profile Editing**: Users shall be able to update their salary, salary day, savings target, and fixed essentials at any time from Settings, triggering an immediate recalculation of all active cycle budgets.
* **FR-1.4 One-Click Demo Profile**: Provide a one-click button to load the benchmark demo persona ("Rahul" — ₹60,000 salary, ₹18,000 fixed essentials, ₹5,000 savings goal, 1st-of-month cycle, with pre-seeded transactions).

### 6.2 Expense Tracking & Transaction Management
* **FR-2.1 Manual Transaction Entry**: The system shall allow users to log an expense with:
  * Transaction Date (defaults to today).
  * Description / Merchant (e.g., "Swiggy dinner", "Airtel broadband").
  * Amount (in INR, positive numeric, min: ₹1).
  * Category (selected from predefined category list).
  * Expense Nature: `Discretionary / Flexible` (default) vs. `Fixed Essential` (deducted from upcoming commitments).
  * Payment Method: `UPI`, `Credit Card`, `Debit Card`, `NetBanking`, `Cash`.
* **FR-2.2 Transaction Ledger**:
  * Paginated/searchable list of transactions within the active cycle.
  * Columns: Date, Description, Category, Payment Method, Nature, Amount.
* **FR-2.3 Transaction Editing & Deletion**:
  * Users can edit any field of an existing transaction or delete it.
  * Any edit or deletion immediately triggers an in-memory or database recalculation of the budget metrics.

### 6.3 Category Management
* **FR-3.1 Predefined Standard Categories**:
  * **Food & Dining** (Discretionary)
  * **Groceries** (Discretionary / Essential)
  * **Commute & Transport** (Discretionary)
  * **Shopping** (Discretionary)
  * **Entertainment & Leisure** (Discretionary)
  * **Bills & Utilities** (Fixed Essential)
  * **Rent & Society** (Fixed Essential)
  * **Health & Medical** (Discretionary / Essential)
  * **Subscriptions** (Discretionary)
  * **General / Miscellaneous** (Discretionary)
* **FR-3.2 Category-Level Totals**: The system shall compute aggregate spend per category for the current cycle to populate breakdown charts.

### 6.4 Core Dashboard & Safe-to-Spend Display
* **FR-4.1 Top Cycle Banner**:
  * User greeting.
  * Active cycle dates (e.g., `1 Nov 2026 – 30 Nov 2026`).
  * Next Payday date and a prominent badge for `Days Remaining: 12 days`.
* **FR-4.2 Hero Metric Card ("Safe to Spend Today")**:
  * Massive, high-visibility display of Safe Daily Spend ($SDS$, e.g., **₹708**).
  * Supporting text: *"Safe to spend each day to protect your ₹5,000 savings goal."*
  * **Transparent Formula Drawer**: Tapping/clicking the card opens an exact breakdown:
    $$\text{Salary (₹60,000)} - \text{Fixed (₹18,000)} - \text{Savings (₹5,000)} - \text{Discretionary Spent (₹28,500)} = \text{Remaining (₹8,500)}$$
    $$\text{Remaining (₹8,500)} \div 12\text{ Days Left} = \mathbf{₹708/\text{day}}$$
* **FR-4.3 Six Summary Financial Cards**:
  1. **Monthly Salary**: ₹60,000
  2. **Total Spent So Far**: ₹38,500 (Fixed Paid + Discretionary Spent)
  3. **Upcoming Fixed Essentials**: ₹8,000
  4. **Protected Savings Goal**: ₹5,000
  5. **Remaining Flexible Money**: ₹8,500
  6. **Current Daily Burn Rate**: ₹1,583/day
* **FR-4.4 Spending Pace Visualizer**:
  * Visual progress bar comparing **Flexible Budget Used (%)** against **Cycle Time Elapsed (%)**.
  * Status badge:
    * `Healthy` (Green) when spending is at or below safe pace.
    * `Watch` (Amber) when spending pace is 10–25% higher than time elapsed.
    * `Risk / Deficit` (Red) when flexible money is exhausted or spending is $>25\%$ higher than pace.
* **FR-4.5 Category Breakdown Visualizer**:
  * Recharts donut or horizontal bar chart showing top spending categories in the active cycle.

### 6.5 Lightweight CSV Import
To maintain simplicity without enterprise CSV mapping bloat, the CSV import feature is defined as follows:
* **FR-5.1 Accepted File Format**: UTF-8 encoded `.csv` up to 2 MB.
* **FR-5.2 Required Columns**:
  * `date` (YYYY-MM-DD or DD/MM/YYYY)
  * `description` (text)
  * `amount` (numeric, positive)
  * `category` (optional; defaults to `General` if blank or unmapped)
  * `payment_method` (optional; defaults to `UPI`)
* **FR-5.3 Interactive Import Preview**:
  * Displays a 5-row table preview before final ingestion.
  * Shows total rows detected, valid rows, and invalid rows (e.g., missing amounts or unparseable dates).
* **FR-5.4 Batch Insert**: On confirmation, valid records are inserted into the database, and the budget engine recalculates immediately.

---

## 7. Edge Cases & Boundary Handling

| Edge Case ID | Scenario | System Behavior & Calculation Rule |
|---|---|---|
| **EC-01** | **Over-Budget / Deficit State** ($M_{\text{flex, rem}} \le 0$) | Safe Daily Spend ($SDS$) is strictly clamped to **₹0**. The dashboard flips to a red `Deficit` alert banner showing: *"You have overspent your flexible budget by ₹X. Your ₹5,000 savings goal is now being used to absorb expenses."* |
| **EC-02** | **End of Cycle / Payday ($D_{\text{rem}} = 1$ or Payday itself)** | To prevent division by zero, when $T = \text{NextPayday}$, the system initiates cycle rollover or prompts: *"Today is Payday! Happy new salary cycle."* If $D_{\text{rem}} = 1$, $SDS = M_{\text{flex, rem}}$. |
| **EC-03** | **Shorter Months (28/29/30-day months with 31st salary day)** | If $D_{\text{sal}} = 31$, in February (28/29 days) or April/June/Sept/Nov (30 days), the system automatically snaps the cycle boundary to the final day of that calendar month. |
| **EC-04** | **Mid-Cycle Onboarding** | If a user signs up on the 18th of a month with salary day on the 1st: The engine sets $\text{CycleStart}$ to the 1st of the current month. The user can either input an estimate of *"Already spent this cycle before joining SpendWise"* or start tracking from today with remaining days ($D_{\text{rem}}$). |
| **EC-05** | **Zero or Negative Expense Amounts** | The expense entry form and CSV parser reject amounts $\le 0$. Refunds or reversals are handled in MVP by editing or deleting the original erroneous transaction rather than logging negative expenses. |
| **EC-06** | **Large Single Expense Exceeding $M_{\text{flex, rem}}$** | The system allows logging the transaction (reflecting reality), immediately drops $M_{\text{flex, rem}}$ into negative, clamps $SDS$ to ₹0, and updates the status to `Risk`. |
| **EC-07** | **Leap Year Calculations** | All date arithmetic uses date-fns or native UTC timestamps in Asia/Kolkata timezone (`UTC+05:30`) to avoid 1-day off-by-one errors across leap years. |
| **EC-08** | **CSV Formatting Inconsistencies** | The parser automatically trims whitespace, strips currency symbols (`₹`, `Rs.`, `,`), and parses standard date formats (`DD-MM-YYYY`, `YYYY-MM-DD`, `DD/MM/YYYY`). |

---

## 8. Non-Functional Requirements

### 8.1 Performance & Latency
* **Deterministic Computation Time**: All budget formulas ($SDS$, $M_{\text{flex, rem}}$, burn rate, pace ratio) must execute in $< 5\text{ ms}$ on standard client or server hardware.
* **Dashboard Page Load**: Initial server-rendered HTML and client hydration must complete in $< 1.5$ seconds on standard 4G connections.
* **CSV Processing**: Parsing and validating a 200-row CSV file must complete in $< 500\text{ ms}$.

### 8.2 Security & Data Integrity
* **Authentication**: Supabase Auth (Email + Password) with secure session handling via Next.js middleware.
* **Row-Level Security (RLS)**: PostgreSQL tables must enforce strict RLS policies tied to `auth.uid()`, preventing any cross-user data leakage.
* **Input Validation**: Strict Zod schema validation on all API endpoints and server actions.
* **Financial Precision**: All currency amounts stored as numeric/decimals or integer paisa to prevent floating-point rounding errors.

### 8.3 UX & Visual Design Guidelines
* **Palette**: Clean fintech theme (white / slate-50 backgrounds, slate-900 typography, subtle 1px slate-200 borders).
* **Semantic Status Indicators**:
  * Emerald (`#10B981`): Healthy spending pace ($\rho \le 1.00$).
  * Amber (`#F59E0B`): Caution spending pace ($1.00 < \rho \le 1.25$).
  * Rose/Red (`#EF4444`): Deficit or over-budget ($\rho > 1.25$ or $M_{\text{flex, rem}} \le 0$).
* **Mobile-First Layout**: Fully responsive card layout optimized for mobile screens (375px+).

---

## 9. User Stories

| ID | Persona | Story Description | Acceptance Goal |
|---|---|---|---|
| **US-01** | Salaried Professional | As a user, I want to configure my salary, salary date, fixed essentials, and savings goal during onboarding. | Establishes the baseline budget with transparent validation. |
| **US-02** | Salaried Professional | As a user, I want to see my "Safe to Spend Today" amount prominently whenever I open the app. | Delivers an instant, actionable spending limit for today in $< 2$ seconds. |
| **US-03** | Salaried Professional | As a user, I want to tap on my safe daily spend to see the exact formula and math behind it. | Builds complete trust in the platform through mathematical transparency. |
| **US-04** | Salaried Professional | As a user, I want to manually log a quick ₹450 dinner expense and see my safe daily spend update immediately. | Provides immediate feedback on how purchases impact the rest of the cycle. |
| **US-05** | Busy Professional | As a user, I want to upload a bank CSV statement and have transactions categorized into my cycle. | Eliminates manual entry friction for bulk transactions without complex bank integrations. |
| **US-06** | Evaluator / Judge | As an evaluator, I want to click a "Load Demo Profile" button to inspect SpendWise fully populated with realistic Indian salary and expense data. | Enables instant zero-friction evaluation of all screens in $< 30$ seconds. |

---

## 10. Acceptance Criteria (Definition of Done for MVP)

1. **Onboarding Complete**: A new user can sign up, enter ₹60,000 salary, 1st of month salary day, ₹18,000 fixed essentials, and ₹5,000 savings goal, and be redirected to a populated dashboard.
2. **Formula Integrity**:
   * For ₹60k salary, ₹18k fixed essentials, ₹5k savings goal, ₹28.5k discretionary spent, and 12 days remaining:
   * $M_{\text{flex, rem}} = 60000 - 18000 - 5000 - 28500 = \mathbf{₹8,500}$.
   * $SDS = \lfloor 8500 \div 12 \rfloor = \mathbf{₹708/\text{day}}$.
   * Both numbers are verified in the UI and automated tests.
3. **Deficit Clamping**: If discretionary spend reaches ₹38,000 (exceeding flexible budget of ₹37,000), $M_{\text{flex, rem}}$ is displayed as **-₹1,000**, $SDS$ is clamped to **₹0**, and a red over-budget badge is displayed.
4. **Transaction Management**: A user can add, edit, and delete an expense. The dashboard metrics and category totals update immediately without page refresh errors.
5. **CSV Ingestion**: Uploading a standard 4-column CSV (`date, description, amount, category`) successfully adds transactions to the ledger and recalculates the budget.
6. **No AI Overhead**: The MVP codebase has zero runtime dependencies on external LLM APIs for core budgeting, ensuring 100% availability and determinism.
7. **Mobile Responsiveness**: The dashboard, ledger, and entry modals render without horizontal overflow or broken touch targets on 375px viewport widths.

---

## 11. Post-MVP Roadmap (v1.1+)

The following capabilities are deliberately staged for subsequent releases to maintain a tight, high-quality MVP:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        POST-MVP ROADMAP (v1.1+)                        │
├────────────────────┬────────────────────┬──────────────────────────────┤
│ Phase 1.1          │ Phase 1.2          │ Phase 1.3                    │
│ Bank SMS Parser    │ Spending Leak      │ AI Financial Coach           │
│ & Auto-Dedupe      │ Heuristics Engine  │ (/api/coach with Context)    │
├────────────────────┼────────────────────┼──────────────────────────────┤
│ • Paste bank SMS   │ • Micro-expense    │ • "Can I afford a ₹2,000     │
│   text / demo feed   audit (≤₹100)        dinner?" Q&A                 │
│ • Regex parser     │ • Subscription     │ • Structured JSON            │
│   for HDFC/SBI/etc.  tracker (>₹1,500)    affordability verdicts       │
│ • Hash-based dedupe│ • Category velocity│ • Zero-hallucination         │
│ • AI classification  spike alerts         context-bounded prompt       │
│   for ambiguous VPA│ • Runaway burn     │                              │
│   handles (fallback) rate detector      │                              │
└────────────────────┴────────────────────┴──────────────────────────────┘
```

1. **Bank SMS Parsing (v1.1)**:
   - Regex parser for Indian debit SMS alerts (HDFC, ICICI, SBI, Axis, Kotak).
   - Deduplication engine using SHA-256 hash of `[amount + date + normalized_merchant]`.
   - AI-assisted classification fallback for ambiguous UPI handles.
2. **Automated Spending Leak Detector (v1.2)**:
   - Micro-expense aggregator ("Death by 1,000 Cuts" on $\le$ ₹100 chai/snack purchases).
   - Recurring subscription tracker alerting when subscriptions exceed ₹1,500/month.
   - Category spending acceleration warnings.
3. **Contextual AI Financial Coach (v1.3)**:
   - Chat endpoint (`/api/coach`) providing personalized affordability assessments strictly grounded in the precomputed budget engine metrics.

---

## 12. Success Metrics for the MVP

* **Core Usability (Time to Value)**: Time required for a user to log in and determine their Safe Daily Spend: $\le 3\text{ seconds}$.
* **Transaction Ingestion Friction**: Manual expense entry completed in $\le 10\text{ seconds}$.
* **Calculation Correctness**: $100\%$ precision in budget balance and daily spend calculations across all test scenarios.
* **User Retention Signal**: Weekly Active Users (WAU) logging in at least 3 times per week to check their daily safe spend before making purchases.

---
*SpendWise PRD v1.0 — Architecture Baseline ready for incremental implementation.*
