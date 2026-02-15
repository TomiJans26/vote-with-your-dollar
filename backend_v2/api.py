"""Product/scan/alternatives/belief/search routes — ported from Flask backend."""
import json
import os
import time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Header, Query, Request
from sqlalchemy.orm import Session
import requests as http_requests

from database import get_db
from models import User, BeliefProfile, ScanHistory
from schemas import SaveBeliefsRequest, AlternativesRequest
from config import settings
from auth import auth_required, auth_optional
from scoring import score_company
from alternatives import find_off_alternatives

router = APIRouter(prefix="/api", tags=["api"])

# ---------------------------------------------------------------------------
# Load data files (in-memory, like Flask version)
# ---------------------------------------------------------------------------
DATA_DIR = settings.DATA_DIR


def _load_json(filename):
    with open(os.path.join(DATA_DIR, filename), "r", encoding="utf-8") as f:
        return json.load(f)


_companies_raw = _load_json("parent-companies.json")["companies"]
_categories_raw = _load_json("product-categories.json")["categories"]
_pacs_raw = _load_json("fec-pac-names.json")["pacs"]
_company_issues_data = _load_json("company-issues.json")


# ---------------------------------------------------------------------------
# Helpers (must be before brand_map build)
# ---------------------------------------------------------------------------
import re as _re

def _normalize(s: str) -> str:
    # Strip parenthetical notes like "(via Swedish Match acquisition)"
    s = _re.sub(r'\s*\(.*?\)', '', s)
    return s.lower().replace("-", "").replace(" ", "").replace("'", "").replace("\u2019", "").strip()


# Build lookups
brand_map: dict[str, dict] = {}
for c in _companies_raw:
    for b in c.get("brands", []):
        brand_map[b.lower()] = c
        # Also index normalized version (strips parentheticals)
        norm_key = _normalize(b)
        if norm_key and norm_key not in brand_map:
            brand_map[norm_key] = c

company_map: dict[str, dict] = {c["id"]: c for c in _companies_raw}
pac_map: dict[str, dict] = {p["companyId"]: p for p in _pacs_raw}

# FEC cache
_fec_cache: dict[str, tuple[dict, float]] = {}
FEC_CACHE_TTL = 3600


def find_parent_company(brand: str | None, product_name: str | None = None):
    if not brand and not product_name:
        return None
    if brand:
        bl = brand.lower().strip()
        exact = brand_map.get(bl)
        if exact:
            return exact
        bl_norm = _normalize(brand)
        for key, company in brand_map.items():
            if bl_norm == _normalize(key):
                return company
        if len(bl_norm) >= 5:
            for key, company in brand_map.items():
                key_norm = _normalize(key)
                if len(key_norm) >= 5 and (bl_norm in key_norm or key_norm in bl_norm):
                    return company
    if product_name:
        pn_norm = _normalize(product_name)
        sorted_brands = sorted(brand_map.items(), key=lambda x: len(x[0]), reverse=True)
        for key, company in sorted_brands:
            key_norm = _normalize(key)
            if len(key_norm) >= 3 and pn_norm.startswith(key_norm):
                return company
    return None


def guess_category(product: dict | None):
    if not product or not product.get("categories"):
        return None
    cats = product["categories"].lower()
    for cat in _categories_raw:
        if cat["name"].lower() in cats:
            return cat
        for sub in cat.get("subcategories", []):
            if sub.replace("-", " ") in cats:
                return cat
    if any(w in cats for w in ("beverage", "drink", "water", "soda")):
        return next((c for c in _categories_raw if c["id"] == "beverages"), None)
    if any(w in cats for w in ("snack", "chip", "cookie")):
        return next((c for c in _categories_raw if c["id"] == "snacks"), None)
    if any(w in cats for w in ("cereal", "breakfast")):
        return next((c for c in _categories_raw if c["id"] == "cereal-breakfast"), None)
    return None


