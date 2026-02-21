# Fetch FEC PAC data for all companies missing it
# Uses OpenFEC API: https://api.open.fec.gov/
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import requests
from database import SessionLocal
from sqlalchemy import text
from config import settings

FEC_API_KEY = settings.FEC_API_KEY
FEC_BASE = "https://api.open.fec.gov/v1"

# Company slug -> search terms for FEC PAC search
# We search by company name variations
COMPANY_SEARCH_NAMES = {
    "apple": ["APPLE INC"],
    "microsoft": ["MICROSOFT CORPORATION"],
    "google-alphabet": ["ALPHABET INC", "GOOGLE"],
    "amazon-retail": ["AMAZON.COM"],
    "meta": ["META PLATFORMS", "FACEBOOK"],
    "nike": ["NIKE INC"],
    "ford": ["FORD MOTOR"],
    "general-motors": ["GENERAL MOTORS"],
    "tesla": ["TESLA INC"],
    "toyota": ["TOYOTA MOTOR"],
    "disney": ["WALT DISNEY"],
    "netflix": ["NETFLIX"],
    "att": ["AT&T"],
    "verizon": ["VERIZON"],
    "t-mobile": ["T-MOBILE"],
    "comcast": ["COMCAST"],
    "jpmorgan": ["JPMORGAN CHASE"],
    "bank-of-america": ["BANK OF AMERICA"],
    "wells-fargo": ["WELLS FARGO"],
    "visa": ["VISA INC"],
    "mastercard": ["MASTERCARD"],
    "exxonmobil": ["EXXON MOBIL", "EXXONMOBIL"],
    "chevron": ["CHEVRON CORP"],
    "shell": ["SHELL"],
    "bp": ["BP AMERICA", "BP PLC"],
    "walmart": ["WALMART", "WAL-MART"],
    "target-corp": ["TARGET CORP"],
    "home-depot": ["HOME DEPOT"],
    "lowes": ["LOWE'S"],
    "costco": ["COSTCO"],
    "mcdonalds": ["MCDONALD'S CORP"],
    "starbucks-corp": ["STARBUCKS"],
    "yum-brands": ["YUM! BRANDS", "YUM BRANDS"],
    "chipotle": ["CHIPOTLE"],
    "dominos": ["DOMINO'S"],
    "wendys": ["WENDY'S"],
    "papa-johns": ["PAPA JOHN'S"],
    "chick-fil-a": ["CHICK-FIL-A"],
    "darden": ["DARDEN RESTAURANTS"],
    "capital-one": ["CAPITAL ONE"],
    "american-express": ["AMERICAN EXPRESS"],
    "goldman-sachs": ["GOLDMAN SACHS"],
    "blackrock": ["BLACKROCK"],
    "paypal": ["PAYPAL"],
    "allstate": ["ALLSTATE"],
    "progressive": ["PROGRESSIVE CORP"],
    "state-farm": ["STATE FARM"],
    "dell": ["DELL TECHNOLOGIES"],
    "hp-inc": ["HP INC"],
    "intel": ["INTEL CORP"],
    "nvidia": ["NVIDIA"],
    "amd": ["ADVANCED MICRO DEVICES", "AMD"],
    "samsung": ["SAMSUNG"],
    "sony": ["SONY"],
    "lenovo": ["LENOVO"],
    "honda": ["HONDA", "AMERICAN HONDA"],
    "stellantis": ["STELLANTIS", "FIAT CHRYSLER", "CHRYSLER"],
    "volkswagen": ["VOLKSWAGEN"],
    "bmw": ["BMW"],
    "hyundai-kia": ["HYUNDAI", "KIA"],
    "nissan": ["NISSAN"],
    "subaru": ["SUBARU"],
    "adidas": ["ADIDAS"],
    "gap-inc": ["GAP INC"],
    "levi-strauss": ["LEVI STRAUSS"],
    "pvh": ["PVH CORP"],
    "ralph-lauren": ["RALPH LAUREN"],
    "under-armour": ["UNDER ARMOUR"],
    "vf-corp": ["VF CORPORATION"],
    "hanesbrands": ["HANESBRANDS"],
    "skechers": ["SKECHERS"],
    "columbia-sportswear": ["COLUMBIA SPORTSWEAR"],
    "tapestry": ["TAPESTRY INC"],
    "capri-holdings": ["CAPRI HOLDINGS"],
    "albertsons": ["ALBERTSONS"],
    "kroger": ["KROGER"],
    "dollar-general": ["DOLLAR GENERAL"],
    "dollar-tree": ["DOLLAR TREE"],
    "cvs": ["CVS HEALTH"],
    "walgreens": ["WALGREENS BOOTS"],
    "publix": ["PUBLIX"],
    "fox-corp": ["FOX CORPORATION"],
    "paramount": ["PARAMOUNT GLOBAL"],
    "warner-bros": ["WARNER BROS", "DISCOVERY"],
    "spotify": ["SPOTIFY"],
    "electronic-arts": ["ELECTRONIC ARTS"],
    "activision": ["ACTIVISION BLIZZARD"],
    "take-two": ["TAKE-TWO INTERACTIVE"],
    "news-corp": ["NEWS CORP"],
    "nyt": ["NEW YORK TIMES"],
    "live-nation": ["LIVE NATION"],
    "sirius-xm": ["SIRIUS XM"],
    "whirlpool": ["WHIRLPOOL"],
    "sherwin-williams": ["SHERWIN-WILLIAMS"],
    "stanley-bnd": ["STANLEY BLACK"],
    "scotts-miracle": ["SCOTTS MIRACLE"],
    "goodyear": ["GOODYEAR"],
    "bridgestone": ["BRIDGESTONE"],
    "autozone": ["AUTOZONE"],
    "valvoline": ["VALVOLINE"],
    "mattel": ["MATTEL"],
    "hasbro": ["HASBRO"],
    "restaurant-brands": ["RESTAURANT BRANDS"],
    "inspire-brands": ["INSPIRE BRANDS"],
    "jack-in-the-box": ["JACK IN THE BOX"],
    "dish": ["DISH NETWORK"],
    "charter": ["CHARTER COMMUNICATIONS"],
    "constellation": ["CONSTELLATION BRANDS"],
    "diageo-spirits": ["DIAGEO"],
    "reynolds-american": ["REYNOLDS AMERICAN", "R.J. REYNOLDS"],
    "williams-sonoma": ["WILLIAMS-SONOMA"],
    "tempur-sealy": ["TEMPUR SEALY"],
    "wayfair": ["WAYFAIR"],
    "wolverine-ww": ["WOLVERINE WORLD WIDE"],
    "deckers": ["DECKERS OUTDOOR"],
    "crocs": ["CROCS INC"],
    "rh": ["RH INC", "RESTORATION HARDWARE"],
    "yeti": ["YETI HOLDINGS"],
    "weber": ["WEBER INC"],
}


