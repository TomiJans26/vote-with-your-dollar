import json
import os
import time
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
import requests as http_requests
from models import db, User, BeliefProfile, ScanHistory
from config import Config

api_bp = Blueprint("api", __name__, url_prefix="/api")

# ---------------------------------------------------------------------------
# Load data files
# ---------------------------------------------------------------------------
DATA_DIR = Config.DATA_DIR


def _load_json(filename):
    with open(os.path.join(DATA_DIR, filename), "r", encoding="utf-8") as f:
        return json.load(f)


_companies_raw = _load_json("parent-companies.json")["companies"]
_categories_raw = _load_json("product-categories.json")["categories"]
_pacs_raw = _load_json("fec-pac-names.json")["pacs"]
_company_issues_data = _load_json("company-issues.json")

# Build lookups
brand_map: dict[str, dict] = {}
for c in _companies_raw:
    for b in c.get("brands", []):
        brand_map[b.lower()] = c

company_map: dict[str, dict] = {c["id"]: c for c in _companies_raw}
pac_map: dict[str, dict] = {p["companyId"]: p for p in _pacs_raw}

# FEC cache (in-memory, 1h TTL)
_fec_cache: dict[str, tuple[dict, float]] = {}
FEC_CACHE_TTL = 3600


# ---------------------------------------------------------------------------
# Helper functions (ported from server.js)
# ---------------------------------------------------------------------------
def find_parent_company(brand: str | None):
    if not brand:
        return None
    bl = brand.lower()
    exact = brand_map.get(bl)
    if exact:
        return exact
    for key, company in brand_map.items():
        if bl in key or key in bl:
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
    # Fallback heuristics
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
        data = {"hasPac": False, "donations": {"democrat": 0, "republican": 0, "other": 0, "total": 0}, "percentDem": 50, "percentRep": 50}
        _fec_cache[company_id] = (data, time.time())
        return data

    try:
        fec_id = pac_info["fecIds"][0]
        api_key = Config.FEC_API_KEY
        resp = http_requests.get(
            f"https://api.open.fec.gov/v1/schedules/schedule_b/by_recipient/",
            params={"committee_id": fec_id, "per_page": 50, "sort": "-total", "cycle": 2024, "api_key": api_key},
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
            "hasPac": True,
            "pacName": pac_info["pacNames"][0],
            "fecId": fec_id,
            "donations": {"democrat": democrat, "republican": republican, "other": other, "total": total},
            "percentDem": round((democrat / total) * 100) if total > 0 else 50,
            "percentRep": round((republican / total) * 100) if total > 0 else 50,
        }
        _fec_cache[company_id] = (data, time.time())
        return data
    except Exception as e:
        data = {
            "hasPac": True,
            "pacName": pac_info["pacNames"][0],
            "donations": {"democrat": 0, "republican": 0, "other": 0, "total": 0},
            "percentDem": 50,
            "percentRep": 50,
            "error": "FEC data temporarily unavailable",
        }
        _fec_cache[company_id] = (data, time.time())
        return data


# ---------------------------------------------------------------------------
# Barcode lookup (Open Food Facts + UPCitemdb)
# ---------------------------------------------------------------------------
def lookup_openfoodfacts(barcode: str):
    try:
        resp = http_requests.get(f"https://world.openfoodfacts.org/api/v2/product/{barcode}.json", timeout=5)
        data = resp.json()
        if data.get("status") == 1 and data.get("product"):
            p = data["product"]
            return {
                "source": "openfoodfacts",
                "barcode": barcode,
                "name": p.get("product_name"),
                "brand": p.get("brands"),
                "categories": p.get("categories"),
                "image": p.get("image_url"),
            }
    except Exception:
        pass
    return None


def lookup_upcitemdb(barcode: str):
    try:
        resp = http_requests.get("https://api.upcitemdb.com/prod/trial/lookup", params={"upc": barcode}, timeout=5)
        data = resp.json()
        items = data.get("items", [])
        if items:
            item = items[0]
            return {
                "source": "upcitemdb",
                "barcode": barcode,
                "name": item.get("title"),
                "brand": item.get("brand"),
                "categories": item.get("category"),
                "image": (item.get("images") or [None])[0],
            }
    except Exception:
        pass
    return None


