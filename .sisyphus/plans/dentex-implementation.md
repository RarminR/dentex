# DenteX — Implementation Plan

## TL;DR

> **Quick Summary**: Build a Romanian-language dental distributor platform with smart offer generation. Next.js 15 + PostgreSQL + Prisma + shadcn/ui. Hybrid rule-based scoring + GPT-4o-mini AI insights. TDD throughout.
>
> **Deliverables**:
> - Full CRUD for Products, Clients, Orders with client-specific discount pricing
> - CSV bulk import for products and historical orders
> - One-click smart offer generator (rule-based scoring + AI enhancement)
> - Dashboard and reports (profitability, product performance, slow-movers)
> - Romanian UI throughout
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 5 waves + final review
> **Critical Path**: Task 1 → Task 2 → Task 8/9/10/11 → Task 20/21 → Task 23 → Final

---

## Context

### Original Request
Build a web app for a dental products distributor where sales reps manage clients (with financials), products, orders, and use a "Generate Offer" button that intelligently bundles popular products with slow-movers, tailored per client.

### Interview Summary
**Key Decisions**:
- Single distributor company, all users same role (no permission tiers)
- 1000+ products, 500+ clients — needs robust search/filter/pagination
- Offer engine: Hybrid (rule-based scoring core + GPT-4o-mini AI for Romanian insights)
- Offers: In-app only (no PDF), editable + regeneratable, system decides bundle automatically
- Data: Bulk CSV import for historical data + create new orders going forward
- TVA: Display-only ("+19% TVA" on totals, don't calculate per line item)
- Pricing: Client-specific via per-client discount percentage off universal price
- Language: Romanian UI
- Stack: Next.js 15 + PostgreSQL + Prisma + shadcn/ui + NextAuth.js

### Metis Review — Identified Gaps (addressed)
- **Financial precision**: All money fields use Prisma Decimal — never Float
- **AI resilience**: Offer engine works 100% without AI (graceful degradation)
- **Soft-delete**: Products/clients referenced by orders are soft-deleted, never hard-deleted
- **Price snapshots**: OrderItems and Offers store prices at creation time
- **Authentication strategy**: NextAuth.js with email/password
- **TVA**: Display-only — store prices without TVA, show "+19% TVA" on totals
- **Client pricing**: Per-client `discountPercent` field, effective price = unitPrice × (1 - discount/100)
- **Order creation**: App creates new orders AND imports historical ones

---

## Work Objectives

### Core Objective
Build a production-ready dental distributor management platform with a smart offer generation engine that helps sales reps create targeted product bundles combining anchor products with upsell opportunities.

### Concrete Deliverables
- Next.js 15 web application with Romanian UI
- PostgreSQL database with full schema (Products, Clients, Orders, Offers, Users)
- Authentication system (email/password login)
- Products CRUD with category filtering and search
- Clients CRUD with financial overview and discount pricing
- Orders CRUD with creation flow and payment tracking
- CSV import system for products and historical orders
- Rule-based scoring engine (configurable weights)
- AI enhancement layer (GPT-4o-mini for Romanian insights)
- Offer generation, editing, and regeneration UI
- Dashboard with KPIs and reports
- Settings with offer engine configuration

### Definition of Done
- [ ] All CRUD operations work for Products, Clients, Orders
- [ ] CSV import handles 1000+ products and 10,000+ orders successfully
- [ ] "Generează Ofertă" produces a relevant bundle in < 3 seconds (rule-based)
- [ ] AI insights appear in Romanian within < 8 seconds
- [ ] Offers are editable and regeneratable
- [ ] All tests pass (`npm test`)
- [ ] App builds without errors (`npm run build`)

### Must Have
- Prisma Decimal for ALL money fields (never Float or number)
- Price snapshots in OrderItems and Offers (immutable after creation)
- Soft-delete for Products and Clients (isActive flag)
- AI graceful degradation (offers work 100% without AI)
- UTF-8 encoding throughout (Romanian diacritics: ă, â, î, ș, ț)
- Zod validation on all form inputs, CSV rows, and AI responses
- Server-side pagination for all list views (1000+ items)
- Responsive design (works on tablet, desktop)

### Must NOT Have (Guardrails)
- ❌ PDF export of offers
- ❌ Client-facing portal
- ❌ Multi-language support (Romanian only)
- ❌ Multi-tenant / SaaS features
- ❌ Email/notification system
- ❌ External ERP/CRM integrations
- ❌ Product images/photos
- ❌ Approval workflows
- ❌ Discount management on individual offer lines (use client discount %)
- ❌ Advanced charts (Recharts/Chart.js) — table-based reports only
- ❌ `@db.Money` Prisma native type (documented limitations)
- ❌ Float or JavaScript number for money calculations
- ❌ Storing redundant calculated fields — EXCEPT: `Order.totalAmount` and `OrderItem.totalPrice` are stored as **price snapshots** (needed for historical accuracy since product prices and client discounts change over time). These are set once at creation and never recalculated.

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: TDD (test-first)
- **Framework**: Vitest (fast, ESM-native, works well with Next.js)
- **If TDD**: Each task follows RED (failing test) → GREEN (minimal impl) → REFACTOR

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

| Deliverable Type | Verification Tool | Method |
|------------------|-------------------|--------|
| Frontend/UI | Playwright (playwright skill) | Navigate, interact, assert DOM, screenshot |
| API/Backend | Bash (curl) | Send requests, assert status + response fields |
| Database | Bash (prisma studio / psql) | Query data, verify schema |
| Algorithm | Vitest | Deterministic test data, assert scoring output |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Foundation — all start immediately):
├── Task 1:  Project initialization + config                [quick]
├── Task 2:  Database schema + Prisma + seed                [quick]
├── Task 3:  Authentication (NextAuth.js)                   [quick]
├── Task 4:  App layout + Romanian sidebar navigation       [visual-engineering]
├── Task 5:  Shared UI components (DataTable, forms, cards) [visual-engineering]
├── Task 6:  Offer engine types + interfaces                [quick]
└── Task 7:  Test infrastructure (Vitest + utilities)       [quick]

Wave 2 (Core CRUD — after Wave 1):
├── Task 8:  Products module (CRUD + search + filter)       [unspecified-high]
├── Task 9:  Clients module (CRUD + financials + discount)  [unspecified-high]
├── Task 10: Orders list + detail + filter                  [unspecified-high]
├── Task 11: Order creation flow                            [unspecified-high]
├── Task 12: CSV import engine (parser + validation)        [deep]
└── Task 13: Server actions + API utilities                 [quick]

Wave 3 (Data + Intelligence — after Wave 2):
├── Task 14: CSV import — products                          [unspecified-high]
├── Task 15: CSV import — orders                            [unspecified-high]
├── Task 16: Reports — client profitability                 [unspecified-high]
├── Task 17: Reports — product performance + slow-movers    [unspecified-high]
├── Task 18: Dashboard (KPIs, top clients, slow-movers)     [visual-engineering]
└── Task 19: Settings page (account + offer engine config)  [unspecified-high]

Wave 4 (The Star Feature — after Wave 3):
├── Task 20: Offer engine — scorer (rule-based algorithm)   [deep]
├── Task 21: Offer engine — bundler (anchor/upsell/diversity) [deep]
├── Task 22: AI enhancer (GPT-4o-mini Romanian insights)    [deep]
└── Task 23: Offer UI + flow (generate, edit, regenerate)   [visual-engineering]

Wave 5 (Integration + QA — after Wave 4):
├── Task 24: Integration testing (cross-module flows)       [deep]
├── Task 25: E2E QA (Playwright full journeys)              [unspecified-high]
└── Task 26: Performance + build verification               [unspecified-high]

Wave FINAL (Independent review — 4 parallel):
├── Task F1: Plan compliance audit                          [oracle]
├── Task F2: Code quality review                            [unspecified-high]
├── Task F3: Real manual QA                                 [unspecified-high]
└── Task F4: Scope fidelity check                           [deep]

Critical Path: T1 → T2 → T8/T9 → T11 → T20 → T21 → T23 → T24 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 7 (Wave 1)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2-7 | 1 |
| 2 | 1 | 8-15, 20-21 | 1 |
| 3 | 1 | 8-11 | 1 |
| 4 | 1 | 8-11, 18, 23 | 1 |
| 5 | 1 | 8-11, 14-19, 23 | 1 |
| 6 | 1 | 20-22 | 1 |
| 7 | 1 | 8-26 | 1 |
| 8 | 2, 3, 4, 5, 7 | 11, 14, 17 | 2 |
| 9 | 2, 3, 4, 5, 7 | 11, 15, 16 | 2 |
| 10 | 2, 3, 4, 5, 7 | 15 | 2 |
| 11 | 8, 9 | 15, 20 | 2 |
| 12 | 2, 7 | 14, 15 | 2 |
| 13 | 2, 3, 7 | 8-11 | 2 |
| 14 | 8, 12 | 17, 18 | 3 |
| 15 | 9, 10, 12 | 16, 18, 20 | 3 |
| 16 | 9, 15 | 18 | 3 |
| 17 | 8, 14 | 18 | 3 |
| 18 | 14, 15, 16, 17 | — | 3 |
| 19 | 2, 4, 5 | 20 | 3 |
| 20 | 6, 15, 19 | 21 | 4 |
| 21 | 20 | 22, 23 | 4 |
| 22 | 6, 21 | 23 | 4 |
| 23 | 4, 5, 21, 22 | 24, 25 | 4 |
| 24 | 23 | F1-F4 | 5 |
| 25 | 23 | F1-F4 | 5 |
| 26 | 23 | F1-F4 | 5 |
| F1-F4 | 24-26 | — | FINAL |

### Agent Dispatch Summary

| Wave | # Parallel | Tasks → Agent Category |
|------|-----------|----------------------|
| 1 | **7** | T1 → `quick`, T2 → `quick`, T3 → `quick`, T4 → `visual-engineering`, T5 → `visual-engineering`, T6 → `quick`, T7 → `quick` |
| 2 | **6** | T8-T11 → `unspecified-high`, T12 → `deep`, T13 → `quick` |
| 3 | **6** | T14-T17 → `unspecified-high`, T18 → `visual-engineering`, T19 → `unspecified-high` |
| 4 | **4** | T20-T22 → `deep`, T23 → `visual-engineering` |
| 5 | **3** | T24 → `deep`, T25-T26 → `unspecified-high` |
| FINAL | **4** | F1 → `oracle`, F2-F3 → `unspecified-high`, F4 → `deep` |

---

## TODOs

---

- [ ] 1. Project Initialization + Configuration

  **What to do**:
  - Initialize Next.js 15 project with App Router, TypeScript, Tailwind CSS, ESLint
  - Install and configure shadcn/ui (use `npx shadcn@latest init`)
  - Install core dependencies: `prisma`, `@prisma/client`, `next-auth`, `zod`, `openai`, `papaparse` (CSV parsing), `decimal.js`
  - Set up project directory structure matching the design (see below)
  - Create `.env.example` with all required environment variables
  - Create `.env` with placeholder values for local development
  - Configure TypeScript strict mode
  - Set up path aliases (`@/` for `src/`)

  **Directory structure to create**:
  ```
  src/
  ├── app/(auth)/login/
  ├── app/(dashboard)/dashboard/
  ├── app/(dashboard)/clients/
  ├── app/(dashboard)/products/
  ├── app/(dashboard)/orders/
  ├── app/(dashboard)/reports/
  ├── app/(dashboard)/settings/
  ├── app/(dashboard)/offers/
  ├── app/api/
  ├── components/ui/
  ├── components/layout/
  ├── components/clients/
  ├── components/products/
  ├── components/orders/
  ├── components/offers/
  ├── lib/engine/
  ├── lib/utils/
  ├── lib/actions/
  ├── lib/validations/
  └── prisma/
  ```

  **Environment variables** (`.env.example`):
  ```
  DATABASE_URL=postgresql://...
  NEXTAUTH_SECRET=...
  NEXTAUTH_URL=http://localhost:3000
  OPENAI_API_KEY=sk-...
  ```

  **Must NOT do**:
  - Do NOT add any component code — just scaffolding
  - Do NOT configure database connection yet (Task 2)
  - Do NOT install chart libraries (Recharts, Chart.js, etc.)
  - Do NOT add any i18n library — we use plain Romanian string constants

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard project scaffolding with well-known tools
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: shadcn/ui initialization and Tailwind config

  **Parallelization**:
  - **Can Run In Parallel**: NO (first task — everything depends on it)
  - **Parallel Group**: Wave 1 (starts first, others wait)
  - **Blocks**: Tasks 2-7
  - **Blocked By**: None

  **References**:
  - Design doc: `.sisyphus/plans/2026-02-18-dentex-design.md` — full project specification
  - shadcn/ui init: `npx shadcn@latest init` — follow prompts for New York style, CSS variables

  **Acceptance Criteria**:
  - [ ] `npm run dev` starts without errors on localhost:3000
  - [ ] `npm run build` completes without errors
  - [ ] TypeScript strict mode enabled in `tsconfig.json`
  - [ ] All directories from structure above exist
  - [ ] `.env.example` contains all required variables

  **QA Scenarios**:
  ```
  Scenario: Dev server starts cleanly
    Tool: Bash
    Preconditions: npm install completed
    Steps:
      1. Run: npm run dev (background, wait 5s)
      2. curl http://localhost:3000 — assert HTTP 200
      3. Kill dev server
    Expected Result: 200 response, no console errors
    Evidence: .sisyphus/evidence/task-1-dev-server.txt

  Scenario: Build succeeds
    Tool: Bash
    Preconditions: Project initialized
    Steps:
      1. Run: npm run build
      2. Assert exit code 0
      3. Assert .next/ directory exists
    Expected Result: Build completes with exit 0
    Evidence: .sisyphus/evidence/task-1-build.txt
  ```

  **Commit**: YES
  - Message: `feat: initialize Next.js 15 project with Tailwind + shadcn/ui`
  - Files: all scaffolding files
  - Pre-commit: `npm run build`

