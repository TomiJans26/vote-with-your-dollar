"""Kroger API client with OAuth2 client-credentials and token caching."""
import os
import time
import requests

KROGER_CLIENT_ID = os.environ.get("KROGER_CLIENT_ID", "dollarvote-bbcchkn8")
KROGER_CLIENT_SECRET = os.environ.get("KROGER_CLIENT_SECRET", "ZGV1nFg0dXPtzU19HKEGZvQ_cZLZ6b8E3_mAOpeC")
KROGER_BASE = "https://api.kroger.com/v1"

_token_cache: dict = {"token": None, "expires_at": 0}


def _get_token() -> str:
    now = time.time()
    if _token_cache["token"] and now < _token_cache["expires_at"] - 60:
        return _token_cache["token"]

    resp = requests.post(
        f"{KROGER_BASE}/connect/oauth2/token",
        data={"grant_type": "client_credentials", "scope": "product.compact"},
        auth=(KROGER_CLIENT_ID, KROGER_CLIENT_SECRET),
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    _token_cache["token"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 1800)
    return _token_cache["token"]


def _headers():
    return {"Authorization": f"Bearer {_get_token()}", "Accept": "application/json"}


def find_locations(zip_code: str, limit: int = 5) -> list[dict]:
    """Find Kroger/banner stores near a ZIP code."""
    try:
        resp = requests.get(
            f"{KROGER_BASE}/locations",
            params={"filter.zipCode.near": zip_code, "filter.limit": limit},
            headers=_headers(),
            timeout=10,
        )
        if not resp.ok:
            return []
        stores = []
        for loc in resp.json().get("data", []):
            addr = loc.get("address", {})
            geo = loc.get("geolocation", {})
            stores.append({
                "id": loc.get("locationId"),
                "name": loc.get("name", "Kroger"),
                "chain": loc.get("chain", "Kroger"),
                "address": f"{addr.get('addressLine1', '')}, {addr.get('city', '')} {addr.get('state', '')} {addr.get('zipCode', '')}".strip(", "),
                "lat": geo.get("latitude"),
                "lng": geo.get("longitude"),
            })
        return stores
    except Exception:
        return []


def find_products(product_name: str, location_id: str, limit: int = 3) -> list[dict]:
    """Search for products at a specific Kroger location."""
    try:
        resp = requests.get(
            f"{KROGER_BASE}/products",
            params={
                "filter.term": product_name,
                "filter.locationId": location_id,
                "filter.limit": limit,
            },
            headers=_headers(),
            timeout=10,
        )
        if not resp.ok:
            return []
        results = []
        for p in resp.json().get("data", []):
            item = p.get("items", [{}])[0] if p.get("items") else {}
            fulfillment = item.get("fulfillment", {})
            price = item.get("price", {})
            results.append({
                "name": p.get("description", ""),
                "brand": p.get("brand", ""),
                "upc": p.get("upc"),
                "available": fulfillment.get("inStore", False),
                "aisle": item.get("aisle", {}).get("description"),
                "price": price.get("regular"),
                "promoPrice": price.get("promo"),
            })
        return results
    except Exception:
        return []
