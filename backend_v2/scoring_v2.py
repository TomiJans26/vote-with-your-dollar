"""
Enhanced company scoring using live signals from the monitor system.

This module extends the existing scoring.py with:
1. Real-time signal analysis from the signals table
2. Dynamic issue tree navigation (replaces static 22 issues)
3. Dual-perspective recommendations (agree/disagree based on user preferences)
4. Source citations for every score
5. Hard-stop detection for deal-breakers
"""

from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from collections import defaultdict
import json
from datetime import datetime, timedelta


@dataclass
class SignalContribution:
    """A single signal contributing to a company score"""
    signal_id: int
    title: str
    summary: Optional[str]
    source: str
    source_url: str
    tree_node_key: str
    tree_node_name: str
    created_at: datetime
    sentiment: str  # 'positive', 'negative', 'neutral'
    confidence: float
    
    def to_dict(self):
        return {
            'signal_id': self.signal_id,
            'title': self.title,
            'summary': self.summary,
            'source': self.source,
            'source_url': self.source_url,
            'tree_node': {
                'key': self.tree_node_key,
                'name': self.tree_node_name
            },
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'sentiment': self.sentiment,
            'confidence': self.confidence
        }


@dataclass
class DualPerspective:
    """Both perspectives on a signal based on user preferences"""
    signal_id: int
    agree_reason: str  # Why user might agree with this signal
    disagree_reason: str  # Why user might disagree with this signal
    
    def to_dict(self):
        return {
            'signal_id': self.signal_id,
            'you_might_agree': self.agree_reason,
            'you_might_disagree': self.disagree_reason
        }


@dataclass
class LiveScore:
    """Company score with live signal data"""
    company_id: int
    company_name: str
    overall_score: float  # -100 to +100
    hard_stops: List[str]  # List of deal-breaker issues triggered
    tree_scores: Dict[str, float]  # {tree_node_key: score}
    contributing_signals: List[SignalContribution]
    perspectives: List[DualPerspective]
    metadata: Dict[str, Any]
    
    def to_dict(self):
        return {
            'company_id': self.company_id,
            'company_name': self.company_name,
            'overall_score': round(self.overall_score, 2),
            'hard_stops': self.hard_stops,
            'tree_scores': {k: round(v, 2) for k, v in self.tree_scores.items()},
            'contributing_signals': [s.to_dict() for s in self.contributing_signals],
            'perspectives': [p.to_dict() for p in self.perspectives],
            'metadata': self.metadata
        }


def analyze_signal_sentiment(signal: Dict, tree_node: Dict, user_pref: Optional[Dict] = None) -> Tuple[str, float]:
    """
    Analyze signal sentiment based on content and tree node context.
    Returns: (sentiment, confidence)
    
    This is a placeholder for NLP-based sentiment analysis.
    In production, this would use ML models.
    """
    title_lower = signal['title'].lower()
    summary_lower = (signal['summary'] or '').lower()
    
    # Simple keyword-based sentiment (replace with ML in production)
    positive_keywords = ['support', 'donate', 'endorse', 'champion', 'promote', 'fund', 'back', 'ally']
    negative_keywords = ['oppose', 'against', 'boycott', 'controversy', 'lawsuit', 'scandal', 'violation']
    
    positive_count = sum(1 for kw in positive_keywords if kw in title_lower or kw in summary_lower)
    negative_count = sum(1 for kw in negative_keywords if kw in title_lower or kw in summary_lower)
    
    if positive_count > negative_count:
        return 'positive', 0.7
    elif negative_count > positive_count:
        return 'negative', 0.7
    else:
        return 'neutral', 0.5


def get_user_tree_preferences(db_session, user_id: int) -> Dict[int, Dict]:
    """
    Load user preferences for tree nodes.
    Returns: {tree_node_id: {mode, sentiment, strength, ...}}
    """
    query = """
        SELECT tree_node_id, mode, sentiment, strength, inferred
        FROM user_tree_preferences
        WHERE user_id = %s
    """
    
    cursor = db_session.cursor()
    cursor.execute(query, (user_id,))
    
    prefs = {}
    for tree_node_id, mode, sentiment, strength, inferred in cursor.fetchall():
        prefs[tree_node_id] = {
            'mode': mode,
            'sentiment': sentiment,
            'strength': strength,
            'inferred': inferred
        }
    
    return prefs


