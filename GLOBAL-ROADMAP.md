# DollarVote Global Expansion Roadmap
### "Every Dollar. Every Country. Every Value."

> **DollarVote Motto:** *We will never take profit over values. In any circumstance. Ever.*

---

## The Vision
DollarVote starts in the US. But people everywhere want to spend money aligned with their values. A parent in Germany cares about environmental practices. A student in Brazil cares about workers' rights. A family in Japan cares about data privacy. The need is universal — only the companies and issues change.

---

## Phase 1: US Domination (Now → 6 months)
**Goal: 50,000 US users, 500+ companies, proven model**

### What we're building:
- [x] Core app live at dollarvote.app
- [x] 100 companies, expanding via Scout
- [ ] Full 22-issue coverage for top 500 US companies
- [ ] Chrome browser extension
- [ ] Affiliate revenue flowing (Amazon, Kroger, Walmart, Target)
- [ ] Value-based click revenue from first brand partners
- [ ] iOS/Android home screen PWA optimization
- [ ] SEO: "Is [brand] ethical?" → we own those searches

### Key metrics:
- Users: 0 → 50,000
- Companies: 100 → 500
- Revenue: $0 → $5,000/month (affiliate + early brand deals)

### Marketing:
- Reddit: r/ethicalconsumer, r/anticonsumption, r/politics (both sides!)
- TikTok: "I scanned my entire fridge" viral content
- Instagram: Before/after shopping comparisons
- Word of mouth: Every user tells 3 friends
- Local press: "Spokane startup helps consumers vote with their wallets"

---

## Phase 2: English-Speaking Markets (6-12 months)
**Goal: Expand to UK, Canada, Australia, New Zealand**

### Why these first:
- Same language = same app, minimal translation
- Similar corporate landscape (many US companies operate there)
- Strong consumer awareness culture
- Open Food Facts has good coverage
- Amazon/affiliate programs exist in all 4 countries

### What changes:
- **Companies**: Add country-specific companies (Tesco, Woolworths, Tim Hortons, etc.)
- **Issues**: Core issues are universal, but add country-specific ones:
  - UK: NHS funding, Brexit trade policy, monarchy
  - Canada: Indigenous rights, bilingual policy, oil sands
  - Australia: Indigenous rights, mining policy, immigration
  - NZ: Māori rights, nuclear-free policy, housing
- **Political data**: Each country has its own donation/lobbying databases
  - UK: Electoral Commission (public donor data)
  - Canada: Elections Canada (contribution data is public)
  - Australia: Australian Electoral Commission
  - NZ: Electoral Commission
