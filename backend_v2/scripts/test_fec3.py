import requests, os

key = os.environ.get("FEC_API_KEY", "DEMO_KEY")
print(f"Key: {key[:10]}...")

# Test various search approaches
tests = [
    ("APPLE INC", "committees"),
    ("APPLE", "committees"),
    ("NIKE", "committees"),
    ("FORD MOTOR", "committees"),
    ("WALMART", "committees"),
    ("MCDONALD", "committees"),
    ("TESLA", "committees"),
]

for term, endpoint in tests:
    r = requests.get(f"https://api.open.fec.gov/v1/{endpoint}/", params={
        "q": term, "api_key": key,
        "committee_type": ["Q", "N", "W", "O", "U", "V"],
        "per_page": 5,
    }, timeout=10)
    if r.status_code == 200:
        results = r.json().get("results", [])
        pacs = [c for c in results if any(kw in c.get("name", "").upper() 
                for kw in ["PAC", "POLITICAL ACTION", "GOOD GOVERNMENT", "CIVIC"])]
        if pacs:
            p = pacs[0]
            print(f"{term}: {p['name']} ({p['committee_id']})")
        else:
            names = [c["name"] for c in results[:3]]
            print(f"{term}: no PAC. Got: {names}")
    else:
        print(f"{term}: HTTP {r.status_code}")
    
    import time; time.sleep(0.5)
