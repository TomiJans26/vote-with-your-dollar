import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCompanyByName } from '../lib/api';

export default function CompanyProfile() {
  const { name } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getCompanyByName(decodeURIComponent(name));
        setCompany(data);
      } catch (e) {
        setError('Company not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [name]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-aligned/30 border-t-teal-600" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="p-4 text-center space-y-4 pt-12">
        <div className="text-5xl">🔍</div>
        <h2 className="text-xl font-bold text-dark-text">Company Not Found</h2>
        <p className="text-sm text-dark-text-secondary">We don't have data on "{decodeURIComponent(name)}" yet.</p>
        <Link to="/explore" className="inline-block px-6 py-2 bg-aligned text-white rounded-xl font-semibold">
          Explore Companies →
        </Link>
      </div>
    );
  }

  const score = company.alignment_score ?? company.overall_score ?? null;
  const scoreColor = score >= 70 ? 'text-emerald-600' : score >= 40 ? 'text-warning' : 'text-danger';
  const scoreBg = score >= 70 ? 'from-emerald-500 to-emerald-700' : score >= 40 ? 'from-yellow-500 to-amber-600' : 'from-red-500 to-red-700';

  return (
    <div className="p-4 space-y-4">
      {/* SEO Title */}
      <div className="text-center pt-4">
        <h1 className="text-2xl font-black text-dark-text">
          Is {company.name} Ethical?
        </h1>
        <p className="text-sm text-dark-text-secondary mt-1">
          Political donations, stances, and alignment scores
        </p>
      </div>

      {/* Score card */}
      {score !== null && (
        <div className={`rounded-2xl p-5 text-center bg-gradient-to-br ${scoreBg} text-white shadow-lg`}>
          <p className="text-sm font-medium opacity-80">Alignment Score</p>
          <p className="text-5xl font-black mt-2">{score}%</p>
          {company.deal_breaker && (
            <p className="mt-2 text-sm font-bold bg-white/20 rounded-lg px-3 py-1 inline-block">
              🚫 Deal Breaker Issue Detected
            </p>
          )}
        </div>
      )}

      {/* Company info */}
      <div className="glass-card rounded-2xl shadow-lg p-4 space-y-3">
        <h2 className="text-sm font-bold text-dark-text uppercase">Company Details</h2>
        {company.industry && (
          <div className="flex justify-between text-sm">
            <span className="text-dark-text-secondary">Industry</span>
            <span className="text-dark-text font-medium">{company.industry}</span>
          </div>
        )}
        {company.brands && company.brands.length > 0 && (
          <div>
            <p className="text-xs text-dark-text-secondary mb-2">Brands</p>
            <div className="flex flex-wrap gap-1.5">
              {company.brands.slice(0, 20).map((b, i) => (
                <span key={i} className="px-2 py-1 bg-white/10 rounded-lg text-xs text-dark-text-secondary">{b.name || b}</span>
              ))}
              {company.brands.length > 20 && (
                <span className="px-2 py-1 bg-dark-bg rounded-lg text-xs text-dark-text-secondary">+{company.brands.length - 20} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Issue stances */}
      {company.stances && company.stances.length > 0 && (
        <div className="glass-card rounded-2xl shadow-lg p-4 space-y-3">
          <h2 className="text-sm font-bold text-dark-text uppercase">Issue Stances</h2>
          {company.stances.map((stance, i) => {
            const stanceColor = stance.position === 'supports' ? 'text-emerald-600 bg-emerald-50' :
                               stance.position === 'opposes' ? 'text-danger bg-danger/10' :
                               'text-dark-text-secondary bg-dark-bg';
            return (
              <div key={i} className="flex justify-between items-center text-sm py-1">
                <span className="text-dark-text-secondary">{stance.issue_name || stance.issue}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${stanceColor}`}>
                  {stance.position || 'unknown'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* PAC donations */}
      {company.pac_data && (
        <div className="glass-card rounded-2xl shadow-lg p-4 space-y-3">
          <h2 className="text-sm font-bold text-dark-text uppercase">Political Donations (PAC)</h2>
          {company.pac_data.total_donated && (
            <div className="flex justify-between text-sm">
              <span className="text-dark-text-secondary">Total Donated</span>
              <span className="text-dark-text font-bold">${company.pac_data.total_donated.toLocaleString()}</span>
            </div>
          )}
          {company.pac_data.dem_pct != null && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-blue-500">Democrat {company.pac_data.dem_pct}%</span>
                <span className="text-red-500">Republican {company.pac_data.rep_pct}%</span>
              </div>
              <div className="w-full h-3 rounded-full overflow-hidden flex">
                <div className="bg-blue-500 h-full" style={{ width: `${company.pac_data.dem_pct}%` }} />
                <div className="bg-danger/100 h-full" style={{ width: `${company.pac_data.rep_pct}%` }} />
              </div>
            </div>
          )}
          <p className="text-[10px] text-dark-text-muted">Source: FEC public records</p>
        </div>
      )}

      {/* CTA */}
      <div className="text-center space-y-3 py-2">
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-aligned text-white rounded-xl font-semibold hover:bg-aligned/90 transition-colors"
        >
          📸 Scan a Product
        </Link>
        <p className="text-xs text-dark-text-muted">
          See how your shopping aligns with your values
        </p>
      </div>

      {/* SEO footer text */}
      <div className="text-xs text-dark-text-muted space-y-2 pt-4 border-t border-dark-border-subtle">
        <p>
          Is {company.name} ethical? DollarVote analyzes political donations, corporate stances on social issues,
          and environmental policies to help you make informed purchasing decisions. All data comes from public
          FEC records and verified news sources.
        </p>
        <p>
          DollarVote helps you vote with your dollar. Every purchase is a choice — make it count.
        </p>
      </div>
    </div>
  );
}
