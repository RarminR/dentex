
## Task 6: Offer Engine Types & Interfaces

**Completed:** 2025-02-18

### Key Decisions
- Used `Prisma.Decimal` for all monetary fields (unitPrice, effectivePrice, costPrice, marginPercent, totalValue, totalMargin, avgOrderValue, discountPercent)
- Composite scores are regular JS `number` (0-1 normalized floats), not Decimal
- Made `aiInsight` and `pitchNote` optional in GeneratedOffer (engine works without AI)
- Stored `engineConfig` snapshot in GeneratedOffer for historical accuracy
- Each ScoredProduct has `role: 'anchor' | 'upsell'` assigned by bundler

### Scoring Weights (w1-w5)
- w1 (clientFrequency): 0.30 — how often this client orders this product
- w2 (globalPopularity): 0.20 — how well this product sells globally
- w3 (margin): 0.25 — profit margin of the product
- w4 (recency): 0.15 — how recently client ordered this product
- w5 (slowMoverPush): 0.10 — push for products that sell slowly
- **Total: 1.0** ✓

### Configuration Defaults
- anchorRatio: 0.60 (60% of bundle are anchor products)
- minBundleSize: 5
- maxBundleSize: 15
- maxCategoryPercent: 0.40 (no category > 40% of bundle)
- scoringTimeframeDays: 365 (look back 1 year)

### Files Created
1. `src/lib/engine/types.ts` — 7 interfaces + 1 type
2. `src/lib/engine/defaults.ts` — DEFAULT_ENGINE_CONFIG + validateWeights() + PRODUCT_CATEGORIES
3. `src/lib/engine/index.ts` — barrel export

### Verification
- TypeScript: `npx tsc --noEmit` → Exit code 0 ✓
- Weights validation: sum = 1.0 ✓
- Commit: `fbe4ee9 feat: define offer engine types and interfaces` ✓

### Downstream Dependencies
- Task 20 (scorer.ts): Produces ScoredProduct[]
- Task 21 (bundler.ts): Selects from ScoredProduct[] → GeneratedOffer
- Task 22 (ai-enhancer.ts): Adds AiEnhancement to GeneratedOffer
- Task 23 (Offer UI): Displays GeneratedOffer


## Task 2: Database Schema + Prisma + Seed Data

### Completed
- ✅ Prisma initialized with SQLite (local dev)
- ✅ All 6 models created: User, Product, Client, Order, OrderItem, Offer
- ✅ All money fields use Decimal (NO Float types)
- ✅ All indexes created for performance
- ✅ Migration applied: 20260217155813_init
- ✅ Seed data populated: 2 users, 20 products, 6 clients, 25 orders
- ✅ Git commit: feat: add Prisma schema with all models + seed data

### Key Decisions
- Used Prisma 5.22.0 (downgraded from 7.4.0 due to adapter requirements)
- SQLite for local development (production will use PostgreSQL)
- Decimal type for all money fields (unitPrice, costPrice, totalAmount, paidAmount, creditLimit, discountPercent)
- Status as String (not enum) for SQLite compatibility
- JSON stored as String in Offer model (items, engineConfig)
- Price snapshots in OrderItem (unitPrice, discount captured at order time)

### Data Structure
- **Products**: 20 items across 4 categories (Materiale Compozite, Instrumente, Consumabile, Implanturi)
- **Clients**: 6 Romanian dental clinics with credit limits and discount percentages
- **Orders**: 25 orders with various statuses (PENDING, DELIVERED, CANCELLED)
- **Users**: 2 users (admin, agent) with bcrypt-hashed passwords

### Next Steps
- Task 3: Authentication (uses User model)
- Task 8: Products module (uses Product model)
- Task 9: Clients module (uses Client model)


## Task 13: Server Actions + API Utilities + Decimal Arithmetic Helpers

**Completed:** 2026-02-18

### Key Decisions
- `src/lib/db.ts` is a thin re-export of `src/lib/prisma.ts` (which already existed) — no duplication
- `Decimal` imported from `@prisma/client/runtime/library` for arithmetic helpers (NOT from `decimal.js` directly)
- `'use server'` files can ONLY export async functions — `handleActionError` must be `async` even if trivial
- `withAuth` uses `Session` type from `next-auth` (not `NonNullable<Awaited<ReturnType<typeof auth>>>`)
- Zod v4 uses `{ error: '...' }` not `{ message: '...' }` for validation messages
- `paginatedQuery` uses `Promise.all` for parallel DB queries (count + data)