---

- [ ] 2. Database Schema + Prisma + Seed Data

  **What to do**:
  - Initialize Prisma: `npx prisma init`
  - Define complete schema in `prisma/schema.prisma` with ALL models:
    - **User**: id, email, passwordHash, name, createdAt
    - **Product**: id, name, sku (unique), category, description, unitPrice (Decimal), costPrice (Decimal), stockQty, isActive (default true), createdAt, updatedAt
    - **Client**: id, companyName, contactPerson, email, phone, address, city, creditLimit (Decimal), paymentTermsDays (default 30), discountPercent (Decimal, default 0), notes, isActive (default true), createdAt, updatedAt
    - **Order**: id, clientId (FK), orderDate, totalAmount (Decimal), status (enum: PENDING/DELIVERED/CANCELLED), paidAmount (Decimal), isPaid (default false), notes, createdAt
    - **OrderItem**: id, orderId (FK), productId (FK), quantity, unitPrice (Decimal — snapshot at order time), discount (Decimal — client discount % at order time), totalPrice (Decimal), createdAt
    - **Offer**: id, clientId (FK), generatedAt, items (Json), aiInsight (nullable String), isEdited (default false), engineConfig (Json), createdAt
  - **CRITICAL**: All price/money fields MUST use `Decimal` type, NEVER `Float`
  - Add indexes: Product.sku (unique), Product.category, Client.city, Order.clientId, Order.orderDate, OrderItem.orderId, OrderItem.productId
  - Create seed script (`prisma/seed.ts`) with:
    - 2 test users
    - 15-20 products across 4 categories (Materiale Compozite, Instrumente, Consumabile, Implanturi)
    - 5-8 test clients with varying discount percentages
    - 20-30 historical orders with order items
    - Use realistic Romanian dental product names
  - Run `npx prisma migrate dev --name init` to create migration
  - Run `npx prisma db seed` to populate test data

  **Must NOT do**:
  - Do NOT use `Float` for any money field — Decimal only
  - Do NOT use `@db.Money` native type (Prisma limitation)
  - Do NOT add computed fields — derive margins and totals in application code
  - Do NOT add product images/photo fields

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Schema definition is straightforward with clear specs
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3-7, after Task 1)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 8-15, 20-21
  - **Blocked By**: Task 1

  **References**:
  - Design doc data model: `.sisyphus/plans/2026-02-18-dentex-design.md` — "Data Model" section
  - Prisma Decimal docs: Use `@db.Decimal(10,2)` for prices, `@db.Decimal(5,2)` for percentages

  **Acceptance Criteria**:
  - [ ] `npx prisma migrate dev` runs without errors
  - [ ] `npx prisma db seed` populates test data
  - [ ] `npx prisma studio` opens and shows all tables with data
  - [ ] ALL money fields are Decimal type (grep schema for `Float` → 0 results)
  - [ ] Test: seed data has products with realistic prices, clients with discount percentages

  **QA Scenarios**:
  ```
  Scenario: Schema creates all tables correctly
    Tool: Bash
    Steps:
      1. Run: npx prisma migrate dev --name init
      2. Assert exit code 0
      3. Run: npx prisma db seed
      4. Assert exit code 0
      5. Query: SELECT COUNT(*) FROM "Product" — assert > 10
      6. Query: SELECT COUNT(*) FROM "Client" — assert > 4
      7. Query: SELECT COUNT(*) FROM "Order" — assert > 15
    Expected Result: All tables created, seed data populated
    Evidence: .sisyphus/evidence/task-2-schema.txt

  Scenario: No Float types in schema
    Tool: Bash
    Steps:
      1. grep -c "Float" prisma/schema.prisma
      2. Assert output is 0
    Expected Result: Zero Float fields — all money uses Decimal
    Evidence: .sisyphus/evidence/task-2-no-floats.txt
  ```

  **Commit**: YES
  - Message: `feat: add Prisma schema with all models + seed data`
  - Files: `prisma/schema.prisma`, `prisma/seed.ts`, `prisma/migrations/`
  - Pre-commit: `npx prisma validate`

---

- [ ] 3. Authentication (NextAuth.js)

  **What to do**:
  - Install `next-auth@beta` (v5 for App Router compatibility)
  - Create `src/lib/auth.ts` — NextAuth config with Credentials provider (email + password)
  - Create `src/app/api/auth/[...nextauth]/route.ts` — auth API route
  - Use bcrypt for password hashing (install `bcryptjs` + `@types/bcryptjs`)
  - Create login page at `src/app/(auth)/login/page.tsx` — simple Romanian form:
    - "Autentificare" (title)
    - "Email" + "Parolă" fields
    - "Intră în cont" button
  - Create auth middleware (`src/middleware.ts`) — redirect unauthenticated users to /login
  - Protect all `(dashboard)` routes behind authentication
  - Session strategy: JWT (simpler, no session table needed)
  - Add initial user creation in seed (password: hashed "admin123")

  **Must NOT do**:
  - Do NOT build registration flow (users are created by admin/seed)
  - Do NOT build password reset flow
  - Do NOT add OAuth providers (Google, GitHub, etc.)
  - Do NOT add role-based permissions — all users equal

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard NextAuth.js setup with Credentials provider
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 4-7)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 8-11
  - **Blocked By**: Task 1

  **References**:
  - NextAuth.js v5 docs for App Router setup
  - Login form labels: "Autentificare", "Email", "Parolă", "Intră în cont"

  **Acceptance Criteria**:
  - [ ] Unauthenticated user visiting /dashboard is redirected to /login
  - [ ] Login with correct credentials → redirect to /dashboard
  - [ ] Login with wrong credentials → error message in Romanian
  - [ ] Session persists across page refreshes (JWT cookie)

  **QA Scenarios**:
  ```
  Scenario: Login with valid credentials
    Tool: Playwright
    Steps:
      1. Navigate to http://localhost:3000/dashboard
      2. Assert redirected to /login
      3. Fill input[name="email"] with "admin@dentex.ro"
      4. Fill input[name="password"] with "admin123"
      5. Click button containing "Intră în cont"
      6. Assert URL contains /dashboard
      7. Screenshot
    Expected Result: Successful login, redirected to dashboard
    Evidence: .sisyphus/evidence/task-3-login-success.png

  Scenario: Login with invalid credentials
    Tool: Playwright
    Steps:
      1. Navigate to /login
      2. Fill email "admin@dentex.ro", password "wrong"
      3. Click login button
      4. Assert error text visible containing "greșit" or "incorect"
    Expected Result: Error message displayed, stays on login page
    Evidence: .sisyphus/evidence/task-3-login-error.png
  ```

  **Commit**: YES
  - Message: `feat: add NextAuth.js authentication with login page`
  - Files: `src/lib/auth.ts`, `src/middleware.ts`, `src/app/(auth)/login/`, `src/app/api/auth/`
  - Pre-commit: `npm run build`

---

- [ ] 4. App Layout + Romanian Sidebar Navigation

  **What to do**:
  - Create `src/app/(dashboard)/layout.tsx` — authenticated layout with sidebar + main content area
  - Create `src/components/layout/Sidebar.tsx` — fixed sidebar with Romanian navigation:
    - 📊 Panou Principal → /dashboard
    - 👥 Clienți → /clients
    - 📦 Produse → /products
    - 📋 Comenzi → /orders
    - 📈 Rapoarte → /reports
    - ⚙️ Setări → /settings
  - Create `src/components/layout/Header.tsx` — top header with:
    - Page title (dynamic based on route)
    - User name display
    - "Deconectare" (logout) button
  - Create `src/components/layout/PageWrapper.tsx` — standard page wrapper with title + breadcrumbs
  - Active nav item highlighted
  - Responsive: sidebar collapses to hamburger menu on mobile/tablet
  - All text in Romanian — create `src/lib/constants/ro.ts` with all UI strings

  **Must NOT do**:
  - Do NOT use any i18n library (just Romanian constants file)
  - Do NOT add page content — just layout shell
  - Do NOT add dark mode

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Layout, navigation, responsive design work
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Professional sidebar layout with shadcn/ui components

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 3, 5-7)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 8-11, 18, 23
  - **Blocked By**: Task 1

  **References**:
  - Design doc module structure: `.sisyphus/plans/2026-02-18-dentex-design.md` — "App Structure & Modules"
  - shadcn/ui sidebar component patterns

  **Acceptance Criteria**:
  - [ ] Sidebar renders with all 6 Romanian navigation items
  - [ ] Active page is highlighted in sidebar
  - [ ] Clicking nav items routes to correct pages
  - [ ] Layout is responsive (sidebar collapses on < 768px)
  - [ ] Logout button works and redirects to /login

  **QA Scenarios**:
  ```
  Scenario: Sidebar navigation works
    Tool: Playwright
    Steps:
      1. Login, navigate to /dashboard
      2. Assert sidebar visible with all 6 nav items
      3. Click "Clienți" link
      4. Assert URL is /clients
      5. Assert "Clienți" nav item is highlighted
      6. Screenshot
    Expected Result: Navigation works, active state visible
    Evidence: .sisyphus/evidence/task-4-sidebar.png

  Scenario: Responsive sidebar collapse
    Tool: Playwright
    Steps:
      1. Set viewport to 768x1024 (tablet)
      2. Assert sidebar is collapsed or hamburger visible
      3. Screenshot
    Expected Result: Sidebar adapts to small viewport
    Evidence: .sisyphus/evidence/task-4-responsive.png
  ```

  **Commit**: YES
  - Message: `feat: add app layout with Romanian sidebar navigation`
  - Files: `src/app/(dashboard)/layout.tsx`, `src/components/layout/`, `src/lib/constants/ro.ts`
  - Pre-commit: `npm run build`

---