def get_company_signals(db_session, company_id: int, days_back: int = 90) -> List[Dict]:
    """
    Get all signals for a company from the last N days.
    """
    cutoff_date = datetime.now() - timedelta(days=days_back)
    
    query = """
        SELECT 
            s.id, s.company_id, s.source, s.signal_type, s.title, 
            s.summary, s.url, s.raw_data, s.created_at,
            stm.tree_node_id, stm.confidence,
            it.key as tree_key, it.display_name as tree_name
        FROM signals s
        LEFT JOIN signal_tree_mapping stm ON s.id = stm.signal_id
        LEFT JOIN issue_tree it ON stm.tree_node_id = it.id
        WHERE s.company_id = %s AND s.created_at >= %s
        ORDER BY s.created_at DESC
    """
    
    cursor = db_session.cursor()
    cursor.execute(query, (company_id, cutoff_date))
    
    signals = []
    for row in cursor.fetchall():
        signals.append({
            'id': row[0],
            'company_id': row[1],
            'source': row[2],
            'signal_type': row[3],
            'title': row[4],
            'summary': row[5],
            'url': row[6],
            'raw_data': row[7],
            'created_at': row[8],
            'tree_node_id': row[9],
            'confidence': row[10],
            'tree_key': row[11],
            'tree_name': row[12]
        })
    
    return signals


def calculate_tree_node_score(signals: List[Dict], user_pref: Optional[Dict]) -> float:
    """
    Calculate score for a single tree node based on its signals.
    Returns: score from -100 to +100
    """
    if not signals:
        return 0.0
    
    positive_count = 0
    negative_count = 0
    neutral_count = 0
    
    for signal in signals:
        sentiment, confidence = analyze_signal_sentiment(signal, None, user_pref)
        
        if sentiment == 'positive':
            positive_count += confidence
        elif sentiment == 'negative':
            negative_count += confidence
        else:
            neutral_count += confidence * 0.5
    
    total = positive_count + negative_count + neutral_count
    if total == 0:
        return 0.0
    
    # Score based on signal balance
    score = ((positive_count - negative_count) / total) * 100
    
    # Apply user preference weighting
    if user_pref:
        user_sentiment = user_pref.get('sentiment', 0)
        strength = user_pref.get('strength', 0.5)
        
        # If user sentiment aligns with score, amplify it
        if (user_sentiment > 0 and score > 0) or (user_sentiment < 0 and score < 0):
            score *= (1 + strength)
        # If misaligned, dampen it
        elif (user_sentiment > 0 and score < 0) or (user_sentiment < 0 and score > 0):
            score *= (1 - strength * 0.5)
    
    return max(-100, min(100, score))


def check_hard_stops(signals: List[Dict], user_prefs: Dict[int, Dict]) -> List[str]:
    """
    Check if any hard-stop conditions are triggered.
    Returns: list of tree node names that triggered hard stops
    """
    hard_stops = []
    
    # Group signals by tree node
    signals_by_node = defaultdict(list)
    for signal in signals:
        if signal['tree_node_id']:
            signals_by_node[signal['tree_node_id']].append(signal)
    
    # Check each tree node for hard stops
    for tree_node_id, node_signals in signals_by_node.items():
        user_pref = user_prefs.get(tree_node_id)
        
        if user_pref and user_pref['mode'] == 'hard_stop':
            # Check if any negative signals exist
            for signal in node_signals:
                sentiment, confidence = analyze_signal_sentiment(signal, None, user_pref)
                
                # User cares positively about this issue, but signal is negative
                if user_pref['sentiment'] > 0 and sentiment == 'negative' and confidence > 0.5:
                    hard_stops.append(signal['tree_name'])
                    break
                # User cares negatively about this issue, but signal is positive
                elif user_pref['sentiment'] < 0 and sentiment == 'positive' and confidence > 0.5:
                    hard_stops.append(signal['tree_name'])
                    break
    
    return list(set(hard_stops))  # Remove duplicates


def generate_dual_perspective(signal: Dict, user_prefs: Dict) -> DualPerspective:
    """
    Generate both agree/disagree perspectives for a signal based on user preferences.
    """
    tree_node_id = signal['tree_node_id']
    user_pref = user_prefs.get(tree_node_id, {})
    
    title = signal['title']
    summary = signal['summary'] or ''
    tree_name = signal['tree_name']
    
    # This is a simplified version - in production, use LLM for nuanced perspectives
    sentiment, _ = analyze_signal_sentiment(signal, None, user_pref)
    
    if sentiment == 'positive':
        agree_reason = f"This company is actively supporting {tree_name}, which aligns with your values."
        disagree_reason = f"Some may see this support for {tree_name} as performative or financially motivated."
    elif sentiment == 'negative':
        agree_reason = f"This controversy around {tree_name} reveals the company's true priorities."
        disagree_reason = f"This may be an isolated incident or misrepresentation of the company's overall stance on {tree_name}."
    else:
        agree_reason = f"This information about {tree_name} is worth considering in your decision."
        disagree_reason = f"This signal may not be directly relevant to your concerns about {tree_name}."
    
    return DualPerspective(
        signal_id=signal['id'],
        agree_reason=agree_reason,
        disagree_reason=disagree_reason
    )