### Decimal Arithmetic Patterns
- `calculateMargin`: `unitPrice.minus(costPrice).dividedBy(unitPrice).times(100)`
- `applyDiscount`: `price.times(new Decimal(1).minus(discountPercent.dividedBy(100)))`
- `sumDecimals`: `values.reduce((acc, val) => acc.plus(val), new Decimal(0))`
- All operations use Prisma Decimal methods: `.minus()`, `.plus()`, `.times()`, `.dividedBy()`
- Comparison uses `.equals()` not `===`

### Files Created
1. `src/lib/db.ts` — re-exports `prisma` from `./prisma`
2. `src/lib/actions/utils.ts` — withAuth, withValidation, paginatedQuery, handleActionError
3. `src/lib/validations/shared.ts` — paginationSchema, idSchema, decimalSchema
4. `src/lib/utils/decimal.ts` — calculateMargin, applyDiscount, sumDecimals
5. `src/lib/utils/decimal.test.ts` — 9 TDD tests (all pass)

### Verification
- Tests: 9/9 decimal tests pass, 60/60 total tests pass ✓
- Build: `npm run build` → Compiled successfully ✓
- Pre-existing failure: `products.test.ts` (mockPrisma hoisting issue, unrelated to this task)
- Evidence: `.sisyphus/evidence/task-13-*.txt`

### Downstream Dependencies
- Task 14+: Server actions can use `withAuth`, `withValidation`, `paginatedQuery`, `handleActionError`
- All money calculations: use `calculateMargin`, `applyDiscount`, `sumDecimals` from `@/lib/utils/decimal`


## Task 12: CSV Import Engine (Parser + Validation Framework)

**Completed:** 2026-02-18

### Key Decisions
- Used `papaparse` with `header: true`, `skipEmptyLines: true`, and trimmed headers for generic row parsing
- Added reusable Romanian converters in parser layer: `parseRomanianDate` (`DD.MM.YYYY` / `DD/MM/YYYY` -> ISO) and `parseRomanianNumber` (`1.234,56` -> `1234.56`)
- Added parser-level safeguards: 10MB max file size and UTF-8 heuristic checks (`\uFFFD` + mojibake hints)
- Built generic validator around Zod `safeParse` and `issues` to collect all errors per row/field
- Row numbering in validator defaults to spreadsheet-style values (`rowOffset = 2`, header row included)

### Files Created
1. `src/lib/import/types.ts`
2. `src/lib/import/parser.ts`
3. `src/lib/import/validator.ts`
4. `src/lib/import/parser.test.ts`
5. `src/lib/import/validator.test.ts`
6. `src/components/import/CsvUploader.tsx`

### UI Patterns Captured
- `CsvUploader` is schema-optional: parses only when no schema is provided; validates + filters valid rows when schema exists
- Supports drag-and-drop + file picker, preview first 5 rows, validation error list with row numbers, and progress bar state
- Romanian labels used directly in component: "Încarcă fișier CSV", "Trage fișierul aici", "Previzualizare", "Importă", "Erori de validare"

### Verification
- TDD red phase captured (`task-12-red-green.txt`): tests failed before implementation due to missing modules
- Import tests pass: 5/5
- Full suite passes: 76/76
- Build passes: `npm run build`
- LSP diagnostics clean for all changed files

## Task 10: Orders List + Detail + Filter

**Completed:** 2026-02-18

### Key Decisions
- Server actions in `src/lib/actions/orders.ts` with `'use server'` directive
- `getOrders` accepts `{ page, pageSize, search, clientId, status, dateFrom, dateTo }` — all optional
- Search filters by `client.companyName` using Prisma `contains`
- Date range uses `gte`/`lte` with end-of-day for `dateTo` (`T23:59:59.999Z`)
- `updateOrderPayment` uses `Prisma.Decimal.gte()` to determine `isPaid` flag
- TVA display-only on order detail total using `formatTVADisplay` from format.ts
- OrderStatusBadge maps statuses to colored badges: PENDING (amber), DELIVERED (emerald), CANCELLED (red)
- Client-side components (`'use client'`): OrderFilters, OrdersTable, PaymentSection
- Server components: orders/page.tsx (list), orders/[id]/page.tsx (detail)