- [ ] 5. Shared UI Components (DataTable, Forms, Cards)

  **What to do**:
  - Install shadcn/ui components: `button`, `input`, `table`, `card`, `dialog`, `form`, `select`, `badge`, `toast`, `dropdown-menu`, `separator`, `skeleton`, `label`, `textarea`, `popover`, `command`
  - Create `src/components/ui/DataTable.tsx` — reusable server-side paginated table:
    - Column definitions, sorting, filtering
    - Server-side pagination (page, pageSize, total)
    - Search input integrated
    - Romanian labels: "Anterior" / "Următorul" for pagination, "Caută..." for search
  - Create `src/components/ui/StatCard.tsx` — KPI card (label, value, optional trend)
  - Create `src/components/ui/SearchInput.tsx` — debounced search input with URL params
  - Create `src/components/ui/ConfirmDialog.tsx` — Romanian confirmation dialog ("Ești sigur?", "Da" / "Anulează")
  - Create `src/components/ui/FormField.tsx` — consistent form field wrapper with label + error
  - Create `src/components/ui/EmptyState.tsx` — "Nu există date" (no data) placeholder
  - Create `src/components/ui/LoadingSkeleton.tsx` — skeleton loading states
  - Create `src/lib/utils/format.ts`:
    - `formatCurrency(amount: Decimal): string` → "1.234,56 RON" (Romanian format)
    - `formatDate(date: Date): string` → "18 feb. 2026" (Romanian short date)
    - `formatPercent(value: Decimal): string` → "19,5%"
    - `calculateWithTVA(amount: Decimal): { net: Decimal, tva: Decimal, total: Decimal }` — for display only
  - All components use Romanian labels

  **Must NOT do**:
  - Do NOT add chart components
  - Do NOT build module-specific components (those go in Tasks 8-11)
  - Do NOT implement client-side pagination — server-side only

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component library creation
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Component design with shadcn/ui, consistent styling

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2-4, 6-7)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 8-19, 23
  - **Blocked By**: Task 1

  **References**:
  - shadcn/ui DataTable recipe for server-side pagination
  - Romanian number format: decimal comma, period for thousands (1.234,56)
  - Romanian date format: DD MMM. YYYY with Romanian month abbreviations

  **Acceptance Criteria**:
  - [ ] DataTable renders with columns, pagination, and search
  - [ ] StatCard displays label + formatted value
  - [ ] `formatCurrency(1234.56)` returns "1.234,56 RON"
  - [ ] `calculateWithTVA(100)` returns { net: 100, tva: 19, total: 119 }
  - [ ] All components use Romanian labels

  **QA Scenarios**:
  ```
  Scenario: Format utilities work correctly
    Tool: Bash (Vitest)
    Steps:
      1. Run: npx vitest run src/lib/utils/format.test.ts
      2. Assert tests pass for: currency formatting, date formatting, TVA calculation
    Expected Result: All format tests pass
    Evidence: .sisyphus/evidence/task-5-format-tests.txt

  Scenario: DataTable renders with pagination
    Tool: Playwright
    Steps:
      1. Navigate to any page using DataTable (after Wave 2)
      2. Assert table header renders
      3. Assert pagination controls visible with Romanian labels
      4. Screenshot
    Expected Result: Table renders correctly
    Evidence: .sisyphus/evidence/task-5-datatable.png
  ```

  **Commit**: YES
  - Message: `feat: add shared UI components and Romanian format utilities`
  - Files: `src/components/ui/`, `src/lib/utils/format.ts`
  - Pre-commit: `npm run build`

---

- [ ] 6. Offer Engine Types + Interfaces

  **What to do**:
  - Create `src/lib/engine/types.ts` with all type definitions:
    ```typescript
    // Scoring weights (configurable)
    interface ScoringWeights {
      clientFrequency: number      // w1 — default 0.30
      globalPopularity: number     // w2 — default 0.20
      margin: number               // w3 — default 0.25
      recency: number              // w4 — default 0.15
      slowMoverPush: number        // w5 — default 0.10
    }

    // Engine configuration
    interface EngineConfig {
      weights: ScoringWeights
      anchorRatio: number          // default 0.60 (60% anchors)
      minBundleSize: number        // default 5
      maxBundleSize: number        // default 15
      maxCategoryPercent: number   // default 0.40 (no category > 40%)
      scoringTimeframeDays: number // default 365 (look back 1 year)
    }

    // Scored product for a specific client
    interface ScoredProduct {
      productId: string
      name: string
      category: string
      unitPrice: Decimal
      effectivePrice: Decimal      // after client discount
      marginPercent: Decimal
      compositeScore: number
      scoreBreakdown: {
        clientFrequency: number
        globalPopularity: number
        margin: number
        recency: number
        slowMoverPush: number
      }
      role: 'anchor' | 'upsell'
    }

    // Generated offer
    interface GeneratedOffer {
      clientId: string
      items: ScoredProduct[]
      totalValue: Decimal
      totalMargin: Decimal
      anchorCount: number
      upsellCount: number
      engineConfig: EngineConfig    // snapshot of config used
      aiInsight?: string            // from GPT-4o-mini (nullable)
    }
    ```
  - Create `src/lib/engine/defaults.ts` — default engine configuration values
  - Create `src/lib/engine/index.ts` — barrel export

  **Must NOT do**:
  - Do NOT implement any algorithm logic — just types
  - Do NOT import Prisma models — keep engine types independent

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Type definitions only, no logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2-5, 7)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 20-22
  - **Blocked By**: Task 1

  **References**:
  - Design doc offer engine: `.sisyphus/plans/2026-02-18-dentex-design.md` — "Offer Engine" section
  - Scoring formula with 5 weights documented in design

  **Acceptance Criteria**:
  - [ ] All types exported from `src/lib/engine/index.ts`
  - [ ] Default config values match design (w1=0.30, w2=0.20, w3=0.25, w4=0.15, w5=0.10)
  - [ ] Types compile without errors: `npx tsc --noEmit`

  **QA Scenarios**:
  ```
  Scenario: Types compile correctly
    Tool: Bash
    Steps:
      1. Run: npx tsc --noEmit
      2. Assert exit code 0
    Expected Result: No type errors
    Evidence: .sisyphus/evidence/task-6-types.txt
  ```

  **Commit**: YES
  - Message: `feat: define offer engine types and interfaces`
  - Files: `src/lib/engine/types.ts`, `src/lib/engine/defaults.ts`, `src/lib/engine/index.ts`
  - Pre-commit: `npx tsc --noEmit`

---

