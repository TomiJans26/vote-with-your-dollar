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
def _normalize(s: str) -> str:
    return s.lower().replace("-", "").replace(" ", "").replace("'", "").replace("'", "").strip()


def find_parent_company(brand: str | None, product_name: str | None = None):
    if not brand and not product_name:
        return None
    # Try exact brand match (lowercase key in brand_map)
    if brand:
        bl = brand.lower().strip()
        exact = brand_map.get(bl)
        if exact:
            return exact
        # Fuzzy: normalize and try exact normalized match
        bl_norm = _normalize(brand)
        for key, company in brand_map.items():
            key_norm = _normalize(key)
            if bl_norm == key_norm:
                return company
        # Substring only if both sides are long enough (avoid "olay" in "fritolay")
        if len(bl_norm) >= 5:
            for key, company in brand_map.items():
                key_norm = _normalize(key)
                if len(key_norm) >= 5 and (bl_norm in key_norm or key_norm in bl_norm):
                    return company
    # Try matching product name against brand list
    if product_name:
        pn_norm = _normalize(product_name)
        # Sort brands longest-first to prefer specific matches
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
                "brand": p.get("brands") or p.get("brand_owner") or p.get("brand_owner_imported"),
                "categories": p.get("categories"),
                "image": p.get("image_url") or p.get("image_small_url"),
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

    parent_company = find_parent_company(product.get("brand"), product.get("name"))
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


# ---------------------------------------------------------------------------
# Open Food Facts cache (in-memory, 1h TTL)
# ---------------------------------------------------------------------------
_off_cache: dict[str, tuple[any, float]] = {}
OFF_CACHE_TTL = 3600


def _off_cached_get(url: str, params: dict | None = None, timeout: int = 15):
    """GET with in-memory 1h cache for Open Food Facts API calls."""
    import hashlib
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


# ---------------------------------------------------------------------------
# Belief alignment scoring (mirrors frontend getBeliefAlignment)
# ---------------------------------------------------------------------------
_IMPORTANCE_WEIGHTS = [0, 1, 3, 0]  # 0=don't care, 1=somewhat, 2=very, 3=dealbreaker


def _score_company(company_id: str, belief_profile: dict, original_company_id: str | None = None):
    """Score a company against a belief profile. Returns dict with score, dealBreakerHit, reasons."""
    company_issues = _company_issues_data.get(company_id, {}).get("issues", {})
    original_issues = _company_issues_data.get(original_company_id, {}).get("issues", {}) if original_company_id else {}

    if not company_issues or not belief_profile:
        return {"score": 0, "dealBreakerHit": False, "reasons": [], "matchingIssues": [], "conflictingIssues": []}

    reasons = []
    matching = []
    conflicting = []
    weighted_sum = 0
    total_weight = 0
    deal_breaker_hit = False

    # Issue name lookup
    issue_names = {
        "abortion": "Abortion / Reproductive Rights", "lgbtq_rights": "LGBTQ+ Rights",
        "racial_justice": "Racial Justice / Equity", "immigration": "Immigration",
        "religious_liberty": "Religious Liberty", "death_penalty": "Death Penalty",
        "workers_rights": "Workers' Rights / Labor Unions", "minimum_wage": "Minimum Wage / Living Wage",
        "corporate_tax": "Corporate Tax Policy", "free_trade": "Free Trade vs Protectionism",
        "climate_change": "Climate Change / Carbon Emissions", "renewable_energy": "Renewable Energy",
        "environmental_regulations": "Environmental Regulations", "animal_rights": "Animal Rights / Welfare",
        "gun_control": "Gun Control / 2nd Amendment", "military_spending": "Military / Defense Spending",
        "police_reform": "Police Reform / Criminal Justice", "drug_policy": "Drug Policy / Legalization",
        "universal_healthcare": "Universal Healthcare", "education_funding": "Education Funding",
        "student_debt": "Student Debt", "vaccine_policy": "Vaccine Policy",
    }
    importance_labels = {0: "don't care", 1: "somewhat important", 2: "very important", 3: "deal breaker"}

    for issue_id, belief in belief_profile.items():
        if not isinstance(belief, dict):
            continue
        importance = belief.get("importance", 0)
        if importance == 0:
            continue
        company_issue = company_issues.get(issue_id)
        if not company_issue:
            continue

        user_stance = belief.get("stance", 0) / 2  # normalize -2..2 to -1..1
        company_stance = company_issue.get("stance", 0)
        issue_name = issue_names.get(issue_id, issue_id)
        imp_label = importance_labels.get(importance, "")
        orig_issue = original_issues.get(issue_id)

        if importance == 3:
            misalignment = user_stance * company_stance
            if misalignment < -0.2:
                deal_breaker_hit = True
                conflicting.append(issue_id)
                reasons.append(f"🚫 Conflicts with your deal breaker on {issue_name}")
            elif misalignment > 0.2:
                weighted_sum += 5
                total_weight += 5
                matching.append(issue_id)
                reasons.append(f"✅ Supports {issue_name} (your deal breaker)")
        else:
            weight = _IMPORTANCE_WEIGHTS[importance]
            score = user_stance * company_stance
            weighted_sum += score * weight
            total_weight += weight

            if score > 0.3:
                matching.append(issue_id)
                # Compare with original company
                if orig_issue and user_stance * orig_issue.get("stance", 0) < 0:
                    orig_company_name = company_map.get(original_company_id, {}).get("name", "the original company")
                    reasons.append(f"✅ Supports {issue_name} ({imp_label} to you) — unlike {orig_company_name}")
                else:
                    reasons.append(f"✅ Supports {issue_name} ({imp_label} to you)")
            elif score < -0.3:
                conflicting.append(issue_id)
                reasons.append(f"⚠️ Mixed on {issue_name}")

    final_score = max(-1, min(1, weighted_sum / total_weight)) if total_weight > 0 else 0
    if deal_breaker_hit:
        final_score = -1

    if final_score > 0.4:
        label = "Great match"
    elif final_score > 0.1:
        label = "Good match"
    elif final_score > -0.1:
        label = "Mixed"
    elif final_score > -0.4:
        label = "Weak match"
    else:
        label = "Poor match"

    return {
        "score": round(final_score, 3),
        "pct": max(0, round(((final_score + 1) / 2) * 100)),
        "dealBreakerHit": deal_breaker_hit,
        "label": label,
        "reasons": reasons[:6],
        "matchingIssues": matching,
        "conflictingIssues": conflicting,
    }


