# Batch FEC PAC lookup - uses /names/committees/ endpoint
# Run in batches to respect rate limits (DEMO_KEY: 1000/day, 120/min)
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests
from database import SessionLocal
from sqlalchemy import text
from config import settings

FEC_API_KEY = os.environ.get("FEC_API_KEY", settings.FEC_API_KEY)
FEC_BASE = "https://api.open.fec.gov/v1"

def search_pac(term):
    try:
        resp = requests.get(
            f"{FEC_BASE}/committees/",
            params={
                "q": term, "api_key": FEC_API_KEY,
                "committee_type": ["Q", "N", "W", "O", "U", "V"],
                "per_page": 10,
            },
            timeout=15
        )
        if resp.status_code == 200:
            return resp.json().get("results", [])
        elif resp.status_code == 429:
            print("  RATE LIMITED - waiting 65s")
            time.sleep(65)
            return search_pac(term)
        else:
            print(f"  HTTP {resp.status_code}")
            return []
    except Exception as e:
        print(f"  Error: {e}")
        return []


def run():
    db = SessionLocal()
    
    # Load existing
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "fec-pac-names.json")
    with open(data_path, "r") as f:
        existing = json.load(f)
    existing_ids = {p["companyId"] for p in existing["pacs"]}
    
    # Get missing companies with their names
    all_companies = db.execute(text("SELECT slug, name FROM companies ORDER BY name")).fetchall()
    rows = [(s, n) for s, n in all_companies if s not in existing_ids]
    
    print(f"Looking up {len(rows)} companies...")
    new_pacs = []
    not_found = []
    
    for i, (slug, name) in enumerate(rows):
        # Clean company name for search
        clean = name.upper()
        # Remove parenthetical notes first
        import re
        clean = re.sub(r'\s*\(.*?\)', '', clean)
        # Remove suffixes (whole words only)
        for remove in [" INC.", " INC", " CORP.", " CORP", " CO.", " LLC", " LTD", " PLC",
                       " N.V.", " S.A.", " AG", " SE"]:
            if clean.endswith(remove):
                clean = clean[:-len(remove)]
        if clean.startswith("THE "):
            clean = clean[4:]
        clean = clean.strip()
        
        # Also try with "PAC" appended
        search_terms = [clean]
        # For short names, be more specific
        if len(clean.split()) == 1:
            search_terms.append(f"{clean} POLITICAL ACTION")
        
        print(f"[{i+1}/{len(rows)}] {slug} -> {clean[:40]}")
        
        found = False
        for term in search_terms:
            results = search_pac(term)
            # Filter for PAC-like committees
            pacs = [r for r in results if any(kw in r.get("name", "").upper() 
                    for kw in ["PAC", "POLITICAL ACTION", "GOOD GOVERNMENT", "CIVIC ACTION"])]
            
            if pacs:
                pac = pacs[0]
                fec_id = pac.get("committee_id") or pac.get("id", "")
                new_pacs.append({
                    "companyId": slug,
                    "pacNames": [pac["name"]],
                    "fecIds": [fec_id],
                })
                print(f"  FOUND: {pac['name']} ({fec_id})")
                found = True
                break
            time.sleep(1.5)
        
        if not found:
            not_found.append(slug)
            print(f"  NOT FOUND")
        
        time.sleep(1.0)
        
        # Save progress every 20 companies
        if (i + 1) % 20 == 0:
            all_pacs = existing["pacs"] + new_pacs
            with open(data_path, "w", encoding="utf-8") as f:
                json.dump({"description": existing["description"], "pacs": all_pacs}, f, indent=2)
            print(f"  -- Saved progress: {len(new_pacs)} new PACs --")
    
    # Final save
    all_pacs = existing["pacs"] + new_pacs
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump({"description": existing["description"], "pacs": all_pacs}, f, indent=2)
    
    print(f"\nDone! Found {len(new_pacs)}/{len(rows)} new PACs")
    print(f"Not found ({len(not_found)}): {', '.join(not_found[:20])}...")
    print(f"Total PAC entries: {len(all_pacs)}")
    
    with open(os.path.join(os.path.dirname(__file__), "fec_not_found.txt"), "w") as f:
        f.write("\n".join(not_found))
    
    db.close()

if __name__ == "__main__":
    run()
