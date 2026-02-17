"""Belief alignment scoring engine — ported from Flask backend."""

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

IMPORTANCE_WEIGHTS = [0, 1, 3, 0]  # 0=don't care, 1=somewhat, 2=very, 3=dealbreaker
IMPORTANCE_LABELS = {0: "don't care", 1: "somewhat important", 2: "very important", 3: "deal breaker"}

STANCE_TO_NUM = {
    "strong_oppose": -1.0,
    "lean_oppose": -0.5,
    "neutral": 0.0,
    "lean_support": 0.5,
    "strong_support": 1.0,
}


def _parse_stance(val) -> float:
    """Convert stance to numeric. Handles both string labels and numbers."""
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, str):
        return STANCE_TO_NUM.get(val.lower().strip(), 0.0)
    return 0.0


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
    weighted_sum = total_weight = 0.0
    deal_breaker_hit = False

    for issue_id, belief in belief_profile.items():
        if not isinstance(belief, dict):
            continue
        importance = belief.get("importance", 0)
        if importance == 0:
            continue
        ci = company_issues.get(issue_id)
        if not ci:
            continue

        user_stance = belief.get("stance", 0) / 2  # user stance is -2 to 2, normalize to -1 to 1
        company_stance = _parse_stance(ci.get("stance", 0))
        issue_name = ISSUE_NAMES.get(issue_id, issue_id)
        imp_label = IMPORTANCE_LABELS.get(importance, "")
        orig_issue = (original_company_issues or {}).get(issue_id)

        if importance == 3:
            misalignment = user_stance * company_stance
            if misalignment < -0.2:
                deal_breaker_hit = True
                conflicting.append(issue_id)
                reasons.append(f"🚫 Conflicts with your deal breaker on {issue_name}")
            elif misalignment > 0.2:
                weighted_sum += 5
                total_weight += 5
                matching.append(issue_id)
                reasons.append(f"✅ Supports {issue_name} (your deal breaker)")
        else:
            weight = IMPORTANCE_WEIGHTS[importance]
            score = user_stance * company_stance
            weighted_sum += score * weight
            total_weight += weight

            if score > 0.3:
                matching.append(issue_id)
                if orig_issue and user_stance * _parse_stance(orig_issue.get("stance", 0)) < 0:
                    reasons.append(f"✅ Supports {issue_name} ({imp_label} to you) — unlike {original_company_name or 'the original company'}")
                else:
                    reasons.append(f"✅ Supports {issue_name} ({imp_label} to you)")
            elif score < -0.3:
                conflicting.append(issue_id)
                reasons.append(f"⚠️ Mixed on {issue_name}")

    final_score = max(-1, min(1, weighted_sum / total_weight)) if total_weight > 0 else 0
    if deal_breaker_hit:
        final_score = -1

    # Stretch the score to use more of the 0-100 range
    # Apply a 2x multiplier capped at -1 to 1 for more granularity
    display_score = max(-1, min(1, final_score * 2))

    if final_score > 0.3:
        label = "Great match"
    elif final_score > 0.1:
        label = "Good match"
    elif final_score > -0.1:
        label = "Mixed"
    elif final_score > -0.3:
        label = "Weak match"
    else:
        label = "Poor match"

    # Count how many user issues had no company data
    total_user_issues = sum(1 for i, b in belief_profile.items() if isinstance(b, dict) and b.get("importance", 0) > 0)
    matched_issues = len(matching) + len(conflicting)
    coverage = matched_issues / total_user_issues if total_user_issues > 0 else 0
    if coverage < 0.3 and not deal_breaker_hit:
        reasons.append(f"📊 Limited data — we only have info on {len([k for k in belief_profile if isinstance(belief_profile.get(k), dict) and belief_profile[k].get('importance', 0) > 0 and company_issues.get(k)])} of your {total_user_issues} important issues")

    return {
        "score": round(final_score, 3),
        "pct": max(0, min(100, round(((display_score + 1) / 2) * 100))),
        "dealBreakerHit": deal_breaker_hit,
        "label": label,
        "reasons": reasons[:6],
        "matchingIssues": matching,
        "conflictingIssues": conflicting,
    }
