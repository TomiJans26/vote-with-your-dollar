// DollarVote Extension - Background Service Worker
const API_BASE = 'https://dollarvote.app/api';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

// Cache for company lookups
const companyCache = new Map();

// Listen for messages from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'LOOKUP_BRAND') {
    lookupBrand(msg.brand).then(sendResponse);
    return true; // async response
  }
  if (msg.type === 'LOOKUP_COMPANY') {
    lookupCompany(msg.company).then(sendResponse);
    return true;
  }
});

async function lookupBrand(brandName) {
  const cacheKey = `brand:${brandName.toLowerCase()}`;
  if (companyCache.has(cacheKey)) {
    const cached = companyCache.get(cacheKey);
    if (Date.now() - cached.time < CACHE_TTL) return cached.data;
  }

  try {
    const resp = await fetch(`${API_BASE}/v2/search?q=${encodeURIComponent(brandName)}&limit=1`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const result = data.results?.[0] || null;
    companyCache.set(cacheKey, { data: result, time: Date.now() });
    return result;
  } catch (e) {
    console.error('DollarVote lookup failed:', e);
    return null;
  }
}

async function lookupCompany(companyName) {
  const cacheKey = `company:${companyName.toLowerCase()}`;
  if (companyCache.has(cacheKey)) {
    const cached = companyCache.get(cacheKey);
    if (Date.now() - cached.time < CACHE_TTL) return cached.data;
  }

  try {
    const resp = await fetch(`${API_BASE}/v2/company?name=${encodeURIComponent(companyName)}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    companyCache.set(cacheKey, { data, time: Date.now() });
    return data;
  } catch (e) {
    console.error('DollarVote company lookup failed:', e);
    return null;
  }
}
