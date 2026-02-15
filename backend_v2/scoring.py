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

        user_stance = belief.get("stance", 0) / 2
        company_stance = ci.get("stance", 0)
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
                if orig_issue and user_stance * orig_issue.get("stance", 0) < 0:
                    reasons.append(f"✅ Supports {issue_name} ({imp_label} to you) — unlike {original_company_name or 'the original company'}")
                else:
                    reasons.append(f"✅ Supports {issue_name} ({imp_label} to you)")
            elif score < -0.3:
                conflicting.append(issue_id)
                reasons.append(f"⚠️ Mixed on {issue_name}")

    final_score = max(-1, min(1, weighted_sum / total_weight)) if total_weight > 0 else 0
    if deal_breaker_hit:
        final_score = -1

    if final_score > 0.4:
        label = "Great match"
    elif final_score > 0.1:
        label = "Good match"
    elif final_score > -0.1:
        label = "Mixed"
    elif final_score > -0.4:
        label = "Weak match"
    else:
        label = "Poor match"

    return {
        "score": round(final_score, 3),
        "pct": max(0, round(((final_score + 1) / 2) * 100)),
        "dealBreakerHit": deal_breaker_hit,
        "label": label,
        "reasons": reasons[:6],
        "matchingIssues": matching,
        "conflictingIssues": conflicting,
    }
