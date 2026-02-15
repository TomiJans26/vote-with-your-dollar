import requests, json, sys

upc = sys.argv[1] if len(sys.argv) > 1 else "033200942610"

r = requests.get(f'http://localhost:3001/api/scan/{upc}', timeout=30)
if r.status_code != 200:
    print(f"Scan failed: {r.status_code} {r.text[:200]}")
else:
    data = r.json()
    product = data.get('product', {})
    pc = data.get('parentCompany')
    print(f"Product: {product.get('name')}")
    print(f"Brand: {product.get('brand')}")
    print(f"Parent: {pc.get('name') if pc else 'NOT FOUND'}")
    print(f"Category: {data.get('category')}")
    
    # Get alternatives
    r2 = requests.post('http://localhost:3001/api/alternatives', json={
        'category': data.get('category', ''),
        'companyId': pc['id'] if pc else '',
        'upc': upc,
        'beliefProfile': {}
    }, timeout=60)
    alts = r2.json().get('alternatives', [])
    print(f"\nAlternatives ({len(alts)}):")
    for a in alts:
        parent = a.get('parentCompany')
        name = (a.get('name') or '?')[:45]
        brand = (a.get('brand') or '?')[:20]
        pname = parent['name'] if parent else 'Independent'
        print(f"  {name:45s} | {brand:20s} | {pname}")
