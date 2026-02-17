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
export function getBeliefAlignment(companyIssues, beliefProfile) {
  if (!companyIssues || !beliefProfile) return { score: 0, dealBreakerHit: false, triggers: [], label: 'No data', color: 'gray' };

  const triggers = [];
  let weightedSum = 0;
  let totalWeight = 0;
  let dealBreakerHit = false;

  const importanceWeights = [0, 1, 3, 0]; // 0=don't care, 1=somewhat, 2=very, 3=dealbreaker (handled separately)

  for (const issueId of Object.keys(beliefProfile)) {
    const belief = beliefProfile[issueId];
    const company = companyIssues[issueId];
    if (!belief || !company) continue;
    if (belief.importance === 0) continue; // don't care

    // User stance normalized to -1..1 (from -2..2)
    const userStance = belief.stance / 2;
    const companyStance = company.stance;

    // Agreement: 1 = perfectly aligned, -1 = perfectly opposed
    const agreement = 1 - Math.abs(userStance - companyStance);

    // Find the issue name
    const issueDef = ALL_ISSUES.find(i => i.id === issueId);
    const issueName = issueDef?.name || issueId;

    if (belief.importance === 3) {
      // DEAL BREAKER: if company opposes user's stance significantly
      const misalignment = userStance * companyStance; // negative if opposed
      if (misalignment < -0.2) {
        dealBreakerHit = true;
        triggers.push({
          issueId,
          issueName,
          type: 'dealbreaker',
          notes: company.notes || `Company stance conflicts with your deal breaker on ${issueName}`,
          companyStance,
          userStance,
        });
      } else if (misalignment > 0.2) {
        // Aligned on dealbreaker - big positive
        weightedSum += 5;
        totalWeight += 5;
      }
    } else {
      const weight = importanceWeights[belief.importance];
      // Score: how much they agree (-1 to 1)
      const score = userStance * companyStance; // positive if same direction
      weightedSum += score * weight;
      totalWeight += weight;

      if (Math.abs(score) > 0.3) {
        triggers.push({
          issueId,
          issueName,
          type: score > 0 ? 'aligned' : 'misaligned',
          notes: company.notes,
          companyStance,
          userStance,
        });
      }
    }
  }

  if (dealBreakerHit) {
    return {
      score: -1,
      dealBreakerHit: true,
      triggers,
      label: '🚫 Deal Breaker',
      color: 'dealbreaker',
    };
  }

  const rawScore = totalWeight > 0 ? Math.max(-1, Math.min(1, weightedSum / totalWeight)) : 0;
  // Stretch the score for display — small differences become visible
  const score = Math.max(-1, Math.min(1, rawScore * 2));

  let label, color;
  if (rawScore > 0.3) { label = '👍 Great match'; color = 'green'; }
  else if (rawScore > 0.1) { label = '👍 Good match'; color = 'lightgreen'; }
  else if (rawScore > -0.1) { label = '➖ Mixed'; color = 'yellow'; }
  else if (rawScore > -0.3) { label = '👎 Weak match'; color = 'orange'; }
  else { label = '👎 Poor match'; color = 'red'; }

  return { score, dealBreakerHit: false, triggers, label, color };
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