def get_company_political_data(company_id: str) -> dict:
    cached = _fec_cache.get(company_id)
    if cached and time.time() - cached[1] < FEC_CACHE_TTL:
        return cached[0]

    pac_info = pac_map.get(company_id)
    if not pac_info or not pac_info.get("fecIds"):
        data = {"hasPac": False, "donations": {"democrat": 0, "republican": 0, "other": 0, "total": 0},
                "percentDem": 50, "percentRep": 50}
        _fec_cache[company_id] = (data, time.time())
        return data

    try:
        fec_id = pac_info["fecIds"][0]
        resp = http_requests.get(
            "https://api.open.fec.gov/v1/schedules/schedule_b/by_recipient/",
            params={"committee_id": fec_id, "per_page": 50, "sort": "-total",
                    "cycle": 2024, "api_key": settings.FEC_API_KEY},
            timeout=10,
        )
        results = resp.json().get("results", []) if resp.ok else []
        democrat = republican = other = 0
        for d in results:
            amount = d.get("total", 0)
            party = (d.get("recipient_party") or d.get("party") or "").upper()
            if party == "DEM":
                democrat += amount
            elif party == "REP":
                republican += amount
            else:
                other += amount
        total = democrat + republican + other
        data = {
            "hasPac": True, "pacName": pac_info["pacNames"][0], "fecId": fec_id,
            "donations": {"democrat": democrat, "republican": republican, "other": other, "total": total},
            "percentDem": round((democrat / total) * 100) if total > 0 else 50,
            "percentRep": round((republican / total) * 100) if total > 0 else 50,
        }
    except Exception:
        data = {
            "hasPac": True, "pacName": pac_info["pacNames"][0],
            "donations": {"democrat": 0, "republican": 0, "other": 0, "total": 0},
            "percentDem": 50, "percentRep": 50, "error": "FEC data temporarily unavailable",
        }
    _fec_cache[company_id] = (data, time.time())
    return data


