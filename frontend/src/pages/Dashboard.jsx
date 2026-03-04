import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getShoppingReport, getScanHistory } from '../lib/api';
import { getBeliefProfile, hasCompletedOnboarding } from '../lib/prefs';
import { ISSUE_CATEGORIES, ALL_ISSUES, IMPORTANCE_LEVELS } from '../lib/issues';

function ScoreRing({ score, size = 80, label }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="rgba(255,255,255,0.1)" strokeWidth="6" fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth="6" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000"
        />
      </svg>
      <span className="text-2xl font-black -mt-[52px] mb-6" style={{ color }}>{score}%</span>
      {label && <p className="text-xs text-dark-text-secondary mt-1">{label}</p>}
    </div>
  );
}

function ReportCard({ report }) {
  if (!report) return null;

  const { overallScore, periodLabel, totalScans, totalCompanies, issueBreakdown,
          dealBreakerAlerts, topAligned, worstAligned, spendingByIndustry } = report;

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className="glass-card rounded-2xl shadow-lg p-5 text-center border border-dark-border">
        <p className="text-xs text-dark-text-secondary uppercase font-semibold">{periodLabel} Report Card</p>
        <div className="mt-3">
          <ScoreRing score={overallScore} size={100} />
        </div>
        <p className="text-sm text-dark-text-secondary mt-2">
          Based on {totalScans} product{totalScans !== 1 ? 's' : ''} from {totalCompanies} compan{totalCompanies !== 1 ? 'ies' : 'y'}
        </p>
      </div>

      {/* Deal Breaker Alerts */}
      {dealBreakerAlerts && dealBreakerAlerts.length > 0 && (
        <div className="glass-card border-2 border-danger/50 rounded-2xl p-4 space-y-2 bg-danger/10">
          <p className="text-sm font-bold text-danger">🚫 Deal Breaker Alerts</p>
          {dealBreakerAlerts.map((alert, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-danger mt-0.5">•</span>
              <p className="text-danger">
                <strong>{alert.company}</strong> — {alert.issue}
                {alert.product && <span className="text-danger/70"> (from buying {alert.product})</span>}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Issue Impact */}
      {issueBreakdown && issueBreakdown.length > 0 && (
        <div className="glass-card rounded-2xl shadow-lg p-4 space-y-3 border border-dark-border">
          <p className="text-xs text-dark-text-secondary uppercase font-semibold">Where Your Money Went</p>
          {issueBreakdown.map((item, i) => {
            const pct = Math.round(item.alignedPct);
            const barColor = pct >= 70 ? 'bg-aligned' : pct >= 40 ? 'bg-warning' : 'bg-danger';
            return (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-dark-text">{item.issueName}</span>
                  <span className={`text-xs font-bold ${pct >= 70 ? 'text-aligned' : pct >= 40 ? 'text-warning' : 'text-danger'}`}>
                    {pct}% aligned
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div className={`${barColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Top Aligned / Worst Aligned */}
      <div className="grid grid-cols-2 gap-3">
        {topAligned && topAligned.length > 0 && (
          <div className="glass-card rounded-xl p-3 space-y-2 border border-aligned/30 bg-aligned/10">
            <p className="text-[10px] text-aligned uppercase font-bold">✅ Most Aligned</p>
            {topAligned.map((c, i) => (
              <div key={i} className="text-xs">
                <p className="font-semibold text-aligned">{c.name}</p>
                <p className="text-aligned/70">{c.score}% match</p>
              </div>
            ))}
          </div>
        )}
        {worstAligned && worstAligned.length > 0 && (
          <div className="glass-card rounded-xl p-3 space-y-2 border border-danger/30 bg-danger/10">
            <p className="text-[10px] text-danger uppercase font-bold">⚠️ Least Aligned</p>
            {worstAligned.map((c, i) => (
              <div key={i} className="text-xs">
                <p className="font-semibold text-danger">{c.name}</p>
                <p className="text-danger/70">{c.score}% match</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Industry Breakdown */}
      {spendingByIndustry && spendingByIndustry.length > 0 && (
        <div className="glass-card rounded-2xl shadow-lg p-4 space-y-2 border border-dark-border">
          <p className="text-xs text-dark-text-secondary uppercase font-semibold">Products by Industry</p>
          {spendingByIndustry.map((ind, i) => (
            <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-dark-border-subtle last:border-0">
              <span className="text-dark-text-secondary">{ind.name}</span>
              <span className="text-xs text-dark-text-muted">{ind.count} product{ind.count !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week'); // week, month, all
  const hasOnboarded = hasCompletedOnboarding();

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [reportData, historyData] = await Promise.all([
          getShoppingReport(period).catch(() => null),
          getScanHistory().catch(() => []),
        ]);
        setReport(reportData);
        setHistory(historyData);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-aligned/20 border-t-aligned" />
      </div>
    );
  }

  // Empty state — no scans yet
  if (!report && history.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <div className="text-center pt-4">
          <span className="text-5xl">📊</span>
          <h2 className="text-xl font-bold text-gradient mt-2">Your Report Card</h2>
          <p className="text-sm text-dark-text-secondary mt-1">
            Scan some products first, then we'll show you where your money is really going.
          </p>
        </div>

        <div className="glass-card rounded-2xl shadow-lg p-6 text-center space-y-4 border border-dark-border">
          <p className="text-4xl">🛒</p>
          <p className="text-sm text-dark-text-secondary">
            Every product you scan gets tracked. We'll build a picture of your shopping habits
            and show you a report card with your alignment scores.
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-aligned text-white rounded-xl font-semibold hover:bg-aligned/90 transition-colors active:scale-95"
          >
            Start Scanning →
          </Link>
        </div>

        {!hasOnboarded && (
          <div className="glass-card border border-warning/30 rounded-xl p-4 text-center bg-warning/10">
            <p className="text-sm text-warning">
              💡 <strong>Set up your values first</strong> to get personalized scores.
            </p>
            <Link to="/onboarding" className="text-sm text-warning underline">Set up now →</Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center pt-2">
        <h2 className="text-xl font-bold text-gradient">📊 Your Report Card</h2>
        <p className="text-xs text-dark-text-secondary">Where your money really goes</p>
      </div>

      {/* Period toggle */}
      <div className="flex justify-center gap-2">
        {[
          { key: 'week', label: 'This Week' },
          { key: 'month', label: 'This Month' },
          { key: 'all', label: 'All Time' },
        ].map(p => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-1.5 text-xs rounded-full font-semibold transition-colors ${
              period === p.key
                ? 'bg-aligned text-white'
                : 'glass-card text-dark-text-secondary hover:bg-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Granular preferences nudge */}
      {hasOnboarded && (
        <div className="glass-card border border-aligned/30 rounded-xl p-3 flex items-center gap-3 bg-aligned/10">
          <span className="text-2xl">🎯</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-aligned font-medium">Want more precise scores?</p>
            <p className="text-[10px] text-aligned/70">Set detailed stances on each issue in Settings</p>
          </div>
          <Link to="/settings" className="text-xs text-aligned font-bold shrink-0">Tune →</Link>
        </div>
      )}

      {report ? (
        <ReportCard report={report} />
      ) : (
        /* Local report from scan history when server report isn't available */
        <LocalReportFromHistory history={history} />
      )}

      {/* Recent scans */}
      {history.length > 0 && (
        <div className="glass-card rounded-2xl shadow-lg p-4 space-y-2 border border-dark-border">
          <div className="flex justify-between items-center">
            <p className="text-xs text-dark-text-secondary uppercase font-semibold">Recent Scans</p>
            <Link to="/history" className="text-xs text-aligned">See all →</Link>
          </div>
          {history.slice(0, 5).map((scan, i) => (
            <Link
              key={i}
              to={`/result/${scan.barcode || 'search-' + scan.parent_company}`}
              className="flex items-center gap-3 py-2 border-b border-dark-border-subtle last:border-0 hover:bg-white/5 rounded-lg px-1 transition-colors"
            >
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm shrink-0">📦</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-dark-text">{scan.product_name || scan.brand_name || 'Unknown'}</p>
                <p className="text-[10px] text-dark-text-muted">{scan.parent_company}</p>
              </div>
              {scan.alignment_score != null && (
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  scan.alignment_score >= 70 ? 'bg-aligned/20 text-aligned' :
                  scan.alignment_score >= 40 ? 'bg-warning/20 text-warning' :
                  'bg-danger/20 text-danger'
                }`}>
                  {Math.round(scan.alignment_score)}%
                </span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Email report signup */}
      <EmailReportCard />
    </div>
  );
}

function LocalReportFromHistory({ history }) {
  if (!history || history.length === 0) return null;

  // Calculate basic stats from local history
  const companies = {};
  let totalScore = 0;
  let scoredCount = 0;

  history.forEach(scan => {
    if (scan.parent_company) {
      companies[scan.parent_company] = (companies[scan.parent_company] || 0) + 1;
    }
    if (scan.alignment_score != null) {
      totalScore += scan.alignment_score;
      scoredCount++;
    }
  });

  const avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 50;

  return (
    <div className="glass-card rounded-2xl shadow-lg p-5 text-center space-y-3 border border-dark-border">
      <ScoreRing score={avgScore} size={80} />
      <p className="text-sm text-dark-text-secondary">
        Average alignment across {history.length} scan{history.length !== 1 ? 's' : ''}
      </p>
      <p className="text-xs text-dark-text-muted">
        Scan more products to build a detailed report
      </p>
    </div>
  );
}

function EmailReportCard() {
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: call API to subscribe to email reports
    // For now, save preference locally
    localStorage.setItem('dv_report_email', JSON.stringify({ email, frequency }));
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="glass-card border border-aligned/30 rounded-2xl p-4 text-center bg-aligned/10">
        <p className="text-sm text-aligned font-medium">✅ Report emails set up!</p>
        <p className="text-xs text-aligned/70">We'll send your {frequency} report card to {email}</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl shadow-lg p-4 space-y-3 border border-dark-border">
      <p className="text-xs text-dark-text-secondary uppercase font-semibold">📧 Get Report Cards by Email</p>
      <p className="text-xs text-dark-text-secondary">
        We'll send you a summary of where your money went and suggest better alternatives.
      </p>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFrequency('weekly')}
            className={`flex-1 py-2 text-xs rounded-lg font-semibold transition-colors ${
              frequency === 'weekly' ? 'bg-aligned text-white' : 'glass-card text-dark-text-secondary'
            }`}
          >
            Weekly
          </button>
          <button
            type="button"
            onClick={() => setFrequency('monthly')}
            className={`flex-1 py-2 text-xs rounded-lg font-semibold transition-colors ${
              frequency === 'monthly' ? 'bg-aligned text-white' : 'glass-card text-dark-text-secondary'
            }`}
          >
            Monthly
          </button>
        </div>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white focus:border-aligned outline-none placeholder-dark-text-muted"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-aligned text-white text-sm rounded-lg font-semibold hover:bg-aligned/90 transition-colors active:scale-95"
          >
            Subscribe
          </button>
        </div>
      </form>
    </div>
  );
}
