# DenteX — Smart Dental Distributor Platform

## Overview

A Romanian-language web application for a dental products distributor with 1000+ products and 500+ clients. Sales reps manage clients, track orders and financials, and use a **one-click smart offer generator** that bundles high-performing products with slow-movers — tailored per client using a hybrid rule-based + AI engine.

**Tech Stack**: Next.js + PostgreSQL
**Language**: Romanian
**Users**: Single distributor company, all users same role (no permission tiers)

---

## Data Model

### Product

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Product name (Romanian) |
| sku | VARCHAR(100) | Unique stock keeping unit |
| category | VARCHAR(100) | Product category (e.g., "Implanturi", "Consumabile", "Instrumente") |
| description | TEXT | Product description |
| unitPrice | DECIMAL(10,2) | Selling price to client |
| costPrice | DECIMAL(10,2) | Distributor's buy price |
| marginPercent | DECIMAL(5,2) | Computed: ((unitPrice - costPrice) / unitPrice) × 100 |
| stockQty | INTEGER | Current stock quantity |
| isActive | BOOLEAN | Whether product is available for offers |
| createdAt | TIMESTAMP | Record creation date |
| updatedAt | TIMESTAMP | Last update |

### Client

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| companyName | VARCHAR(255) | Clinic / practice name |
| contactPerson | VARCHAR(255) | Main contact name |
| email | VARCHAR(255) | Contact email |
| phone | VARCHAR(50) | Contact phone |
| address | TEXT | Full address |
| city | VARCHAR(100) | City (for regional filtering) |
| creditLimit | DECIMAL(10,2) | Maximum credit allowed |
| paymentTermsDays | INTEGER | Payment terms in days (e.g., 30, 60, 90) |
| notes | TEXT | Free-text notes |
| createdAt | TIMESTAMP | Record creation date |
| updatedAt | TIMESTAMP | Last update |

### Order

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| clientId | UUID (FK) | References Client |
| orderDate | DATE | When the order was placed |
| totalAmount | DECIMAL(12,2) | Total order value |
| status | ENUM | 'pending', 'delivered', 'cancelled' |
| paidAmount | DECIMAL(12,2) | How much has been paid |
| isPaid | BOOLEAN | Whether fully paid |
| notes | TEXT | Order notes |
| createdAt | TIMESTAMP | Record creation date |

### OrderItem

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| orderId | UUID (FK) | References Order |
| productId | UUID (FK) | References Product |
| quantity | INTEGER | Quantity ordered |
| unitPrice | DECIMAL(10,2) | Price at time of order |
| totalPrice | DECIMAL(12,2) | quantity × unitPrice |

### Offer

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| clientId | UUID (FK) | References Client |
| generatedAt | TIMESTAMP | When generated |
| items | JSONB | Array of {productId, quantity, unitPrice, role: 'anchor'|'upsell', score} |
| aiInsight | TEXT | AI-generated insight/recommendation text (Romanian) |
| isEdited | BOOLEAN | Whether the rep manually modified the offer |
| engineConfig | JSONB | Snapshot of weights/settings used at generation time |
| createdAt | TIMESTAMP | Record creation date |

### User

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Login email |
| passwordHash | VARCHAR(255) | Hashed password |
| name | VARCHAR(255) | Display name |
| createdAt | TIMESTAMP | Record creation date |

---

## App Structure & Modules

### Navigation (Sidebar — Romanian)

```
📊 Panou Principal (Dashboard)
👥 Clienți (Clients)
📦 Produse (Products)
📋 Comenzi (Orders)
📈 Rapoarte (Reports)
⚙️ Setări (Settings)
```

### Module Details

#### 1. Panou Principal (Dashboard)
- Revenue overview (this month vs last month)
- Top 10 clients by revenue
- Top 10 slow-moving products (candidates for upsell)
- Recent orders
- Outstanding payments summary

