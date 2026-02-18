"""Admin routes for DollarVote dashboard."""
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import func, case
from sqlalchemy.orm import Session
import jwt as pyjwt

from config import settings
from database import get_db
from models import (
    User, ScanHistory, ClickEvent, Company, Brand, CompanyIssue,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])

# ---------------------------------------------------------------------------
# Hardcoded admin credentials
# ---------------------------------------------------------------------------
ADMIN_USERNAME = "dave"
ADMIN_PASSWORD = "DV@dmin2026!"


# ---------------------------------------------------------------------------
# ResearchQueue model — defined here to avoid circular imports
# ---------------------------------------------------------------------------
from sqlalchemy import Column, Integer, String, DateTime, Text
from database import Base


class ResearchQueue(Base):
    __tablename__ = "research_queue"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_name = Column(String(255), nullable=True)
    brand_name = Column(String(255), nullable=True)
    barcode = Column(String(50), nullable=True)
    scan_count = Column(Integer, default=1)
    status = Column(String(50), default="pending")  # pending / in_progress / complete
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)


# ---------------------------------------------------------------------------
# Admin JWT helpers
# ---------------------------------------------------------------------------
def _create_admin_token() -> str:
    payload = {
        "sub": "admin",
        "is_admin": True,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "iat": datetime.now(timezone.utc),
    }
    return pyjwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _verify_admin(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing admin authorization")
    token = authorization[7:]
    try:
        payload = pyjwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        if not payload.get("is_admin"):
            raise HTTPException(403, "Not an admin token")
    except pyjwt.ExpiredSignatureError:
        raise HTTPException(401, "Admin token expired")
    except Exception:
        raise HTTPException(401, "Invalid admin token")
    return True


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------
class AdminLoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
def admin_login(req: AdminLoginRequest):
    if req.username != ADMIN_USERNAME or req.password != ADMIN_PASSWORD:
        raise HTTPException(401, "Invalid admin credentials")
    token = _create_admin_token()
    return {"access_token": token}


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------
@router.get("/stats")
def admin_stats(admin=Depends(_verify_admin), db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    total_users = db.query(func.count(User.id)).scalar() or 0
    total_scans = db.query(func.count(ScanHistory.id)).scalar() or 0
    total_clicks = db.query(func.count(ClickEvent.id)).scalar() or 0
    users_today = db.query(func.count(User.id)).filter(User.created_at >= today_start).scalar() or 0
    scans_today = db.query(func.count(ScanHistory.id)).filter(ScanHistory.scanned_at >= today_start).scalar() or 0

    return {
        "total_users": total_users,
        "total_scans": total_scans,
        "total_clicks": total_clicks,
        "users_today": users_today,
        "scans_today": scans_today,
    }


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------
@router.get("/users")
def admin_users(admin=Depends(_verify_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return {
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "created_at": u.created_at.isoformat() if u.created_at else None,
                "email_verified": u.email_verified,
            }
            for u in users
        ]
    }


# ---------------------------------------------------------------------------
# Companies (from DB)
# ---------------------------------------------------------------------------
@router.get("/companies")
def admin_companies(admin=Depends(_verify_admin), db: Session = Depends(get_db)):
    companies = db.query(Company).order_by(Company.name).all()
    return {
        "companies": [
            {
                "id": c.id,
                "slug": c.slug,
                "name": c.name,
                "ticker": c.ticker,
                "industry": c.industry,
                "country": c.country,
                "description": c.description,
                "brand_count": len(c.brands),
            }
            for c in companies
        ]
    }


# ---------------------------------------------------------------------------
# Company detail (drill-down)
# ---------------------------------------------------------------------------
@router.get("/companies/ranked")
def admin_companies_ranked(
    issues: str = Query(..., description="Comma-separated issue IDs (up to 3)"),
    admin=Depends(_verify_admin),
    db: Session = Depends(get_db),
):
    from api import _companies_raw, _company_issues_data

    issue_list = [i.strip() for i in issues.split(",") if i.strip()][:3]
    if not issue_list:
        raise HTTPException(400, "At least one issue required")

    STANCE_SCORE = {
        "strong_support": 2, "lean_support": 1, "neutral": 0,
        "lean_oppose": -1, "strong_oppose": -2,
    }
    weights = [3, 2, 1]

    def _stance_to_score(val):
        """Convert stance value (string or number) to a score for ranking."""
        if isinstance(val, (int, float)):
            return val * 2  # -1..1 → -2..2 to match string scale
        return STANCE_SCORE.get(val, 0)

    def _stance_to_label(val):
        """Convert numeric stance to display label."""
        if isinstance(val, (int, float)):
            if val >= 0.7: return "strong_support"
            if val >= 0.3: return "lean_support"
            if val <= -0.7: return "strong_oppose"
            if val <= -0.3: return "lean_oppose"
            return "neutral"
        return val if val else "neutral"

    results = []
    for c in _companies_raw:
        cid = c["id"]
        ci = _company_issues_data.get(cid, {}).get("issues", {})
        score = 0
        stances = {}
        for idx, ik in enumerate(issue_list):
            stance_val = ci.get(ik, {}).get("stance", 0)
            stances[ik] = _stance_to_label(stance_val)
            score += _stance_to_score(stance_val) * weights[idx]
        results.append({
            "id": cid,
            "name": c.get("name", ""),
            "ticker": c.get("ticker"),
            "industry": c.get("industry"),
            "score": round(score, 2),
            "stances": stances,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return {"companies": results, "issues": issue_list}


@router.get("/companies/{company_id_str}")
def admin_company_detail(company_id_str: str,
                         admin=Depends(_verify_admin), db: Session = Depends(get_db)):
    from api import _company_issues_data, company_map

    # Try DB first
    try:
        cid_int = int(company_id_str)
        company = db.query(Company).get(cid_int)
    except (ValueError, TypeError):
        company = None

    # Get JSON data
    json_company = company_map.get(company_id_str)

    if not company and not json_company:
        raise HTTPException(404, "Company not found")

    # Build response from DB company
    if company:
        info = {
            "id": company.id,
            "slug": company.slug,
            "name": company.name,
            "ticker": company.ticker,
            "industry": company.industry,
            "country": company.country,
            "description": company.description,
            "brands": [b.name for b in company.brands],
        }
    else:
        info = {
            "id": company_id_str,
            "slug": json_company.get("id"),
            "name": json_company.get("name", ""),
            "ticker": json_company.get("ticker"),
            "industry": json_company.get("industry"),
            "country": json_company.get("country"),
            "description": json_company.get("description"),
            "brands": json_company.get("brands", []),
        }

    # Issues from JSON
    ci = _company_issues_data.get(company_id_str, {}).get("issues", {})
    # Also try slug
    if not ci and company:
        ci = _company_issues_data.get(company.slug, {}).get("issues", {})
    issues = [
        {"key": k, "stance": v.get("stance", "neutral"),
         "importance": v.get("importance", ""), "notes": v.get("notes", "")}
        for k, v in ci.items()
    ]

    # PAC donations from DB
    from models import PacDonation
    pac_total = 0
    if company:
        pacs = db.query(PacDonation).filter_by(company_id=company.id).all()
        pac_total = sum(p.total or 0 for p in pacs)

    # Click count
    company_name = info["name"]
    click_count = db.query(func.count(ClickEvent.id)).filter(
        ClickEvent.alternative_company_id == company_id_str
    ).scalar() or 0

    # Research queue
    rq = db.query(ResearchQueue).filter(
        ResearchQueue.company_name.ilike(f"%{company_name}%")
    ).all() if company_name else []

    return {
        "company": info,
        "issues": issues,
        "pac_total": pac_total,
        "click_count": click_count,
        "research_items": [
            {"id": r.id, "brand_name": r.brand_name, "status": r.status, "scan_count": r.scan_count}
            for r in rq
        ],
    }


class CompanyUpdateRequest(BaseModel):
    name: Optional[str] = None
    ticker: Optional[str] = None
    industry: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None


@router.put("/companies/{company_id}")
def admin_update_company(company_id: int, req: CompanyUpdateRequest,
                         admin=Depends(_verify_admin), db: Session = Depends(get_db)):
    company = db.query(Company).get(company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    for field, val in req.dict(exclude_none=True).items():
        setattr(company, field, val)
    db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Click analytics
# ---------------------------------------------------------------------------
@router.get("/clicks")
def admin_clicks(admin=Depends(_verify_admin), db: Session = Depends(get_db)):
    # Clicks by link type
    by_type = db.query(
        ClickEvent.link_type, func.count(ClickEvent.id)
    ).group_by(ClickEvent.link_type).all()

    # Top clicked brands
    top_brands = db.query(
        ClickEvent.alternative_brand, func.count(ClickEvent.id).label("cnt")
    ).group_by(ClickEvent.alternative_brand).order_by(func.count(ClickEvent.id).desc()).limit(10).all()

    # Clicks by day (last 30 days)
    thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
    by_day = db.query(
        func.cast(ClickEvent.clicked_at, String).label("day"),
        func.count(ClickEvent.id)
    ).filter(ClickEvent.clicked_at >= thirty_days_ago).group_by(
        func.cast(ClickEvent.clicked_at, String)
    ).order_by(func.cast(ClickEvent.clicked_at, String)).all()

    return {
        "by_type": [{"link_type": r[0], "count": r[1]} for r in by_type],
        "top_brands": [{"brand": r[0], "count": r[1]} for r in top_brands],
        "by_day": [{"day": str(r[0])[:10] if r[0] else None, "count": r[1]} for r in by_day],
    }


# ---------------------------------------------------------------------------
# Research queue
# ---------------------------------------------------------------------------
@router.get("/research-queue")
def admin_research_queue(status: str = Query("pending"),
                         admin=Depends(_verify_admin), db: Session = Depends(get_db)):
    q = db.query(ResearchQueue)
    if status != "all":
        q = q.filter(ResearchQueue.status == status)
    items = q.order_by(ResearchQueue.scan_count.desc()).all()
    return {
        "items": [
            {
                "id": r.id,
                "company_name": r.company_name,
                "brand_name": r.brand_name,
                "barcode": r.barcode,
                "scan_count": r.scan_count,
                "status": r.status,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            }
            for r in items
        ]
    }


class ResearchQueueAddRequest(BaseModel):
    company_name: Optional[str] = None
    brand_name: Optional[str] = None
    barcode: Optional[str] = None


@router.post("/research-queue")
def admin_add_research_queue(req: ResearchQueueAddRequest,
                             admin=Depends(_verify_admin), db: Session = Depends(get_db)):
    entry = ResearchQueue(
        company_name=req.company_name,
        brand_name=req.brand_name,
        barcode=req.barcode,
    )
    db.add(entry)
    db.commit()
    return {"ok": True, "id": entry.id}


@router.put("/research-queue/{item_id}/complete")
def admin_complete_research(item_id: int,
                            admin=Depends(_verify_admin), db: Session = Depends(get_db)):
    item = db.query(ResearchQueue).get(item_id)
    if not item:
        raise HTTPException(404, "Item not found")
    item.status = "complete"
    item.completed_at = datetime.now(timezone.utc)
    db.commit()
    return {"ok": True}


# ---------------------------------------------------------------------------
# Helper: add unknown scan to research queue (called from api.py)
# ---------------------------------------------------------------------------
def add_to_research_queue(db: Session, brand_name: str = None, barcode: str = None):
    """Upsert an unknown scan into the research queue."""
    try:
        existing = None
        if barcode:
            existing = db.query(ResearchQueue).filter_by(barcode=barcode).first()
        if not existing and brand_name:
            existing = db.query(ResearchQueue).filter_by(brand_name=brand_name).first()

        if existing:
            existing.scan_count = (existing.scan_count or 0) + 1
        else:
            entry = ResearchQueue(
                brand_name=brand_name,
                barcode=barcode,
                scan_count=1,
            )
            db.add(entry)
        db.commit()
    except Exception:
        db.rollback()


# Need String import for cast
from sqlalchemy import String
