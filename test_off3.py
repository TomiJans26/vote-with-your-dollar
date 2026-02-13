import requests

# Test with proper v2 API
r = requests.get("https://world.openfoodfacts.org/api/v2/search",
                 params={"categories_tags_en": "corn-chips", "page_size": 5,
                          "fields": "code,product_name,brands,brand_owner"},
                 timeout=20)
print(f"Status: {r.status_code}")
print(f"Content-Type: {r.headers.get('content-type')}")
if r.ok:
    try:
        data = r.json()
        prods = data.get("products", [])
        print(f"Products: {len(prods)}")
        for p in prods:
            print(f"  {p.get('product_name','?')[:40]} | {p.get('brands','?')}")
    except:
        print(f"Body: {r.text[:500]}")