- [ ] 7. Test Infrastructure (Vitest + Utilities)

  **What to do**:
  - Install: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitejs/plugin-react`, `jsdom`
  - Create `vitest.config.ts` — configured for Next.js (jsdom environment, path aliases, coverage)
  - Create `src/test/setup.ts` — test setup file with jest-dom matchers
  - Create `src/test/helpers.ts` — test utilities:
    - `createMockProduct(overrides?)` — generates test product with realistic defaults
    - `createMockClient(overrides?)` — generates test client with defaults
    - `createMockOrder(overrides?)` — generates test order
    - `createMockOrderItems(orderId, products[])` — generates order items
  - Create `src/test/db.ts` — test database utilities (clean DB between tests)
  - Add `test` script to `package.json`: `"test": "vitest run"`, `"test:watch": "vitest"`
  - Write one example test to verify setup works:
    - Test `formatCurrency` from Task 5 (or create placeholder)

  **Must NOT do**:
  - Do NOT install Playwright yet (Task 25)
  - Do NOT write module-specific tests (those are in each module's task)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard Vitest setup
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2-6)
  - **Parallel Group**: Wave 1
  - **Blocks**: Tasks 8-26 (all tasks write tests)
  - **Blocked By**: Task 1

  **References**:
  - Vitest docs for Next.js configuration
  - @testing-library/react for component tests

  **Acceptance Criteria**:
  - [ ] `npm test` runs and passes (at least 1 test)
  - [ ] Mock helpers create valid test data
  - [ ] Path aliases work in test files

  **QA Scenarios**:
  ```
  Scenario: Test suite runs successfully
    Tool: Bash
    Steps:
      1. Run: npm test
      2. Assert exit code 0
      3. Assert output contains "1 passed" (or more)
    Expected Result: Test suite functional
    Evidence: .sisyphus/evidence/task-7-tests.txt
  ```

  **Commit**: YES
  - Message: `feat: add Vitest test infrastructure with mock helpers`
  - Files: `vitest.config.ts`, `src/test/`, `package.json`
  - Pre-commit: `npm test`

---

- [ ] 8. Products Module (CRUD + Search + Filter)

  **What to do**:
  - Create `src/lib/validations/product.ts` — Zod schemas for product create/edit:
    - name (required, max 255), sku (required, unique, max 100), category (required, enum of categories)
    - unitPrice (required, positive Decimal), costPrice (required, positive Decimal)
    - stockQty (required, non-negative integer), description (optional text)
  - Create `src/lib/actions/products.ts` — server actions:
    - `getProducts(params: { page, pageSize, search, category })` — paginated list with search + category filter
    - `getProduct(id)` — single product with sales statistics
    - `createProduct(data)` — create with Zod validation
    - `updateProduct(id, data)` — update with validation
    - `deactivateProduct(id)` — soft-delete (set isActive = false), reject if has orders
  - Create `src/app/(dashboard)/products/page.tsx` — product list page:
    - DataTable with columns: Nume, SKU, Categorie, Preț Vânzare, Preț Achiziție, Marjă %, Stoc, Status
    - Search by name/SKU
    - Filter by category dropdown
    - "Adaugă Produs" button → add form
  - Create `src/app/(dashboard)/products/[id]/page.tsx` — product detail page:
    - Product info card
    - Sales statistics: total units sold, unique clients, avg monthly orders
    - "Editează" button → edit form
    - "Dezactivează" button (soft-delete) with confirmation dialog
  - Create `src/app/(dashboard)/products/new/page.tsx` — add product form
  - Create `src/components/products/ProductForm.tsx` — shared create/edit form component
  - Write tests for: product validation, getProducts pagination, create/update actions

  **Must NOT do**:
  - Do NOT add product image upload
  - Do NOT add CSV import (Task 14)
  - Do NOT hard-delete products

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Full CRUD module with multiple pages, server actions, and tests
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Data table layout, form design

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 9, 10, 12, 13)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 11, 14, 17
  - **Blocked By**: Tasks 2, 3, 4, 5, 7

  **References**:
  - Design doc: `.sisyphus/plans/2026-02-18-dentex-design.md` — "Produse (Products)" section
  - DataTable component from Task 5
  - Prisma Product model from Task 2
  - Romanian labels: Produse, Nume, Preț Vânzare, Preț Achiziție, Marjă, Stoc, Categorie, Adaugă Produs, Editează, Dezactivează

  **Acceptance Criteria**:
  - [ ] Product list renders with all columns, pagination, search, category filter
  - [ ] Create product → appears in list
  - [ ] Edit product → changes persist
  - [ ] Deactivate product → marked inactive, still visible in historical orders
  - [ ] Prices displayed in Romanian format (1.234,56 RON)
  - [ ] Tests pass: `npx vitest run src/lib/actions/products.test.ts`

  **QA Scenarios**:
  ```
  Scenario: Create and view a product
    Tool: Playwright
    Steps:
      1. Login, navigate to /products
      2. Click "Adaugă Produs" button
      3. Fill: Nume="Test Compozit", SKU="TC001", Categorie="Materiale Compozite"
      4. Fill: Preț Vânzare="150.00", Preț Achiziție="90.00", Stoc="100"
      5. Submit form
      6. Assert redirected to product list
      7. Assert "Test Compozit" appears in table
      8. Click on "Test Compozit" row
      9. Assert detail page shows all entered data
      10. Assert margin displays "40,00%"
    Expected Result: Product created and displayed correctly
    Evidence: .sisyphus/evidence/task-8-create-product.png

  Scenario: Search and filter products
    Tool: Playwright
    Steps:
      1. Navigate to /products
      2. Type "compozit" in search input
      3. Assert table shows only products matching search
      4. Clear search, select "Instrumente" category filter
      5. Assert table shows only Instrumente products
    Expected Result: Search and filter work correctly
    Evidence: .sisyphus/evidence/task-8-search-filter.png

  Scenario: Deactivate product
    Tool: Playwright
    Steps:
      1. Navigate to product detail page
      2. Click "Dezactivează"
      3. Assert confirmation dialog appears
      4. Click "Da" to confirm
      5. Assert product shows "Inactiv" badge
    Expected Result: Product soft-deleted successfully
    Evidence: .sisyphus/evidence/task-8-deactivate.png
  ```

  **Commit**: YES
  - Message: `feat: add Products module with CRUD, search, and filtering`
  - Files: `src/app/(dashboard)/products/`, `src/lib/actions/products.ts`, `src/lib/validations/product.ts`, `src/components/products/`
  - Pre-commit: `npm test && npm run build`

---

- [ ] 9. Clients Module (CRUD + Financials + Discount)

  **What to do**:
  - Create `src/lib/validations/client.ts` — Zod schemas:
    - companyName (required), contactPerson (required), email (email format), phone (optional)
    - address (optional), city (optional), creditLimit (positive Decimal), paymentTermsDays (positive int)
    - discountPercent (Decimal 0-100, default 0), notes (optional text)
  - Create `src/lib/actions/clients.ts` — server actions:
    - `getClients(params: { page, pageSize, search, city })` — paginated list with search + city filter
    - `getClient(id)` — single client with computed financials
    - `getClientFinancials(id)` — computed from orders: totalSpent, totalPaid, outstandingBalance, avgOrderValue, totalOrders, profitabilityMargin
    - `createClient(data)` — create with validation
    - `updateClient(id, data)` — update
    - `deactivateClient(id)` — soft-delete
  - Create client pages:
    - `src/app/(dashboard)/clients/page.tsx` — list with DataTable
      - Columns: Companie, Contact, Oraș, Discount %, Total Comenzi, Sold Restant, Status
    - `src/app/(dashboard)/clients/[id]/page.tsx` — detail page:
      - Client info card (editable)
      - **Financial summary cards**: Total Cheltuit, Sold Restant, Valoare Medie Comandă, Marjă Profitabilitate
      - **Order history table** (last orders for this client)
      - **🔥 "Generează Ofertă" button** (links to offer generation — implemented in Task 23)
    - `src/app/(dashboard)/clients/new/page.tsx` — add client form
  - Create `src/components/clients/ClientForm.tsx` — shared form component
  - Create `src/components/clients/FinancialSummary.tsx` — financial cards component
  - Write tests for: client validation, financials computation, CRUD actions

  **Must NOT do**:
  - Do NOT implement offer generation (Task 23) — just place the button
  - Do NOT build client-facing features
  - Do NOT hard-delete clients

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Full CRUD + financial computations
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Financial cards, data-dense detail page layout

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 10, 12, 13)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 11, 15, 16
  - **Blocked By**: Tasks 2, 3, 4, 5, 7

  **References**:
  - Design doc: `.sisyphus/plans/2026-02-18-dentex-design.md` — "Clienți (Clients)" section
  - Financial computations derive from Order + OrderItem tables
  - Romanian labels: Clienți, Companie, Contact, Oraș, Discount, Total Cheltuit, Sold Restant, Marjă Profitabilitate, Generează Ofertă

  **Acceptance Criteria**:
  - [ ] Client list renders with all columns and pagination
  - [ ] Client detail shows financial summary cards with correct computed values
  - [ ] Client discount percentage stored and displayed correctly
  - [ ] "Generează Ofertă" button visible on client detail page
  - [ ] Financial values use Romanian currency format
  - [ ] Tests pass for financial computation accuracy

  **QA Scenarios**:
  ```
  Scenario: Create client with discount and view financials
    Tool: Playwright
    Steps:
      1. Login, navigate to /clients/new
      2. Fill: Companie="Clinica Dr. Popescu", Contact="Dr. Ion Popescu"
      3. Fill: Email="popescu@clinica.ro", Oraș="București"
      4. Fill: Discount="15", Limită Credit="50000", Termen Plată="30"
      5. Submit form
      6. Navigate to new client's detail page
      7. Assert financial cards show "0,00 RON" (no orders yet)
      8. Assert discount shows "15%"
      9. Assert "Generează Ofertă" button is visible
    Expected Result: Client created with correct financials display
    Evidence: .sisyphus/evidence/task-9-create-client.png

  Scenario: Client with orders shows correct financials
    Tool: Playwright
    Steps:
      1. Navigate to a seeded client with existing orders (from seed data)
      2. Assert "Total Cheltuit" card shows non-zero value
      3. Assert "Sold Restant" is calculated correctly (total - paid)
      4. Assert order history table shows orders
    Expected Result: Financial summary computed from real order data
    Evidence: .sisyphus/evidence/task-9-financials.png
  ```

  **Commit**: YES
  - Message: `feat: add Clients module with CRUD, financials, and discount pricing`
  - Files: `src/app/(dashboard)/clients/`, `src/lib/actions/clients.ts`, `src/lib/validations/client.ts`, `src/components/clients/`
  - Pre-commit: `npm test && npm run build`

---

- [ ] 10. Orders List + Detail + Filter

  **What to do**:
  - Create `src/lib/actions/orders.ts` — server actions:
    - `getOrders(params: { page, pageSize, search, clientId, status, dateFrom, dateTo })` — paginated list
    - `getOrder(id)` — single order with items + client info
    - `updateOrderPayment(id, paidAmount)` — update payment tracking
  - Create `src/app/(dashboard)/orders/page.tsx` — orders list:
    - DataTable columns: Nr. Comandă, Client, Dată, Total, Status, Plătit, Sold
    - Filters: client search, status dropdown, date range
  - Create `src/app/(dashboard)/orders/[id]/page.tsx` — order detail:
    - Order info (client, date, status)
    - Order items table: Produs, Cantitate, Preț Unitar, Discount Client, Total
    - Payment section: Total Comandă, Plătit, Rest de plată
    - "Marchează Plata" button to update paid amount
    - Display "+19% TVA" on order total (display only, not calculated per item)
  - Write tests for: order filtering, payment update logic

  **Must NOT do**:
  - Do NOT build order creation flow (Task 11)
  - Do NOT calculate TVA per line item — display only on total
  - Do NOT allow editing order items after creation

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: List + detail pages with filtering and payment tracking
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 9, 12, 13)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 2, 3, 4, 5, 7

  **References**:
  - Design doc: `.sisyphus/plans/2026-02-18-dentex-design.md` — "Comenzi (Orders)" section
  - TVA display: Show total + "19% TVA = X RON" + "Total cu TVA = Y RON" at bottom
  - Order statuses: PENDING (În așteptare), DELIVERED (Livrată), CANCELLED (Anulată)

  **Acceptance Criteria**:
  - [ ] Order list shows all columns with correct formatting
  - [ ] Filters by client, status, and date range work
  - [ ] Order detail shows items with per-row totals
  - [ ] TVA line displayed on order total: "Total: 1.000 RON + TVA 19%: 190 RON = 1.190 RON"
  - [ ] Payment update persists and recalculates outstanding balance

  **QA Scenarios**:
  ```
  Scenario: View order with TVA display
    Tool: Playwright
    Steps:
      1. Navigate to a seeded order's detail page
      2. Assert order items table renders with products
      3. Assert total shows "+19% TVA" note
      4. Assert total cu TVA is displayed
      5. Screenshot
    Expected Result: Order detail renders with TVA display
    Evidence: .sisyphus/evidence/task-10-order-detail.png

  Scenario: Filter orders by status
    Tool: Playwright
    Steps:
      1. Navigate to /orders
      2. Select status filter "Livrată"
      3. Assert all visible orders have "Livrată" status badge
    Expected Result: Filter narrows results correctly
    Evidence: .sisyphus/evidence/task-10-filter.png
  ```

  **Commit**: YES
  - Message: `feat: add Orders list and detail with filtering and TVA display`
  - Files: `src/app/(dashboard)/orders/`, `src/lib/actions/orders.ts`, `src/components/orders/`
  - Pre-commit: `npm test && npm run build`

---

- [ ] 11. Order Creation Flow

  **What to do**:
  - Create `src/app/(dashboard)/orders/new/page.tsx` — order creation page:
    - Step 1: Select client (searchable dropdown)
    - Step 2: Add products (searchable product list with quantity input)
      - Show effective price per product: unitPrice × (1 - client.discountPercent / 100)
      - Each row: Product name, Unit Price, Client Price (after discount), Quantity, Row Total
    - Step 3: Review and confirm
      - Show all items, subtotal, TVA note, total
      - "Confirmă Comanda" button
  - Create `src/lib/actions/orders.ts` — add `createOrder(data)`:
    - Validate with Zod: clientId required, at least 1 item, quantities > 0
    - Create Order + OrderItems in a transaction
    - **CRITICAL**: Snapshot unitPrice AND client discount in OrderItem at creation time
    - Calculate totalAmount from items (sum of quantity × effectivePrice)
  - Create `src/components/orders/OrderProductSelector.tsx` — product search + add to order
  - Create `src/components/orders/OrderSummary.tsx` — review before confirm
  - Write tests for: order creation with discount pricing, price snapshot

  **Must NOT do**:
  - Do NOT implement stock checking/reduction
  - Do NOT allow editing orders after creation
  - Do NOT calculate TVA in the backend — just display on frontend

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multi-step form with real-time price calculations
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 8 + 9 for product/client data)
  - **Parallel Group**: Wave 2 (after T8, T9)
  - **Blocks**: Tasks 15, 20
  - **Blocked By**: Tasks 8, 9

  **References**:
  - Client discount formula: effectivePrice = product.unitPrice × (1 - client.discountPercent / 100)
  - Price snapshot: OrderItem stores unitPrice and discount at creation time, never changes
  - Design doc: `.sisyphus/plans/2026-02-18-dentex-design.md` — "Comenzi" section

  **Acceptance Criteria**:
  - [ ] Select client → product prices reflect their discount percentage
  - [ ] Add products → quantities → row totals calculate correctly
  - [ ] Confirm order → Order + OrderItems created in database
  - [ ] OrderItem.unitPrice = product.unitPrice at time of order (not updated if product price changes)
  - [ ] OrderItem.discount = client.discountPercent at time of order
  - [ ] Test: `createOrder` with 10% discount client, verify stored prices

  **QA Scenarios**:
  ```
  Scenario: Create order with client discount pricing
    Tool: Playwright
    Steps:
      1. Navigate to /orders/new
      2. Select a client with 15% discount
      3. Search and add product "Test Compozit" (unitPrice: 150 RON)
      4. Assert effective price shows 127,50 RON (150 × 0.85)
      5. Set quantity to 10
      6. Assert row total shows 1.275,00 RON
      7. Click "Confirmă Comanda"
      8. Assert redirected to order detail
      9. Assert order total is 1.275,00 RON
    Expected Result: Order created with correctly discounted prices
    Evidence: .sisyphus/evidence/task-11-create-order.png

  Scenario: Price snapshot is immutable
    Tool: Bash (Vitest)
    Steps:
      1. Create order for client with 15% discount, product at 150 RON
      2. Change product price to 200 RON
      3. Reload order detail
      4. Assert OrderItem.unitPrice is still 150 RON
    Expected Result: Historical order prices don't change
    Evidence: .sisyphus/evidence/task-11-price-snapshot.txt
  ```

  **Commit**: YES
  - Message: `feat: add order creation flow with client discount pricing`
  - Files: `src/app/(dashboard)/orders/new/`, `src/components/orders/`, `src/lib/actions/orders.ts`
  - Pre-commit: `npm test && npm run build`

---

- [ ] 12. CSV Import Engine (Parser + Validation Framework)

  **What to do**:
  - Create `src/lib/import/parser.ts` — generic CSV parser using papaparse:
    - Accept File upload, detect encoding (UTF-8 required, reject Latin-1)
    - Parse with header row
    - Handle Romanian diacritics (ă, â, î, ș, ț)
    - Handle Romanian date formats (DD.MM.YYYY and DD/MM/YYYY → ISO)
    - Handle Romanian number format (comma decimal: "1.234,56" → 1234.56)
  - Create `src/lib/import/validator.ts` — generic row validation framework:
    - Accept Zod schema per entity type
    - Validate each row, collect errors with row numbers
    - Return: { valid: Row[], errors: { row: number, field: string, message: string }[] }
  - Create `src/lib/import/types.ts` — import result types
  - Create `src/components/import/CsvUploader.tsx` — shared upload component:
    - Drag-and-drop or file picker
    - Romanian labels: "Încarcă fișier CSV", "Trage fișierul aici"
    - Preview first 5 rows before confirming import
    - Show validation errors with row numbers
    - Progress indicator for large files
  - Write tests for:
    - CSV parsing with Romanian diacritics
    - Date format conversion (DD.MM.YYYY → ISO)
    - Number format conversion (1.234,56 → 1234.56)
    - Validation error collection

  **Must NOT do**:
  - Do NOT implement product/order-specific import logic (Tasks 14, 15)
  - Do NOT process files > 10MB (show error)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Encoding detection, format conversion, validation framework — requires careful edge case handling
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8-11, 13)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 14, 15
  - **Blocked By**: Tasks 2, 7

  **References**:
  - papaparse library for CSV parsing
  - Romanian diacritics encoding: UTF-8 BOM detection
  - Romanian date format: DD.MM.YYYY (e.g., "18.02.2026")
  - Romanian number format: period=thousands, comma=decimal (e.g., "1.234,56")

  **Acceptance Criteria**:
  - [ ] Parse CSV with Romanian diacritics correctly
  - [ ] Convert "18.02.2026" → "2026-02-18"
  - [ ] Convert "1.234,56" → 1234.56
  - [ ] Reject non-UTF-8 encoded files with clear error
  - [ ] Validation collects all errors with row numbers
  - [ ] All tests pass

  **QA Scenarios**:
  ```
  Scenario: Parse CSV with Romanian characters
    Tool: Bash (Vitest)
    Steps:
      1. Create test CSV with: "Compozit nanohybrid premium,Materiale Compozite,1.234,56"
      2. Parse with import engine
      3. Assert product name contains "î" or other diacritics
      4. Assert price parsed as 1234.56
    Expected Result: Romanian text and numbers parsed correctly
    Evidence: .sisyphus/evidence/task-12-csv-parse.txt

  Scenario: Validation collects errors
    Tool: Bash (Vitest)
    Steps:
      1. Create CSV with rows: valid, missing required field, invalid price
      2. Validate with product schema
      3. Assert 1 valid row, 2 errors with correct row numbers
    Expected Result: Errors collected with row numbers
    Evidence: .sisyphus/evidence/task-12-validation.txt
  ```

  **Commit**: YES
  - Message: `feat: add CSV import engine with Romanian format support`
  - Files: `src/lib/import/`, `src/components/import/`
  - Pre-commit: `npm test`

---

- [ ] 13. Server Actions + API Utilities

  **What to do**:
  - Create `src/lib/db.ts` — Prisma client singleton (with global caching for dev)
  - Create `src/lib/actions/utils.ts` — shared action utilities:
    - `withAuth(action)` — wrapper that checks authentication
    - `withValidation(schema, action)` — wrapper for Zod validation
    - `paginatedQuery(model, params)` — generic paginated Prisma query helper
    - `handleActionError(error)` — consistent error response formatting
  - Create `src/lib/validations/shared.ts` — shared Zod schemas:
    - `paginationSchema` — page, pageSize, search
    - `idSchema` — UUID validation
    - `decimalSchema` — Decimal string validation
  - Create `src/lib/utils/decimal.ts` — Decimal arithmetic helpers:
    - Using `Prisma.Decimal` or `decimal.js`
    - `calculateMargin(unitPrice, costPrice)` → margin percentage
    - `applyDiscount(price, discountPercent)` → discounted price
    - `sumDecimals(values)` → total
  - Write tests for decimal arithmetic (CRITICAL — verify 0.1 + 0.2 precision)

  **Must NOT do**:
  - Do NOT use regular JavaScript arithmetic for money
  - Do NOT create REST API routes — use Server Actions only

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Utility functions and wrappers
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8-12)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 8-11 (they import these utilities)
  - **Blocked By**: Tasks 2, 3, 7

  **References**:
  - Prisma Decimal handling documentation
  - Next.js Server Actions patterns

  **Acceptance Criteria**:
  - [ ] `applyDiscount(Decimal(150), Decimal(15))` returns Decimal(127.50) exactly
  - [ ] `calculateMargin(Decimal(150), Decimal(90))` returns Decimal(40) (40%)
  - [ ] Decimal precision test: `sum([0.1, 0.2])` equals `0.3` exactly
  - [ ] `paginatedQuery` returns { data, total, page, pageSize }
  - [ ] All tests pass

  **QA Scenarios**:
  ```
  Scenario: Decimal arithmetic precision
    Tool: Bash (Vitest)
    Steps:
      1. Run: npx vitest run src/lib/utils/decimal.test.ts
      2. Assert: applyDiscount(150, 15) === 127.50
      3. Assert: calculateMargin(150, 90) === 40.00
      4. Assert: sum([0.1, 0.2]) === 0.3 (not 0.30000000000000004)
    Expected Result: All decimal tests pass with exact precision
    Evidence: .sisyphus/evidence/task-13-decimal.txt
  ```

  **Commit**: YES
  - Message: `feat: add server action utilities and Decimal arithmetic helpers`
  - Files: `src/lib/db.ts`, `src/lib/actions/utils.ts`, `src/lib/validations/shared.ts`, `src/lib/utils/decimal.ts`
  - Pre-commit: `npm test`

---

- [ ] 14. CSV Import — Products

  **What to do**:
  - Create `src/lib/import/products.ts` — product-specific import logic:
    - Define expected CSV columns: Nume, SKU, Categorie, Preț Vânzare, Preț Achiziție, Stoc, Descriere
    - Map Romanian headers to model fields
    - Zod validation per row (reuse product validation from Task 8)
    - Upsert by SKU (if SKU exists, update; if new, create)
    - Use `Prisma.createMany` with `skipDuplicates` for bulk insert
    - Transaction: all-or-nothing per batch (100 rows per batch)
  - Create `src/app/(dashboard)/products/import/page.tsx` — import page:
    - Use CsvUploader from Task 12
    - Column mapping preview
    - "Importă" button
    - Results summary: X importate, Y actualizate, Z erori
  - Create `src/lib/actions/import.ts` — `importProducts(file)` server action
  - Write tests for: upsert logic, duplicate handling, validation errors

  **Must NOT do**:
  - Do NOT process files > 10MB
  - Do NOT import in background (synchronous for V1)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Import logic with upsert, batching, and validation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 15-19)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 17, 18
  - **Blocked By**: Tasks 8, 12

  **References**:
  - CSV import engine from Task 12 (parser + validator)
  - Product validation schemas from Task 8
  - Expected CSV format: `Nume,SKU,Categorie,Preț Vânzare,Preț Achiziție,Stoc,Descriere`

  **Acceptance Criteria**:
  - [ ] Upload CSV with 100+ products → all imported correctly
  - [ ] Duplicate SKU → product updated (upsert), not duplicated
  - [ ] Invalid rows → shown as errors with row numbers, valid rows still imported
  - [ ] Romanian diacritics in product names preserved
  - [ ] Import summary shows count: imported, updated, errors

  **QA Scenarios**:
  ```
  Scenario: Import products CSV
    Tool: Playwright
    Steps:
      1. Navigate to /products/import
      2. Upload test CSV with 20 products (including 2 duplicates, 1 invalid)
      3. Assert preview shows first 5 rows
      4. Click "Importă"
      5. Assert summary: "17 importate, 2 actualizate, 1 eroare"
      6. Navigate to /products
      7. Assert new products appear in list
    Expected Result: Bulk import with correct upsert behavior
    Evidence: .sisyphus/evidence/task-14-import.png

  Scenario: Reject non-UTF8 file
    Tool: Playwright
    Steps:
      1. Navigate to /products/import
      2. Upload Latin-1 encoded CSV
      3. Assert error message about encoding
    Expected Result: Clear encoding error message
    Evidence: .sisyphus/evidence/task-14-encoding-error.png
  ```

  **Commit**: YES
  - Message: `feat: add CSV product import with upsert and validation`
  - Files: `src/lib/import/products.ts`, `src/app/(dashboard)/products/import/`, `src/lib/actions/import.ts`
  - Pre-commit: `npm test && npm run build`

---

- [ ] 15. CSV Import — Orders

  **What to do**:
  - Create `src/lib/import/orders.ts` — order-specific import logic:
    - Expected CSV columns: Client (companyName), Dată Comandă, Produs (SKU), Cantitate, Preț Unitar, Status, Plătit
    - Match clients by companyName (fuzzy-ish: trim, lowercase compare)
    - Match products by SKU
    - Group rows by order (same client + same date = same order)
    - Handle missing clients/products: log as error, skip row
    - Create Orders + OrderItems in transaction per order
    - Snapshot prices from CSV (historical prices, not current)
  - Create `src/app/(dashboard)/orders/import/page.tsx` — import page
  - Add `importOrders(file)` to server actions
  - Write tests for: client matching, product matching, order grouping, error handling

  **Must NOT do**:
  - Do NOT create clients that don't exist (just error)
  - Do NOT create products that don't exist (just error)
  - Do NOT recalculate prices — use prices from CSV as historical snapshots

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex matching logic and order grouping from flat CSV
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 14, 16-19)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 16, 18, 20
  - **Blocked By**: Tasks 9, 10, 12

  **References**:
  - CSV import engine from Task 12
  - Order/OrderItem models from Task 2
  - Expected format: `Client,Dată Comandă,Produs SKU,Cantitate,Preț Unitar,Status,Plătit`
  - Order grouping: rows with same Client + Dată Comandă → single Order with multiple OrderItems

  **Acceptance Criteria**:
  - [ ] Import CSV with 500+ order rows → orders created with correct items
  - [ ] Multiple items for same client+date grouped into single order
  - [ ] Unmatched client/product → error logged, row skipped
  - [ ] Historical prices from CSV preserved (not current product prices)
  - [ ] Summary: X comenzi create, Y articole, Z erori

  **QA Scenarios**:
  ```
  Scenario: Import historical orders
    Tool: Playwright
    Steps:
      1. Navigate to /orders/import
      2. Upload CSV with 50 order rows (10 distinct orders, 5 items each)
      3. Click "Importă"
      4. Assert summary: "10 comenzi create, 50 articole"
      5. Navigate to /orders
      6. Assert 10 new orders appear
      7. Open one order → assert 5 items with correct historical prices
    Expected Result: Orders imported with correct grouping
    Evidence: .sisyphus/evidence/task-15-import-orders.png

  Scenario: Handle unmatched products
    Tool: Playwright
    Steps:
      1. Upload CSV with row referencing non-existent SKU "FAKE001"
      2. Assert error shown: "Produs cu SKU 'FAKE001' nu a fost găsit (rândul 5)"
    Expected Result: Clear error for unmatched references
    Evidence: .sisyphus/evidence/task-15-unmatched.png
  ```

  **Commit**: YES
  - Message: `feat: add CSV order import with client/product matching`
  - Files: `src/lib/import/orders.ts`, `src/app/(dashboard)/orders/import/`
  - Pre-commit: `npm test && npm run build`

---

- [ ] 16. Reports — Client Profitability

  **What to do**:
  - Create `src/lib/actions/reports.ts` — report queries:
    - `getClientProfitability(params: { dateFrom?, dateTo?, limit? })`:
      - For each client: totalRevenue, totalCost, profit, marginPercent, orderCount
      - Sorted by profitability (highest margin first)
      - Profit = sum(orderItem.totalPrice) - sum(orderItem.quantity × product.costPrice)
  - Create `src/app/(dashboard)/reports/page.tsx` — reports hub page (links to sub-reports)
  - Create `src/app/(dashboard)/reports/profitability/page.tsx`:
    - Table: Client, Total Vânzări, Cost Total, Profit, Marjă %, Nr. Comenzi
    - Date range filter (last 30/90/365 days or custom)
    - Sorted by profit descending
    - Show "+19% TVA" note on totals
  - Write tests for: profit calculation accuracy with Decimal math

  **Must NOT do**:
  - Do NOT add charts — table-based reports only
  - Do NOT include inactive clients

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Complex aggregation queries with Decimal arithmetic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 14, 15, 17-19)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 18
  - **Blocked By**: Tasks 9, 15

  **References**:
  - Design doc: `.sisyphus/plans/2026-02-18-dentex-design.md` — "Rapoarte (Reports)" section
  - Profitability: Revenue (sum of client's order item totals) - Cost (sum of quantity × costPrice)
  - Romanian: Raport Profitabilitate Clienți, Total Vânzări, Cost, Profit, Marjă

  **Acceptance Criteria**:
  - [ ] Report shows all active clients ranked by profitability
  - [ ] Profit calculation matches: revenue - cost
  - [ ] Date range filter works correctly
  - [ ] Values in Romanian currency format
  - [ ] Tests verify Decimal precision in profit calculations

  **QA Scenarios**:
  ```
  Scenario: Profitability report renders correctly
    Tool: Playwright
    Steps:
      1. Navigate to /reports/profitability
      2. Assert table renders with client rows
      3. Assert first row has highest profit
      4. Assert RON formatting on all money columns
      5. Select "Ultimele 30 zile" filter
      6. Assert table updates (may show fewer/different results)
    Expected Result: Profitability data displayed and filterable
    Evidence: .sisyphus/evidence/task-16-profitability.png
  ```

  **Commit**: YES
  - Message: `feat: add client profitability report`
  - Files: `src/lib/actions/reports.ts`, `src/app/(dashboard)/reports/`
  - Pre-commit: `npm test && npm run build`

---

- [ ] 17. Reports — Product Performance + Slow-Movers

  **What to do**:
  - Add to `src/lib/actions/reports.ts`:
    - `getProductPerformance(params)`:
      - For each product: totalUnitsSold, uniqueClients, totalRevenue, avgMonthlyOrders, salesVelocity
      - salesVelocity = totalUnitsSold / months in range
    - `getSlowMovers(params)`:
      - Products with salesVelocity below threshold (configurable, default: bottom 20%)
      - Include: product name, category, current stock, last order date, total units ever sold
  - Create `src/app/(dashboard)/reports/products/page.tsx`:
    - Table: Produs, Categorie, Unități Vândute, Clienți Unici, Venituri, Viteză Vânzare
    - Toggle: "Top Vânzări" vs "Mișcare Lentă" (tab switch)
    - Date range filter
  - Write tests for: salesVelocity calculation, slow-mover threshold

  **Must NOT do**:
  - Do NOT add charts
  - Do NOT include inactive products in slow-mover list

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Aggregation queries with velocity calculations
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 14-16, 18, 19)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 18
  - **Blocked By**: Tasks 8, 14

  **References**:
  - salesVelocity formula: totalUnitsSold / monthsInRange
  - Slow-mover: bottom 20% by salesVelocity
  - Romanian: Raport Performanță Produse, Top Vânzări, Mișcare Lentă, Unități Vândute, Viteză Vânzare

  **Acceptance Criteria**:
  - [ ] Product performance table shows correct sales stats
  - [ ] Slow-mover list identifies bottom 20% products
  - [ ] Tab toggle between top sellers and slow movers works
  - [ ] Sales velocity calculated correctly
  - [ ] Tests pass for velocity and threshold calculations

  **QA Scenarios**:
  ```
  Scenario: View top sellers and slow movers
    Tool: Playwright
    Steps:
      1. Navigate to /reports/products
      2. Assert "Top Vânzări" tab shows products sorted by velocity (high first)
      3. Click "Mișcare Lentă" tab
      4. Assert shows products sorted by velocity (low first)
      5. Assert slow-mover products have low unit counts
    Expected Result: Both views render with correct sorting
    Evidence: .sisyphus/evidence/task-17-performance.png
  ```

  **Commit**: YES
  - Message: `feat: add product performance and slow-mover reports`
  - Files: `src/app/(dashboard)/reports/products/`, `src/lib/actions/reports.ts`
  - Pre-commit: `npm test && npm run build`

---

- [ ] 18. Dashboard (KPIs, Top Clients, Slow-Movers)

  **What to do**:
  - Create `src/lib/actions/dashboard.ts`:
    - `getDashboardData()` — aggregated query returning:
      - KPIs: totalRevenue (this month), orderCount (this month), activeClients, outstandingPayments
      - Month-over-month comparison (vs last month) as percentage change
      - Top 5 clients by revenue (this month)
      - Top 5 slow-moving products
      - Last 10 orders
  - Create `src/app/(dashboard)/dashboard/page.tsx`:
    - 4 StatCards at top: Venituri Luna Aceasta, Comenzi, Clienți Activi, Plăți Restante
    - Each card shows value + trend vs last month (↑ +12% or ↓ -5%)
    - Section: "Top Clienți" — small table (5 rows)
    - Section: "Produse cu Mișcare Lentă" — small table (5 rows)
    - Section: "Comenzi Recente" — small table (10 rows)
  - All values in Romanian format

  **Must NOT do**:
  - Do NOT add charts or graphs
  - Do NOT add real-time updates

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Dashboard layout with KPI cards and multiple data sections
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Data-dense dashboard design with clear visual hierarchy

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs data from Tasks 14-17)
  - **Parallel Group**: Wave 3 (last in wave)
  - **Blocks**: None
  - **Blocked By**: Tasks 14, 15, 16, 17

  **References**:
  - Design doc: `.sisyphus/plans/2026-02-18-dentex-design.md` — "Panou Principal (Dashboard)" section
  - StatCard component from Task 5
  - Romanian: Venituri Luna Aceasta, Comenzi, Clienți Activi, Plăți Restante, Top Clienți, Produse cu Mișcare Lentă, Comenzi Recente

  **Acceptance Criteria**:
  - [ ] 4 KPI cards render with correct values from database
  - [ ] Trend percentages show month-over-month change
  - [ ] Top clients table shows 5 rows sorted by revenue
  - [ ] Slow movers table shows 5 lowest-velocity products
  - [ ] Recent orders table shows last 10 orders
  - [ ] All values in Romanian format

  **QA Scenarios**:
  ```
  Scenario: Dashboard renders with live data
    Tool: Playwright
    Steps:
      1. Login, navigate to /dashboard
      2. Assert 4 StatCards visible
      3. Assert "Venituri Luna Aceasta" shows RON formatted value
      4. Assert "Top Clienți" section has up to 5 rows
      5. Assert "Comenzi Recente" section has up to 10 rows
      6. Screenshot full dashboard
    Expected Result: Dashboard populated with real aggregated data
    Evidence: .sisyphus/evidence/task-18-dashboard.png
  ```

  **Commit**: YES
  - Message: `feat: add dashboard with KPIs, top clients, and slow-movers`
  - Files: `src/app/(dashboard)/dashboard/`, `src/lib/actions/dashboard.ts`
  - Pre-commit: `npm run build`

---

- [ ] 19. Settings Page (Account + Offer Engine Config)

  **What to do**:
  - Create `src/app/(dashboard)/settings/page.tsx` — settings page with sections:
    - **Cont (Account)**: Change password form ("Parolă curentă", "Parolă nouă", "Confirmă parola")
    - **Configurare Motor Oferte (Offer Engine Config)**:
      - Scoring weights (5 sliders or number inputs with labels):
        - Frecvență client (w1): 0.00 - 1.00
        - Popularitate globală (w2): 0.00 - 1.00
        - Marjă profit (w3): 0.00 - 1.00
        - Recență (w4): 0.00 - 1.00
        - Mișcare lentă (w5): 0.00 - 1.00
      - Show: "Total ponderi: X" (must sum to 1.00)
      - Bundle settings:
        - Raport ancoră/upsell: slider 50-80% (default 60%)
        - Dimensiune minimă ofertă: 1-50 (default 5)
        - Dimensiune maximă ofertă: 1-50 (default 15)
        - Limită categorie: 10-100% (default 40%)
        - Perioadă analiză (zile): 30-730 (default 365)
  - Create `src/lib/actions/settings.ts`:
    - `getEngineConfig()` — load from database (or defaults)
    - `updateEngineConfig(config)` — validate weights sum to 1.0, save
    - `changePassword(currentPassword, newPassword)` — with bcrypt
  - Store engine config in a simple `Settings` table (key-value or single JSON row)
  - Write tests for: weight validation (must sum to 1.0), password change

  **Must NOT do**:
  - Do NOT add user management (create/delete users)
  - Do NOT add app-wide settings (theme, language, etc.)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Settings form with validation logic
  - **Skills**: [`frontend-ui-ux`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 14-18)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 20
  - **Blocked By**: Tasks 2, 4, 5

  **References**:
  - Default engine config from Task 6 (defaults.ts)
  - Design doc: `.sisyphus/plans/2026-02-18-dentex-design.md` — "Setări (Settings)" section
  - Weight labels (Romanian): Frecvență client, Popularitate globală, Marjă profit, Recență, Mișcare lentă

  **Acceptance Criteria**:
  - [ ] Engine config form shows current values
  - [ ] Weights validation: reject if sum ≠ 1.00
  - [ ] Save config → persists to database
  - [ ] Password change works with correct current password
  - [ ] Password change fails with wrong current password (Romanian error)

  **QA Scenarios**:
  ```
  Scenario: Update offer engine weights
    Tool: Playwright
    Steps:
      1. Navigate to /settings
      2. Change w1 (Frecvență client) to 0.40
      3. Assert "Total ponderi" updates live
      4. Adjust other weights to sum to 1.00
      5. Click save
      6. Refresh page
      7. Assert saved values persist
    Expected Result: Config saved and persists
    Evidence: .sisyphus/evidence/task-19-settings.png

  Scenario: Reject invalid weights
    Tool: Playwright
    Steps:
      1. Set all weights to 0.50 (total = 2.50)
      2. Click save
      3. Assert error: "Ponderile trebuie să totalizeze 1,00"
    Expected Result: Validation prevents invalid config
    Evidence: .sisyphus/evidence/task-19-validation.png
  ```

  **Commit**: YES
  - Message: `feat: add settings page with offer engine configuration`
  - Files: `src/app/(dashboard)/settings/`, `src/lib/actions/settings.ts`
  - Pre-commit: `npm test && npm run build`

---

- [ ] 20. Offer Engine — Scorer (Rule-Based Algorithm)

  **What to do**:
  - Create `src/lib/engine/scorer.ts`:
    - `scoreProducts(clientId: string, config: EngineConfig): Promise<ScoredProduct[]>`
    - For each active product, calculate composite score relative to this client:
      1. **clientFrequency**: Count of this product in client's orders / max frequency across all products for this client. Normalize to 0-1.
      2. **globalPopularity**: This product's total units sold across ALL clients / max across all products. Normalize to 0-1.
      3. **margin**: product.marginPercent / 100. Already 0-1.
      4. **recency**: Days since client last ordered this product. Map to 0-1 (0 days = 1.0, 365+ days = 0.0, linear).
      5. **slowMoverPush**: INVERTED global popularity (1 - globalPopularity). High for slow movers.
    - compositeScore = w1×clientFrequency + w2×globalPopularity + w3×margin + w4×recency + w5×slowMoverPush
    - Handle edge cases:
      - Client with 0 orders → clientFrequency = 0 for all, recency = 0 for all
      - New product with 0 sales → globalPopularity = 0, slowMoverPush = 1.0
      - Product never ordered by client → clientFrequency = 0, recency = 0
    - Include scoreBreakdown in each ScoredProduct for transparency
    - Use config.scoringTimeframeDays to limit order history window
  - Write comprehensive tests with deterministic seed data:
    - Test: Client who orders Product A frequently → high clientFrequency for A
    - Test: Globally popular product → high globalPopularity
    - Test: Client with 0 orders → scores based on global data only
    - Test: New product → high slowMoverPush
    - Test: Score normalization (all scores between 0 and 1)

  **Must NOT do**:
  - Do NOT implement bundle selection (Task 21)
  - Do NOT call AI (Task 22)
  - Do NOT cache scores yet — compute fresh each time

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core algorithm with normalization, edge cases, and comprehensive testing
  - **Skills**: [`superpowers/test-driven-development`]
    - `test-driven-development`: TDD is critical for algorithmic correctness

  **Parallelization**:
  - **Can Run In Parallel**: NO (core dependency for bundler)
  - **Parallel Group**: Wave 4 (first in wave)
  - **Blocks**: Task 21
  - **Blocked By**: Tasks 6, 15, 19

  **References**:
  - Engine types from Task 6 (`ScoredProduct`, `ScoringWeights`, `EngineConfig`)
  - Default config from Task 6 (`defaults.ts`)
  - Design doc scoring formula: `.sisyphus/plans/2026-02-18-dentex-design.md` — "Offer Engine" section
  - Normalization: each factor scaled to 0-1 before applying weights

  **Acceptance Criteria**:
  - [ ] Scorer returns ScoredProduct[] with composite scores between 0 and 1
  - [ ] Score breakdown shows all 5 factors individually
  - [ ] Client with frequent orders of Product X → X has high clientFrequency
  - [ ] Globally unpopular product → high slowMoverPush score
  - [ ] Client with 0 orders → scores based on global data + margin only
  - [ ] New product with 0 sales → high slowMoverPush, 0 globalPopularity
  - [ ] All tests pass with deterministic seed data

  **QA Scenarios**:
  ```
  Scenario: Score products for active client
    Tool: Bash (Vitest)
    Steps:
      1. Seed: Client A with 10 orders. Product X ordered 8 times, Product Y ordered 1 time, Product Z never ordered.
      2. Run scorer for Client A
      3. Assert Product X has highest clientFrequency
      4. Assert Product Z has clientFrequency = 0
      5. Assert all compositeScores between 0 and 1
      6. Assert scoreBreakdown has all 5 fields
    Expected Result: Scores correctly reflect client ordering patterns
    Evidence: .sisyphus/evidence/task-20-scorer.txt

  Scenario: Score products for new client (0 orders)
    Tool: Bash (Vitest)
    Steps:
      1. Seed: Client B with 0 orders. Products have global sales data.
      2. Run scorer for Client B
      3. Assert all clientFrequency = 0
      4. Assert all recency = 0
      5. Assert scores still differentiated by globalPopularity + margin + slowMoverPush
    Expected Result: Algorithm degrades gracefully for new clients
    Evidence: .sisyphus/evidence/task-20-new-client.txt

  Scenario: Slow-mover identification
    Tool: Bash (Vitest)
    Steps:
      1. Seed: Product SLOW with 2 total sales. Product FAST with 500 total sales.
      2. Run scorer
      3. Assert SLOW.slowMoverPush > FAST.slowMoverPush
      4. Assert FAST.globalPopularity > SLOW.globalPopularity
    Expected Result: Slow/fast movers correctly identified
    Evidence: .sisyphus/evidence/task-20-slow-movers.txt
  ```

  **Commit**: YES
  - Message: `feat: implement rule-based product scoring algorithm`
  - Files: `src/lib/engine/scorer.ts`, `src/lib/engine/scorer.test.ts`
  - Pre-commit: `npm test`

---

- [ ] 21. Offer Engine — Bundler (Anchor/Upsell Selection)

  **What to do**:
  - Create `src/lib/engine/bundler.ts`:
    - `buildBundle(scoredProducts: ScoredProduct[], config: EngineConfig, client: Client): GeneratedOffer`
    - **Step 1: Determine bundle size**
      - If client has order history: avg items per order, clamped to [minBundleSize, maxBundleSize]
      - If client has 0 orders: use minBundleSize (starter kit)
    - **Step 2: Split into anchor/upsell**
      - anchorCount = round(bundleSize × anchorRatio)
      - upsellCount = bundleSize - anchorCount
    - **Step 3: Select anchors**
      - Sort scored products by: high clientFrequency + high globalPopularity (anchor affinity)
      - Pick top anchorCount, respecting category diversity (no category > maxCategoryPercent)
    - **Step 4: Select upsells**
      - Sort remaining products by: high slowMoverPush + high margin (upsell affinity)
      - Pick top upsellCount, respecting category diversity
    - **Step 5: Calculate totals**
      - Use client's effective price (unitPrice × (1 - discountPercent/100))
      - totalValue = sum of (effectivePrice × suggested quantity)
      - totalMargin = weighted average margin of bundle
    - **Suggested quantities**: Based on client's typical order quantities per product (or default 1 if never ordered)
    - Mark each product with role: 'anchor' | 'upsell'
  - Write tests for:
    - Correct anchor/upsell split with 60/40 ratio
    - Category diversity enforcement
    - Bundle size for client with history vs new client
    - Client discount applied to effective prices

  **Must NOT do**:
  - Do NOT call AI (Task 22)
  - Do NOT persist the offer to database (Task 23)
  - Do NOT add randomness — algorithm must be deterministic for same input

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex selection algorithm with constraints (diversity, ratios, size)
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs scorer from Task 20)
  - **Parallel Group**: Wave 4 (after T20)
  - **Blocks**: Tasks 22, 23
  - **Blocked By**: Task 20

  **References**:
  - Scorer output from Task 20 (ScoredProduct[])
  - Engine types from Task 6
  - Category diversity rule: no single category > 40% of bundle
  - Client discount: `applyDiscount` from Task 13

  **Acceptance Criteria**:
  - [ ] Bundle respects anchorRatio (60/40 by default)
  - [ ] No category exceeds 40% of bundle items
  - [ ] Bundle size based on client's average order size (clamped to min/max)
  - [ ] New client gets minBundleSize starter kit
  - [ ] effectivePrice reflects client discount
  - [ ] Algorithm is deterministic (same input → same output)
  - [ ] All tests pass

  **QA Scenarios**:
  ```
  Scenario: Build bundle for active client
    Tool: Bash (Vitest)
    Steps:
      1. Seed: Client with 15% discount, avg 8 items per order. 50 scored products.
      2. Build bundle with default config (60/40, min 5, max 15)
      3. Assert bundleSize = 8 (based on avg order)
      4. Assert anchors = 5 (round(8 × 0.6))
      5. Assert upsells = 3
      6. Assert each anchor has role = 'anchor'
      7. Assert no category > 40% of items
      8. Assert effectivePrice = unitPrice × 0.85 for each item
    Expected Result: Bundle correctly assembled with constraints
    Evidence: .sisyphus/evidence/task-21-bundle.txt

  Scenario: Bundle for new client (starter kit)
    Tool: Bash (Vitest)
    Steps:
      1. Seed: Client with 0 orders
      2. Build bundle
      3. Assert bundleSize = minBundleSize (5)
      4. Assert anchors based on global popularity (not client frequency)
    Expected Result: Starter kit for new client
    Evidence: .sisyphus/evidence/task-21-starter-kit.txt
  ```

  **Commit**: YES
  - Message: `feat: implement offer bundle builder with anchor/upsell selection`
  - Files: `src/lib/engine/bundler.ts`, `src/lib/engine/bundler.test.ts`
  - Pre-commit: `npm test`

---

- [ ] 22. AI Enhancer (GPT-4o-mini Romanian Insights)

  **What to do**:
  - Create `src/lib/engine/ai-enhancer.ts`:
    - `enhanceOffer(offer: GeneratedOffer, clientProfile: ClientProfile): Promise<AiEnhancement>`
    - Build prompt with:
      - Client summary: name, top categories ordered, order frequency, last order date, discount tier
      - Bundle summary: anchor products (names, categories), upsell products (names, categories)
      - Global context: which products are trending, which are slow-movers
    - **System prompt**: "Ești un asistent de vânzări pentru un distribuitor de produse dentare din România. Răspunde întotdeauna în limba română."
    - **Request 3 outputs**:
      1. `insight`: 2-3 sentences explaining WHY this bundle is good for this client (Romanian)
      2. `pitchNote`: 1-2 sentences the sales rep can use when presenting (Romanian)
      3. `swapSuggestions`: optional array of {removeProductId, addProductId, reason} if AI sees better combinations
    - Parse response with Zod — validate structure, reject malformed
    - **Timeout**: 10 seconds max, then return offer without AI (graceful degradation)
    - **Error handling**: If OpenAI API fails → log error, return offer with aiInsight = null
    - Log token usage for cost monitoring
  - Create `src/lib/engine/ai-enhancer.test.ts`:
    - Mock OpenAI API
    - Test: valid response parsed correctly
    - Test: timeout → returns null insight
    - Test: malformed response → returns null insight
    - Test: API error → returns null insight

  **Must NOT do**:
  - Do NOT block offer display while waiting for AI
  - Do NOT retry failed AI calls (user can regenerate)
  - Do NOT cache AI responses (each generation is fresh context)
  - Do NOT send full product catalog to AI (only bundle + client summary)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: AI integration with structured output parsing, error handling, and degradation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 23, after Task 21)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 23
  - **Blocked By**: Tasks 6, 21

  **References**:
  - OpenAI API (GPT-4o-mini model) — structured output with response_format
  - Engine types from Task 6
  - System prompt in Romanian for dental sales context

  **Acceptance Criteria**:
  - [ ] AI returns Romanian insight text for a valid offer
  - [ ] Response parsed and validated with Zod
  - [ ] Timeout (>10s) → offer returned without AI insight
  - [ ] API error → offer returned without AI insight (no crash)
  - [ ] Token usage logged
  - [ ] All tests pass (with mocked API)

  **QA Scenarios**:
  ```
  Scenario: AI generates Romanian insight
    Tool: Bash (Vitest)
    Steps:
      1. Mock OpenAI to return valid Romanian response
      2. Call enhanceOffer with test bundle
      3. Assert insight is non-empty Romanian text
      4. Assert pitchNote is non-empty
      5. Assert response validated by Zod schema
    Expected Result: AI enhancement parsed correctly
    Evidence: .sisyphus/evidence/task-22-ai-insight.txt

  Scenario: AI timeout graceful degradation
    Tool: Bash (Vitest)
    Steps:
      1. Mock OpenAI to take 15 seconds (exceeds 10s timeout)
      2. Call enhanceOffer
      3. Assert returns within 11 seconds
      4. Assert aiInsight is null
      5. Assert no error thrown
    Expected Result: Timeout handled gracefully
    Evidence: .sisyphus/evidence/task-22-timeout.txt

  Scenario: AI API failure graceful degradation
    Tool: Bash (Vitest)
    Steps:
      1. Mock OpenAI to return 500 error
      2. Call enhanceOffer
      3. Assert aiInsight is null
      4. Assert error logged
      5. Assert no exception thrown
    Expected Result: API failure handled gracefully
    Evidence: .sisyphus/evidence/task-22-api-error.txt
  ```

  **Commit**: YES
  - Message: `feat: add GPT-4o-mini AI enhancer for Romanian offer insights`
  - Files: `src/lib/engine/ai-enhancer.ts`, `src/lib/engine/ai-enhancer.test.ts`
  - Pre-commit: `npm test`

---

- [ ] 23. Offer UI + Flow (Generate, Edit, Regenerate)

  **What to do**:
  - Create `src/lib/actions/offers.ts` — server actions:
    - `generateOffer(clientId)`: Orchestrates the full pipeline:
      1. Load client + engine config
      2. Call scorer (Task 20)
      3. Call bundler (Task 21)
      4. Call AI enhancer (Task 22) — non-blocking, add insight when ready
      5. Save Offer to database (items as JSONB snapshot)
      6. Return GeneratedOffer
    - `getOffer(id)` — load saved offer with client info
    - `updateOffer(id, items)` — save edited items, mark isEdited = true
    - `getClientOffers(clientId)` — list past offers for a client
  - Create `src/app/(dashboard)/offers/[clientId]/page.tsx` — offer generation/view page:
    - Header: "Ofertă pentru: [Client Name]"
    - AI Insight card (if available): 💡 icon + Romanian text
    - **Ancoră section**: Products marked as anchor — green accent
    - **Upsell section**: Products marked as upsell — orange accent
    - Each row: Product Name, Category, Quantity (editable), Price (with client discount), Row Total
    - Score breakdown tooltip (on hover): shows why this product was included
    - Footer: Total Ofertă, Marjă Medie, "+19% TVA" note
    - Actions: [✏️ Editează] [🔄 Regenerează] [💾 Salvează]
    - Edit mode: swap products (remove + add from dropdown), adjust quantities
    - Regenerate: new API call, fresh bundle
    - Show loading state while generating (< 3s for scoring, < 8s with AI)
  - Create `src/components/offers/OfferDisplay.tsx` — the main offer view component
  - Create `src/components/offers/OfferItemRow.tsx` — single product row
  - Create `src/components/offers/OfferEditor.tsx` — edit mode component
  - Wire up the "Generează Ofertă" button from Client detail (Task 9) to this page
  - Write tests for: offer generation pipeline, offer save/load, edit persistence

  **Must NOT do**:
  - Do NOT add PDF export
  - Do NOT block UI while AI loads (show offer immediately, add AI insight when ready)
  - Do NOT allow editing items after offer is saved (create new version instead)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Complex UI with anchor/upsell sections, edit mode, loading states
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Offer display design with visual hierarchy (anchor vs upsell sections)

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs Tasks 21 + 22)
  - **Parallel Group**: Wave 4 (last in wave)
  - **Blocks**: Tasks 24, 25
  - **Blocked By**: Tasks 4, 5, 21, 22

  **References**:
  - Design doc offer display mockup: `.sisyphus/plans/2026-02-18-dentex-design.md` — "Offer Display Screen"
  - Engine pipeline: scorer → bundler → AI enhancer
  - Romanian labels: Ofertă pentru, Ancoră, Upsell, Editează, Regenerează, Salvează, Total Ofertă

  **Acceptance Criteria**:
  - [ ] Click "Generează Ofertă" on client page → navigates to offer page
  - [ ] Offer displays within 3 seconds (rule-based), AI insight within 8 seconds
  - [ ] Anchor and upsell sections visually distinct
  - [ ] Edit: can swap products and adjust quantities
  - [ ] Regenerate: creates fresh bundle
  - [ ] Save: persists to database as Offer record
  - [ ] Score breakdown visible on hover/click per product
  - [ ] All prices reflect client discount

  **QA Scenarios**:
  ```
  Scenario: Generate offer for a client
    Tool: Playwright
    Steps:
      1. Login, navigate to a client with order history
      2. Click "Generează Ofertă"
      3. Assert loading state appears
      4. Wait for offer to render (max 10s)
      5. Assert "Ancoră" section has products
      6. Assert "Upsell" section has products
      7. Assert total is displayed in RON format
      8. Assert "+19% TVA" note visible
      9. Assert AI insight card visible (or "Se generează..." while loading)
      10. Screenshot
    Expected Result: Full offer generated and displayed
    Evidence: .sisyphus/evidence/task-23-generate-offer.png

  Scenario: Edit and save offer
    Tool: Playwright
    Steps:
      1. Generate offer (from scenario above)
      2. Click "Editează"
      3. Change quantity of first anchor product to 20
      4. Assert row total updates
      5. Assert offer total updates
      6. Click "Salvează"
      7. Assert success toast "Oferta a fost salvată"
      8. Reload page → assert changes persist
    Expected Result: Edits saved and persisted
    Evidence: .sisyphus/evidence/task-23-edit-offer.png

  Scenario: Regenerate offer
    Tool: Playwright
    Steps:
      1. From saved offer, click "Regenerează"
      2. Assert loading state
      3. Assert new offer appears (may have different products)
      4. Assert new offer has different ID (new record)
    Expected Result: Fresh offer generated
    Evidence: .sisyphus/evidence/task-23-regenerate.png

  Scenario: Offer for new client (0 orders)
    Tool: Playwright
    Steps:
      1. Navigate to a client with 0 orders
      2. Click "Generează Ofertă"
      3. Assert offer generates (starter kit based on global data)
      4. Assert bundle has minBundleSize products
    Expected Result: Algorithm handles new client gracefully
    Evidence: .sisyphus/evidence/task-23-new-client-offer.png
  ```

  **Commit**: YES
  - Message: `feat: add offer generation UI with edit and regenerate`
  - Files: `src/app/(dashboard)/offers/`, `src/lib/actions/offers.ts`, `src/components/offers/`
  - Pre-commit: `npm test && npm run build`

---

- [ ] 24. Integration Testing (Cross-Module Flows)

  **What to do**:
  - Create `src/test/integration/` directory
  - Write integration tests for the key user flows:
    - **Full offer pipeline**: Create client → create products → create orders → generate offer → verify scoring uses order data
    - **CSV import → offer**: Import products CSV → import orders CSV → generate offer → verify imported data affects scoring
    - **Price consistency**: Create product → create client with discount → create order → verify prices snapshotted → change product price → verify order unchanged
    - **Financial calculations**: Create multiple orders for client → verify profitability report matches → verify dashboard KPIs match
    - **Settings → offer**: Change engine weights → generate offer → verify different bundle vs default weights
  - Use real database (test database instance)
  - Clean database between test suites

  **Must NOT do**:
  - Do NOT test UI rendering (that's Task 25)
  - Do NOT mock the database — use real Prisma queries

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Cross-module integration testing requires understanding full data flow
  - **Skills**: [`superpowers/test-driven-development`]

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 25, 26)
  - **Parallel Group**: Wave 5
  - **Blocks**: F1-F4
  - **Blocked By**: Task 23

  **References**:
  - All server actions from Tasks 8-23
  - Test utilities from Task 7

  **Acceptance Criteria**:
  - [ ] All integration tests pass: `npx vitest run src/test/integration/`
  - [ ] Full offer pipeline test: client orders → scoring → correct bundle
  - [ ] Price snapshot test: order prices immutable after product price change
  - [ ] Config change test: different weights → different offer

  **QA Scenarios**:
  ```
  Scenario: Integration test suite passes
    Tool: Bash
    Steps:
      1. Run: npx vitest run src/test/integration/ --reporter=verbose
      2. Assert exit code 0
      3. Assert all test suites pass
    Expected Result: All integration tests green
    Evidence: .sisyphus/evidence/task-24-integration.txt
  ```

  **Commit**: YES
  - Message: `test: add integration tests for cross-module flows`
  - Files: `src/test/integration/`
  - Pre-commit: `npm test`

---

- [ ] 25. E2E QA (Playwright Full Journeys)

  **What to do**:
  - Install Playwright: `npx playwright install`
  - Create `e2e/` directory with test files
  - Write E2E tests for complete user journeys:
    1. **Auth flow**: Visit app → redirect to login → login → see dashboard
    2. **Product management**: Add product → edit → view in list → deactivate
    3. **Client management**: Add client with discount → view financials → see discount applied
    4. **Order creation**: Select client → add products → verify discounted prices → create order → view in list
    5. **CSV import**: Upload products CSV → verify products in list. Upload orders CSV → verify orders.
    6. **Offer generation**: Open client → generate offer → verify anchor/upsell split → edit → save → regenerate
    7. **Reports**: View profitability → verify data present. View slow-movers → verify data.
    8. **Settings**: Change engine weights → save → verify persists
  - All tests use Romanian selectors (button text, labels, etc.)
  - Add Playwright config for local dev server

  **Must NOT do**:
  - Do NOT test AI responses in E2E (mock the AI layer)
  - Do NOT test against production

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: E2E test writing with Playwright
  - **Skills**: [`playwright`]
    - `playwright`: Browser automation for E2E tests

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 24, 26)
  - **Parallel Group**: Wave 5
  - **Blocks**: F1-F4
  - **Blocked By**: Task 23

  **References**:
  - Romanian UI labels from all modules (used as selectors)
  - Playwright docs for Next.js testing

  **Acceptance Criteria**:
  - [ ] All 8 E2E journeys pass: `npx playwright test`
  - [ ] Tests use Romanian text selectors
  - [ ] Screenshots captured for each journey

  **QA Scenarios**:
  ```
  Scenario: E2E test suite passes
    Tool: Bash
    Steps:
      1. Run: npx playwright test --reporter=list
      2. Assert exit code 0
      3. Assert all tests pass
    Expected Result: All E2E tests green
    Evidence: .sisyphus/evidence/task-25-e2e.txt
  ```

  **Commit**: YES
  - Message: `test: add Playwright E2E tests for all user journeys`
  - Files: `e2e/`, `playwright.config.ts`
  - Pre-commit: `npx playwright test`

---

- [ ] 26. Performance + Build Verification

  **What to do**:
  - Verify production build: `npm run build` → no errors, no warnings
  - Check bundle size: no single page chunk > 200KB
  - Test pagination performance: query 1000+ products, 500+ clients, 10000+ orders → pages load < 2s
  - Test offer generation performance: measure time for scorer + bundler → < 3 seconds
  - Test CSV import performance: 1000 product rows → < 30 seconds
  - Fix any N+1 query issues (use Prisma `include` properly)
  - Add proper loading states for all async operations
  - Verify all pages are server-side rendered (no client-side data fetching for initial load)

  **Must NOT do**:
  - Do NOT add caching layer (V2)
  - Do NOT add CDN configuration

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Performance testing and optimization
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 24, 25)
  - **Parallel Group**: Wave 5
  - **Blocks**: F1-F4
  - **Blocked By**: Task 23

  **References**:
  - Next.js build output analysis
  - Prisma query optimization docs

  **Acceptance Criteria**:
  - [ ] `npm run build` → exit 0, no warnings
  - [ ] Product list with 1000+ rows loads < 2s (server-side paginated)
  - [ ] Offer generation (scorer + bundler) completes < 3s
  - [ ] No N+1 queries in list views
  - [ ] All pages have loading skeletons

  **QA Scenarios**:
  ```
  Scenario: Production build succeeds
    Tool: Bash
    Steps:
      1. Run: npm run build 2>&1
      2. Assert exit code 0
      3. Assert no "warning" in output (except known Next.js warnings)
    Expected Result: Clean production build
    Evidence: .sisyphus/evidence/task-26-build.txt

  Scenario: Offer generation performance
    Tool: Bash (Vitest)
    Steps:
      1. Seed 1000 products, 500 clients, 10000 orders
      2. Time: scoreProducts + buildBundle for a client with 50 orders
      3. Assert total time < 3000ms
    Expected Result: Offer generates within performance budget
    Evidence: .sisyphus/evidence/task-26-perf.txt
  ```

  **Commit**: YES
  - Message: `perf: verify build, pagination, and offer generation performance`
  - Files: performance-related fixes
  - Pre-commit: `npm run build && npm test`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in `.sisyphus/evidence/`. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npx tsc --noEmit` + ESLint + `npm test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify ALL money fields use Decimal (grep for Float in schema). Check Zod validation on all inputs.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state (fresh seed). Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (create product → import orders → generate offer → check reports). Test edge cases: empty state, 0-order client, deactivated product. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual implementation. Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance per task. Verify no PDF export, no charts, no multi-language, no product images were built. Flag unaccounted features.
  Output: `Tasks [N/N compliant] | Scope Creep [CLEAN/N issues] | Missing [CLEAN/N items] | VERDICT`

---

## Commit Strategy

| After Task(s) | Message | Pre-commit |
|--------------|---------|------------|
| 1 | `feat: initialize Next.js 15 project with Tailwind + shadcn/ui` | `npm run build` |
| 2 | `feat: add Prisma schema with all models + seed data` | `npx prisma validate` |
| 3 | `feat: add NextAuth.js authentication with login page` | `npm run build` |
| 4 | `feat: add app layout with Romanian sidebar navigation` | `npm run build` |
| 5 | `feat: add shared UI components and Romanian format utilities` | `npm run build` |
| 6 | `feat: define offer engine types and interfaces` | `npx tsc --noEmit` |
| 7 | `feat: add Vitest test infrastructure with mock helpers` | `npm test` |
| 8 | `feat: add Products module with CRUD, search, and filtering` | `npm test && npm run build` |
| 9 | `feat: add Clients module with CRUD, financials, and discount pricing` | `npm test && npm run build` |
| 10 | `feat: add Orders list and detail with filtering and TVA display` | `npm test && npm run build` |
| 11 | `feat: add order creation flow with client discount pricing` | `npm test && npm run build` |
| 12 | `feat: add CSV import engine with Romanian format support` | `npm test` |
| 13 | `feat: add server action utilities and Decimal arithmetic helpers` | `npm test` |
| 14 | `feat: add CSV product import with upsert and validation` | `npm test && npm run build` |
| 15 | `feat: add CSV order import with client/product matching` | `npm test && npm run build` |
| 16 | `feat: add client profitability report` | `npm test && npm run build` |
| 17 | `feat: add product performance and slow-mover reports` | `npm test && npm run build` |
| 18 | `feat: add dashboard with KPIs, top clients, and slow-movers` | `npm run build` |
| 19 | `feat: add settings page with offer engine configuration` | `npm test && npm run build` |
| 20 | `feat: implement rule-based product scoring algorithm` | `npm test` |
| 21 | `feat: implement offer bundle builder with anchor/upsell selection` | `npm test` |
| 22 | `feat: add GPT-4o-mini AI enhancer for Romanian offer insights` | `npm test` |
| 23 | `feat: add offer generation UI with edit and regenerate` | `npm test && npm run build` |
| 24 | `test: add integration tests for cross-module flows` | `npm test` |
| 25 | `test: add Playwright E2E tests for all user journeys` | `npx playwright test` |
| 26 | `perf: verify build, pagination, and offer generation performance` | `npm run build && npm test` |

---

## Success Criteria

### Verification Commands
```bash
npm run build          # Expected: exit 0, no errors
npm test               # Expected: all tests pass
npx playwright test    # Expected: all E2E tests pass
npx tsc --noEmit       # Expected: no type errors
npx prisma validate    # Expected: schema valid
```

### Final Checklist
- [ ] All "Must Have" items present and verified
- [ ] All "Must NOT Have" items absent (no PDF, no charts, no images, etc.)
- [ ] All 26 tasks completed with passing QA scenarios
- [ ] All 4 final review agents APPROVE
- [ ] All tests pass (unit + integration + E2E)
- [ ] Production build succeeds
- [ ] App accessible at localhost:3000 with Romanian UI
- [ ] Offer generation works end-to-end for clients with and without history
