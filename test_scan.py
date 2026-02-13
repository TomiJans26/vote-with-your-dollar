import requests, json

# Test scan
r = requests.get('http://localhost:3001/api/scan/028400064057')
data = r.json()
print('=== SCAN ===')
product = data.get('product', {})
print(f"Product: {product.get('name')}")
print(f"Brand: {product.get('brand')}")
pc = data.get('parentCompany')
print(f"Parent: {pc.get('name') if pc else 'NOT FOUND'}")
print(f"Category: {data.get('category')}")
print()

# Test alternatives
r2 = requests.post('http://localhost:3001/api/alternatives', json={
    'category': data.get('category', ''),
    'companyId': pc['id'] if pc else '',
    'upc': '028400064057',
    'beliefProfile': {}
})
alts = r2.json().get('alternatives', [])
print(f'=== ALTERNATIVES ({len(alts)}) ===')
for a in alts:
    parent = a.get('parentCompany')
    pct = a.get('alignment', {}).get('pct')
    name = (a.get('name') or 'Unknown')[:50]
    brand = (a.get('brand') or 'Unknown')[:20]
    pname = parent['name'] if parent else 'Independent'
    print(f"  {name:50s} | {brand:20s} | {pname:20s} | {pct}%")
