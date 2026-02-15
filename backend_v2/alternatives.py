"""Smart alternatives engine using Open Food Facts v2 API."""
import hashlib
import time
import requests as http_requests


_off_cache: dict[str, tuple] = {}
OFF_CACHE_TTL = 3600


def _off_cached_get(url: str, params: dict | None = None, timeout: int = 15):
    key = hashlib.md5((url + str(sorted((params or {}).items()))).encode()).hexdigest()
    cached = _off_cache.get(key)
    if cached and time.time() - cached[1] < OFF_CACHE_TTL:
        return cached[0]
    try:
        resp = http_requests.get(url, params=params, timeout=timeout)
        data = resp.json() if resp.ok else None
    except Exception:
        data = None
    _off_cache[key] = (data, time.time())
    return data


def find_off_alternatives(upc: str, exclude_company_id: str, brand_map: dict,
                          company_map: dict, find_parent_fn):
    """Find alternative products from Open Food Facts."""
    product_data = _off_cached_get(f"https://world.openfoodfacts.org/api/v2/product/{upc}.json")
    if not product_data or product_data.get("status") != 1:
        return []

    product = product_data.get("product", {})
    categories_tags = product.get("categories_tags", [])
    product_name = product.get("product_name", "")

    alt_products = []
    seen_barcodes = {upc}
    exclude_company = company_map.get(exclude_company_id)
    exclude_brands = set()
    if exclude_company:
        exclude_brands = {b.lower() for b in exclude_company.get("brands", [])}

    for cat_tag in reversed(categories_tags[:5]):
        cat_name = cat_tag.replace("en:", "")
        data = _off_cached_get(
            "https://world.openfoodfacts.org/api/v2/search",
            params={"categories_tags_en": cat_name, "page_size": 20,
                    "fields": "code,product_name,brands,brand_owner,brand_owner_imported,image_small_url,image_url",
                    "countries_tags_en": "united-states"})
        if not data:
            continue
        for p in data.get("products", []):
            barcode = p.get("code")
            name = p.get("product_name")
            brand = p.get("brands", "")
            if not barcode or not name or barcode in seen_barcodes:
                continue
            brand_lower = brand.lower() if brand else ""
            brand_for_lookup = brand or p.get("brand_owner") or p.get("brand_owner_imported")
            parent = find_parent_fn(brand_for_lookup, name)
            if parent and parent["id"] == exclude_company_id:
                continue
            if brand_lower in exclude_brands:
                continue
            seen_barcodes.add(barcode)
            alt_products.append({
                "barcode": barcode,
                "name": name,
                "brand": brand or brand_for_lookup or "Unknown Brand",
                "image": p.get("image_small_url") or p.get("image_url"),
                "parentCompany": {"id": parent["id"], "name": parent["name"]} if parent else None,
            })
            if len(alt_products) >= 20:
                break
        if len(alt_products) >= 10:
            break

    # Search-based fallback
    if len(alt_products) < 5 and product_name:
        search_term = product_name.split(",")[0].split("-")[0].strip()[:40]
        data = _off_cached_get(
            "https://world.openfoodfacts.org/api/v2/search",
            params={"search_terms": search_term, "page_size": 20,
                    "fields": "code,product_name,brands,brand_owner,brand_owner_imported,image_small_url,image_url"})
        if data:
            for p in data.get("products", []):
                barcode = p.get("code")
                name = p.get("product_name")
                brand = p.get("brands", "")
                if not barcode or not name or barcode in seen_barcodes:
                    continue
                brand_for_lookup = brand or p.get("brand_owner") or p.get("brand_owner_imported")
                parent = find_parent_fn(brand_for_lookup, name)
                if parent and parent["id"] == exclude_company_id:
                    continue
                brand_lower = brand.lower() if brand else ""
                if brand_lower in exclude_brands:
                    continue
                seen_barcodes.add(barcode)
                alt_products.append({
                    "barcode": barcode,
                    "name": name,
                    "brand": brand or brand_for_lookup or "Unknown Brand",
                    "image": p.get("image_small_url") or p.get("image_url"),
                    "parentCompany": {"id": parent["id"], "name": parent["name"]} if parent else None,
                })
                if len(alt_products) >= 20:
                    break

    return alt_products