def score_company_live(company_id: int, user_id: int, db_session, days_back: int = 90) -> LiveScore:
    """
    Score a company based on live signals and user preferences.
    
    This is the main entry point for the new scoring system.
    """
    # Get company name
    cursor = db_session.cursor()
    cursor.execute("SELECT name FROM companies WHERE id = %s", (company_id,))
    result = cursor.fetchone()
    if not result:
        raise ValueError(f"Company {company_id} not found")
    company_name = result[0]
    
    # Load user preferences
    user_prefs = get_user_tree_preferences(db_session, user_id)
    
    # Get signals
    signals = get_company_signals(db_session, company_id, days_back)
    
    if not signals:
        # No live signals - fall back to static scoring
        return LiveScore(
            company_id=company_id,
            company_name=company_name,
            overall_score=0.0,
            hard_stops=[],
            tree_scores={},
            contributing_signals=[],
            perspectives=[],
            metadata={'fallback': 'no_signals', 'days_back': days_back}
        )
    
    # Check for hard stops first
    hard_stops = check_hard_stops(signals, user_prefs)
    
    # Group signals by tree node
    signals_by_node = defaultdict(list)
    for signal in signals:
        if signal['tree_node_id']:
            signals_by_node[signal['tree_node_id']].append(signal)
    
    # Calculate scores for each tree node
    tree_scores = {}
    all_contributions = []
    
    for tree_node_id, node_signals in signals_by_node.items():
        user_pref = user_prefs.get(tree_node_id)
        
        # Skip nodes user doesn't care about (unless mode='ignore' is explicitly set)
        if user_pref and user_pref['mode'] == 'ignore':
            continue
        
        score = calculate_tree_node_score(node_signals, user_pref)
        tree_key = node_signals[0]['tree_key']
        tree_scores[tree_key] = score
        
        # Add contributing signals
        for signal in node_signals:
            sentiment, confidence = analyze_signal_sentiment(signal, None, user_pref)
            
            contribution = SignalContribution(
                signal_id=signal['id'],
                title=signal['title'],
                summary=signal['summary'],
                source=signal['source'],
                source_url=signal['url'] or '',
                tree_node_key=signal['tree_key'],
                tree_node_name=signal['tree_name'],
                created_at=signal['created_at'],
                sentiment=sentiment,
                confidence=confidence
            )
            all_contributions.append(contribution)
    
    # Calculate overall score (weighted average)
    if tree_scores:
        weighted_sum = 0
        weight_total = 0
        
        for tree_key, score in tree_scores.items():
            # Find the tree_node_id for this key
            tree_node_id = next((s['tree_node_id'] for s in signals if s['tree_key'] == tree_key), None)
            user_pref = user_prefs.get(tree_node_id, {})
            weight = user_pref.get('strength', 0.5)
            
            weighted_sum += score * weight
            weight_total += weight
        
        overall_score = weighted_sum / weight_total if weight_total > 0 else 0
    else:
        overall_score = 0
    
    # Generate dual perspectives
    perspectives = []
    for signal in signals[:10]:  # Limit to top 10 most recent
        perspective = generate_dual_perspective(signal, user_prefs)
        perspectives.append(perspective)
    
    return LiveScore(
        company_id=company_id,
        company_name=company_name,
        overall_score=overall_score,
        hard_stops=hard_stops,
        tree_scores=tree_scores,
        contributing_signals=all_contributions,
        perspectives=perspectives,
        metadata={
            'signal_count': len(signals),
            'days_back': days_back,
            'tree_nodes_analyzed': len(tree_scores)
        }
    )


def score_company_hybrid(company_id: int, user_id: int, db_session, days_back: int = 90) -> Dict:
    """
    Hybrid scoring: try live signals first, fall back to static scoring if no signals.
    
    This maintains backward compatibility with the existing system.
    """
    live_score = score_company_live(company_id, user_id, db_session, days_back)
    
    # If no live signals, import and use the old scoring system
    if live_score.metadata.get('fallback') == 'no_signals':
        try:
            from .scoring import score_company as score_company_static
            static_score = score_company_static(company_id, user_id, db_session)
            
            # Merge static score with live structure
            return {
                'company_id': company_id,
                'company_name': live_score.company_name,
                'overall_score': static_score.get('score', 0),
                'hard_stops': [],
                'contributing_signals': [],
                'perspectives': [],
                'metadata': {'source': 'static_fallback'}
            }
        except ImportError:
            pass
    
    return live_score.to_dict()


# Backward compatibility
def score_company(company_id: int, user_id: int, db_session) -> Dict:
    """
    Main scoring function - backward compatible wrapper.
    """
    return score_company_hybrid(company_id, user_id, db_session)
