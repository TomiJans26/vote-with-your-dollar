import requests

# Check what OFF returns for corn-chips category
r = requests.get('https://world.openfoodfacts.org/category/corn-chips.json', params={'page_size': 10}, timeout=15)
data = r.json()
products = data.get('products', [])
print(f"Category corn-chips: {len(products)} products")
for p in products[:5]:
    print(f"  {p.get('product_name', '?')[:40]} | brands={p.get('brands', '?')} | brand_owner={p.get('brand_owner', '?')}")

print()
# Also try search
r2 = requests.get('https://world.openfoodfacts.org/cgi/search.pl', params={'search_terms': 'Tostitos', 'json': 1, 'page_size': 10}, timeout=15)
data2 = r2.json()
products2 = data2.get('products', [])
print(f"Search 'Tostitos': {len(products2)} products")
for p in products2[:5]:
    print(f"  {p.get('product_name', '?')[:40]} | brands={p.get('brands', '?')} | code={p.get('code')}")
