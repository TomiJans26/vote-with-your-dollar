"""Seed the MSSQL database from JSON data files."""
import json
import os
import sys

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, SessionLocal, Base
from models import (Company, Brand, CompanyIssue, PacDonation, ProductCategory, Issue)
from config import settings

DATA_DIR = settings.DATA_DIR

ISSUES = [
    ("abortion", "Abortion / Reproductive Rights", "Social", "Rights related to abortion and reproductive healthcare", "⚖️"),
    ("lgbtq_rights", "LGBTQ+ Rights", "Social", "Rights and protections for LGBTQ+ individuals", "🏳️‍🌈"),
    ("racial_justice", "Racial Justice / Equity", "Social", "Racial equity, diversity, and inclusion efforts", "✊"),
    ("immigration", "Immigration", "Social", "Immigration policy and reform", "🌍"),
    ("religious_liberty", "Religious Liberty", "Social", "Religious freedom and accommodation", "🛐"),
    ("death_penalty", "Death Penalty", "Social", "Capital punishment policy", "⚖️"),
    ("workers_rights", "Workers' Rights / Labor Unions", "Economic", "Labor rights and union support", "👷"),
    ("minimum_wage", "Minimum Wage / Living Wage", "Economic", "Minimum and living wage policies", "💰"),
    ("corporate_tax", "Corporate Tax Policy", "Economic", "Corporate taxation levels and policy", "🏢"),
    ("free_trade", "Free Trade vs Protectionism", "Economic", "Trade policy stance", "🌐"),
    ("climate_change", "Climate Change / Carbon Emissions", "Environment", "Climate action and carbon reduction", "🌡️"),
    ("renewable_energy", "Renewable Energy", "Environment", "Investment in renewable energy sources", "☀️"),
    ("environmental_regulations", "Environmental Regulations", "Environment", "Support for environmental rules", "🌿"),
    ("animal_rights", "Animal Rights / Welfare", "Environment", "Animal testing and welfare policies", "🐾"),
    ("gun_control", "Gun Control / 2nd Amendment", "Policy", "Firearms regulation stance", "🔫"),
    ("military_spending", "Military / Defense Spending", "Policy", "Military and defense budget stance", "🎖️"),
    ("police_reform", "Police Reform / Criminal Justice", "Policy", "Criminal justice and police reform", "👮"),
    ("drug_policy", "Drug Policy / Legalization", "Policy", "Drug legalization and policy reform", "💊"),
    ("universal_healthcare", "Universal Healthcare", "Policy", "Universal healthcare support", "🏥"),
    ("education_funding", "Education Funding", "Policy", "Public education funding support", "📚"),
    ("student_debt", "Student Debt", "Policy", "Student loan and debt policy", "🎓"),
    ("vaccine_policy", "Vaccine Policy", "Policy", "Vaccine mandates and policy", "💉"),
]


def seed():
    print("Creating tables...")
    Base.metadata.create_all(engine)
    
    db = SessionLocal()
    try:
        # Issues
        if db.query(Issue).count() == 0:
            print("Seeding issues...")
            for key, name, category, desc, icon in ISSUES:
                db.add(Issue(key=key, name=name, category=category, description=desc, icon=icon))
            db.commit()
            print(f"  → {len(ISSUES)} issues")

        # Companies + Brands
        if db.query(Company).count() == 0:
            print("Seeding companies & brands...")
            with open(os.path.join(DATA_DIR, "parent-companies.json"), "r", encoding="utf-8") as f:
                companies = json.load(f)["companies"]
            for c in companies:
                company = Company(
                    slug=c["id"], name=c["name"], ticker=c.get("ticker"),
                    industry=c.get("industry"), country=c.get("country"),
                )
                db.add(company)
                db.flush()
                for b in c.get("brands", []):
                    db.add(Brand(company_id=company.id, name=b))
            db.commit()
            print(f"  → {len(companies)} companies")

        # Company issues
        if db.query(CompanyIssue).count() == 0:
            print("Seeding company issues...")
            with open(os.path.join(DATA_DIR, "company-issues.json"), "r", encoding="utf-8") as f:
                issues_data = json.load(f)
            # Build slug->id map
            slug_map = {c.slug: c.id for c in db.query(Company).all()}
            count = 0
            for company_slug, data in issues_data.items():
                cid = slug_map.get(company_slug)
                if not cid:
                    continue
                for issue_key, issue_data in data.get("issues", {}).items():
                    db.add(CompanyIssue(
                        company_id=cid, issue_key=issue_key,
                        stance=issue_data.get("stance", 0),
                        confidence=issue_data.get("confidence"),
                        notes=issue_data.get("notes"),
                    ))
                    count += 1
            db.commit()
            print(f"  → {count} company-issue records")

        # PAC donations
        if db.query(PacDonation).count() == 0:
            print("Seeding PAC data...")
            with open(os.path.join(DATA_DIR, "fec-pac-names.json"), "r", encoding="utf-8") as f:
                pacs = json.load(f)["pacs"]
            slug_map = {c.slug: c.id for c in db.query(Company).all()}
            count = 0
            for p in pacs:
                cid = slug_map.get(p["companyId"])
                if not cid:
                    continue
                for fec_id in p.get("fecIds", []):
                    db.add(PacDonation(
                        company_id=cid,
                        pac_name=p["pacNames"][0] if p.get("pacNames") else None,
                        fec_committee_id=fec_id,
                    ))
                    count += 1
            db.commit()
            print(f"  → {count} PAC records")

        # Product categories
        if db.query(ProductCategory).count() == 0:
            print("Seeding product categories...")
            with open(os.path.join(DATA_DIR, "product-categories.json"), "r", encoding="utf-8") as f:
                categories = json.load(f)["categories"]
            count = 0
            seen_slugs = set()
            for cat in categories:
                if cat["id"] in seen_slugs:
                    continue
                seen_slugs.add(cat["id"])
                parent = ProductCategory(slug=cat["id"], name=cat["name"])
                db.add(parent)
                db.flush()
                for sub in cat.get("subcategories", []):
                    sub_slug = f"{cat['id']}--{sub}" if sub in seen_slugs else sub
                    if sub_slug in seen_slugs:
                        continue
                    seen_slugs.add(sub_slug)
                    db.add(ProductCategory(slug=sub_slug, name=sub.replace("-", " ").title(), parent_id=parent.id))
                    count += 1
                count += 1
            db.commit()
            print(f"  → {count} categories")

        print("✅ Seeding complete!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
