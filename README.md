# Vote With Your Dollar 🗳️💵

**Scan a product → See who really makes it → See where their money goes politically → Find alternatives.**

## Overview

Every purchase is a vote. This app connects the dots between the products you buy, the parent corporations behind them, and where those corporations direct their political spending via PACs (Political Action Committees).

## How It Works

1. **Scan** a product barcode (or search by name)
2. **Identify** the parent company behind the brand
3. **Reveal** that company's PAC contributions via FEC data
4. **Suggest** alternative products from companies whose values align with yours

## Architecture

```
vote-with-your-dollar/
├── data/
│   ├── parent-companies.json    # 50 major CPG companies + their brands
│   ├── product-categories.json  # Grocery categories for alternative matching
│   └── fec-pac-names.json       # PAC names for FEC API lookups
├── src/
│   └── api/
│       ├── fec.js               # OpenFEC API client
│       └── barcode.js           # Barcode lookup (Open Food Facts + UPCitemdb)
└── package.json
```

### Data Flow

```
Barcode → Product Name/Brand → Parent Company → PAC Name → FEC Contributions
                                      ↓
                              Product Category → Alternative Brands → Alternative Products
```

### APIs Used

| API | Purpose | Auth |
|-----|---------|------|
| [OpenFEC](https://api.open.fec.gov) | PAC contributions & committee data | API key (free) |
| [Open Food Facts](https://world.openfoodfacts.org) | Product/barcode lookups | None |
| [UPCitemdb](https://www.upcitemdb.com) | Fallback barcode lookups | Trial key |

## Setup

```bash
npm install

# Set your FEC API key (get one at https://api.data.gov/signup/)
export FEC_API_KEY=OidB7yZzEj3kLKkKkls6QcYFHpHN4xB5C1JCyHn2

# Run
npm start
```

## Status

🚧 **Early development** — Data foundation phase.

## License

MIT
