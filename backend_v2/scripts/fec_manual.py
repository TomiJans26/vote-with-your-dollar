# Manual FEC PAC lookups for companies with tricky names
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import requests

FEC_API_KEY = os.environ.get("FEC_API_KEY", "DEMO_KEY")

# Manually verified PAC committee IDs from FEC.gov
# These were verified by searching on fec.gov directly
MANUAL_PACS = [
    {"companyId": "chevron", "pacNames": ["CHEVRON EMPLOYEES POLITICAL ACTION COMMITTEE (CHEVRON EMPAC)"], "fecIds": ["C00090290"]},
    {"companyId": "shell", "pacNames": ["SHELL OIL COMPANY EMPLOYEES' POLITICAL AWARENESS COMMITTEE"], "fecIds": ["C00039776"]},
    {"companyId": "fox-corp", "pacNames": ["21ST CENTURY FOX AMERICA, INC PAC"], "fecIds": ["C00472092"]},
    {"companyId": "honda", "pacNames": ["AMERICAN HONDA MOTOR CO INC POLITICAL ACTION COMMITTEE"], "fecIds": ["C00216390"]},
    {"companyId": "nissan", "pacNames": ["NISSAN NORTH AMERICA INC POLITICAL ACTION COMMITTEE"], "fecIds": ["C00354100"]},
    {"companyId": "hyundai-kia", "pacNames": ["HYUNDAI MOTOR AMERICA POLITICAL ACTION COMMITTEE"], "fecIds": ["C00544510"]},
    {"companyId": "stellantis", "pacNames": ["STELLANTIS (FCA US LLC) POLITICAL ACTION COMMITTEE"], "fecIds": ["C00074468"]},
    {"companyId": "dollar-general", "pacNames": ["DOLLAR GENERAL CORPORATION POLITICAL ACTION COMMITTEE"], "fecIds": ["C00489971"]},
    {"companyId": "starbucks-corp", "pacNames": ["STARBUCKS COFFEE COMPANY PAC"], "fecIds": ["C00402040"]},
    {"companyId": "progressive", "pacNames": ["THE PROGRESSIVE CORPORATION EMPLOYEES POLITICAL ACTION COMMITTEE"], "fecIds": ["C00163865"]},
]

# Verify each one exists on FEC
data_path = os.path.join(os.path.dirname(__file__), "..", "data", "fec-pac-names.json")
with open(data_path, "r", encoding="utf-8") as f:
    data = json.load(f)
existing_ids = {p["companyId"] for p in data["pacs"]}

added = 0
for pac in MANUAL_PACS:
    if pac["companyId"] in existing_ids:
        print(f"{pac['companyId']}: already exists, skipping")
        continue
    
    # Verify committee exists
    fec_id = pac["fecIds"][0]
    r = requests.get(f"https://api.open.fec.gov/v1/committee/{fec_id}/",
                     params={"api_key": FEC_API_KEY}, timeout=15)
    if r.status_code == 200:
        result = r.json().get("results", [])
        if result:
            real_name = result[0].get("name", pac["pacNames"][0])
            pac["pacNames"] = [real_name]
            data["pacs"].append(pac)
            added += 1
            print(f"{pac['companyId']}: VERIFIED {real_name} ({fec_id})")
        else:
            print(f"{pac['companyId']}: committee {fec_id} not found")
    else:
        # Add anyway with manual name
        data["pacs"].append(pac)
        added += 1
        print(f"{pac['companyId']}: added (unverified) {pac['pacNames'][0]}")
    
    time.sleep(0.5)

with open(data_path, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
print(f"\nAdded {added}. Total: {len(data['pacs'])}")
