# Build issue stances for remaining 78 companies
# Based on public records: ESG reports, news coverage, SEC filings, HRC scores, lobbying records
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

NEW_STANCES = {
    # === FINANCIAL ===
    "blackrock": {
        "issues": {
            "climate_change": {"stance": -0.5, "confidence": "high", "notes": "Larry Fink pushed ESG investing. Then retreated from 'ESG' label 2023-24 under political pressure. Still climate-aware but less vocal."},
            "corporate_tax": {"stance": 0.4, "confidence": "medium", "notes": "Major financial firm. Lobbies for favorable investment tax treatment."},
            "workers_rights": {"stance": 0.2, "confidence": "low", "notes": "Standard financial industry. Not particularly pro or anti union."},
            "lgbtq_rights": {"stance": -0.3, "confidence": "medium", "notes": "Good HRC score. Standard progressive corporate policies."},
        }
    },
    "capital-one": {
        "issues": {
            "racial_justice": {"stance": -0.4, "confidence": "medium", "notes": "Diversity commitments. Community development lending programs."},
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Perfect HRC score. Pride sponsor."},
            "corporate_tax": {"stance": 0.3, "confidence": "low", "notes": "Standard banking tax optimization."},
        }
    },
    "allstate": {
        "issues": {
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Climate risk modeling. But raises rates in climate-impacted areas."},
            "racial_justice": {"stance": -0.3, "confidence": "medium", "notes": "Diversity programs. Community investment."},
        }
    },
    "progressive": {
        "issues": {
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Good HRC score. Flo character widely embraced by LGBTQ+ community."},
            "climate_change": {"stance": -0.2, "confidence": "low", "notes": "Some sustainability reporting. Not a priority."},
        }
    },
    "state-farm": {
        "issues": {
            "lgbtq_rights": {"stance": -0.2, "confidence": "medium", "notes": "Pulled children's book donations after conservative backlash 2022. Mixed signals."},
            "gun_control": {"stance": 0.0, "confidence": "low", "notes": "Stopped insuring some gun manufacturers in some states. Neutral overall."},
        }
    },

    # === TELECOM ===
    "charter": {
        "issues": {
            "workers_rights": {"stance": 0.3, "confidence": "medium", "notes": "IBEW strikes. Anti-union stance."},
            "corporate_tax": {"stance": 0.4, "confidence": "medium", "notes": "Lobbies against regulation. Tax optimization."},
        }
    },
    "dish": {
        "issues": {
            "workers_rights": {"stance": 0.3, "confidence": "medium", "notes": "Known for aggressive management style. Low Glassdoor ratings."},
        }
    },

    # === ENTERTAINMENT ===
    "warner-bros": {
        "issues": {
            "lgbtq_rights": {"stance": -0.3, "confidence": "medium", "notes": "HBO has extensive LGBTQ+ content. But some content cuts under Zaslav."},
            "racial_justice": {"stance": -0.3, "confidence": "medium", "notes": "Diverse content slate. Some controversy over cuts to diverse programming."},
            "workers_rights": {"stance": 0.3, "confidence": "medium", "notes": "Massive layoffs under Discovery merger. WGA/SAG strike holdout."},
        }
    },
    "news-corp": {
        "issues": {
            "climate_change": {"stance": 0.5, "confidence": "high", "notes": "Fox News historically climate skeptical. Murdoch media empire skeptical of climate regulation."},
            "immigration": {"stance": 0.6, "confidence": "high", "notes": "Fox News/NY Post strongly anti-immigration editorial stance."},
            "gun_control": {"stance": 0.6, "confidence": "high", "notes": "Fox News/NY Post pro-2nd Amendment editorial stance."},
            "lgbtq_rights": {"stance": 0.3, "confidence": "medium", "notes": "Mixed. Some anti-trans coverage. Corporate policies are standard."},
            "racial_justice": {"stance": 0.3, "confidence": "medium", "notes": "Anti-CRT, anti-DEI editorial positions."},
        }
    },
    "nyt": {
        "issues": {
            "climate_change": {"stance": -0.7, "confidence": "high", "notes": "Extensive climate coverage. Climate desk. Editorial supports action."},
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Generally supportive. Some controversy over trans coverage balance."},
            "racial_justice": {"stance": -0.5, "confidence": "medium", "notes": "1619 Project. Extensive racial justice coverage."},
            "immigration": {"stance": -0.4, "confidence": "medium", "notes": "Generally pro-immigration reform editorial stance."},
            "gun_control": {"stance": -0.5, "confidence": "medium", "notes": "Editorial board consistently supports gun regulation."},
        }
    },
    "electronic-arts": {
        "issues": {
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "LGBTQ+ inclusion in games (The Sims). Good HRC score."},
            "workers_rights": {"stance": 0.3, "confidence": "medium", "notes": "Crunch culture. Layoffs. Spouse letter controversy historically."},
        }
    },
    "activision": {
        "issues": {
            "lgbtq_rights": {"stance": -0.2, "confidence": "low", "notes": "Now Microsoft. Previously mixed. Some inclusion efforts."},
            "workers_rights": {"stance": 0.5, "confidence": "high", "notes": "Major sexual harassment scandal. Bobby Kotick era. QA union formed."},
            "racial_justice": {"stance": 0.2, "confidence": "medium", "notes": "DFEH lawsuit alleged racial discrimination. Frat boy culture."},
        }
    },
    "take-two": {
        "issues": {
            "lgbtq_rights": {"stance": -0.2, "confidence": "low", "notes": "Some inclusion in games. Not particularly vocal."},
            "workers_rights": {"stance": 0.3, "confidence": "medium", "notes": "Industry standard crunch. Layoffs."},
        }
    },
    "live-nation": {
        "issues": {
            "corporate_tax": {"stance": 0.3, "confidence": "low", "notes": "Antitrust concerns. Monopoly pricing. DOJ lawsuit."},
            "workers_rights": {"stance": 0.2, "confidence": "low", "notes": "Gig economy workers. Contractor model for many roles."},
        }
    },
    "sirius-xm": {
        "issues": {
            "lgbtq_rights": {"stance": -0.2, "confidence": "low", "notes": "Diverse content. OutQ channel historically."},
        }
    },

    # === RETAIL ===
    "cvs": {
        "issues": {
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Good HRC score. Inclusive pharmacy policies. Trans healthcare."},
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Sustainability goals. Reduced packaging."},
            "drug_policy": {"stance": -0.2, "confidence": "medium", "notes": "Stopped selling tobacco 2014. Opioid settlement. Naloxone access."},
            "workers_rights": {"stance": 0.1, "confidence": "low", "notes": "Pharmacy staff shortages. Raised minimum wages. Mixed."},
        }
    },
    "publix": {
        "issues": {
            "lgbtq_rights": {"stance": 0.3, "confidence": "medium", "notes": "Donated to anti-LGBTQ candidates. Heiress donated to Jan 6 rally."},
            "gun_control": {"stance": 0.3, "confidence": "medium", "notes": "Donated to NRA-backed candidates. Florida politics."},
            "workers_rights": {"stance": -0.3, "confidence": "medium", "notes": "Employee-owned (ESOP). Good benefits for grocery. Anti-union."},
        }
    },
    "wayfair": {
        "issues": {
            "immigration": {"stance": 0.3, "confidence": "medium", "notes": "Employee walkout over sales of furniture to border detention centers."},
            "workers_rights": {"stance": 0.3, "confidence": "medium", "notes": "Layoffs. Employee walkout dismissed by management."},
        }
    },

    # === CLOTHING ===
    "adidas": {
        "issues": {
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Pride collections. Inclusive marketing."},
            "racial_justice": {"stance": -0.4, "confidence": "medium", "notes": "$120M pledge after BLM. Dropped Kanye over antisemitism. Diversity commitments."},
            "workers_rights": {"stance": 0.3, "confidence": "medium", "notes": "Supply chain labor issues. Uyghur cotton concerns."},
            "climate_change": {"stance": -0.5, "confidence": "medium", "notes": "Parley ocean plastic shoes. End Plastic Waste program."},
        }
    },
    "levi-strauss": {
        "issues": {
            "gun_control": {"stance": -0.6, "confidence": "high", "notes": "CEO Chip Bergh publicly advocated gun control. Everytown partnership. Asked customers not to carry guns in stores."},
            "lgbtq_rights": {"stance": -0.6, "confidence": "high", "notes": "Very early LGBTQ+ supporter. One of first companies with domestic partner benefits. Pride sponsor."},
            "workers_rights": {"stance": -0.3, "confidence": "medium", "notes": "Better than industry average. Worker well-being programs. Supply chain transparency."},
            "climate_change": {"stance": -0.5, "confidence": "medium", "notes": "Water<Less finishing. Science-based targets. Climate action advocacy."},
            "racial_justice": {"stance": -0.4, "confidence": "medium", "notes": "Diversity programs. HBCU partnerships."},
        }
    },
    "pvh": {
        "issues": {
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Calvin Klein progressive marketing. Good HRC score."},
            "climate_change": {"stance": -0.4, "confidence": "medium", "notes": "Fashion Pact signatory. Sustainability targets."},
        }
    },
    "vf-corp": {
        "issues": {
            "climate_change": {"stance": -0.5, "confidence": "medium", "notes": "Science-based targets. North Face sustainability programs. Patagonia-adjacent positioning."},
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Good HRC score. North Face Pride campaign (Explore Fund)."},
            "workers_rights": {"stance": 0.1, "confidence": "low", "notes": "Supply chain issues. Standard for industry."},
        }
    },
    "ralph-lauren": {
        "issues": {
            "lgbtq_rights": {"stance": -0.3, "confidence": "medium", "notes": "Good HRC score. Inclusive campaigns."},
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Some sustainability commitments. Not industry leader."},
        }
    },
    "under-armour": {
        "issues": {
            "racial_justice": {"stance": 0.1, "confidence": "medium", "notes": "CEO Kevin Plank praised Trump. Then walked it back. Athletes pushed back."},
            "workers_rights": {"stance": 0.2, "confidence": "medium", "notes": "Accounting scandal. Layoffs. Toxic culture allegations."},
        }
    },
    "tapestry": {
        "issues": {
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Good HRC score. Coach Pride collections."},
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Sustainability reports. Some circularity programs."},
        }
    },
    "hm-group": {
        "issues": {
            "climate_change": {"stance": -0.4, "confidence": "medium", "notes": "Garment collecting. Conscious Collection. But fast fashion model inherently wasteful."},
            "workers_rights": {"stance": 0.3, "confidence": "high", "notes": "Bangladesh factory collapse fallout. Supplier labor issues. Living wage commitments incomplete."},
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Pride campaigns. Inclusive marketing."},
        }
    },
    "inditex": {
        "issues": {
            "workers_rights": {"stance": 0.2, "confidence": "medium", "notes": "Zara supplier labor issues. Fast fashion model."},
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Sustainability pledges. But fast fashion volume contradicts."},
        }
    },
    "hanesbrands": {
        "issues": {
            "workers_rights": {"stance": 0.2, "confidence": "medium", "notes": "Outsourced manufacturing. Some labor concerns in supply chain."},
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Sustainability commitments. Energy reduction targets."},
        }
    },
    "columbia-sportswear": {
        "issues": {
            "climate_change": {"stance": -0.4, "confidence": "medium", "notes": "Sustainability focus. CEO Gert Boyle was beloved figure."},
            "workers_rights": {"stance": 0.0, "confidence": "low", "notes": "Standard for industry."},
        }
    },
    "skechers": {"issues": {}},
    "new-balance": {
        "issues": {
            "free_trade": {"stance": 0.5, "confidence": "high", "notes": "Supported TPP opposition. Praised Trump on trade. Only major sneaker made in US. Pro-tariff."},
            "workers_rights": {"stance": -0.2, "confidence": "medium", "notes": "US manufacturing jobs. Better than offshore-only competitors."},
        }
    },
    "capri-holdings": {
        "issues": {
            "lgbtq_rights": {"stance": -0.3, "confidence": "medium", "notes": "Versace LGBTQ+ marketing. Michael Kors Pride."},
        }
    },
    "crocs": {"issues": {}},
    "deckers": {"issues": {}},
    "wolverine-ww": {"issues": {}},

    # === TECH ===
    "dell": {
        "issues": {
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Perfect HRC score. ERGs."},
            "climate_change": {"stance": -0.4, "confidence": "medium", "notes": "Moonshot sustainability goals. Recycled materials in packaging."},
            "workers_rights": {"stance": 0.2, "confidence": "medium", "notes": "Layoffs 2023. Return to office mandates."},
        }
    },
    "hp-inc": {
        "issues": {
            "climate_change": {"stance": -0.5, "confidence": "medium", "notes": "Strong sustainability program. HP Planet Partners recycling."},
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Good HRC score."},
        }
    },
    "amd": {
        "issues": {
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Energy efficient chip goals. 30x energy efficiency target."},
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Lisa Su leadership. Good diversity scores."},
        }
    },
    "samsung": {
        "issues": {
            "workers_rights": {"stance": 0.4, "confidence": "high", "notes": "Anti-union historically. Chairman convicted of union-busting. Korean chaebol culture."},
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Some sustainability commitments. Massive manufacturing footprint."},
        }
    },
    "lenovo": {
        "issues": {
            "workers_rights": {"stance": 0.2, "confidence": "low", "notes": "Chinese state-connected company. Standard."},
        }
    },
    "lg-electronics": {
        "issues": {
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Zero Carbon 2030 pledge. Energy efficient appliances focus."},
        }
    },
    "logitech": {
        "issues": {
            "climate_change": {"stance": -0.5, "confidence": "medium", "notes": "Carbon neutral since 2021. Carbon labeling on products. Design for Sustainability."},
        }
    },

    # === RESTAURANTS ===
    "darden": {
        "issues": {
            "minimum_wage": {"stance": 0.4, "confidence": "high", "notes": "Olive Garden parent. Lobbied against ACA employer mandate. Low server wages."},
            "workers_rights": {"stance": 0.3, "confidence": "medium", "notes": "Cut worker hours to avoid ACA. Tipped wage reliance."},
        }
    },
    "papa-johns": {
        "issues": {
            "minimum_wage": {"stance": 0.5, "confidence": "high", "notes": "Founder John Schnatter opposed ACA, threatened to raise pizza prices. Anti-minimum wage increase."},
            "racial_justice": {"stance": 0.4, "confidence": "high", "notes": "Founder used N-word on conference call. Forced to resign. Company distanced itself."},
            "workers_rights": {"stance": 0.4, "confidence": "medium", "notes": "Anti-ACA. Franchise model. Low wages."},
        }
    },
    "jack-in-the-box": {
        "issues": {
            "workers_rights": {"stance": 0.2, "confidence": "low", "notes": "Standard fast food. Franchise model."},
        }
    },

    # === AUTO ===
    "hyundai-kia": {
        "issues": {
            "workers_rights": {"stance": 0.5, "confidence": "high", "notes": "Child labor scandal at Alabama suppliers 2022. Reuters investigation."},
            "climate_change": {"stance": -0.4, "confidence": "medium", "notes": "Heavy EV investment. Ioniq line. Hydrogen fuel cells."},
        }
    },
    "nissan": {
        "issues": {
            "climate_change": {"stance": -0.4, "confidence": "medium", "notes": "Leaf was first mass-market EV. Ariya EV. But also lagged on EV transition."},
            "workers_rights": {"stance": 0.3, "confidence": "medium", "notes": "Anti-union at Mississippi plant. Defeated UAW vote."},
        }
    },
    "subaru": {
        "issues": {
            "lgbtq_rights": {"stance": -0.5, "confidence": "high", "notes": "One of first brands to market to LGBTQ+ community in 1990s. Long history of LGBTQ+ advertising."},
            "environmental_regulations": {"stance": -0.4, "confidence": "medium", "notes": "Zero-landfill manufacturing. Love Promise environmental commitments."},
            "animal_rights": {"stance": -0.3, "confidence": "medium", "notes": "ASPCA partnership. Pet-friendly brand identity."},
        }
    },

    # === HOME ===
    "whirlpool": {
        "issues": {
            "free_trade": {"stance": 0.6, "confidence": "high", "notes": "Major tariff supporter. Lobbied heavily for washing machine tariffs. Won Trump-era tariffs."},
            "workers_rights": {"stance": 0.0, "confidence": "low", "notes": "Union plants in some locations. Mixed."},
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Energy efficient appliance targets."},
        }
    },
    "ikea": {
        "issues": {
            "climate_change": {"stance": -0.7, "confidence": "high", "notes": "Massive renewable energy investments. Climate positive by 2030 goal. Plant-based food menu."},
            "lgbtq_rights": {"stance": -0.5, "confidence": "medium", "notes": "Pride collections. LGBTQ+ inclusive marketing globally."},
            "workers_rights": {"stance": -0.2, "confidence": "medium", "notes": "Living wage commitments. But warehouse conditions criticized in some markets."},
            "renewable_energy": {"stance": -0.8, "confidence": "high", "notes": "Owns wind farms and solar. Selling solar panels to customers."},
        }
    },
    "williams-sonoma": {
        "issues": {
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Some sustainability commitments. Fair Trade certified."},
        }
    },
    "sherwin-williams": {
        "issues": {
            "environmental_regulations": {"stance": 0.2, "confidence": "medium", "notes": "Lead paint legacy. Environmental remediation obligations."},
            "workers_rights": {"stance": 0.1, "confidence": "low", "notes": "Standard industrial."},
        }
    },
    "stanley-bnd": {
        "issues": {
            "workers_rights": {"stance": 0.0, "confidence": "low", "notes": "Manufacturing jobs. Standard."},
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "ESG commitments. Carbon targets."},
        }
    },
    "scotts-miracle": {
        "issues": {
            "environmental_regulations": {"stance": 0.3, "confidence": "medium", "notes": "Roundup (glyphosate) products. EPA fined for bird-killing pesticides. Chemical lawn care."},
            "drug_policy": {"stance": -0.3, "confidence": "medium", "notes": "CEO Jim Hagedorn invested in cannabis. Hawthorne Gardening division for grow supplies."},
        }
    },

    # === BABY/TOYS ===
    "mattel": {
        "issues": {
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Gender-neutral dolls. Trans Barbie. Inclusive toy lines."},
            "racial_justice": {"stance": -0.4, "confidence": "medium", "notes": "Diverse Barbie line. Multiple skin tones, body types."},
            "workers_rights": {"stance": 0.2, "confidence": "medium", "notes": "Chinese factory labor concerns historically."},
        }
    },
    "hasbro": {
        "issues": {
            "lgbtq_rights": {"stance": -0.3, "confidence": "medium", "notes": "Inclusive D&D. Some representation in media properties."},
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Eliminating plastic packaging. Sustainability goals."},
        }
    },
    "lego": {
        "issues": {
            "climate_change": {"stance": -0.6, "confidence": "high", "notes": "Investing $400M in sustainable materials. Plant-based bricks research. Carbon neutral ops."},
            "lgbtq_rights": {"stance": -0.4, "confidence": "medium", "notes": "Everyone Is Awesome LGBTQ+ set. Inclusive messaging."},
            "workers_rights": {"stance": -0.3, "confidence": "medium", "notes": "Well-regarded employer. Good working conditions."},
        }
    },

    # === ALCOHOL/TOBACCO ===
    "constellation": {
        "issues": {
            "immigration": {"stance": -0.3, "confidence": "medium", "notes": "Corona/Modelo brands depend on Hispanic market. Pro-immigration business interest."},
            "workers_rights": {"stance": 0.1, "confidence": "low", "notes": "Standard for industry."},
        }
    },
    "diageo-spirits": {
        "issues": {
            "lgbtq_rights": {"stance": -0.5, "confidence": "medium", "notes": "Strong LGBTQ+ marketing. Sponsorships. Progressive corporate culture."},
            "racial_justice": {"stance": -0.4, "confidence": "medium", "notes": "Diversity commitments. Black-owned bar support programs."},
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Grain-to-glass sustainability. Carbon targets."},
        }
    },

    # === MISC ===
    "ge-appliances": {
        "issues": {
            "workers_rights": {"stance": -0.1, "confidence": "low", "notes": "Haier-owned (Chinese). US manufacturing jobs maintained."},
        }
    },
    "goodyear": {
        "issues": {
            "workers_rights": {"stance": -0.1, "confidence": "medium", "notes": "USW union workforce. Standard labor relations."},
            "climate_change": {"stance": -0.2, "confidence": "low", "notes": "Some sustainable tire research. Soybean oil tires."},
        }
    },
    "bridgestone": {
        "issues": {
            "climate_change": {"stance": -0.3, "confidence": "medium", "notes": "Carbon neutral by 2050. Sustainability focus."},
        }
    },
    "autozone": {
        "issues": {
            "workers_rights": {"stance": 0.3, "confidence": "medium", "notes": "Anti-union. Low wages for retail. Mandatory overtime issues."},
        }
    },
    "valvoline": {"issues": {}},
    "fast-retailing": {
        "issues": {
            "workers_rights": {"stance": 0.2, "confidence": "medium", "notes": "Uniqlo supplier labor issues. Uyghur cotton controversy."},
        }
    },
    "dyson": {
        "issues": {
            "free_trade": {"stance": 0.4, "confidence": "medium", "notes": "James Dyson supported Brexit despite moving HQ to Singapore. Outsourced manufacturing to Malaysia."},
            "workers_rights": {"stance": 0.3, "confidence": "medium", "notes": "Malaysian factory conditions criticized. Migrant worker issues."},
        }
    },
    "tupperware": {"issues": {}},
    "tempur-sealy": {"issues": {}},
    "sleep-number": {"issues": {}},
    "rh": {"issues": {}},
    "weber": {"issues": {}},
    "traeger": {"issues": {}},
    "yeti": {"issues": {}},
    "gerber-nestle": {"issues": {}},  # Covered under nestle parent
    "graco": {"issues": {}},
    "church-and-dwight-home": {"issues": {}},
    "mazda": {"issues": {}},
}

def run():
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "company-issues.json")
    with open(data_path, "r", encoding="utf-8") as f:
        existing = json.load(f)
    
    added_companies = 0
    added_issues = 0
    for slug, data in NEW_STANCES.items():
        if not data.get("issues"):
            continue
        if slug not in existing:
            existing[slug] = data
            added_companies += 1
            added_issues += len(data["issues"])
        else:
            for k, v in data["issues"].items():
                if k not in existing[slug].get("issues", {}):
                    if "issues" not in existing[slug]:
                        existing[slug]["issues"] = {}
                    existing[slug]["issues"][k] = v
                    added_issues += 1
    
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
    
    print(f"Added {added_companies} new companies, {added_issues} new issue stances")
    print(f"Total companies with issue data: {len([k for k,v in existing.items() if v.get('issues')])}")

if __name__ == "__main__":
    run()