def search_pac(company_name):
    """Search FEC for PAC committees matching a company name."""
    try:
        resp = requests.get(
            f"{FEC_BASE}/names/committees/",
            params={"q": company_name, "api_key": FEC_API_KEY},
            timeout=10
        )
        if resp.status_code == 200:
            results = resp.json().get("results", [])
            # Filter for PAC-type committees
            pacs = [r for r in results if "PAC" in r.get("name", "").upper()
                    or "POLITICAL ACTION" in r.get("name", "").upper()
                    or "GOOD GOVERNMENT" in r.get("name", "").upper()]
            return pacs
        elif resp.status_code == 429:
            print("  Rate limited, waiting 60s...")
            time.sleep(60)
            return search_pac(company_name)
        else:
            print(f"  FEC API error {resp.status_code}: {resp.text[:200]}")
            return []
    except Exception as e:
        print(f"  Error: {e}")
        return []


def get_pac_financials(committee_id, cycle=2024):
    """Get PAC financial summary for a specific cycle."""
    try:
        resp = requests.get(
            f"{FEC_BASE}/committee/{committee_id}/totals/",
            params={"cycle": cycle, "api_key": FEC_API_KEY},
            timeout=10
        )
        if resp.status_code == 200:
            results = resp.json().get("results", [])
            if results:
                return results[0]
        return None
    except:
        return None


