import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings
import requests

FEC_API_KEY = settings.FEC_API_KEY

# Try committee search instead of names
tests = ["APPLE", "MICROSOFT", "GOOGLE", "AMAZON", "NIKE", "FORD MOTOR", "GENERAL MOTORS", "AT&T", "WALMART", "JPMORGAN"]

for term in tests:
    resp = requests.get(
        "https://api.open.fec.gov/v1/committees/",
        params={
            "q": term,
            "api_key": FEC_API_KEY,
            "committee_type": ["Q", "N", "W"],  # PAC types
            "per_page": 5,
            "sort": "-receipts",
        },
        timeout=10
    )
    if resp.status_code == 200:
        results = resp.json().get("results", [])
        pacs = [r for r in results if "PAC" in r.get("name", "").upper()
                or "POLITICAL ACTION" in r.get("name", "").upper()
                or "GOOD GOVERNMENT" in r.get("name", "").upper()]
        if pacs:
            p = pacs[0]
            print(f"{term}: {p['name']} ({p['committee_id']})")
        elif results:
            r = results[0]
            print(f"{term}: (no PAC) best={r['name']} ({r['committee_id']})")
        else:
            print(f"{term}: NO RESULTS")
    else:
        print(f"{term}: ERROR {resp.status_code}")
    
    import time; time.sleep(0.5)