#### 2. Clienți (Clients)
- **List view**: Searchable, filterable table (by city, payment status, revenue tier)
- **Client detail page**:
  - Contact info & notes
  - Financial summary card: total spent, outstanding balance, avg order value, profitability margin
  - Order history table (with links to order details)
  - **🔥 "Generează Ofertă" button** — the core feature
- **Add/edit client** form

#### 3. Produse (Products)
- **Catalog view**: Searchable, filterable by category, sortable by price/margin/stock
- **Product detail**: Sales statistics (how many clients buy it, frequency, total units sold), margin info
- **Add/edit product** form
- **CSV import** for bulk product upload

#### 4. Comenzi (Orders)
- **All orders list**: Filter by client, date range, status, payment status
- **Order detail**: Items, amounts, payment tracking
- **Add order**: Select client → search/add products → set quantities → save
- **CSV import** for bulk historical order import

#### 5. Rapoarte (Reports)
- Client profitability ranking (revenue minus cost)
- Product performance (best sellers vs worst sellers)
- Revenue over time chart (monthly/quarterly)
- Slow-mover inventory report (products with low sales velocity)
- Payment aging report (overdue invoices)

#### 6. Setări (Settings)
- Account management (change password, manage users)
- **Offer engine configuration**:
  - Anchor/upsell ratio (default: 60/40)
  - Bundle size range (min: 5, max: 15)
  - Scoring weights (order frequency, margin, global rank, recency)
- CSV import tools & history

---

## Offer Engine — Hybrid Architecture

### Layer 1: Rule-Based Scoring (Core)

For each product, relative to a specific client, calculate a composite score:

```
Product Score (for Client X) =
  w1 × clientOrderFrequency     (how often this client orders this product)
  + w2 × globalSalesRank        (how well this product sells across ALL clients)
  + w3 × marginPercent           (profit margin — higher = better for distributor)
  + w4 × recencyBonus            (recently ordered by client = familiar, good anchor)
  + w5 × slowMoverPenalty        (rarely ordered globally = upsell candidate)
```

**Default weights** (configurable in Settings):
- w1 (Client frequency): 0.30
- w2 (Global popularity): 0.20
- w3 (Margin): 0.25
- w4 (Recency): 0.15
- w5 (Slow-mover push): 0.10

**Product Classification**:
- **Anchor** (top 60% of bundle): High client frequency + high global rank → products the client already loves
- **Upsell** (bottom 40% of bundle): Low client frequency + low global rank + high margin → products the distributor wants to push

**Category Diversification**: The algorithm ensures no single category exceeds 40% of the offer. Forces variety.

**Bundle Size**: Determined by client's average order size (historical). Small buyer → 5-8 products. Large buyer → 10-15 products.

### Layer 2: AI Enhancement (GPT-4o-mini)

After the rule-based engine produces the bundle, send to AI for:

