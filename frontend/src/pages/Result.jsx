import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { scanProduct, getAlternatives, trackClick } from '../lib/api';
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
      // Use pct directly from distance-based scoring
      pct = beliefResult.pct ?? Math.round(((beliefResult.score + 1) / 2) * 100);
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

function StoreDropdown({ storeLinks, brand, companyId, originalCompanyId }) {
  const [open, setOpen] = useState(false);

  const stores = [
    { key: 'walmart', label: '🏬 Walmart', url: storeLinks.walmart },
    { key: 'target', label: '🎯 Target', url: storeLinks.target },
    { key: 'kroger', label: '🛒 Kroger', url: storeLinks.kroger },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-600 transition-colors"
      >
        🏪 Find in Store {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="absolute left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-200 z-10 min-w-[160px] overflow-hidden">
          {stores.map((s) => (
            <a
              key={s.key}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackClick(brand, companyId, originalCompanyId, s.key);
                setOpen(false);
              }}
              className="block px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors border-b border-gray-100 last:border-0"
            >
              {s.label}
            </a>
          ))}
        </div>
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
        if (result.parentCompany) {
          const bp = getBeliefProfile();
          const catId = result.category?.id || 'general';
          const altData = await getAlternatives(catId, result.parentCompany.id, upc.startsWith('search-') ? null : upc, bp);
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
        <p className="text-sm text-gray-600">{error}</p>
        <p className="text-xs text-gray-400">
          Barcode: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{upc}</span>
        </p>
        <div className="pt-2 space-y-2">
          <Link to="/" className="inline-block px-6 py-2 bg-teal-600 text-white rounded-xl font-semibold">
            🔍 Search by Brand
          </Link>
          <p className="text-xs text-gray-400">
            Not all products have barcodes in our database yet.<br/>
            Try searching by brand name — we track 100+ companies and 600+ brands!
          </p>
        </div>
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
        <div className="flex gap-4 items-start">
          {product.image ? (
            <img
              src={product.image}
              alt=""
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
              className="w-20 h-20 object-contain rounded-xl bg-gray-50 shrink-0"
            />
          ) : null}
          <div className="w-20 h-20 bg-gray-100 rounded-xl items-center justify-center text-3xl shrink-0" style={{ display: product.image ? 'none' : 'flex' }}>📦</div>
          <div className="flex-1">
            <h2 className="font-bold text-lg leading-tight break-words">{product.name || 'Unknown Product'}</h2>
            {product.brand && <p className="text-sm text-gray-500 mt-1">{product.brand}</p>}
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

          {/* PAC Donations - total only, no party breakdown */}
          {political && political.donations?.total > 0 && (
            <div className="space-y-1">
              <p className="text-xs uppercase text-gray-400 font-semibold">Political Donations</p>
              <p className="text-sm font-semibold text-gray-700">
                💰 ${(political.donations.total).toLocaleString()} in PAC contributions
              </p>
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

      {/* Smart Alternatives */}
      {alts.length > 0 ? (
        <div className="space-y-3">
          <div className="px-1">
            <h3 className="font-bold text-base text-teal-800">🔄 Better Aligned Alternatives</h3>
            <p className="text-xs text-gray-500">Products that match your values better</p>
          </div>
          {alts.map((alt, i) => {
            const pct = alt.alignment?.pct ?? 50;
            const badgeColor = alt.alignment?.dealBreakerHit ? 'bg-red-500' : pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-400';
            return (
              <div key={alt.barcode || alt.parentCompany?.id || i} className="bg-white rounded-2xl shadow-lg p-4 border-l-4 border-teal-500">
                <div className="flex gap-3 items-start">
                  {alt.image ? (
                    <img src={alt.image} alt="" className="w-14 h-14 object-contain rounded-lg bg-gray-50 shrink-0" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }} />
                  ) : null}
                  <div className="w-14 h-14 bg-gray-100 rounded-lg items-center justify-center text-2xl shrink-0" style={{ display: alt.image ? 'none' : 'flex' }}>📦</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm leading-tight truncate">{alt.name || alt.brand || 'Alternative'}</p>
                        {alt.brand && alt.brand !== alt.name && <p className="text-xs text-gray-500 truncate">{alt.brand}</p>}
                        {alt.parentCompany && <p className="text-xs text-gray-400">{alt.parentCompany.name}</p>}
                      </div>
                      <span className={`${badgeColor} text-white text-xs font-bold px-2 py-1 rounded-full shrink-0`}>
                        {alt.alignment?.dealBreakerHit ? '🚫' : `${pct}%`}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Why it's better */}
                {alt.alignment?.reasons?.length > 0 && (
                  <div className="mt-2 space-y-1 pl-1">
                    {alt.alignment.reasons.slice(0, 3).map((reason, ri) => (
                      <p key={ri} className="text-xs text-gray-600 leading-snug">{reason}</p>
                    ))}
                  </div>
                )}
                <div className="mt-3 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {alt.buyLink && (
                      <a href={alt.buyLink} target="_blank" rel="noopener noreferrer"
                        onClick={() => trackClick(alt.brand || alt.name, alt.parentCompany?.id || '', parentCompany?.id || '', 'amazon')}
                        className="inline-flex items-center gap-1 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 transition-colors">
                        📦 Order Online
                      </a>
                    )}
                    {alt.storeLinks && (
                      <StoreDropdown
                        storeLinks={alt.storeLinks}
                        brand={alt.brand || alt.name || ''}
                        companyId={alt.parentCompany?.id || ''}
                        originalCompanyId={parentCompany?.id || ''}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300">affiliate link</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : !loading && parentCompany && (
        <div className="bg-white rounded-2xl shadow p-5 text-center text-sm text-gray-500">
          <p className="text-2xl mb-2">🔍</p>
          <p>We couldn't find alternatives in our database yet.</p>
          <p className="text-xs text-gray-400 mt-1">Help us grow by suggesting products!</p>
        </div>
      )}

      {/* Share + Scan again */}
      <div className="text-center pt-2 pb-4 space-y-3">
        {parentCompany && navigator.share && (
          <button
            onClick={() => {
              const pct = beliefResult ? Math.round(((beliefResult.score + 1) / 2) * 100) : null;
              const text = beliefResult?.dealBreakerHit
                ? `🚫 ${parentCompany.name} (makes ${product.name || product.brand}) hit one of my deal breakers on DollarVote!`
                : pct != null
                  ? `${pct >= 60 ? '👍' : '👎'} ${parentCompany.name} (makes ${product.name || product.brand}) scores ${pct}% aligned with my values on DollarVote!`
                  : `I just looked up ${product.name || product.brand} on DollarVote — it's made by ${parentCompany.name}!`;
              navigator.share({
                title: 'DollarVote — Vote With Your Dollar',
                text,
                url: 'https://dollarvote.app',
              }).catch(() => {});
            }}
            className="inline-block px-8 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors mr-2"
          >
            📤 Share
          </button>
        )}
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
