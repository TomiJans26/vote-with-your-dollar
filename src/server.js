const express = require('express');
const path = require('path');
const cors = require('cors');
const { lookupBarcode } = require('./api/barcode');
const fec = require('./api/fec');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Load data
const companies = require('../data/parent-companies.json').companies;
const categories = require('../data/product-categories.json').categories;
const pacs = require('../data/fec-pac-names.json').pacs;
const companyIssuesData = require('../data/company-issues.json');

// Build brand->company lookup (case-insensitive)
const brandMap = new Map();
companies.forEach(c => {
  c.brands.forEach(b => {
    brandMap.set(b.toLowerCase(), c);
  });
});

// Build company lookup by id
const companyMap = new Map();
companies.forEach(c => companyMap.set(c.id, c));

// Build PAC lookup by company id
const pacMap = new Map();
pacs.forEach(p => pacMap.set(p.companyId, p));

// Simple in-memory cache for FEC data (TTL: 1 hour)
const fecCache = new Map();
const FEC_CACHE_TTL = 3600000;

function findParentCompany(brand) {
  if (!brand) return null;
  // Try exact match first
  const exact = brandMap.get(brand.toLowerCase());
  if (exact) return exact;
  // Try partial match
  for (const [key, company] of brandMap) {
    if (brand.toLowerCase().includes(key) || key.includes(brand.toLowerCase())) {
      return company;
    }
  }
  return null;
}

function guessCategory(product) {
  if (!product?.categories) return null;
  const cats = product.categories.toLowerCase();
  for (const cat of categories) {
    if (cats.includes(cat.name.toLowerCase())) return cat;
    for (const sub of cat.subcategories || []) {
      if (cats.includes(sub.replace(/-/g, ' '))) return cat;
    }
  }
  // Fallback heuristics
  if (cats.includes('beverage') || cats.includes('drink') || cats.includes('water') || cats.includes('soda')) {
    return categories.find(c => c.id === 'beverages');
  }
  if (cats.includes('snack') || cats.includes('chip') || cats.includes('cookie')) {
    return categories.find(c => c.id === 'snacks');
  }
  if (cats.includes('cereal') || cats.includes('breakfast')) {
    return categories.find(c => c.id === 'cereal-breakfast');
  }
  return null;
}

async function getCompanyPoliticalData(companyId) {
  const cached = fecCache.get(companyId);
  if (cached && Date.now() - cached.ts < FEC_CACHE_TTL) return cached.data;

  const pacInfo = pacMap.get(companyId);
  if (!pacInfo || !pacInfo.fecIds.length) {
    const data = { hasPac: false, donations: { democrat: 0, republican: 0, other: 0, total: 0 }, percentDem: 50, percentRep: 50 };
    fecCache.set(companyId, { data, ts: Date.now() });
    return data;
  }

  try {
    // Get disbursements for the first FEC ID
    const fecId = pacInfo.fecIds[0];
    const disbursements = await fec.getPacCandidateContributions(fecId, 2024);
    
    let democrat = 0, republican = 0, other = 0;
    for (const d of disbursements) {
      const amount = d.total || 0;
      const party = (d.recipient_party || d.party || '').toUpperCase();
      if (party === 'DEM') democrat += amount;
      else if (party === 'REP') republican += amount;
      else other += amount;
    }
    
    const total = democrat + republican + other;
    const data = {
      hasPac: true,
      pacName: pacInfo.pacNames[0],
      fecId,
      donations: { democrat, republican, other, total },
      percentDem: total > 0 ? Math.round((democrat / total) * 100) : 50,
      percentRep: total > 0 ? Math.round((republican / total) * 100) : 50,
    };
    fecCache.set(companyId, { data, ts: Date.now() });
    return data;
  } catch (err) {
    console.error(`FEC lookup failed for ${companyId}:`, err.message);
    // Return mock/estimated data so the app still works
    const data = { hasPac: true, pacName: pacInfo.pacNames[0], donations: { democrat: 0, republican: 0, other: 0, total: 0 }, percentDem: 50, percentRep: 50, error: 'FEC data temporarily unavailable' };
    fecCache.set(companyId, { data, ts: Date.now() });
    return data;
  }
}

// GET /api/scan/:upc
app.get('/api/scan/:upc', async (req, res) => {
  try {
    const { upc } = req.params;
    const product = await lookupBarcode(upc);
    if (!product) {
      return res.status(404).json({ error: 'Product not found', upc });
    }

    const parentCompany = findParentCompany(product.brand);
    const category = guessCategory(product);
    let political = null;

    if (parentCompany) {
      political = await getCompanyPoliticalData(parentCompany.id);
    }

    // Include issue stances if available
    const companyIssues = parentCompany ? (companyIssuesData[parentCompany.id]?.issues || {}) : {};

    res.json({
      product: {
        name: product.name,
        brand: product.brand,
        image: product.image,
        barcode: product.barcode,
        categories: product.categories,
      },
      parentCompany: parentCompany ? {
        id: parentCompany.id,
        name: parentCompany.name,
        ticker: parentCompany.ticker,
        industry: parentCompany.industry,
      } : null,
      category: category ? { id: category.id, name: category.name } : null,
      political,
      companyIssues,
    });
  } catch (err) {
    console.error('Scan error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/alternatives/:category/:companyId
app.get('/api/alternatives/:category/:companyId', async (req, res) => {
  try {
    const { category, companyId } = req.params;
    
    // Find companies in same category (different from the scanned one)
    const alternatives = companies
      .filter(c => c.id !== companyId)
      .slice(0, 10); // candidates

    const results = [];
    for (const alt of alternatives) {
      if (results.length >= 3) break;
      const political = await getCompanyPoliticalData(alt.id);
      results.push({
        company: { id: alt.id, name: alt.name, ticker: alt.ticker },
        brands: alt.brands.slice(0, 5),
        political,
      });
    }

    res.json({ category, alternatives: results });
  } catch (err) {
    console.error('Alternatives error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/company/:companyId
app.get('/api/company/:companyId', async (req, res) => {
  try {
    const company = companyMap.get(req.params.companyId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const political = await getCompanyPoliticalData(company.id);
    const pacInfo = pacMap.get(company.id);

    res.json({
      ...company,
      political,
      pac: pacInfo || null,
    });
  } catch (err) {
    console.error('Company error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/company/:companyId/issues — returns company issue stances
app.get('/api/company/:companyId/issues', (req, res) => {
  const { companyId } = req.params;
  const issues = companyIssuesData[companyId];
  if (!issues) {
    return res.json({ companyId, issues: {} });
  }
  res.json({ companyId, ...issues });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`VWYD API server running on http://localhost:${PORT}`);
});
