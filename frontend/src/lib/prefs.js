import { ALL_ISSUES, ISSUE_CATEGORIES } from './issues';

const KEY = 'vwyd_prefs';
const PROFILE_KEY = 'vwyd_belief_profile';
const ONBOARDED_KEY = 'vwyd_onboarded';

const defaults = {
  leaning: 0,
  issues: [],
};

export function getPrefs() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY)) };
  } catch {
    return { ...defaults };
  }
}

export function savePrefs(prefs) {
  localStorage.setItem(KEY, JSON.stringify(prefs));
}

// --- Belief Profile ---

/**
 * Belief profile shape:
 * {
 *   [issueId]: { stance: -2..2, importance: 0..3 }
 * }
 */
export function getBeliefProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem(PROFILE_KEY));
    return stored || {};
  } catch {
    return {};
  }
}

export function saveBeliefProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function hasCompletedOnboarding() {
  return localStorage.getItem(ONBOARDED_KEY) === 'true';
}

export function setOnboardingComplete() {
  localStorage.setItem(ONBOARDED_KEY, 'true');
}

/**
 * Old alignment function (kept for backward compat)
 */
export function getAlignment(political, prefs) {
  if (!political || !political.donations?.total) return 0;
  const { percentDem, percentRep } = political;
  const lean = prefs?.leaning || 0;

  if (lean < 0) {
    return ((percentDem - percentRep) / 100);
  } else if (lean > 0) {
    return ((percentRep - percentDem) / 100);
  }
  return 0;
}

/**
 * New belief-based scoring. Returns:
 * { score: -1..1, dealBreakerHit: bool, triggers: [...], label, color }
 *
 * companyIssues: { [issueId]: { stance: -1..1, confidence, notes } }
 */
/**
 * Continuous distance-based alignment scoring.
 * Both stances on -1.0 to 1.0 continuous scale.
 * Alignment = 1 - (gap / 2), where gap = |user - company| (0 to 2 range)
 *   Gap 0.0 → 100%, Gap 0.5 → 75%, Gap 1.0 → 50%, Gap 2.0 → 0%
 * Continuous = granular. 51% ≠ 50%. Every decimal matters.
 */
export function getBeliefAlignment(companyIssues, beliefProfile) {
  if (!companyIssues || !beliefProfile) return { score: 0, pct: 50, dealBreakerHit: false, triggers: [], label: 'No data', color: 'gray' };

  const triggers = [];
  let weightedAlignmentSum = 0;
  let totalWeight = 0;
  let dealBreakerHit = false;

  const importanceWeights = { 0: 0, 1: 1, 2: 3, 3: 5 };

  for (const issueId of Object.keys(beliefProfile)) {
    const belief = beliefProfile[issueId];
    const company = companyIssues[issueId];
    if (!belief || !company) continue;
    if (belief.importance === 0) continue;

    // Both on -5 to +5 scale
    const userVal = Math.max(-5, Math.min(5, belief.stance)); // already -5..5 from slider
    const companyRawStance = typeof company.stance === 'number' ? company.stance : 0;
    const companyVal = companyRawStance * 5; // -1..1 → -5..5

    // Skip neutral/no-data company stances — silence ≠ disagreement
    const companyConf = (company.confidence || '').toLowerCase();
    if (companyRawStance === 0 && (companyConf === 'low' || companyConf === '' || !company.confidence)) {
      continue; // Don't count "no data" as 50% alignment
    }

    // Continuous distance
    const gap = Math.abs(userVal - companyVal); // 0.0 to 10.0
    const alignment = 1.0 - (gap / 10.0);      // 1.0 = perfect, 0.0 = opposite

    const issueDef = ALL_ISSUES.find(i => i.id === issueId);
    const issueName = issueDef?.name || issueId;
    const weight = importanceWeights[belief.importance] || 0;

    if (belief.importance === 3) {
      // Deal breaker: if gap > 5 (more than half the 10-point scale apart)
      if (gap > 5) {
        dealBreakerHit = true;
        triggers.push({
          issueId, issueName, type: 'dealbreaker',
          notes: company.notes || `${Math.round(gap)} points apart on ${issueName}`,
          companyStance: companyVal, userStance: userVal, gap,
        });
      } else {
        weightedAlignmentSum += alignment * weight;
        totalWeight += weight;
        if (gap <= 2) {
          triggers.push({
            issueId, issueName, type: 'aligned',
            notes: company.notes, companyStance: companyVal, userStance: userVal, gap,
          });
        }
      }
    } else {
      weightedAlignmentSum += alignment * weight;
      totalWeight += weight;

      if (gap <= 2) {
        triggers.push({
          issueId, issueName, type: 'aligned',
          notes: company.notes, companyStance: companyVal, userStance: userVal, gap,
        });
      } else if (gap >= 7) {
        triggers.push({
          issueId, issueName, type: 'misaligned',
          notes: company.notes, companyStance: companyVal, userStance: userVal, gap,
        });
      }
    }
  }

  if (dealBreakerHit) {
    return {
      score: -1, pct: 0, dealBreakerHit: true, triggers,
      label: '🚫 Deal Breaker', color: 'dealbreaker',
    };
  }

  const pct = totalWeight > 0 ? Math.round((weightedAlignmentSum / totalWeight) * 100) : 50;
  const clampedPct = Math.max(0, Math.min(100, pct));
  const score = (clampedPct / 50) - 1;

  let label, color;
  if (clampedPct >= 75) { label = '👍 Great match'; color = 'green'; }
  else if (clampedPct >= 60) { label = '👍 Good match'; color = 'lightgreen'; }
  else if (clampedPct >= 40) { label = '➖ Mixed'; color = 'yellow'; }
  else if (clampedPct >= 25) { label = '👎 Weak match'; color = 'orange'; }
  else { label = '👎 Poor match'; color = 'red'; }

  return { score, pct: clampedPct, dealBreakerHit: false, triggers, label, color };
}

/**
 * Get summary stats for the belief profile
 */
export function getProfileSummary(profile) {
  if (!profile) return { total: 0, dealBreakers: 0, categories: [] };

  const entries = Object.entries(profile).filter(([_, v]) => v.importance > 0);
  const dealBreakers = entries.filter(([_, v]) => v.importance === 3);

  const categorySummary = ISSUE_CATEGORIES.map(cat => {
    const catIssues = cat.issues.filter(i => profile[i.id]?.importance > 0);
    return { ...cat, activeCount: catIssues.length };
  }).filter(c => c.activeCount > 0);

  return {
    total: entries.length,
    dealBreakers: dealBreakers.length,
    categories: categorySummary,
  };
}
