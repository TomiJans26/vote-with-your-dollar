import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings
import requests

FEC_API_KEY = settings.FEC_API_KEY
print(f"FEC API Key: {FEC_API_KEY[:10]}...")

resp = requests.get(
    "https://api.open.fec.gov/v1/names/committees/",
    params={"q": "APPLE INC", "api_key": FEC_API_KEY},
    timeout=10
)
print(f"FEC status: {resp.status_code}")
if resp.status_code == 200:
    results = resp.json().get("results", [])
    print(f"Results: {len(results)}")
    for r in results[:5]:
        name = r.get("name", "?")
        cid = r.get("id", "?")
        print(f"  {name} ({cid})")
else:
    print(f"Error: {resp.text[:300]}")
