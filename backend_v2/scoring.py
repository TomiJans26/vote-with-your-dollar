"""Belief alignment scoring engine — distance-based model.

Both user and company stances are mapped to a 1-5 scale:
  1 = strongly oppose, 2 = lean oppose, 3 = neutral, 4 = lean support, 5 = strongly support

Alignment per issue = (4 - gap) / 4, where gap = |user - company|
  Gap 0 → 100% aligned
  Gap 1 → 75% aligned
  Gap 2 → 50% aligned
  Gap 3 → 25% aligned
  Gap 4 → 0% aligned

Final score = weighted average of per-issue alignment, weighted by importance.
"""

ISSUE_NAMES = {
    "abortion": "Abortion / Reproductive Rights",
    "lgbtq_rights": "LGBTQ+ Rights",
    "racial_justice": "Racial Justice / Equity",
    "immigration": "Immigration",
    "religious_liberty": "Religious Liberty",
    "death_penalty": "Death Penalty",
    "workers_rights": "Workers' Rights / Labor Unions",
    "minimum_wage": "Minimum Wage / Living Wage",
    "corporate_tax": "Corporate Tax Policy",
    "free_trade": "Free Trade vs Protectionism",
    "climate_change": "Climate Change / Carbon Emissions",
    "renewable_energy": "Renewable Energy",
    "environmental_regulations": "Environmental Regulations",
    "animal_rights": "Animal Rights / Welfare",
    "gun_control": "Gun Control / 2nd Amendment",
    "military_spending": "Military / Defense Spending",
    "police_reform": "Police Reform / Criminal Justice",
    "drug_policy": "Drug Policy / Legalization",
    "universal_healthcare": "Universal Healthcare",
    "education_funding": "Education Funding",
    "student_debt": "Student Debt",
    "vaccine_policy": "Vaccine Policy",
}

IMPORTANCE_WEIGHTS = {0: 0, 1: 1, 2: 3, 3: 5}  # 0=don't care, 1=somewhat, 2=very, 3=dealbreaker
IMPORTANCE_LABELS = {0: "don't care", 1: "somewhat important", 2: "very important", 3: "deal breaker"}

STANCE_TO_NUM = {
    "strong_oppose": -1.0,
    "lean_oppose": -0.5,
    "neutral": 0.0,
    "lean_support": 0.5,
    "strong_support": 1.0,
}


def _parse_stance(val) -> float:
    """Convert stance to numeric -1.0 to 1.0. Handles both string labels and numbers."""
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        return STANCE_TO_NUM.get(val.lower().strip(), 0.0)
    return 0.0


def _to_1_5(val_neg1_to_1: float) -> float:
    """Map a value from -1..1 to 1..5 scale."""
    return (val_neg1_to_1 + 1) * 2 + 1  # -1→1, 0→3, 1→5


def score_company(
    company_issues: dict,
    belief_profile: dict,
    original_company_issues: dict | None = None,
    original_company_name: str | None = None,
) -> dict:
    if not company_issues or not belief_profile:
        return {"score": 0, "pct": 50, "dealBreakerHit": False, "label": "Unknown",
                "reasons": [], "matchingIssues": [], "conflictingIssues": []}

    reasons, matching, conflicting = [], [], []
    weighted_alignment_sum = 0.0
    total_weight = 0.0
    deal_breaker_hit = False
    issues_scored = 0

    for issue_id, belief in belief_profile.items():
        if not isinstance(belief, dict):
            continue
        importance = belief.get("importance", 0)
        if importance == 0:
            continue
        ci = company_issues.get(issue_id)
        if not ci:
            continue

        # Map both to 1-5 scale
        user_raw = belief.get("stance", 0)  # -2 to 2 from onboarding
        user_1_5 = _to_1_5(user_raw / 2)   # normalize -2..2 → -1..1 → 1..5

        company_raw = _parse_stance(ci.get("stance", 0))  # -1.0 to 1.0
        company_1_5 = _to_1_5(company_raw)  # → 1..5

        # Distance-based alignment
        gap = abs(user_1_5 - company_1_5)   # 0 to 4
        alignment = (4 - gap) / 4           # 1.0 = perfect, 0.0 = opposite

        issue_name = ISSUE_NAMES.get(issue_id, issue_id)
        imp_label = IMPORTANCE_LABELS.get(importance, "")
        weight = IMPORTANCE_WEIGHTS.get(importance, 0)
        issues_scored += 1

        # Deal breaker check: if gap is > 2 (more than half the scale apart)
        if importance == 3:
            if gap > 2:
                deal_breaker_hit = True
                conflicting.append(issue_id)
                reasons.append(f"🚫 Deal breaker: {issue_name} — company is {gap:.0f} points away from your stance")
            else:
                matching.append(issue_id)
                weighted_alignment_sum += alignment * weight
                total_weight += weight
                if gap <= 1:
                    reasons.append(f"✅ {issue_name} — closely aligned (deal breaker, gap: {gap:.0f})")
        else:
            weighted_alignment_sum += alignment * weight
            total_weight += weight

            if gap <= 1:
                matching.append(issue_id)
                # Check if this is BETTER than the original company
                orig_issue = (original_company_issues or {}).get(issue_id)
                if orig_issue:
                    orig_company_1_5 = _to_1_5(_parse_stance(orig_issue.get("stance", 0)))
                    orig_gap = abs(user_1_5 - orig_company_1_5)
                    if orig_gap > gap:
                        reasons.append(f"✅ {issue_name} ({imp_label}) — closer to you than {original_company_name or 'the original'}")
                    else:
                        reasons.append(f"✅ {issue_name} ({imp_label})")
                else:
                    reasons.append(f"✅ {issue_name} ({imp_label})")
            elif gap >= 3:
                conflicting.append(issue_id)
                reasons.append(f"⚠️ {issue_name} — {gap:.0f} points apart")

    # Calculate final percentage
    if deal_breaker_hit:
        pct = 0
        label = "🚫 Deal Breaker"
    elif total_weight > 0:
        pct = round((weighted_alignment_sum / total_weight) * 100)
        pct = max(0, min(100, pct))

        if pct >= 75:
            label = "Great match"
        elif pct >= 60:
            label = "Good match"
        elif pct >= 40:
            label = "Mixed"
        elif pct >= 25:
            label = "Weak match"
        else:
            label = "Poor match"
    else:
        pct = 50
        label = "No data"

    # Coverage warning
    total_user_issues = sum(1 for i, b in belief_profile.items()
                           if isinstance(b, dict) and b.get("importance", 0) > 0)
    if issues_scored < total_user_issues * 0.3 and not deal_breaker_hit:
        reasons.append(f"📊 Limited data — scored {issues_scored} of your {total_user_issues} important issues")

    # Score as -1 to 1 for compatibility (pct is the primary display value now)
    score = (pct / 50) - 1  # 0%→-1, 50%→0, 100%→1

    return {
        "score": round(score, 3),
        "pct": pct,
        "dealBreakerHit": deal_breaker_hit,
        "label": label,
        "reasons": reasons[:6],
        "matchingIssues": matching,
        "conflictingIssues": conflicting,
    }
