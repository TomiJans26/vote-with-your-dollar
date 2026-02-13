import requests, time

# Test the exact same call the backend makes
upc = "028400064057"

# Get product categories
r = requests.get(f"https://world.openfoodfacts.org/api/v2/product/{upc}.json", timeout=15)
p = r.json()["product"]
cats = p.get("categories_tags", [])
print(f"Categories: {cats}")

# Try most specific category first (reversed)
for cat_tag in reversed(cats[:5]):
    print(f"\nSearching category: {cat_tag}")
    t0 = time.time()
    try:
        r2 = requests.get("https://world.openfoodfacts.org/cgi/search.pl",
                          params={"tagtype_0": "categories", "tag_contains_0": "contains",
                                  "tag_0": cat_tag, "json": 1, "page_size": 5,
                                  "fields": "code,product_name,brands,brand_owner"},
                          timeout=15)
        data = r2.json()
        prods = data.get("products", [])
        print(f"  Got {len(prods)} products in {time.time()-t0:.1f}s")
        for pp in prods[:3]:
            print(f"    {pp.get('product_name','?')[:40]} | {pp.get('brands','?')}")
    except Exception as e:
        print(f"  ERROR: {e} ({time.time()-t0:.1f}s)")
    break  # just test one
