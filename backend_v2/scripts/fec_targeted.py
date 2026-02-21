import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests

FEC_API_KEY = os.environ.get("FEC_API_KEY", "DEMO_KEY")

# Companies that SHOULD have PACs but we missed - search with better terms
TARGETED = {
    "allstate": "ALLSTATE",
    "chevron": "CHEVRON",
    "dollar-general": "DOLLAR GENERAL",
    "ford": "FORD MOTOR",  # we may already have this
    "general-motors": "GENERAL MOTORS",
    "google-alphabet": "GOOGLE",
    "mcdonalds": "MCDONALDS",
    "honda": "AMERICAN HONDA",
    "hyundai-kia": "HYUNDAI",
    "nissan": "NISSAN NORTH",
    "starbucks-corp": "STARBUCKS",
    "stellantis": "CHRYSLER",
    "fox-corp": "FOX CORPORATION",
    "shell": "SHELL OIL",
    "amd": "ADVANCED MICRO",
    "nvidia": "NVIDIA",
    "att": "AT&T",
    "progressive": "PROGRESSIVE",
    "hasbro": "HASBRO",
    "mattel": "MATTEL",
    "wendys": "WENDYS",
    "dominos": "DOMINOS",
}

def search(term):
    r = requests.get("https://api.open.fec.gov/v1/committees/", params={
        "q": term, "api_key": FEC_API_KEY,
        "committee_type": ["Q", "N", "W", "O", "U", "V"],
        "per_page": 10,
    }, timeout=15)
    if r.status_code == 200:
        return r.json().get("results", [])
    if r.status_code == 429:
        print("  RATE LIMITED")
        time.sleep(65)
        return search(term)
    return []

# Load existing
data_path = os.path.join(os.path.dirname(__file__), "..", "data", "fec-pac-names.json")
with open(data_path, "r", encoding="utf-8") as f:
    data = json.load(f)
existing_ids = {p["companyId"] for p in data["pacs"]}

found = 0
for slug, term in TARGETED.items():
    if slug in existing_ids:
        print(f"{slug}: already have PAC data")
        continue
    
    results = search(term)
    pacs = [c for c in results if any(kw in c.get("name", "").upper()
            for kw in ["PAC", "POLITICAL ACTION", "GOOD GOVERNMENT", "CIVIC"])]
    
    if pacs:
        p = pacs[0]
        fec_id = p.get("committee_id", "")
        data["pacs"].append({
            "companyId": slug,
            "pacNames": [p["name"]],
            "fecIds": [fec_id],
        })
        found += 1
        print(f"{slug}: FOUND {p['name']} ({fec_id})")
    else:
        if results:
            print(f"{slug}: no PAC. Got: {[r['name'] for r in results[:2]]}")
        else:
            print(f"{slug}: NO RESULTS")
    
    time.sleep(0.5)

with open(data_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"\nFound {found} additional PACs. Total: {len(data['pacs'])}")
