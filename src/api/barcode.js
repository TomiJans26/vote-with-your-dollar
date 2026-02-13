const axios = require('axios');

/**
 * Look up a product by barcode using Open Food Facts.
 * @param {string} barcode
 * @returns {Promise<object|null>} Product data or null
 */
async function lookupOpenFoodFacts(barcode) {
  try {
    const { data } = await axios.get(
      `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`,
      { timeout: 5000 }
    );
    if (data.status === 1 && data.product) {
      const p = data.product;
      return {
        source: 'openfoodfacts',
        barcode,
        name: p.product_name || null,
        brand: p.brands || null,
        categories: p.categories || null,
        image: p.image_url || null,
        raw: p,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Look up a product by barcode using UPCitemdb (trial endpoint).
 * @param {string} barcode
 * @returns {Promise<object|null>}
 */
async function lookupUPCitemdb(barcode) {
  try {
    const { data } = await axios.get(
      `https://api.upcitemdb.com/prod/trial/lookup`,
      { params: { upc: barcode }, timeout: 5000 }
    );
    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return {
        source: 'upcitemdb',
        barcode,
        name: item.title || null,
        brand: item.brand || null,
        categories: item.category || null,
        image: item.images?.[0] || null,
        raw: item,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Look up a barcode with fallback: tries Open Food Facts first, then UPCitemdb.
 * @param {string} barcode
 * @returns {Promise<object|null>}
 */
async function lookupBarcode(barcode) {
  const result = await lookupOpenFoodFacts(barcode);
  if (result) return result;
  return lookupUPCitemdb(barcode);
}

module.exports = { lookupBarcode, lookupOpenFoodFacts, lookupUPCitemdb };
