# DollarVote — Project Status
### Last Updated: Feb 27, 2026

> **Motto:** *We will never take profit over values. In any circumstance. Ever.*

---

## Overall Progress: ~10-15%

---

## 🟢 DONE
- [x] Core app live at dollarvote.app (Vercel + Railway + PostgreSQL)
- [x] 200 companies, 1,554 brands, 227 product categories, 18 industries
- [x] FEC PAC data: 173 verified entries
- [x] Issue stances: 264 companies documented from public records
- [x] Full React UI rebuild (onboarding, report cards, explore page, deal breakers)
- [x] Auth optional, onboarding works without account
- [x] FEC API key registered (mhlNnA0OtHFPjlMC3wKVT8NeeSs58Gp8mngXchOX)
- [x] Amazon affiliate tag: dollarvote20-20
- [x] Kroger API: dollarvote-bbcchkn8 (covers Safeway, Fred Meyer, QFC)
- [x] INDUSTRY-DATABASE.md (2,090 lines)
- [x] COMPANY-DATA-STRATEGY.md
- [x] GLOBAL-ROADMAP.md (international expansion plan)
- [x] Domain: dollarvote.app (also own vwyd.app)
- [x] TOS + Privacy Policy, register checkbox required
- [x] GitHub: TomiJans26/vote-with-your-dollar

---

## 🔥 DEPLOY NOW (code written, not live yet)
- [ ] Push Feb 21-22 frontend changes to Vercel (production)
- [ ] Deploy backend_v2 (FastAPI) to Railway
- [ ] Verify live site works with new UI + data
- [ ] Save FEC API key to env (not hardcoded)

---

## 🟡 BUILD PHASE (~30% of total work)
- [x] Barcode scanning — viewfinder overlay, haptic feedback ✅ Feb 27
- [x] Product alternatives engine — already in Result.jsx ✅
- [x] Affiliate links — Amazon tag wired, store links working ✅
- [x] Chrome browser extension — v0.1 for Amazon/Walmart/Target/Kroger/Safeway ✅ Feb 28
- [x] Mobile PWA polish — DollarVote branding, Apple web app, manifest ✅ Feb 27
- [x] Shopping list feature — add from scans + alternatives, alignment scores ✅ Feb 27
- [x] Report cards / alignment scores — Dashboard.jsx with score rings, issue breakdown ✅
- [ ] FEC batch PAC lookup — re-run with real API key (had bugs)
- [x] Search: "Is [brand] ethical?" landing pages — /company/:name route ✅ Feb 28
- [ ] Kroger OAuth + "Add to Safeway cart" integration (API docs captured)
- [ ] Habit-based curated shopping lists (learn what you buy → suggest aligned swaps)

---

## 🔴 DATA PHASE (~25% of total work)
- [ ] Expand to 500+ companies with full issue coverage
- [ ] All 22 issues researched per company
- [ ] Automated data pipeline (Scout crawling news + press releases, not manual)
- [ ] Source citations for every claim (trust = everything)
- [ ] Data freshness — companies change positions, need update cycle
- [ ] Fill gaps: many companies missing PAC data (foreign, private, no PAC)

---

## 🔴 GROWTH PHASE (~25% of total work)
- [ ] SEO pages ranking on Google ("Is [brand] ethical?")
- [ ] Marketing content: TikTok ("I scanned my fridge"), Reddit, Instagram
- [ ] First 1,000 users
- [ ] First revenue from affiliate links
- [ ] Value-based click partnerships (brands pay per click on genuine recommendations)
- [ ] Press: "Spokane startup helps consumers vote with their wallets"
- [ ] Subreddits: r/ethicalconsumer, r/anticonsumption, r/politics

---

## 🔴 SCALE PHASE (~10% of total work)
- [ ] International expansion (UK, Canada, Australia first — see GLOBAL-ROADMAP.md)
- [ ] API for third-party integrations
- [ ] Team beyond Dave + Tomi
- [ ] Country-specific political donation databases
- [ ] Multi-currency affiliate links

---

## 🔧 INFRA / HOUSEKEEPING
- [ ] Fix gateway bind issue (169.254.x APIPA adapter vs 192.168.2.101)
- [ ] Brave Search API — need paid plan for Scout research crawling
- [ ] Scout research pipeline: news + press releases (social media auth walls killed scraping)

---

## Tech Stack
- **Frontend:** React + Vite (Vercel, free tier)
- **Backend:** FastAPI (Railway, $5/mo)
- **Database:** PostgreSQL on Railway (prod) / MSSQL SQL Server 2025 Express local (dev)
- **Local Dev DB:** Instance .\SQLEXPRESS01, database DollarVote
- **Domain:** dollarvote.app via GoDaddy (A record → 76.76.21.21)

---

## Business Rules (NON-NEGOTIABLE)
- **NO ADS. EVER.** No banners, pre-rolls, pop-ups. Not now, not when we're big. FOREVER.
- **Integrity first. Revenue second. Always.**
- Alignment scores are NEVER influenced by affiliate revenue
- We recommend what matches the user's values, period
- Revenue = affiliate links + value-based clicks (matchmaking, not advertising)
- All political donation data is public (FEC) — First Amendment protected, WA anti-SLAPP law

---

## Growth Milestones
| Users | Milestone |
|-------|-----------|
| 100 | AdSense consideration |
| 1,000 | Pitch small aligned brands |
| 10,000 | Big brands come to us |
| 50,000 | Phase 1 complete, expand internationally |

---

*"You can't win if you don't even try."*