### Files Created
1. `src/lib/actions/orders.ts` — getOrders, getOrder, updateOrderPayment, getClientsForFilter
2. `src/lib/actions/orders.test.ts` — 12 tests (TDD: filtering, pagination, payment logic)
3. `src/components/orders/OrderStatusBadge.tsx` — status → colored Badge
4. `src/components/orders/OrderFilters.tsx` — search, status, client, date range filters via URL params
5. `src/components/orders/OrdersTable.tsx` — DataTable wrapper with pagination
6. `src/components/orders/PaymentSection.tsx` — payment form with balance display
7. `src/app/(dashboard)/orders/page.tsx` — orders list with filters + table
8. `src/app/(dashboard)/orders/[id]/page.tsx` — order detail with items table + TVA + payment

### Patterns
- URL search params for filter state (not React state) — server-side filtering
- `Suspense` wrapping `OrderFilters` to handle `useSearchParams` boundary
- Prisma Decimal `.toString()` for display, `Prisma.Decimal.gte()` for comparison
- Next.js 15 `searchParams` as `Promise<...>` pattern (awaited in server component)

### Verification
- Tests: 76/76 pass (12 new orders tests) ✓
- Build: `npm run build` → Compiled successfully, routes listed ✓
- LSP: All 8 files clean (0 errors) ✓
- Commit: `d033e7e feat: add Orders list and detail with filtering and TVA display` ✓

## Task 8: Products Module (CRUD + Search + Filter)

**Completed:** 2026-02-18

### Key Decisions
- Zod v4 API: `{ error: 'msg' }` instead of `{ message: 'msg' }` / `{ errorMap: ... }` / `{ invalid_type_error: ... }`
- Prices stored as string in Zod schema, converted to `Prisma.Decimal` in server action
- Margin computed in app: `((unitPrice - costPrice) / unitPrice) * 100` — not stored in DB
- Soft-delete only: `deactivateProduct` sets `isActive = false`, never hard-deletes
- `vi.hoisted()` required for mock variables in Vitest when `vi.mock` is hoisted above const declarations
- Prisma `catch (e)` with `e as { code?: string }` cast needed because `instanceof` narrowing on `PrismaClientKnownRequestError` doesn't narrow `.code` property in strict TS
- Server components (pages) + client components (list/detail interactivity) pattern
- URL searchParams for filter state (search, category, page) — consistent with Orders module

### Files Created
1. `src/lib/validations/product.ts` — Zod schemas for create/update
2. `src/lib/actions/products.ts` — 5 server actions (getProducts, getProduct, createProduct, updateProduct, deactivateProduct)
3. `src/lib/actions/products.test.ts` — 16 TDD tests (pagination, search, CRUD, validation, duplicate SKU)
4. `src/components/products/ProductForm.tsx` — shared create/edit form
5. `src/components/products/ProductsListClient.tsx` — list with DataTable, search, category filter
6. `src/components/products/ProductDetailClient.tsx` — detail with stats, deactivate
7. `src/app/(dashboard)/products/page.tsx` — product list (server component)
8. `src/app/(dashboard)/products/new/page.tsx` — add product
9. `src/app/(dashboard)/products/[id]/page.tsx` — product detail
10. `src/app/(dashboard)/products/[id]/edit/page.tsx` — edit product

### Verification
- Tests: 76/76 pass (16 new products tests) ✓
- Build: `npm run build` → Compiled successfully ✓
- Routes: /products, /products/[id], /products/[id]/edit, /products/new ✓
- Evidence: `.sisyphus/evidence/task-8-*.txt`

## Task 9: Clients Module (CRUD + Financials + Discount)

**Completed:** 2026-02-18

### Key Decisions
- Zod schemas use `z.coerce.number()` for creditLimit/discountPercent/paymentTermsDays — handles form string inputs
- Empty optional strings (email, phone, etc.) stored as `null` in DB, accepted as `''` in Zod via `.optional().or(z.literal(''))`
- `getClientFinancials` computes profitability from OrderItems: `(totalRevenue - totalCost) / totalRevenue * 100`
- `getClients` filters only `isActive: true` by default — deactivated clients hidden from list
- City filter via `distinct` query on active clients — dynamic filter values
- `deactivateClient` is soft-delete only: sets `isActive = false`, never deletes

### Financial Computation
- totalSpent: `order.aggregate._sum.totalAmount`
- totalPaid: `order.aggregate._sum.paidAmount`
- outstandingBalance: `totalSpent.sub(totalPaid)` (Prisma Decimal arithmetic)
- avgOrderValue: `totalSpent.div(totalOrders)` (or zero if no orders)
- profitabilityMargin: `(totalRevenue - totalCost) / totalRevenue * 100` from OrderItems + Product.costPrice

