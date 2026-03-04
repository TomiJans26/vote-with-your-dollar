"""
On-Demand Company Lookup — When a user scans an unknown brand.
Searches free public sources, identifies parent company, stores permanently in PostgreSQL.
Zero AI tokens. Pure Python.
"""
import requests
import feedparser
import json
import logging
import re
import threading
from urllib.parse import quote_plus
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger("on_demand")

FEC_API_KEY = "mhlNnA0OtHFPjlMC3wKVT8NeeSs58Gp8mngXchOX"
USER_AGENT = "DollarVote-Monitor/1.0"


def _search_google_news(query, num=5):
    """Search Google News RSS."""
    try:
        url = f"https://news.google.com/rss/search?q={quote_plus(query)}&hl=en-US&gl=US&ceid=US:en"
        feed = feedparser.parse(url)
        return [{"title": e.get("title", ""), "url": e.get("link", ""), "source": "google_news"}
                for e in feed.entries[:num]]
    except:
        return []


def _search_wikipedia(query):
    """Search Wikipedia for company/brand info."""
    try:
        resp = requests.get("https://en.wikipedia.org/w/api.php",
                           params={"action": "query", "list": "search", 
                                   "srsearch": f"{query} company brand parent",
                                   "format": "json", "srlimit": 3},
                           headers={"User-Agent": USER_AGENT}, timeout=8)
        results = []
        for item in resp.json().get("query", {}).get("search", []):
            title = item["title"]
            # Get summary
            sr = requests.get("https://en.wikipedia.org/w/api.php",
                            params={"action": "query", "titles": title, "prop": "extracts",
                                    "exintro": True, "explaintext": True, "format": "json"},
                            headers={"User-Agent": USER_AGENT}, timeout=8)
            pages = sr.json().get("query", {}).get("pages", {})
            for pid, page in pages.items():
                results.append({
                    "title": title,
                    "summary": page.get("extract", "")[:500],
                    "url": f"https://en.wikipedia.org/wiki/{quote_plus(title.replace(' ', '_'))}"
                })
        return results
    except:
        return []


def _extract_parent(wiki_results, brand_name):
    """Try to identify parent company from Wikipedia text."""
    patterns = [
        r"(?:is a |is an )?(?:brand|subsidiary|division|product line?) (?:of|owned by|by|from) ([A-Z][A-Za-z\s&.'-]+)",
        r"(?:owned|operated|manufactured|produced|distributed) by ([A-Z][A-Za-z\s&.'-]+)",
        r"parent company[,:]?\s*([A-Z][A-Za-z\s&.'-]+)",
        r"([A-Z][A-Za-z\s&.'-]+?) (?:owns|acquired|bought|purchased) " + re.escape(brand_name),
    ]
    text = " ".join(r.get("summary", "") for r in wiki_results)
    for pattern in patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            match = match.strip().rstrip(".,;:")
            if match.lower() not in [brand_name.lower(), "the", "a", "an", "its"] and 2 < len(match) < 80:
                return match
    return None


def _search_fec(name):
    """Search FEC for PAC committees."""
    try:
        resp = requests.get(f"https://api.open.fec.gov/v1/names/committees/",
                           params={"q": name, "api_key": FEC_API_KEY},
                           headers={"User-Agent": USER_AGENT}, timeout=8)
        if resp.ok:
            return [{"name": r.get("name", ""), "id": r.get("id", ""),
                     "url": f"https://www.fec.gov/data/committee/{r.get('id', '')}/"}
                    for r in resp.json().get("results", [])[:5]]
    except:
        pass
    return []


def lookup_and_store(brand_name: str, barcode: str, db: Session):
    """
    Full on-demand lookup. Runs in background thread.
    Searches Wikipedia, Google News, FEC.
    Stores company + signals in PostgreSQL.
    """
    try:
        logger.info(f"On-demand lookup: {brand_name} (barcode: {barcode})")
        
        # 1. Wikipedia — best for parent company ID
        wiki = _search_wikipedia(brand_name)
        
        # 2. Try to extract parent
        parent_name = _extract_parent(wiki, brand_name)
        company_name = parent_name or brand_name
        
        # 3. Check if company already exists
        result = db.execute(text("SELECT id FROM companies WHERE LOWER(name) = LOWER(:name)"),
                           {"name": company_name})
        row = result.fetchone()
        
        if row:
            company_id = row[0]
            logger.info(f"  Company exists: {company_name} (ID: {company_id})")
        else:
            # Create new company
            result = db.execute(
                text("""INSERT INTO companies (slug, name, industry, country, created_at) 
                        VALUES (:slug, :name, 'Unknown', 'US', NOW()) RETURNING id"""),
                {"slug": re.sub(r'[^a-z0-9]+', '-', company_name.lower()).strip('-'),
                 "name": company_name})
            company_id = result.fetchone()[0]
            logger.info(f"  Created company: {company_name} (ID: {company_id})")
            
            # Add brand mapping
            db.execute(text("""INSERT INTO brands (company_id, name) VALUES (:cid, :name)
                            ON CONFLICT DO NOTHING"""),
                      {"cid": company_id, "name": brand_name})
        
        # 4. Google News
        news = _search_google_news(f"{company_name} company")
        if parent_name:
            news.extend(_search_google_news(f"{parent_name}"))
        
        # 5. FEC
        fec = _search_fec(company_name)
        
        # 6. Store signals
        signals_added = 0
        for article in news:
            try:
                db.execute(text("""INSERT INTO signals (company_id, source, signal_type, title, url, created_at)
                                  VALUES (:cid, 'rss', 'news', :title, :url, NOW())"""),
                          {"cid": company_id, "title": article["title"][:500], "url": article["url"]})
                signals_added += 1
            except:
                pass
        
        for f in fec:
            try:
                db.execute(text("""INSERT INTO signals (company_id, source, signal_type, title, url, created_at)
                                  VALUES (:cid, 'fec', 'pac_committee', :title, :url, NOW())"""),
                          {"cid": company_id, "title": f"FEC Committee: {f['name']}", "url": f["url"]})
                signals_added += 1
            except:
                pass
        
        db.commit()
        logger.info(f"  Lookup complete: {company_name} — {signals_added} signals stored")
        return {"company_id": company_id, "company_name": company_name, 
                "parent": parent_name, "signals": signals_added}
        
    except Exception as e:
        logger.error(f"  On-demand lookup failed: {e}")
        db.rollback()
        return None


def trigger_background_lookup(brand_name: str, barcode: str, db_factory):
    """Fire-and-forget background lookup. Non-blocking."""
    def _run():
        db = db_factory()
        try:
            lookup_and_store(brand_name, barcode, db)
        finally:
            db.close()
    
    thread = threading.Thread(target=_run, daemon=True)
    thread.start()
