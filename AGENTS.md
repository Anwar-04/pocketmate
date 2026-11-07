# SpendWise — Persistent Development Instructions for AI Agents (AGENTS.md)

This file contains non-negotiable development rules and persistent operating guidelines for any AI coding agent working on the **SpendWise** codebase.

---

## 1. Documentation & Architecture Alignment
* **Mandatory Context**: Read [`REQUIREMENTS.md`](./REQUIREMENTS.md) and [`ARCHITECTURE.md`](./ARCHITECTURE.md) before writing or modifying any implementation code.
* **Strict Adherence**: Follow approved product requirements and the system architecture. Do not alter core product definitions (e.g. Salary Cycle, Safe Daily Spend formula) without explicit user approval.
* **No Unauthorized Changes**: Do not install new dependencies, alter architecture boundaries, or introduce new libraries/technologies without prior approval.

---

## 2. Code Quality & Strict Typing
* **Language Standard**: Use TypeScript throughout the entire stack with strict type checking enabled (`noImplicitAny`, strict null checks).
* **No `any` Types**: Explicitly type all data structures, API payloads, domain parameters, and component props. Use shared domain types located in `src/types/`.
* **Clean Architecture**: Follow the established directory layout in `src/`. Keep domain calculations, database queries, and presentation components cleanly decoupled.
* **Reusable UI**: Build modular, accessible components using Tailwind CSS and shadcn/ui patterns.
* **UI States**: Always implement loading states, error boundaries, and informative empty states for all views, tables, and data cards.

---

## 3. Data Integrity & Financial Precision
* **Decimal-Safe Financial Arithmetic**: All monetary values in Indian Rupees (₹) must be handled safely against floating-point inaccuracies. Perform calculations using integers (paisa) or rounded/floored decimal-safe utilities.
* **Deterministic Financial Engine**:
  * Math for Flexible Money, Safe Daily Spend, Cycle Dates, Burn Rate, and Leaks must reside exclusively in deterministic TypeScript (`src/lib/financial/`).
  * Never delegate financial arithmetic, balance calculation, or budget limits to an AI/LLM.
* **Database Access**: Use **Prisma ORM** for all database access. Hand-written raw SQL queries are prohibited unless explicitly required and approved.
* **Schema Validation**: Use **Zod** schemas to validate all inputs: API route payloads, CSV import rows, form submissions, and external query parameters.

---

## 4. Security & Data Isolation
* **User-Level Isolation**: Ensure users can only access their own financial records. Every Prisma query and database operation must strictly filter by `where: { userId: session.user.id }`.
* **Zero Credential Leaks**: Never hardcode credentials, API keys, database connection strings, or secrets anywhere in the codebase. All secrets must be loaded via server-side environment variables (`.env`).
* **Authentication & Authorization**: Strictly follow Supabase Auth and session management best practices. Protect private routes and API endpoints via middleware session verification.
* **CSV Import Safeguards**: Validate file size ($\le 2$ MB), file extension, and sanitize row inputs before batch creation.

---

## 5. Development Workflow & Testing
* **Incremental Execution**: Implement features incrementally in small, testable milestones. Explain what each created or edited file does and why it exists.
* **Automated Testing**: Write and maintain tests for critical business logic (e.g., salary cycle date boundaries, safe daily spend arithmetic, leak detectors, CSV normalizer).
* **Pre-Completion Checks**: Always run relevant tests, linter, and TypeScript type checks (`tsc --noEmit` or `npm run build`) before declaring any task complete.
* **Preserve Integrity**: Do not delete existing comments or documentation unrelated to your immediate task.

---
*Follow these instructions on every turn and prompt across the lifetime of the SpendWise project.*