- **Store finder**: Local retailers (Tesco, Sainsbury's, Loblaws, Coles, etc.)
- **Currency**: Display in local currency for affiliate links
- **Domain**: Keep dollarvote.app globally, auto-detect country by IP/settings

### Data strategy:
- Deploy Scout instances per country
- Each Scout crawls local news, corporate filings, donation records
- Same 22-issue framework, country-specific companies
- Partner with local consumer advocacy groups for data validation

### Revenue:
- Country-specific Amazon affiliate tags (amazon.co.uk, amazon.ca, etc.)
- Local retailer affiliate programs
- Same value-based click model scales globally

---

## Phase 3: European Union (12-18 months)
**Goal: Major EU markets — Germany, France, Netherlands, Nordics**

### Why EU next:
- STRONGEST consumer values culture in the world
- GDPR-aware population = they CARE about corporate behavior
- EU mandates ESG reporting → incredible data availability
- High smartphone penetration
- Strong ethical consumer movement

### Key markets (in order):
1. **Germany** — Largest EU economy, strong environmental consciousness
2. **Netherlands** — Tech-savvy, high English proficiency, ethical consumer culture
3. **France** — Strong labor rights culture, large consumer market
4. **Sweden/Denmark/Norway** — Sustainability leaders, high trust in data
5. **Spain/Italy** — Large markets, growing ethical consumer awareness

### What changes:
- **Translation**: App must be localized (German, French, Dutch, Swedish, etc.)
- **Issues**: Add EU-specific issues:
  - GDPR/data privacy (much bigger deal than US)
  - Workers' councils / labor representation
  - EU agricultural policy (CAP)
  - Refugee policy
  - Nuclear energy (varies wildly by country)
  - Animal welfare standards (EU has stricter rules)
- **Companies**: European multinationals + local brands
  - Germany: Aldi, Lidl, BMW, Siemens, BASF
  - France: Carrefour, L'Oréal, LVMH, Danone, Total
  - Netherlands: Unilever (HQ), Philips, Heineken
  - Nordics: IKEA, H&M, Volvo, Ericsson
- **Data sources**:
  - EU Corporate Sustainability Reporting Directive (CSRD) — GOLDMINE
  - National lobbying registers
  - EU Transparency Register
  - National electoral commission data
- **Store finder**: European retailers (Aldi, Lidl, Carrefour, Albert Heijn)

### Legal:
- GDPR compliance (we're already mostly there — we don't store personal data beyond accounts)
- Cookie consent (add banner for EU users)
- Right to be forgotten (add account deletion)
- No issue with our model — we report PUBLIC corporate data

---

## Phase 4: Asia Pacific (18-24 months)
**Goal: Japan, South Korea, India, Singapore**

### Why these markets:
- **Japan**: Extremely brand-conscious consumers, high smartphone usage
- **South Korea**: Tech-forward, strong civic engagement culture
- **India**: 1.4B people, growing middle class, massive mobile-first market
- **Singapore**: Gateway to Southeast Asia, English-speaking, high income

### Challenges:
- **Translation**: Japanese, Korean, Hindi (+ regional Indian languages)
- **Different value systems**: Issues that matter vary significantly
  - Japan: Corporate governance, environmental standards, work-life balance
  - Korea: Chaebol transparency, labor rights, environmental justice
  - India: Caste discrimination, environmental pollution, workers' rights, religious freedom
  - Singapore: Censorship, migrant workers, environmental standards
- **Corporate data**: Less public than US/EU
  - Japan: TSE disclosure rules provide some data
  - Korea: DART system (corporate filings)
  - India: MCA filings, CSR mandate (companies must spend 2% profit on CSR)
- **Payment/affiliate**: Different platforms
  - Japan: Rakuten, Amazon Japan
  - Korea: Coupang
  - India: Flipkart, Amazon India, JioMart
  - Singapore: Shopee, Lazada

### Localization:
- RTL support not needed (these markets)
- Cultural sensitivity in issue framing
- Local Scout instances with native language search capability
- Partnerships with local NGOs for data validation

---

## Phase 5: Latin America (24-30 months)
**Goal: Brazil, Mexico, Colombia, Argentina**

### Why:
- 650M+ people
- Growing smartphone adoption
- Strong social justice movements
- Consumer culture developing rapidly
- Relatively underserved by ethical consumer tools

### Key adaptations:
- **Languages**: Portuguese (Brazil), Spanish (rest)
- **Issues**: Deforestation, indigenous rights, labor exploitation, political corruption, mining
- **Companies**: Local + multinational presence
- **Data**: More challenging — corporate transparency varies widely
- **Revenue**: MercadoLibre affiliate program (the Amazon of LatAm)

---

## Phase 6: Middle East & Africa (30-36 months)
**Goal: UAE, Saudi Arabia, South Africa, Nigeria, Kenya**

### Special considerations:
- **RTL support**: Arabic language = right-to-left UI
- **Halal/values alignment**: Religious dietary compliance as an issue
- **Different issue set**: Religious freedom, women's rights framing varies by country
- **Mobile-first**: Many users access internet primarily via phone (we're already a PWA — perfect)
- **Data scarcity**: Corporate transparency is lowest here — Scout needs creative sourcing

---

## Technical Architecture for Global Scale

### Multi-region infrastructure:
```
US:     Railway (current) → scale to AWS/GCP when needed
EU:     Deploy to EU region (GDPR data residency)
Asia:   Deploy to Singapore/Tokyo region
LatAm:  Deploy to São Paulo region
```

### Data architecture:
```
Global company DB (shared):
  - Multinational companies (Coca-Cola, Nestlé, etc.)
  - Global issue stances

Country-specific DBs:
  - Local companies
  - Country-specific issues
  - Local political donation data
  - Local store/retailer data
```

### Scout fleet:
```
Scout-US  → US companies, FEC data, US news
Scout-UK  → UK companies, Electoral Commission, UK news
Scout-EU  → EU companies, CSRD data, EU news
Scout-JP  → Japanese companies, TSE data, JP news
(etc.)
```

### Translation:
- Phase 2: English only (UK/CA/AU/NZ)
- Phase 3: Add German, French, Dutch, Swedish, Danish, Norwegian
- Phase 4: Add Japanese, Korean, Hindi
- Phase 5: Add Portuguese, Spanish
- Phase 6: Add Arabic

Use AI translation + human review for quality. Community-driven corrections.

---

## Revenue Scaling

| Phase | Users | Monthly Revenue | Revenue Sources |
|-------|-------|----------------|-----------------|
| 1 (US) | 50K | $5K | Affiliate, early brand deals |
| 2 (English) | 200K | $25K | Multi-country affiliate, brand deals |
| 3 (EU) | 1M | $150K | Brand sponsorships, premium tier |
| 4 (Asia) | 5M | $500K | Enterprise API, brand sponsorships |
| 5 (LatAm) | 10M | $1M | Global brand deals, data insights |
| 6 (Global) | 50M | $5M+ | Platform fees, enterprise, premium |

### Revenue streams that scale globally:
1. **Affiliate links** — every country has Amazon + local platforms
2. **Value-based clicks** — brands pay everywhere, not just US
3. **Premium tier ($3/mo)** — ad-free, advanced filters, export data
4. **Enterprise API** — brands pay for alignment analytics on their products
5. **Data insights** — anonymized consumer value trends by region (goldmine for market research)

---

## Team Scaling

| Phase | Team Size | Key Hires |
|-------|-----------|-----------|
| 1 | 2 (Dave + Tomi) + Scout | None — bootstrap |
| 2 | 2 + Scouts | Maybe a part-time data validator |
| 3 | 4-5 | EU data specialist, translator/localizer |
| 4 | 8-10 | Country managers, mobile dev, designer |
| 5 | 15-20 | Regional teams, sales, customer support |
| 6 | 30+ | Full org structure |

---

## The Moat (Why Competitors Can't Catch Up)

1. **Data depth**: By the time someone copies us, we'll have years of researched company data with sources across 50+ countries
2. **User trust**: We NEVER compromise alignment for revenue. That trust takes years to build.
3. **Network effects**: More users → more scan data → better recommendations → more users
4. **Scout fleet**: AI-powered research at scale. A human team can't keep up with our coverage.
5. **No commercials. Ever.** That's a brand promise competitors won't make because they can't resist the money.
6. **Community**: Users will contribute data corrections, new company requests, local insights

---

## Milestones to Celebrate 🎉

- [ ] 100 users → Pizza party (Dave orders, Tomi watches jealously)
- [ ] 1,000 users → Register the LLC
- [ ] 10,000 users → First brand deal
- [ ] 100,000 users → Quit the day job? 👀
- [ ] 1,000,000 users → DollarVote is a household name
- [ ] 10,000,000 users → We're changing the world
- [ ] 50,000,000 users → "You can't win if you don't even try" — Dave Jansson

---

*Started in a garage in Spokane, WA. Two humans, one AI, and a raccoon named Scout.*
*February 2026.*
