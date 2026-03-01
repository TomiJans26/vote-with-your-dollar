// DollarVote Extension - Content Script
// Detects products on shopping sites and shows alignment badges

(function() {
  'use strict';

  const BADGE_CLASS = 'dollarvote-badge';
  const PROCESSED_ATTR = 'data-dollarvote';

  // Site-specific selectors for product elements
  const SITE_CONFIG = {
    'www.amazon.com': {
      productCards: '[data-component-type="s-search-result"], .s-result-item',
      brandText: '.a-size-base-plus, .a-row .a-size-base',
      titleText: 'h2 a span, .a-text-normal',
      insertTarget: '.a-section .a-spacing-small, .a-row:last-child',
      priceText: '.a-price .a-offscreen',
    },
    'www.walmart.com': {
      productCards: '[data-item-id], [data-testid="list-view"]',
      brandText: '[data-automation-id="product-brand"]',
      titleText: '[data-automation-id="product-title"], span[data-automation-id="name"]',
      insertTarget: '[data-automation-id="product-price"]',
    },
    'www.target.com': {
      productCards: '[data-test="product-card"], [data-test="@web/ProductCard"]',
      brandText: '[data-test="product-brand"]',
      titleText: '[data-test="product-title"] a',
      insertTarget: '[data-test="product-price"]',
    },
    'www.kroger.com': {
      productCards: '.ProductCard, [data-testid="product-card"]',
      brandText: '.ProductCard-Brand',
      titleText: '.ProductCard-Title',
      insertTarget: '.ProductCard-Price',
    },
  };

  const hostname = window.location.hostname;
  const config = SITE_CONFIG[hostname];
  if (!config) return;

  function getScoreColor(pct) {
    if (pct >= 70) return { bg: '#10B981', text: '#fff' };
    if (pct >= 40) return { bg: '#F59E0B', text: '#fff' };
    return { bg: '#EF4444', text: '#fff' };
  }

  function createBadge(data) {
    const badge = document.createElement('div');
    badge.className = BADGE_CLASS;

    if (!data || !data.company) {
      badge.innerHTML = `<span class="dv-badge dv-badge-unknown" title="DollarVote: Brand not found">🗳️ ?</span>`;
      return badge;
    }

    const score = data.alignment_pct ?? 50;
    const colors = getScoreColor(score);
    const dealBreaker = data.deal_breaker ? ' 🚫' : '';
    const companyName = data.company.name || 'Unknown';

    badge.innerHTML = `
      <a href="https://dollarvote.app/company/${encodeURIComponent(companyName)}"
         target="_blank" rel="noopener noreferrer"
         class="dv-badge"
         style="background:${colors.bg};color:${colors.text}"
         title="DollarVote: ${companyName} — ${score}% aligned with your values${dealBreaker}">
        🗳️ ${score}%${dealBreaker}
      </a>
    `;
    return badge;
  }

  async function processProduct(card) {
    if (card.getAttribute(PROCESSED_ATTR)) return;
    card.setAttribute(PROCESSED_ATTR, 'true');

    // Extract brand/title
    let brand = '';
    if (config.brandText) {
      const brandEl = card.querySelector(config.brandText);
      brand = brandEl?.textContent?.trim() || '';
    }
    if (!brand && config.titleText) {
      const titleEl = card.querySelector(config.titleText);
      brand = titleEl?.textContent?.trim()?.split(/\s+/).slice(0, 3).join(' ') || '';
    }
    if (!brand) return;

    // Lookup via background
    const result = await chrome.runtime.sendMessage({ type: 'LOOKUP_BRAND', brand });

    // Insert badge
    const badge = createBadge(result);
    const target = config.insertTarget ? card.querySelector(config.insertTarget) : null;
    if (target) {
      target.parentNode.insertBefore(badge, target.nextSibling);
    } else {
      card.appendChild(badge);
    }
  }

  function scanPage() {
    const cards = document.querySelectorAll(config.productCards);
    cards.forEach(card => processProduct(card));
  }

  // Initial scan
  setTimeout(scanPage, 1000);

  // Watch for dynamically loaded products
  const observer = new MutationObserver((mutations) => {
    let hasNewNodes = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0) { hasNewNodes = true; break; }
    }
    if (hasNewNodes) {
      setTimeout(scanPage, 500);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();
