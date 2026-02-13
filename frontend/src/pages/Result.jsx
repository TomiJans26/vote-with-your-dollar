import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { scanProduct, getAlternatives } from '../lib/api';
import { getPrefs, getAlignment, getBeliefProfile, getBeliefAlignment, hasCompletedOnboarding } from '../lib/prefs';
import DonationBar from '../components/DonationBar';
import AlignmentBadge from '../components/AlignmentBadge';
import IssueBreakdown from '../components/IssueBreakdown';

function AlignmentHero({ score, beliefResult }) {
  // Calculate display percentage (0-100)
  let pct, label, emoji;
  if (beliefResult) {
    if (beliefResult.dealBreakerHit) {
      pct = 0;
      label = 'Deal Breaker';
      emoji = '🚫';
    } else {
      // score is -1..1, map to 0..100
      pct = Math.round(((beliefResult.score + 1) / 2) * 100);
      label = 'Aligned';
      emoji = pct >= 70 ? '🟢' : pct >= 40 ? '🟡' : '🔴';
    }
  } else {
    pct = Math.round(((score + 1) / 2) * 100);
    label = 'Aligned';
    emoji = pct >= 70 ? '🟢' : pct >= 40 ? '🟡' : '🔴';
  }

  // Gradient color
  const getColor = (p) => {
    if (beliefResult?.dealBreakerHit) return 'from-red-600 to-red-800';
    if (p >= 70) return 'from-emerald-500 to-emerald-700';
    if (p >= 50) return 'from-yellow-500 to-amber-600';
    if (p >= 30) return 'from-orange-500 to-orange-700';
    return 'from-red-500 to-red-700';
  };

  const getRingColor = (p) => {
    if (beliefResult?.dealBreakerHit) return 'border-red-500';
    if (p >= 70) return 'border-emerald-500';
    if (p >= 50) return 'border-yellow-500';
    if (p >= 30) return 'border-orange-500';
    return 'border-red-500';
  };

  return (
    <div className={`bg-gradient-to-br ${getColor(pct)} rounded-2xl p-5 text-white text-center shadow-lg`}>
      <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full border-4 ${getRingColor(pct)} bg-white/20 mb-2`}>
        <span className="text-3xl font-black">
          {beliefResult?.dealBreakerHit ? emoji : `${pct}%`}
        </span>
      </div>
      <p className="text-lg font-bold tracking-wide">
        {beliefResult?.dealBreakerHit ? '🚫 Deal Breaker Hit' : `${pct}% ${label}`}
      </p>
      {beliefResult && !beliefResult.dealBreakerHit && (
        <p className="text-xs text-white/70 mt-1">{beliefResult.label}</p>
      )}
      {beliefResult?.dealBreakerHit && (
        <p className="text-xs text-white/80 mt-1">This company conflicts with one of your deal-breaker issues</p>
      )}
    </div>
  );
}

export default function Result() {
  const { upc } = useParams();
  const [data, setData] = useState(null);
  const [alts, setAlts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    scanProduct(upc)
      .then(async (result) => {
        setData(result);
        if (result.category && result.parentCompany) {
          const altData = await getAlternatives(result.category.id, result.parentCompany.id);
          setAlts(altData.alternatives || []);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [upc]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="text-5xl">😕</div>
        <h2 className="text-lg font-bold text-gray-800">Product Not Found</h2>
        <p className="text-sm text-gray-600">
          We couldn't find a product for barcode <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{upc}</span>
        </p>
        <Link to="/" className="inline-block mt-4 px-6 py-2 bg-teal-600 text-white rounded-xl font-semibold">
          Scan Again
        </Link>
      </div>
    );
  }

  const { product, parentCompany, political, companyIssues } = data;
  const prefs = getPrefs();
  const beliefProfile = getBeliefProfile();
  const useBeliefs = hasCompletedOnboarding() && Object.keys(beliefProfile).length > 0;

  // Compute alignment
  const oldAlignment = parentCompany ? getAlignment(political, prefs) : 0;
  const beliefResult = useBeliefs && companyIssues && Object.keys(companyIssues).length > 0
    ? getBeliefAlignment(companyIssues, beliefProfile)
    : null;

  return (
    <div className="p-4 space-y-4">
      {/* Product card */}
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <div className="flex gap-4">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-20 h-20 object-contain rounded-xl bg-gray-50 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-3xl shrink-0">📦</div>
          )}
          <div className="min-w-0">
            <h2 className="font-bold text-lg leading-tight truncate">{product.name || 'Unknown Product'}</h2>
            {product.brand && <p className="text-sm text-gray-500">{product.brand}</p>}
            <p className="text-xs text-gray-400 mt-1 font-mono">{upc}</p>
          </div>
        </div>
      </div>

      {/* Alignment Hero - Big alignment score at top */}
      {parentCompany && (beliefResult || political) && (
        <AlignmentHero score={oldAlignment} beliefResult={beliefResult} />
      )}

      {/* Parent company */}
      {parentCompany ? (
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-gray-400 font-semibold">Parent Company</p>
              <h3 className="font-bold text-lg">{parentCompany.name}</h3>
              {parentCompany.ticker && (
                <span className="text-xs text-gray-400">{parentCompany.ticker}</span>
              )}
            </div>
            <AlignmentBadge alignment={oldAlignment} beliefResult={beliefResult} />
          </div>

          {/* Issue breakdown — enhanced with bars */}
          {companyIssues && Object.keys(companyIssues).length > 0 && (
            <IssueBreakdown
              triggers={beliefResult?.triggers || []}
              companyIssues={companyIssues}
              beliefProfile={useBeliefs ? beliefProfile : null}
            />
          )}

          {/* Donation breakdown */}
          {political && (
            <div className="space-y-2">
              <p className="text-xs uppercase text-gray-400 font-semibold">PAC Donations</p>
              <DonationBar percentDem={political.percentDem} percentRep={political.percentRep} />
              <div className="flex justify-between text-xs">
                <span className="text-dem-dark font-semibold">
                  🔵 Democrat {political.percentDem}%
                </span>
                <span className="text-rep-dark font-semibold">
                  🔴 Republican {political.percentRep}%
                </span>
              </div>
              {political.donations?.total > 0 && (
                <p className="text-xs text-gray-400">
                  Total: ${(political.donations.total).toLocaleString()}
                </p>
              )}
              {political.error && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">{political.error}</p>
              )}
              {!political.hasPac && (
                <p className="text-xs text-gray-400 italic">No US PAC found for this company</p>
              )}
            </div>
          )}

          {/* No issue data notice */}
          {useBeliefs && (!companyIssues || Object.keys(companyIssues).length === 0) && (
            <p className="text-xs text-gray-400 italic bg-gray-50 rounded-lg p-2">
              📊 We don't have detailed issue data for this company yet. Score is based on PAC donations only.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-5 text-center text-gray-500 text-sm">
          <p>🔍 Parent company not identified</p>
          <p className="text-xs mt-1">This product's brand may not be in our database yet.</p>
        </div>
      )}

      {/* Alternatives */}
      {alts.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm uppercase text-gray-500 px-1">
            🔄 Alternatives to Consider
          </h3>
          {alts.map((alt) => {
            const altAlignment = getAlignment(alt.political, prefs);
            return (
              <div key={alt.company.id} className="bg-white rounded-2xl shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{alt.company.name}</p>
                    <p className="text-xs text-gray-500">{alt.brands.join(', ')}</p>
                  </div>
                  <AlignmentBadge alignment={altAlignment} size="sm" />
                </div>
                <DonationBar
                  percentDem={alt.political.percentDem}
                  percentRep={alt.political.percentRep}
                  className="mt-2"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Scan again */}
      <div className="text-center pt-2 pb-4">
        <Link
          to="/"
          className="inline-block px-8 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
        >
          📸 Scan Another
        </Link>
      </div>
    </div>
  );
}