### Files Created
1. `src/lib/validations/client.ts` — clientCreateSchema, clientUpdateSchema
2. `src/lib/actions/clients.ts` — getClients, getClient, getClientFinancials, createClient, updateClient, deactivateClient
3. `src/lib/actions/clients.test.ts` — 24 tests (TDD: validation, CRUD, financials)
4. `src/components/clients/ClientForm.tsx` — shared create/edit form
5. `src/components/clients/FinancialSummary.tsx` — 6 StatCards for financial metrics
6. `src/components/clients/ClientsListView.tsx` — client-side list with search, city filter, pagination
7. `src/components/clients/DeactivateButton.tsx` — confirm-then-deactivate button
8. `src/app/(dashboard)/clients/page.tsx` — server page with initial data fetch
9. `src/app/(dashboard)/clients/[id]/page.tsx` — detail page with financials + order history
10. `src/app/(dashboard)/clients/new/page.tsx` — new client form page

### Patterns
- ClientsListView uses `useDebouncedCallback` for search (300ms debounce)
- Server page fetches initial data + distinct cities, passes to client component
- Detail page uses `Promise.all` for parallel getClient + getClientFinancials
- "Generează Ofertă" button links to `/offers/new?clientId={id}` (page doesn't exist yet)
- Prisma Decimal used throughout — `sub()`, `div()`, `add()`, `mul()`, `gt()` for all money arithmetic

### Verification
- Tests: 76/76 pass (24 new client tests) ✓
- Build: `npm run build` → Compiled successfully ✓
- Routes: /clients, /clients/[id], /clients/new all listed ✓
- Evidence: `.sisyphus/evidence/task-9-*.txt`

## Task 11: Order Creation Flow with Client Discount Pricing

**Completed:** 2026-02-18

### Key Decisions
- Used Prisma nested creates (`order.create({ data: { items: { create: [...] } } })`) for atomic Order+OrderItems creation — implicit transaction
- Avoided interactive `$transaction` due to Prisma 5.22.0 type inference issues with transaction client (`tx.client` not typed)
- Price snapshots: `OrderItem.unitPrice` from Product, `OrderItem.discount` from Client.discountPercent at creation time
- `applyDiscount(unitPrice, discount)` from `@/lib/utils/decimal.ts` for effective price calculation
- TVA computed display-only on frontend via `calculateWithTVA` from format.ts — NOT stored in DB
- Multi-step form state managed in client component (`NewOrderForm`), server component (`page.tsx`) only fetches data

### Pricing Formula
- `effectivePrice = unitPrice × (1 - discountPercent / 100)` via `applyDiscount`
- `totalPrice = effectivePrice × quantity` via `Decimal.times()`
- `totalAmount = sumDecimals(itemTotalPrices)`
- TVA display: `subtotal + TVA 19% = total cu TVA` (frontend only)

### Multi-Step UI
1. **Select Client**: searchable list showing companyName + discountPercent badge
2. **Add Products**: search products, set quantity, see effective price with discount annotation
3. **Review + Confirm**: full summary with subtotal, TVA 19%, total cu TVA, then "Confirmă Comanda" → redirect to `/orders/[id]`

### Files Created
1. `src/app/(dashboard)/orders/new/page.tsx` — server page fetching clients + products
2. `src/components/orders/NewOrderForm.tsx` — client-side multi-step form controller
3. `src/components/orders/OrderProductSelector.tsx` — product search + quantity + pricing
4. `src/components/orders/OrderSummary.tsx` — review with TVA display
5. `src/lib/actions/orders.ts` — added `createOrder` (appended, not replaced)
6. `src/lib/actions/orders.test.ts` — added 5 TDD tests (appended, not replaced)

### Patterns
- `getClients({ pageSize: 200 })` and `getProducts({ pageSize: 200 })` to fetch all for client-side filtering
- `OrderItemDraft` interface for client-side item state (string prices for display)
- Step indicator with numbered circles (current=primary, completed=emerald, pending=muted)
- Unicode escapes for Romanian chars in JSX to avoid encoding issues

### Verification
- Tests: 81/81 pass (5 new createOrder tests) ✓
- Build: `npm run build` → Compiled successfully, /orders/new route listed ✓
- LSP: All new files clean (0 errors) ✓
- Evidence: `.sisyphus/evidence/task-11-*.txt`