1. **Insight generation**: "Acest client nu a comandat implanturi în ultimele 3 luni — oferta include accesorii pentru implanturi ca oportunitate de reangajare." (This client hasn't ordered implants in 3 months — the offer includes implant accessories as a re-engagement opportunity.)

2. **Bundle validation**: AI reviews the bundle for logical coherence — e.g., don't suggest impression materials without suggesting impression trays.

3. **Personalized pitch note**: A short Romanian text the sales rep can use when presenting the offer to the client.

**AI receives**: Client profile summary, last 10 orders, the generated bundle with scores, and product category relationships.

**AI returns**: Insight text (Romanian), any swap suggestions, pitch note.

### Offer Generation Flow

```
User clicks "Generează Ofertă"
         │
         ▼
┌─────────────────────┐
│ 1. Load client data  │ ← order history, financials, preferences
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 2. Score all active  │ ← apply weighted formula per product
│    products          │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 3. Select bundle     │ ← pick anchors + upsells, enforce category diversity
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 4. AI enhancement    │ ← GPT-4o-mini adds insight + validates + pitch note
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ 5. Present offer     │ ← show bundle with labels (Ancoră/Upsell) + AI insight
│    to user           │
└─────────┬───────────┘
          ▼
    ┌─────┴─────┐
    │           │
  Edit     Regenerează
 (swap,     (new bundle,
 remove,    fresh AI call)
 adjust)
```

---

## UI/UX Overview

### Design Approach
- Clean, professional, data-dense (this is a business tool, not consumer app)
- Sidebar navigation, main content area
- Tables with search/filter/sort for lists (clients, products, orders)
- Cards for summary data (financial overview, client stats)
- The offer generation screen is the hero — prominent, clear, with anchor/upsell labels

### Offer Display Screen
```
┌────────────────────────────────────────────────┐
│ Ofertă pentru: Dr. Popescu - Clinica Dentară   │
│ Generată: 18 Feb 2026                          │
├────────────────────────────────────────────────┤
│                                                │
│ 💡 AI Insight:                                 │
│ "Acest client preferă consumabile premium și   │
│  nu a comandat materiale de amprentă de 4 luni.│
│  Oferta include kit de amprentă ca oportunitate│
│  de reangajare."                               │
│                                                │
│ ┌──────────────────────────────────────────┐   │
│ │ ⭐ ANCORĂ (produse populare pt client)   │   │
│ ├──────────────────────────────────────────┤   │
│ │ Composite nanohybrid premium  │ 50 buc │ │   │
│ │ Ace endodontice ProTaper      │ 20 buc │ │   │
│ │ Adeziv universal Bond         │ 10 buc │ │   │
│ │ ...                                    │ │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ ┌──────────────────────────────────────────┐   │
│ │ 🔄 UPSELL (produse recomandate)          │   │
│ ├──────────────────────────────────────────┤   │
│ │ Kit amprentă silicon          │ 5 buc  │ │   │
│ │ Freze diamantate set          │ 3 buc  │ │   │
│ │ Soluție dezinfectant PRO      │ 10 buc │ │   │
│ │ ...                                    │ │   │
│ └──────────────────────────────────────────┘   │
│                                                │
│ 📊 Total ofertă: 4,250 RON | Marjă: 32%      │
│                                                │
│ [✏️ Editează]  [🔄 Regenerează]  [💾 Salvează] │
└────────────────────────────────────────────────┘
```

---

## Tech Architecture

### Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15 (App Router) | React framework with SSR/SSG |
| Styling | Tailwind CSS + shadcn/ui | Fast, professional UI components |
| Database | PostgreSQL | Relational data, complex queries for scoring |
| ORM | Prisma | Type-safe database access |
| Auth | NextAuth.js | Simple email/password authentication |
| AI | OpenAI API (GPT-4o-mini) | Insight generation, bundle validation |
| Hosting | Vercel | Next.js optimized hosting |
| DB Hosting | Supabase or Neon | Managed PostgreSQL |

### Project Structure

```
dentex/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Login/register pages
│   │   ├── (dashboard)/        # Authenticated layout
│   │   │   ├── dashboard/      # Panou Principal
│   │   │   ├── clients/        # Clienți (list + [id] detail)
│   │   │   ├── products/       # Produse
│   │   │   ├── orders/         # Comenzi
│   │   │   ├── reports/        # Rapoarte
│   │   │   └── settings/       # Setări
│   │   └── api/                # API routes
│   │       ├── clients/
│   │       ├── products/
│   │       ├── orders/
│   │       ├── offers/
│   │       │   └── generate/   # POST — trigger offer engine
│   │       ├── reports/
│   │       └── import/         # CSV import endpoints
│   ├── components/             # Shared UI components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # Sidebar, header, etc.
│   │   ├── clients/            # Client-specific components
│   │   ├── products/           # Product-specific components
│   │   ├── orders/             # Order-specific components
│   │   └── offers/             # Offer display, editor
│   ├── lib/
│   │   ├── db.ts               # Prisma client
│   │   ├── auth.ts             # Auth config
│   │   ├── engine/             # Offer engine
│   │   │   ├── scorer.ts       # Rule-based scoring algorithm
│   │   │   ├── bundler.ts      # Bundle assembly (anchors + upsells)
│   │   │   ├── ai-enhancer.ts  # GPT-4o-mini integration
│   │   │   └── types.ts        # Engine types
│   │   └── utils/
│   │       ├── csv-parser.ts   # CSV import utilities
│   │       └── format.ts       # Romanian number/date formatting
│   └── prisma/
│       ├── schema.prisma       # Database schema
│       └── seed.ts             # Seed data for development
├── public/
├── .env                        # Environment variables
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Monthly Cost Estimate

### AI Costs (OpenAI API — GPT-4o-mini)

GPT-4o-mini pricing: $0.15 / 1M input tokens, $0.60 / 1M output tokens

Per offer generation:
- Input: ~2,000 tokens (client profile + product bundle + context)
- Output: ~400 tokens (insight + pitch note in Romanian)

| Usage Level | Offers/Month | Input Tokens | Output Tokens | Monthly Cost |
|-------------|-------------|-------------|--------------|-------------|
| Light | 500 | 1M | 200K | **~$0.27** |
| Medium | 2,000 | 4M | 800K | **~$1.08** |
| Heavy | 5,000 | 10M | 2M | **~$2.70** |

**AI cost is negligible** — even heavy usage is under $3/month.

### Hosting Costs

| Service | Free Tier | Production Tier | Notes |
|---------|----------|----------------|-------|
| **Vercel** (Next.js hosting) | $0/mo | $20/mo (Pro) | Pro needed for commercial use, custom domain, analytics |
| **Supabase** (PostgreSQL) | $0/mo (500MB) | $25/mo (8GB, backups) | Free tier fine for launch, upgrade as data grows |
| **Domain** (.ro or .com) | — | ~$1/mo (~$12/year) | dentex.ro or similar |
| **OpenAI API** | — | ~$1-3/mo | Based on offer generation volume |

### Monthly Cost Summary

| Scenario | Vercel | Database | AI | Domain | **Total** |
|----------|--------|---------|-----|--------|-----------|
| **Development / MVP** | Free | Free (Supabase) | ~$1 | $1 | **~$2/mo** |
| **Production (recommended)** | $20 | $25 | ~$2 | $1 | **~$48/mo** |
| **Heavy usage** | $20 | $25 | ~$3 | $1 | **~$49/mo** |

### Cost Notes

- **The AI layer is extremely cheap.** GPT-4o-mini is powerful enough for Romanian insight generation and costs almost nothing at this scale.
- **Database is the main cost driver.** With 1000+ products × 500+ clients × years of order history, you'll need the paid Supabase tier relatively quickly.
- **No per-user costs.** Vercel Pro covers unlimited team members. Supabase doesn't charge per connection.
- **Scales well.** Even 10× the usage would only add ~$25/month for a larger database plan. AI costs stay under $5.
- **If using GPT-4o instead of GPT-4o-mini**: Multiply AI costs by ~15×. Still only ~$15-40/month. Worth considering if Romanian quality from mini isn't sufficient.

---

## What's NOT Included (Explicit Scope Boundaries)

- ❌ PDF export of offers (in-app only for now)
- ❌ Client-facing portal (clients don't log in)
- ❌ Multi-language support (Romanian only)
- ❌ Multi-tenant / SaaS features (single company)
- ❌ Mobile app (responsive web only)
- ❌ Email/notification system
- ❌ Integration with external ERP/CRM systems
- ❌ Automated payment tracking (manual entry)
- ❌ Role-based permissions (all users equal access)

---

## Success Criteria

1. Distributor can add/import products and clients with full financial data
2. Order history (imported + new) feeds the scoring algorithm correctly
3. "Generează Ofertă" produces a relevant, diverse bundle in < 3 seconds
4. AI insights are coherent, in Romanian, and reference actual client patterns
5. Offers are editable (swap/remove products) and regeneratable
6. Reports show clear product performance and client profitability rankings
7. CSV import handles 1000+ products and years of order history without issues