def lookup_barcode(barcode: str):
    return lookup_openfoodfacts(barcode) or lookup_upcitemdb(barcode)


# ---------------------------------------------------------------------------
# Helper: get current user id if authenticated (optional auth)
# ---------------------------------------------------------------------------
def _get_optional_user_id():
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        return int(identity) if identity else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Product/company routes
# ---------------------------------------------------------------------------
@api_bp.route("/scan/<upc>", methods=["GET"])
def scan_product(upc):
    # Handle search-based lookups (search-{companyId})
    if upc.startswith("search-"):
        company_id = upc[7:]
        company = company_map.get(company_id)
        if not company:
            return jsonify({"error": "Company not found", "upc": upc}), 404
        political = get_company_political_data(company_id)
        company_issues = _company_issues_data.get(company_id, {}).get("issues", {})
        return jsonify({
            "product": {
                "name": company["name"],
                "brand": company.get("brands", [""])[0],
                "image": None,
                "barcode": None,
                "categories": company.get("industry"),
            },
            "parentCompany": {
                "id": company["id"],
                "name": company["name"],
                "ticker": company.get("ticker"),
                "industry": company.get("industry"),
            },
            "category": None,
            "political": political,
            "companyIssues": company_issues,
        })

    product = lookup_barcode(upc)
    if not product:
        return jsonify({"error": "Product not found", "upc": upc}), 404

    parent_company = find_parent_company(product.get("brand"))
    category = guess_category(product)
    political = None

    if parent_company:
        political = get_company_political_data(parent_company["id"])

    company_issues = _company_issues_data.get(parent_company["id"], {}).get("issues", {}) if parent_company else {}

    # Save to scan history if authenticated
    user_id = _get_optional_user_id()
    if user_id:
        try:
            entry = ScanHistory(
                user_id=user_id,
                upc=upc,
                product_name=product.get("name"),
                brand=product.get("brand"),
                parent_company=parent_company["name"] if parent_company else None,
                alignment_score=None,
            )
            db.session.add(entry)
            db.session.commit()
        except Exception:
            db.session.rollback()

    return jsonify({
        "product": {
            "name": product.get("name"),
            "brand": product.get("brand"),
            "image": product.get("image"),
            "barcode": product.get("barcode"),
            "categories": product.get("categories"),
        },
        "parentCompany": {
            "id": parent_company["id"],
            "name": parent_company["name"],
            "ticker": parent_company.get("ticker"),
            "industry": parent_company.get("industry"),
        } if parent_company else None,
        "category": {"id": category["id"], "name": category["name"]} if category else None,
        "political": political,
        "companyIssues": company_issues,
    })


@api_bp.route("/alternatives/<category>/<company_id>", methods=["GET"])
def get_alternatives(category, company_id):
    alternatives_src = [c for c in _companies_raw if c["id"] != company_id][:10]
    results = []
    for alt in alternatives_src:
        if len(results) >= 3:
            break
        political = get_company_political_data(alt["id"])
        results.append({
            "company": {"id": alt["id"], "name": alt["name"], "ticker": alt.get("ticker")},
            "brands": alt.get("brands", [])[:5],
            "political": political,
        })
    return jsonify({"category": category, "alternatives": results})