# ---------------------------------------------------------------------------
# Barcode lookup
# ---------------------------------------------------------------------------
def lookup_openfoodfacts(barcode: str):
    try:
        resp = http_requests.get(f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json", timeout=5)
        data = resp.json()
        if data.get("status") == 1 and data.get("product"):
            p = data["product"]
            return {
                "source": "openfoodfacts", "barcode": barcode,
                "name": p.get("product_name"),
                "brand": p.get("brands") or p.get("brand_owner") or p.get("brand_owner_imported"),
                "categories": p.get("categories"),
                "image": p.get("image_url") or p.get("image_small_url"),
            }
    except Exception:
        pass
    return None


def lookup_upcitemdb(barcode: str):
    try:
        resp = http_requests.get("https://api.upcitemdb.com/prod/trial/lookup",
                                 params={"upc": barcode}, timeout=5)
        data = resp.json()
        items = data.get("items", [])
        if items:
            item = items[0]
            return {
                "source": "upcitemdb", "barcode": barcode,
                "name": item.get("title"), "brand": item.get("brand"),
                "categories": item.get("category"),
                "image": (item.get("images") or [None])[0],
            }
    except Exception:
        pass
    return None


def lookup_barcode(barcode: str):
    return lookup_openfoodfacts(barcode) or lookup_upcitemdb(barcode)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("/scan/{upc}")
def scan_product(upc: str, authorization: str = Header(None), db: Session = Depends(get_db)):
    # Handle search-based lookups
    if upc.startswith("search-"):
        company_id = upc[7:]
        company = company_map.get(company_id)
        if not company:
            raise HTTPException(404, {"error": "Company not found", "upc": upc})
        political = get_company_political_data(company_id)
        company_issues = _company_issues_data.get(company_id, {}).get("issues", {})
        return {
            "product": {"name": company["name"], "brand": company.get("brands", [""])[0],
                        "image": None, "barcode": None, "categories": company.get("industry")},
            "parentCompany": {"id": company["id"], "name": company["name"],
                              "ticker": company.get("ticker"), "industry": company.get("industry")},
            "category": None, "political": political, "companyIssues": company_issues,
        }

    # Handle brand-name lookups (e.g., "brand-zyn")
    if upc.startswith("brand-"):
        brand_query = upc[6:]
        parent = find_parent_company(brand_query)
        if not parent:
            raise HTTPException(404, {"error": f"Brand '{brand_query}' not found in our database", "upc": upc})
        political = get_company_political_data(parent["id"])
        company_issues = _company_issues_data.get(parent["id"], {}).get("issues", {})
        # Find which brand matched, use clean name
        matched_brand = brand_query.title()
        bq_norm = _normalize(brand_query)
        for b in parent.get("brands", []):
            if bq_norm == _normalize(b):
                # Strip parenthetical from display name
                matched_brand = _re.sub(r'\s*\(.*?\)', '', b).strip()
                break
        return {
            "product": {"name": matched_brand, "brand": matched_brand,
                        "image": None, "barcode": None, "categories": parent.get("industry")},
            "parentCompany": {"id": parent["id"], "name": parent["name"],
                              "ticker": parent.get("ticker"), "industry": parent.get("industry")},
            "category": None, "political": political, "companyIssues": company_issues,
        }

    product = lookup_barcode(upc)
    if not product:
        # Fallback: try matching barcode digits against UPC databases failed,
        # return helpful error with suggestion to search by brand name
        raise HTTPException(404, {"error": "Product not found in barcode databases. Try searching by brand name instead.", "upc": upc})

    parent_company = find_parent_company(product.get("brand"), product.get("name"))
    category = guess_category(product)
    political = get_company_political_data(parent_company["id"]) if parent_company else None
    company_issues = _company_issues_data.get(parent_company["id"], {}).get("issues", {}) if parent_company else {}

    # Save scan history if authenticated
    user = auth_optional(authorization, db)
    if user:
        try:
            entry = ScanHistory(
                user_id=user.id, barcode=upc,
                product_name=product.get("name"), brand_name=product.get("brand"),
                parent_company=parent_company["name"] if parent_company else None,
            )
            db.add(entry)
            db.commit()
        except Exception:
            db.rollback()

    return {
        "product": {"name": product.get("name"), "brand": product.get("brand"),
                     "image": product.get("image"), "barcode": product.get("barcode"),
                     "categories": product.get("categories")},
        "parentCompany": {"id": parent_company["id"], "name": parent_company["name"],
                          "ticker": parent_company.get("ticker"),
                          "industry": parent_company.get("industry")} if parent_company else None,
        "category": {"id": category["id"], "name": category["name"]} if category else None,
        "political": political,
        "companyIssues": company_issues,
    }


@router.get("/alternatives/{category}/{company_id}")
def get_alternatives(category: str, company_id: str, upc: str = Query(None),
                     beliefProfile: str = Query(None)):
    belief_profile = json.loads(beliefProfile) if beliefProfile else {}
    return _build_alternatives_response(category, company_id, upc, belief_profile)


@router.post("/alternatives")
def post_alternatives(data: AlternativesRequest):
    return _build_alternatives_response(data.category, data.companyId, data.upc, data.beliefProfile)


def _build_alternatives_response(category, company_id, upc, belief_profile):
    scored_results = []
    unscored_results = []

    if upc:
        off_products = find_off_alternatives(upc, company_id, brand_map, company_map, find_parent_company)
        seen_companies = set()
        seen_brands = set()
        for prod in off_products:
            parent = prod.get("parentCompany")
            brand_key = (prod.get("brand") or prod.get("name") or "").lower()
            if brand_key in seen_brands:
                continue
            seen_brands.add(brand_key)

            if parent:
                if parent["id"] in seen_companies:
                    continue
                seen_companies.add(parent["id"])
                ci = _company_issues_data.get(parent["id"], {}).get("issues", {})
                orig_ci = _company_issues_data.get(company_id, {}).get("issues", {})
                orig_name = company_map.get(company_id, {}).get("name")
                score_data = score_company(ci, belief_profile, orig_ci, orig_name) if belief_profile else {
                    "score": 0, "pct": 50, "dealBreakerHit": False, "label": "Unknown",
                    "reasons": [], "matchingIssues": [], "conflictingIssues": []}
                if score_data["dealBreakerHit"]:
                    continue
                scored_results.append({**prod, "alignment": score_data})
            else:
                unscored_results.append({
                    **prod, "alignment": {
                        "score": 0, "pct": None, "dealBreakerHit": False,
                        "label": "Independent / Unknown Parent",
                        "reasons": ["ℹ️ This brand isn't owned by a major conglomerate in our database — it may be independently owned"],
                        "matchingIssues": [], "conflictingIssues": []
                    }
                })

    scored_results.sort(key=lambda x: x["alignment"]["score"], reverse=True)
    results = scored_results[:5]
    if len(results) < 5:
        for us in unscored_results:
            results.append(us)
            if len(results) >= 5:
                break

    return {"category": category, "alternatives": results}


@router.get("/search")
def search_products(q: str = Query(""), db: Session = Depends(get_db)):
    q = q.strip().lower()
    if not q or len(q) < 2:
        return {"results": [], "offResults": []}

    brand_results = []
    seen_companies = set()
    for c in _companies_raw:
        for b in c.get("brands", []):
            if q in b.lower():
                if c["id"] not in seen_companies:
                    seen_companies.add(c["id"])
                    matching_brands = [br for br in c.get("brands", []) if q in br.lower()]
                    brand_results.append({
                        "type": "brand", "brand": matching_brands[0] if matching_brands else b,
                        "matchingBrands": matching_brands[:5],
                        "company": {"id": c["id"], "name": c["name"],
                                    "ticker": c.get("ticker"), "industry": c.get("industry")},
                    })
                break
        if len(brand_results) >= 10:
            break

    for c in _companies_raw:
        if q in c["name"].lower() and c["id"] not in seen_companies:
            seen_companies.add(c["id"])
            brand_results.append({
                "type": "company", "brand": c.get("brands", [""])[0],
                "matchingBrands": c.get("brands", [])[:5],
                "company": {"id": c["id"], "name": c["name"],
                            "ticker": c.get("ticker"), "industry": c.get("industry")},
            })

    off_results = []
    try:
        resp = http_requests.get(
            "https://world.openfoodfacts.org/cgi/search.pl",
            params={"search_terms": q, "json": 1, "page_size": 10}, timeout=5)
        if resp.ok:
            for p in resp.json().get("products", []):
                barcode = p.get("code")
                name = p.get("product_name")
                if barcode and name:
                    off_results.append({
                        "type": "product", "barcode": barcode, "name": name,
                        "brand": p.get("brands"),
                        "image": p.get("image_small_url") or p.get("image_url"),
                    })
    except Exception:
        pass

    return {"results": brand_results, "offResults": off_results}


@router.get("/company/{company_id}")
def get_company(company_id: str):
    company = company_map.get(company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    political = get_company_political_data(company["id"])
    pac_info = pac_map.get(company["id"])
    return {**company, "political": political, "pac": pac_info}


@router.get("/company/{company_id}/issues")
def get_company_issues(company_id: str):
    issues = _company_issues_data.get(company_id)
    if not issues:
        return {"companyId": company_id, "issues": {}}
    return {"companyId": company_id, **issues}


# ---------------------------------------------------------------------------
# Profile routes (require auth)
# ---------------------------------------------------------------------------
@router.get("/profile/beliefs")
def get_beliefs(user: User = Depends(auth_required), db: Session = Depends(get_db)):
    beliefs = db.query(BeliefProfile).filter_by(user_id=user.id).all()
    profile = {}
    for b in beliefs:
        profile[b.issue_key] = {"stance": b.stance, "importance": b.importance}
    return {"beliefs": profile}


@router.put("/profile/beliefs")
def save_beliefs(req: SaveBeliefsRequest, user: User = Depends(auth_required),
                 db: Session = Depends(get_db)):
    db.query(BeliefProfile).filter_by(user_id=user.id).delete()
    for issue_key, val in req.beliefs.items():
        bp = BeliefProfile(
            user_id=user.id, issue_key=issue_key,
            stance=val.stance, importance=val.importance,
            is_deal_breaker=(val.importance == 3),
        )
        db.add(bp)
    db.commit()
    return {"ok": True}


@router.get("/profile/history")
def get_history(user: User = Depends(auth_required), db: Session = Depends(get_db)):
    history = db.query(ScanHistory).filter_by(user_id=user.id)\
        .order_by(ScanHistory.scanned_at.desc()).limit(100).all()
    return {
        "history": [
            {"id": h.id, "upc": h.barcode, "product_name": h.product_name,
             "brand": h.brand_name, "parent_company": h.parent_company,
             "alignment_score": h.alignment_score,
             "scanned_at": h.scanned_at.isoformat() if h.scanned_at else None}
            for h in history
        ]
    }


@router.delete("/profile")
def delete_account(user: User = Depends(auth_required), db: Session = Depends(get_db)):
    db.delete(user)
    db.commit()
    return {"ok": True, "message": "Account deleted"}