def get_pac_disbursements_by_party(committee_id, cycle=2024):
    """Get how much a PAC gave to each party."""
    try:
        # Get disbursements to candidates
        resp = requests.get(
            f"{FEC_BASE}/schedules/schedule_b/by_recipient_id/",
            params={
                "committee_id": committee_id,
                "cycle": cycle,
                "api_key": FEC_API_KEY,
                "per_page": 100,
            },
            timeout=10
        )
        if resp.status_code != 200:
            return None

        results = resp.json().get("results", [])
        dem_total = 0
        rep_total = 0
        other_total = 0

        for r in results:
            amount = r.get("total", 0) or 0
            # recipient_id starting with candidate IDs
            memo = (r.get("recipient_name", "") or "").upper()
            if "DEM" in memo or "DEMOCRAT" in memo:
                dem_total += amount
            elif "REP" in memo or "REPUBLICAN" in memo:
                rep_total += amount
            else:
                other_total += amount

        return {"democrat": dem_total, "republican": rep_total, "other": other_total}
    except:
        return None


def run():
    db = SessionLocal()
    
    # Load existing PAC data
    with open(os.path.join(os.path.dirname(__file__), "..", "data", "fec-pac-names.json"), "r") as f:
        existing_data = json.load(f)
    
    existing_ids = {p["companyId"] for p in existing_data["pacs"]}
    new_pacs = []
    
    # Get all companies needing PAC data
    all_slugs = [r[0] for r in db.execute(text("SELECT slug FROM companies")).fetchall()]
    missing = [s for s in all_slugs if s not in existing_ids]
    
    print(f"Searching FEC for {len(missing)} companies...")
    found = 0
    not_found = []
    
    for i, slug in enumerate(sorted(missing)):
        search_terms = COMPANY_SEARCH_NAMES.get(slug)
        if not search_terms:
            # Generate from company name
            name = db.execute(text("SELECT name FROM companies WHERE slug = :s"), {"s": slug}).scalar()
            if name:
                # Clean up the name for FEC search
                clean = name.upper().replace("INC.", "").replace("CORP.", "").replace("THE ", "").strip()
                search_terms = [clean]
            else:
                continue
        
        print(f"[{i+1}/{len(missing)}] {slug}: searching {search_terms[0]}...")
        
        best_pacs = []
        for term in search_terms:
            results = search_pac(term)
            if results:
                best_pacs = results
                break
            time.sleep(0.5)  # Rate limit courtesy
        
        if best_pacs:
            pac_names = [p["name"] for p in best_pacs[:3]]
            fec_ids = [p["id"] for p in best_pacs[:3]]
            new_pacs.append({
                "companyId": slug,
                "pacNames": pac_names,
                "fecIds": fec_ids,
            })
            found += 1
            print(f"  Found: {pac_names[0]} ({fec_ids[0]})")
        else:
            not_found.append(slug)
            print(f"  No PAC found")
        
        # Rate limit - DEMO_KEY allows 120/min
        time.sleep(1.0)
    
    # Merge with existing data
    all_pacs = existing_data["pacs"] + new_pacs
    output = {
        "description": existing_data["description"],
        "pacs": all_pacs,
    }
    
    out_path = os.path.join(os.path.dirname(__file__), "..", "data", "fec-pac-names.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\nDone! Found PACs for {found}/{len(missing)} companies")
    print(f"Not found ({len(not_found)}): {not_found}")
    print(f"Total PAC entries: {len(all_pacs)}")
    
    # Save not-found list
    with open(os.path.join(os.path.dirname(__file__), "fec_not_found.txt"), "w") as f:
        f.write("\n".join(not_found))
    
    db.close()


if __name__ == "__main__":
    run()