def _find_off_alternatives(upc: str, exclude_company_id: str):
    """Find alternative products from Open Food Facts based on original product's categories."""
    # First get the original product's categories
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

    # Try category-based search using the most specific category (v2 API — fast and reliable)
    for cat_tag in reversed(categories_tags[:5]):
        cat_name = cat_tag.replace("en:", "")
        data = _off_cached_get("https://world.openfoodfacts.org/api/v2/search",
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
            # Filter out same parent company
            brand_lower = brand.lower() if brand else ""
            brand_for_lookup = brand or p.get("brand_owner") or p.get("brand_owner_imported")
            parent = find_parent_company(brand_for_lookup, name)
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

    # Also try search-based
    if len(alt_products) < 5 and product_name:
        search_term = product_name.split(",")[0].split("-")[0].strip()[:40]
        data = _off_cached_get("https://world.openfoodfacts.org/api/v2/search",
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
                parent = find_parent_company(brand_for_lookup, name)
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


def _fallback_alternatives(category: str, exclude_company_id: str, belief_profile: dict):
    """Fallback: return company-level alternatives from our database when OFF doesn't work."""
    alts = [c for c in _companies_raw if c["id"] != exclude_company_id]
    results = []
    for alt in alts:
        score_data = _score_company(alt["id"], belief_profile, exclude_company_id) if belief_profile else {"score": 0, "pct": 50, "dealBreakerHit": False, "label": "Unknown", "reasons": [], "matchingIssues": [], "conflictingIssues": []}
        if score_data["dealBreakerHit"]:
            continue
        results.append({
            "barcode": None,
            "name": alt.get("brands", [""])[0],
            "brand": alt.get("brands", [""])[0],
            "image": None,
            "parentCompany": {"id": alt["id"], "name": alt["name"]},
            "alignment": score_data,
        })
    results.sort(key=lambda x: x["alignment"]["score"], reverse=True)
    return results[:5]


@api_bp.route("/alternatives/<category>/<company_id>", methods=["GET"])
def get_alternatives(category, company_id):
    upc = request.args.get("upc")
    belief_json = request.args.get("beliefProfile")
    belief_profile = json.loads(belief_json) if belief_json else {}

    return _build_alternatives_response(category, company_id, upc, belief_profile)


@api_bp.route("/alternatives", methods=["POST"])
def post_alternatives():
    data = request.get_json(silent=True) or {}
    category = data.get("category", "")
    company_id = data.get("companyId", "")
    upc = data.get("upc")
    belief_profile = data.get("beliefProfile", {})

    return _build_alternatives_response(category, company_id, upc, belief_profile)


def _build_alternatives_response(category, company_id, upc, belief_profile):
    scored_results = []
    unscored_results = []

    # Try Open Food Facts product-level alternatives
    if upc:
        off_products = _find_off_alternatives(upc, company_id)
        seen_companies = set()
        seen_brands = set()
        for prod in off_products:
            parent = prod.get("parentCompany")
            brand_key = (prod.get("brand") or prod.get("name") or "").lower()
            
            # Avoid duplicate brands
            if brand_key in seen_brands:
                continue
            seen_brands.add(brand_key)
            
            if parent:
                # Only one product per parent company
                if parent["id"] in seen_companies:
                    continue
                seen_companies.add(parent["id"])
                
                score_data = _score_company(parent["id"], belief_profile, company_id) if belief_profile else {"score": 0, "pct": 50, "dealBreakerHit": False, "label": "Unknown", "reasons": [], "matchingIssues": [], "conflictingIssues": []}
                if score_data["dealBreakerHit"]:
                    continue
                scored_results.append({**prod, "alignment": score_data})
            else:
                # Unknown parent company — still show as alternative!
                # These are often smaller/independent brands which may be better choices
                unscored_results.append({
                    **prod,
                    "alignment": {
                        "score": 0, "pct": None, "dealBreakerHit": False,
                        "label": "Independent / Unknown Parent",
                        "reasons": ["ℹ️ This brand isn't owned by a major conglomerate in our database — it may be independently owned"],
                        "matchingIssues": [], "conflictingIssues": []
                    }
                })

    # Combine: scored first (sorted by alignment), then unscored products
    scored_results.sort(key=lambda x: x["alignment"]["score"], reverse=True)
    results = scored_results[:5]
    
    # Fill remaining slots with unscored real products (NOT random companies)
    if len(results) < 5:
        for us in unscored_results:
            results.append(us)
            if len(results) >= 5:
                break

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
