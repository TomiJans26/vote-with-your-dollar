# Precise FEC search for remaining important companies
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests

FEC_API_KEY = os.environ.get("FEC_API_KEY", "DEMO_KEY")

# Search with very specific PAC-related terms
SEARCHES = {
    "chevron": ["CHEVRON EMPLOYEES", "CHEVRON CORPORATION PAC", "CHEVRON EMPAC"],
    "shell": ["SHELL OIL COMPANY", "SHELL POLITICAL"],
    "honda": ["HONDA MOTOR", "AMERICAN HONDA PAC"],
    "nissan": ["NISSAN NORTH AMERICA PAC"],
    "hyundai-kia": ["HYUNDAI MOTOR AMERICA"],
    "stellantis": ["STELLANTIS PAC", "FCA US PAC", "FIAT CHRYSLER PAC"],
    "dollar-general": ["DOLLAR GENERAL PAC", "DOLLAR GENERAL CORPORATION"],
    "starbucks-corp": ["STARBUCKS PAC", "STARBUCKS COFFEE"],
    "fox-corp": ["FOX CORPORATION PAC", "21ST CENTURY FOX"],
    "progressive": ["PROGRESSIVE CORPORATION PAC", "PROGRESSIVE INSURANCE"],
}

data_path = os.path.join(os.path.dirname(__file__), "..", "data", "fec-pac-names.json")
with open(data_path, "r", encoding="utf-8") as f:
    data = json.load(f)

# First, remove the bad entries we just added
bad_names = ["MILLER-MEEKS", "AMERICANS FOR RENAISSANCE", "ADAM CLAYTON", "AUSTIN SCOTT",
             "10TH DISTRICT", "GRAND CANYON", "STEVEN FULOP", "GABPAC"]
cleaned = []
for p in data["pacs"]:
    names = p.get("pacNames", [])
    name = names[0] if names else ""
    if any(bad in name.upper() for bad in bad_names):
        print(f"Removing bad entry: {p['companyId']} -> {name}")
        continue
    cleaned.append(p)
data["pacs"] = cleaned

existing_ids = {p["companyId"] for p in data["pacs"]}

for slug, terms in SEARCHES.items():
    if slug in existing_ids:
        print(f"{slug}: already have data")
        continue
    
    for term in terms:
        r = requests.get("https://api.open.fec.gov/v1/committees/", params={
            "q": term, "api_key": FEC_API_KEY,
            "per_page": 10,
        }, timeout=15)
        
        if r.status_code != 200:
            if r.status_code == 429:
                print(f"  RATE LIMITED on {term}")
                time.sleep(65)
                continue
            continue
        
        results = r.json().get("results", [])
        # Filter for actual corporate PACs
        pacs = [c for c in results if any(kw in c.get("name", "").upper()
                for kw in ["PAC", "POLITICAL ACTION", "GOOD GOVERNMENT", "CIVIC", "EMPAC"])]
        
        if pacs:
            p = pacs[0]
            fec_id = p.get("committee_id", "")
            name = p["name"]
            data["pacs"].append({
                "companyId": slug,
                "pacNames": [name],
                "fecIds": [fec_id],
            })
            print(f"{slug}: FOUND {name} ({fec_id})")
            break
        
        time.sleep(0.5)
    else:
        print(f"{slug}: NOT FOUND with any search term")
    
    time.sleep(0.5)

with open(data_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print(f"\nTotal PAC entries: {len(data['pacs'])}")
