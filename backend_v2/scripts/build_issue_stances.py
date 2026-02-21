# Build issue stances for new companies from publicly known corporate positions
# Sources: ESG reports, public statements, SEC filings, news coverage
# Stance scale: -1.0 (strongly left/progressive) to +1.0 (strongly right/conservative)
# 0.0 = neutral or unknown
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Issue stances based on well-documented public corporate positions
# Each entry: { issue_key: { stance: float, confidence: "high"|"medium"|"low", notes: str } }
NEW_COMPANY_ISSUES = {
    # === TECH COMPANIES ===
    "apple": {
        "issues": {
            "climate_change": {"stance": -0.8, "confidence": "high", "notes": "Carbon neutral since 2020. Committed to 100% clean energy supply chain by 2030."},
            "lgbtq_rights": {"stance": -0.8, "confidence": "high", "notes": "Tim Cook openly gay CEO. Strong internal LGBTQ+ policies. Sponsors Pride events."},
            "workers_rights": {"stance": 0.3, "confidence": "medium", "notes": "Anti-union stance at retail stores. Fought unionization efforts. But good benefits."},
            "immigration": {"stance": -0.5, "confidence": "medium", "notes": "Opposed travel bans. DACA supporter. Tim Cook vocal on immigration reform."},
            "racial_justice": {"stance": -0.5, "confidence": "medium", "notes": "$100M Racial Equity and Justice Initiative."},
            "environmental_regulations": {"stance": -0.6, "confidence": "high", "notes": "Supports Paris Agreement. Lobbies for environmental regulation."},
            "renewable_energy": {"stance": -0.8, "confidence": "high", "notes": "100% renewable energy for global operations."},
            "gun_control": {"stance": -0.3, "confidence": "low", "notes": "Removed gun emoji. Generally progressive stance but not very vocal."},
            "corporate_tax": {"stance": 0.5, "confidence": "high", "notes": "Extensive use of tax havens (Ireland structure). Lobbies against tax increases."},
        }
    },
    "microsoft": {
        "issues": {
            "climate_change": {"stance": -0.9, "confidence": "high", "notes": "Carbon negative by 2030 pledge. Removing all historical carbon emissions by 2050."},
            "lgbtq_rights": {"stance": -0.7, "confidence": "high", "notes": "Perfect HRC score. Strong LGBTQ+ workplace policies."},
            "workers_rights": {"stance": -0.2, "confidence": "medium", "notes": "Voluntarily recognized Activision Blizzard union. Better than most tech."},
            "immigration": {"stance": -0.6, "confidence": "high", "notes": "Brad Smith vocal on DACA. Fought travel bans. Supports immigration reform."},
            "racial_justice": {"stance": -0.5, "confidence": "medium", "notes": "$150M diversity initiative. Published racial equity data."},
            "renewable_energy": {"stance": -0.8, "confidence": "high", "notes": "100% renewable energy. Massive solar/wind investments."},
            "military_spending": {"stance": 0.4, "confidence": "medium", "notes": "Major defense contractor (JEDI/Azure). HoloLens army contract."},
            "gun_control": {"stance": -0.3, "confidence": "low", "notes": "Generally progressive but not vocal on guns specifically."},
        }
    },
    "google-alphabet": {
        "issues": {
            "climate_change": {"stance": -0.8, "confidence": "high", "notes": "Carbon neutral since 2007. 24/7 carbon-free energy by 2030 goal."},
            "lgbtq_rights": {"stance": -0.7, "confidence": "high", "notes": "Perfect HRC score. Strong internal policies."},
            "workers_rights": {"stance": 0.4, "confidence": "high", "notes": "Fired union organizers. Anti-union culture. Contractor workforce issues."},
            "immigration": {"stance": -0.6, "confidence": "high", "notes": "Vocal H-1B supporter. Opposed travel bans."},
            "drug_policy": {"stance": -0.3, "confidence": "low", "notes": "Generally progressive culture but no strong corporate stance."},
            "renewable_energy": {"stance": -0.9, "confidence": "high", "notes": "Largest corporate buyer of renewable energy globally."},
            "corporate_tax": {"stance": 0.5, "confidence": "high", "notes": "Complex international tax structures. Lobbies on tax policy."},
        }
    },
    "amazon-retail": {
        "issues": {
            "climate_change": {"stance": -0.5, "confidence": "medium", "notes": "Climate Pledge co-founder. But massive carbon footprint from delivery."},
            "workers_rights": {"stance": 0.7, "confidence": "high", "notes": "Aggressive anti-union campaigns. Warehouse working conditions criticized. Low starting wages historically."},
            "minimum_wage": {"stance": -0.3, "confidence": "medium", "notes": "Raised to $15/hr in 2018, now $17+. Lobbied for federal $15 minimum."},
            "lgbtq_rights": {"stance": -0.5, "confidence": "medium", "notes": "Good HRC score. Internal policies strong."},
            "corporate_tax": {"stance": 0.7, "confidence": "high", "notes": "Paid $0 federal income tax multiple years. Heavy tax optimization."},
            "renewable_energy": {"stance": -0.5, "confidence": "medium", "notes": "100% renewable by 2025 goal. But overall footprint still massive."},
        }
    },
    "meta": {
        "issues": {
            "lgbtq_rights": {"stance": -0.3, "confidence": "medium", "notes": "Good HRC score but platform enforcement inconsistent."},
            "climate_change": {"stance": -0.5, "confidence": "medium", "notes": "Net zero by 2030. 100% renewable energy for operations."},
            "gun_control": {"stance": -0.2, "confidence": "low", "notes": "Banned some gun sales on platform. Inconsistent enforcement."},
            "vaccine_policy": {"stance": -0.3, "confidence": "medium", "notes": "Labeled COVID misinformation. Partnered with health authorities."},
            "corporate_tax": {"stance": 0.6, "confidence": "high", "notes": "Irish tax structure. Significant tax optimization."},
            "workers_rights": {"stance": 0.2, "confidence": "medium", "notes": "Massive layoffs 2022-2023. Contractor workforce."},
        }
    },
    "tesla": {
        "issues": {
            "climate_change": {"stance": -0.9, "confidence": "high", "notes": "Core business is EVs and clean energy. Accelerating world transition to sustainable energy."},
            "renewable_energy": {"stance": -0.9, "confidence": "high", "notes": "Solar panels, Powerwall, Megapack. Core to business model."},
            "workers_rights": {"stance": 0.7, "confidence": "high", "notes": "Musk strongly anti-union. NLRB violations. Fired organizing workers."},
            "lgbtq_rights": {"stance": 0.3, "confidence": "medium", "notes": "Musk has made anti-trans comments. Company moved HQ to Texas."},
            "immigration": {"stance": 0.3, "confidence": "medium", "notes": "Musk shifted to anti-immigration rhetoric. DOGE focus on deportation."},
            "racial_justice": {"stance": 0.4, "confidence": "medium", "notes": "Racial discrimination lawsuits at Fremont factory. $137M verdict (later reduced)."},
            "gun_control": {"stance": 0.5, "confidence": "medium", "notes": "Musk is pro-2nd Amendment. Opposes gun regulation."},
            "free_trade": {"stance": 0.3, "confidence": "medium", "notes": "Musk supports some tariffs. Close to Trump administration."},
        }
    },

    # === AUTOMOTIVE ===
    "general-motors": {
        "issues": {
            "climate_change": {"stance": -0.6, "confidence": "high", "notes": "All-EV by 2035 pledge. $35B EV investment. But also lobbied against emissions rules historically."},
            "workers_rights": {"stance": -0.2, "confidence": "medium", "notes": "UAW union. Major 2023 strike resulted in 25% raises. Mixed history."},
            "renewable_energy": {"stance": -0.5, "confidence": "medium", "notes": "100% renewable energy by 2025 for US facilities."},
            "military_spending": {"stance": 0.3, "confidence": "medium", "notes": "Defense contracts. GM Defense subsidiary."},
        }
    },
    "ford": {
        "issues": {
            "climate_change": {"stance": -0.5, "confidence": "medium", "notes": "Heavy EV investment (F-150 Lightning, Mustang Mach-E). But scaled back some EV plans."},
            "workers_rights": {"stance": -0.2, "confidence": "medium", "notes": "UAW union. 2023 strike. Generally works with unions."},
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Good HRC score. Sponsors Pride. Some conservative backlash."},
            "environmental_regulations": {"stance": -0.2, "confidence": "medium", "notes": "Split from Trump admin on emissions rollback. Supports CA standards."},
        }
    },
    "toyota": {
        "issues": {
            "climate_change": {"stance": 0.2, "confidence": "medium", "notes": "Criticized for lobbying against EV mandates. Bet on hydrogen over EVs. Slow EV transition."},
            "environmental_regulations": {"stance": 0.3, "confidence": "medium", "notes": "Lobbied against stricter emissions standards. Donated to election deniers."},
            "workers_rights": {"stance": 0.2, "confidence": "medium", "notes": "Non-union US plants. Opposed UAW organizing."},
        }
    },

    # === RESTAURANTS ===
    "mcdonalds": {
        "issues": {
            "minimum_wage": {"stance": 0.3, "confidence": "medium", "notes": "Historically opposed minimum wage increases. Franchise model shifts responsibility."},
            "workers_rights": {"stance": 0.4, "confidence": "medium", "notes": "Anti-union. Fight for $15 campaign targeted McDonald's heavily."},
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Some sustainability pledges. Sustainable beef commitments. But massive footprint."},
            "animal_rights": {"stance": 0.2, "confidence": "medium", "notes": "Some cage-free pledges but slow implementation. Animal welfare activists target them."},
        }
    },
    "starbucks-corp": {
        "issues": {
            "lgbtq_rights": {"stance": -0.6, "confidence": "high", "notes": "Early supporter of marriage equality. Trans healthcare benefits. Pride support."},
            "workers_rights": {"stance": 0.5, "confidence": "high", "notes": "Aggressive anti-union campaign under Schultz. NLRB complaints. Closed unionizing stores."},
            "minimum_wage": {"stance": -0.3, "confidence": "medium", "notes": "Higher than minimum starting pay. Good benefits for part-time."},
            "racial_justice": {"stance": -0.5, "confidence": "medium", "notes": "Closed stores for racial bias training after Philadelphia incident."},
            "climate_change": {"stance": -0.4, "confidence": "medium", "notes": "Reusable cup goals. Sustainability commitments. Plant-based options."},
        }
    },
    "chick-fil-a": {
        "issues": {
            "lgbtq_rights": {"stance": 0.8, "confidence": "high", "notes": "CEO Dan Cathy opposed same-sex marriage. Donated to anti-LGBTQ organizations. Stopped some donations in 2019 but position widely known."},
            "religious_liberty": {"stance": 0.8, "confidence": "high", "notes": "Closed Sundays. Christian values central to brand. WinShape Foundation."},
            "workers_rights": {"stance": -0.3, "confidence": "medium", "notes": "Above-average pay for fast food. Good employee satisfaction."},
        }
    },
    "chipotle": {
        "issues": {
            "animal_rights": {"stance": -0.6, "confidence": "high", "notes": "Responsibly Raised standards. No antibiotics. Animal welfare leadership in fast food."},
            "environmental_regulations": {"stance": -0.4, "confidence": "medium", "notes": "Real food commitment. Non-GMO ingredients. Sustainability focus."},
            "workers_rights": {"stance": 0.2, "confidence": "medium", "notes": "Child labor violations. Some wage theft lawsuits. But better than most fast food."},
        }
    },

    # === RETAIL ===
    "walmart": {
        "issues": {
            "minimum_wage": {"stance": 0.3, "confidence": "high", "notes": "Historically fought minimum wage increases. Raised internal minimum to $14/hr in 2023."},
            "workers_rights": {"stance": 0.7, "confidence": "high", "notes": "Famously anti-union. Closed stores and departments that voted to unionize."},
            "gun_control": {"stance": -0.2, "confidence": "medium", "notes": "Stopped selling assault-style rifles 2015. Raised age to 21. Still sells guns/ammo."},
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Project Gigaton emissions reduction. Some renewable energy. But massive footprint."},
            "corporate_tax": {"stance": 0.3, "confidence": "medium", "notes": "Tax incentive deals with local governments. Lobbies for lower corporate rates."},
        }
    },
    "target-corp": {
        "issues": {
            "lgbtq_rights": {"stance": -0.5, "confidence": "high", "notes": "Pride merchandise. Gender-neutral bathrooms policy. But pulled back Pride displays 2023 after threats."},
            "racial_justice": {"stance": -0.4, "confidence": "medium", "notes": "Racial equity commitments. Black-owned brands initiative."},
            "climate_change": {"stance": -0.4, "confidence": "medium", "notes": "Science-based targets. Sustainable products. Clean energy investments."},
            "workers_rights": {"stance": 0.1, "confidence": "medium", "notes": "Raised minimum to $15+. Better than Walmart but still anti-union."},
        }
    },
    "costco": {
        "issues": {
            "workers_rights": {"stance": -0.5, "confidence": "high", "notes": "Well above average wages ($17.50+ starting). Good benefits. Works with unions at some locations."},
            "minimum_wage": {"stance": -0.5, "confidence": "high", "notes": "CEO advocated for higher federal minimum wage. Pays well above it."},
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Some sustainability efforts. Less vocal than competitors."},
            "animal_rights": {"stance": -0.3, "confidence": "medium", "notes": "Cage-free egg commitments. Kirkland organic options."},
        }
    },
    "home-depot": {
        "issues": {
            "lgbtq_rights": {"stance": 0.1, "confidence": "medium", "notes": "Co-founder Ken Langone supported conservative causes. Company itself has basic protections."},
            "climate_change": {"stance": -0.2, "confidence": "low", "notes": "Some sustainability products. Not particularly vocal."},
            "gun_control": {"stance": 0.2, "confidence": "low", "notes": "Co-founder Langone is conservative. Company politically quiet."},
            "workers_rights": {"stance": 0.2, "confidence": "medium", "notes": "Anti-union. Cut some benefits."},
        }
    },

    # === FINANCIAL ===
    "jpmorgan": {
        "issues": {
            "climate_change": {"stance": -0.2, "confidence": "medium", "notes": "Pledged Paris Agreement alignment. But largest fossil fuel financier globally."},
            "racial_justice": {"stance": -0.4, "confidence": "medium", "notes": "$30B racial equity commitment. But historical redlining."},
            "corporate_tax": {"stance": 0.4, "confidence": "medium", "notes": "Lobbies for favorable tax treatment. Jamie Dimon opposes some tax increases."},
            "workers_rights": {"stance": 0.1, "confidence": "low", "notes": "Raised minimum to $20+. But anti-union."},
            "gun_control": {"stance": -0.2, "confidence": "low", "notes": "Restricts some gun industry banking. Not very vocal."},
        }
    },

    # === TELECOM ===
    "att": {
        "issues": {
            "workers_rights": {"stance": 0.2, "confidence": "medium", "notes": "CWA union members. But has fought union demands. Layoffs."},
            "climate_change": {"stance": -0.2, "confidence": "low", "notes": "Some carbon neutral pledges. Not a priority."},
            "corporate_tax": {"stance": 0.5, "confidence": "high", "notes": "Major beneficiary of 2017 tax cuts. Promised jobs, did layoffs instead."},
            "free_trade": {"stance": 0.2, "confidence": "low", "notes": "Lobbies on telecom regulation."},
        }
    },

    # === ENTERTAINMENT ===
    "disney": {
        "issues": {
            "lgbtq_rights": {"stance": -0.5, "confidence": "high", "notes": "Opposed FL Don't Say Gay bill (eventually). LGBTQ+ content in media. Internal employee activism."},
            "racial_justice": {"stance": -0.5, "confidence": "medium", "notes": "Diversity casting. Inclusion initiatives. Some controversy both ways."},
            "climate_change": {"stance": -0.4, "confidence": "medium", "notes": "Environmental commitments. Net zero by 2030."},
            "workers_rights": {"stance": 0.2, "confidence": "medium", "notes": "Theme park wages criticized. But SAG/WGA contracts."},
            "gun_control": {"stance": -0.3, "confidence": "medium", "notes": "After Parkland, restricted NRA-related discounts."},
        }
    },
    "netflix": {
        "issues": {
            "lgbtq_rights": {"stance": -0.5, "confidence": "medium", "notes": "Extensive LGBTQ+ content. But Dave Chappelle controversy."},
            "racial_justice": {"stance": -0.5, "confidence": "medium", "notes": "$100M fund for Black creative community."},
            "workers_rights": {"stance": 0.3, "confidence": "medium", "notes": "High pay but ruthless 'keeper test' culture. Mass layoffs."},
            "climate_change": {"stance": -0.3, "confidence": "low", "notes": "Net zero by 2022 claim. Some sustainability efforts."},
        }
    },

    # === CLOTHING ===
    "nike": {
        "issues": {
            "racial_justice": {"stance": -0.7, "confidence": "high", "notes": "Colin Kaepernick ad campaign. BLM support. Strong diversity messaging."},
            "lgbtq_rights": {"stance": -0.5, "confidence": "medium", "notes": "Be True collection for Pride. Perfect HRC score."},
            "workers_rights": {"stance": 0.5, "confidence": "high", "notes": "Sweatshop labor scandals. Supply chain labor issues. Improved but still criticized."},
            "climate_change": {"stance": -0.5, "confidence": "medium", "notes": "Move to Zero sustainability program. Science-based targets."},
            "environmental_regulations": {"stance": -0.4, "confidence": "medium", "notes": "Recycled materials. Circularity goals."},
        }
    },
    "gap-inc": {
        "issues": {
            "workers_rights": {"stance": -0.2, "confidence": "medium", "notes": "Raised minimum wage to $10 in 2014 (early mover). Supply chain issues."},
            "lgbtq_rights": {"stance": -0.5, "confidence": "medium", "notes": "Long-time Pride supporter. Good HRC score."},
            "racial_justice": {"stance": -0.4, "confidence": "medium", "notes": "Equality & Belonging initiatives. Diverse leadership."},
        }
    },

    # === TOBACCO ===
    "altria": {
        "issues": {
            "drug_policy": {"stance": 0.3, "confidence": "medium", "notes": "Invested in cannabis (Cronos Group). But primary business is tobacco."},
            "corporate_tax": {"stance": 0.5, "confidence": "medium", "notes": "Heavy lobbying. Fights excise tax increases."},
            "environmental_regulations": {"stance": 0.4, "confidence": "medium", "notes": "Cigarette butts major pollutant. Minimal environmental focus."},
            "workers_rights": {"stance": 0.1, "confidence": "low", "notes": "Well-paying jobs. Standard corporate."},
        }
    },
    "philip-morris-intl": {
        "issues": {
            "environmental_regulations": {"stance": 0.3, "confidence": "medium", "notes": "Tobacco industry. Some sustainability marketing around IQOS."},
            "corporate_tax": {"stance": 0.5, "confidence": "medium", "notes": "International tax structures. Swiss headquarters."},
        }
    },
}


def run():
    # Load existing issues
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "company-issues.json")
    with open(data_path, "r") as f:
        existing = json.load(f)
    
    print(f"Existing issue data for {len(existing)} companies")
    
    added = 0
    for slug, data in NEW_COMPANY_ISSUES.items():
        if slug not in existing:
            existing[slug] = data
            added += 1
            print(f"  Added: {slug} ({len(data['issues'])} issues)")
        else:
            # Merge new issues into existing
            for issue_key, issue_data in data["issues"].items():
                if issue_key not in existing[slug].get("issues", {}):
                    if "issues" not in existing[slug]:
                        existing[slug]["issues"] = {}
                    existing[slug]["issues"][issue_key] = issue_data
                    added += 1
    
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
    
    print(f"\nAdded/updated {added} issue stances across {len(NEW_COMPANY_ISSUES)} companies")
    print(f"Total companies with issue data: {len(existing)}")


if __name__ == "__main__":
    run()