@api_bp.route("/search", methods=["GET"])
def search_products():
    q = (request.args.get("q") or "").strip().lower()
    if not q or len(q) < 2:
        return jsonify({"results": [], "offResults": []})

    # Search local brand database
    brand_results = []
    seen_companies = set()
    for c in _companies_raw:
        for b in c.get("brands", []):
            if q in b.lower():
                if c["id"] not in seen_companies:
                    seen_companies.add(c["id"])
                    matching_brands = [br for br in c.get("brands", []) if q in br.lower()]
                    brand_results.append({
                        "type": "brand",
                        "brand": matching_brands[0] if matching_brands else b,
                        "matchingBrands": matching_brands[:5],
                        "company": {
                            "id": c["id"],
                            "name": c["name"],
                            "ticker": c.get("ticker"),
                            "industry": c.get("industry"),
                        },
                    })
                break
        if len(brand_results) >= 10:
            break

    # Also search company names
    for c in _companies_raw:
        if q in c["name"].lower() and c["id"] not in seen_companies:
            seen_companies.add(c["id"])
            brand_results.append({
                "type": "company",
                "brand": c.get("brands", [""])[0],
                "matchingBrands": c.get("brands", [])[:5],
                "company": {
                    "id": c["id"],
                    "name": c["name"],
                    "ticker": c.get("ticker"),
                    "industry": c.get("industry"),
                },
            })

    # Search Open Food Facts
    off_results = []
    try:
        resp = http_requests.get(
            "https://world.openfoodfacts.org/cgi/search.pl",
            params={"search_terms": q, "json": 1, "page_size": 10},
            timeout=5,
        )
        if resp.ok:
            data = resp.json()
            for p in data.get("products", []):
                barcode = p.get("code")
                name = p.get("product_name")
                if barcode and name:
                    off_results.append({
                        "type": "product",
                        "barcode": barcode,
                        "name": name,
                        "brand": p.get("brands"),
                        "image": p.get("image_small_url") or p.get("image_url"),
                    })
    except Exception:
        pass

    return jsonify({"results": brand_results, "offResults": off_results})


@api_bp.route("/company/<company_id>", methods=["GET"])
def get_company(company_id):
    company = company_map.get(company_id)
    if not company:
        return jsonify({"error": "Company not found"}), 404
    political = get_company_political_data(company["id"])
    pac_info = pac_map.get(company["id"])
    return jsonify({**company, "political": political, "pac": pac_info})


@api_bp.route("/company/<company_id>/issues", methods=["GET"])
def get_company_issues(company_id):
    issues = _company_issues_data.get(company_id)
    if not issues:
        return jsonify({"companyId": company_id, "issues": {}})
    return jsonify({"companyId": company_id, **issues})


# ---------------------------------------------------------------------------
# Profile routes (require auth)
# ---------------------------------------------------------------------------
@api_bp.route("/profile/beliefs", methods=["GET"])
@jwt_required()
def get_beliefs():
    user_id = int(get_jwt_identity())
    beliefs = BeliefProfile.query.filter_by(user_id=user_id).all()
    profile = {}
    for b in beliefs:
        profile[b.issue_key] = {"stance": b.stance, "importance": b.importance}
    return jsonify({"beliefs": profile})


@api_bp.route("/profile/beliefs", methods=["PUT"])
@jwt_required()
def save_beliefs():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}
    beliefs_data = data.get("beliefs", {})

    if not isinstance(beliefs_data, dict):
        return jsonify({"error": "beliefs must be an object"}), 400

    # Delete existing and replace
    BeliefProfile.query.filter_by(user_id=user_id).delete()
    for issue_key, val in beliefs_data.items():
        if not isinstance(val, dict):
            continue
        stance = val.get("stance", 0)
        importance = val.get("importance", 0)
        # Validate ranges
        if not (-2 <= stance <= 2):
            continue
        if not (0 <= importance <= 3):
            continue
        bp = BeliefProfile(user_id=user_id, issue_key=issue_key, stance=stance, importance=importance)
        db.session.add(bp)

    db.session.commit()
    return jsonify({"ok": True})


@api_bp.route("/profile/history", methods=["GET"])
@jwt_required()
def get_history():
    user_id = int(get_jwt_identity())
    history = ScanHistory.query.filter_by(user_id=user_id).order_by(ScanHistory.scanned_at.desc()).limit(100).all()
    return jsonify({
        "history": [
            {
                "id": h.id,
                "upc": h.upc,
                "product_name": h.product_name,
                "brand": h.brand,
                "parent_company": h.parent_company,
                "alignment_score": h.alignment_score,
                "scanned_at": h.scanned_at.isoformat() if h.scanned_at else None,
            }
            for h in history
        ]
    })


@api_bp.route("/profile", methods=["DELETE"])
@jwt_required()
def delete_account():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"ok": True, "message": "Account deleted"})
