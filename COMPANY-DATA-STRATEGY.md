# DollarVote - Data Strategy & Coverage Plan

**Last Updated:** February 21, 2026

## The Mission

Every dollar is a vote. DollarVote exists so consumers don't have to spend hours researching who owns what, where the money goes, and whether their purchases align with their values. **We do the deep dive so they don't have to.**

## What We Track

For every company in our database:

1. **Ownership Chain** — Who really owns this brand? (Parent company → subsidiary → brand)
2. **PAC Donations** — FEC data on political action committee spending (Democrat/Republican/Other split)
3. **Issue Stances** — 22 issues from abortion to vaccine policy, scored -1 to +1
4. **Industry Classification** — What sector they operate in
5. **Brand Portfolio** — Every consumer-facing brand they own
6. **Product Categories** — What aisle/category each brand lives in

## Current Coverage (Feb 2026)

| Metric | Count |
|--------|-------|
| Industries | 18 |
| Companies | 200 |
| Brands | 1,554 |
| Product Categories | 227 |
| Issue Stances Tracked | 22 |

### Industry Breakdown

| Industry | Companies | Brands | Coverage Assessment |
|----------|-----------|--------|-------------------|
| Food & Beverage | 29 | 562 | **STRONG** — Deep coverage of grocery aisle |
| Household & Cleaning | 8 | 131 | **GOOD** — Major players covered |
| Consumer Conglomerate | 3 | 88 | **GOOD** — P&G, Unilever, Berkshire |
| Electronics & Tech | 18 | 87 | **FOUNDATION** — Big names, need more accessory/peripheral brands |
| Clothing & Apparel | 20 | 87 | **FOUNDATION** — Major brands, need fast fashion + DTC brands |
| Automotive | 22 | 86 | **FOUNDATION** — All major automakers + gas + parts |
| Health & Wellness | 5 | 83 | **GOOD** — OTC meds, vitamins covered |
| Retail & E-Commerce | 16 | 80 | **GOOD** — Store brands + private labels |
| Entertainment & Media | 13 | 60 | **FOUNDATION** — Streaming, gaming, news |
| Beauty & Cosmetics | 3 | 56 | **NEEDS WORK** — Missing Coty, Shiseido, indie brands |
| Home & Furniture | 16 | 53 | **FOUNDATION** — Appliances, tools, furniture |
| Tobacco & Alcohol | 7 | 47 | **FOUNDATION** — Major tobacco + spirits |
| Personal Care | 2 | 33 | **THIN** — Overlap with conglomerates helps |
| Restaurants & Food Service | 13 | 32 | **FOUNDATION** — Major chains covered |
| Baby & Kids | 5 | 25 | **THIN** — Toys covered, need more baby gear |
| Financial Services | 14 | 24 | **THIN** — Major banks/cards, need fintech |
| Telecom & Internet | 6 | 20 | **FOUNDATION** — All major carriers |
| Pet Care | 0 | 0 | **EMPTY** — Brands exist under Mars/Nestle/Smucker, need dedicated companies |

## Data Quality Layers (Target State)

Each company should eventually have ALL of these:

1. **Basic Info** ✅ — Name, ticker, country, industry
2. **Brand Portfolio** ✅ — All consumer-facing brands
3. **Brand Categories** ✅ — What product category each brand is in
4. **FEC/PAC Data** 🟡 — Have for ~50 original companies, need for 150 new ones
5. **Issue Stances** 🟡 — Have for ~50, need for 150 new ones
6. **Ownership Chain** 🔴 — Who owns whom (subsidiaries, major shareholders like BlackRock)
7. **Controversy Log** 🔴 — Major scandals, lawsuits, EPA violations
8. **ESG Scores** 🔴 — Environmental, Social, Governance ratings
9. **Lobbying Spend** 🔴 — OpenSecrets data on lobbying expenditures
10. **Executive Donations** 🔴 — Personal donations from C-suite (separate from PAC)

## Priority Order for Expansion

### Phase 1: Complete What We Have (Current)
- ✅ All industries populated with companies and brands
- ✅ All brands categorized
- 🔲 FEC data for new 150 companies
- 🔲 Issue stances for new 150 companies

### Phase 2: Depth Over Breadth
- Research controversy/scandal data for top 50 companies
- Add ownership chain data (who owns whom)
- Cross-reference BlackRock/Vanguard/State Street holdings
- Add ESG scores from public sources

### Phase 3: The Long Tail
- DTC (Direct-to-Consumer) brands — Warby Parker, Casper, Dollar Shave Club, etc.
- Regional brands — store brands, regional chains
- International brands popular in US market
- Emerging brands in each category

### Phase 4: Real-Time Data
- Automated FEC data refresh each election cycle
- News monitoring for controversies
- Stock ownership tracking
- Lobbying disclosure updates

## Key Insights Baked Into Our Data

These are things we've discovered that make DollarVote valuable:

1. **The Illusion of Choice** — 10 companies control most of the grocery aisle
2. **The Craft Illusion** — Brands that look indie but aren't (Goose Island = AB InBev, Burt's Bees = Clorox, Blue Moon = Molson Coors, Ben & Jerry's = Unilever)
3. **Private vs Public** — Private companies (Mars, SC Johnson) are genuinely different from public ones where BlackRock owns 5-8%
4. **Foreign Ownership** — Budweiser is Belgian, Gerber is Swiss, Lysol is British, Dial is German
5. **Koch Industries** — Georgia-Pacific (Brawny, Angel Soft, Dixie, Quilted Northern) = Koch money. $400M+ per election cycle.
6. **Tobacco Heritage** — Kraft/Mondelez was owned by Philip Morris (Marlboro) from 1988-2007. Every Oreo sold during those years funded tobacco.
7. **PAC Bipartisanship** — Corporate PACs donate to BOTH parties, buying access not ideology
8. **ZYN = Philip Morris** — The nicotine pouch brand is owned by Philip Morris International

## The Database Architecture

```
industries (18)
  └── companies (200)
       ├── brands (1,554)
       │    └── product_categories (227, hierarchical)
       ├── company_issues (stance on 22 issues)
       ├── pac_donations (FEC data)
       └── products (barcode-linked, from scans)
```

## Files

- `backend_v2/data/industries.json` — Industry definitions
- `backend_v2/data/parent-companies-v2.json` — Full company+brand export with categories
- `backend_v2/data/product-categories-v2.json` — Category tree
- `backend_v2/data/parent-companies.json` — Original 50 companies (legacy)
- `backend_v2/data/company-issues.json` — Issue stances
- `backend_v2/data/fec-pac-names.json` — PAC committee IDs for FEC lookup
- `INDUSTRY-DATABASE.md` — Human-readable complete database reference

## Principles

- **No ads. No commercials. Ever.** Revenue from affiliate links and value-based clicks.
- **Integrity first. Revenue second. Always.** Alignment scores are never influenced by money.
- **We will never take profit over values. In any circumstance. Ever.**
- Data is public (FEC, corporate disclosures). First Amendment protected.

---

*This document is the strategic backbone of DollarVote's data layer. When in doubt about what to research or add, refer here.*
