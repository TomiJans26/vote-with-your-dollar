import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { scanProduct, getAlternatives, trackClick } from '../lib/api';
import { getPrefs, getAlignment, getBeliefProfile, getBeliefAlignment, hasCompletedOnboarding } from '../lib/prefs';
import { addToShoppingList } from './ShoppingList';
import DonationBar from '../components/DonationBar';
import AlignmentBadge from '../components/AlignmentBadge';
import IssueBreakdown from '../components/IssueBreakdown';

function AlignmentHero({ score, beliefResult, companyName, political }) {
  let pct, label, emoji;
  if (beliefResult) {
    if (beliefResult.dealBreakerHit) {
      pct = 0;
      label = 'Deal Breaker';
      emoji = '🚫';
    } else {
      pct = beliefResult.pct ?? Math.round(((beliefResult.score + 1) / 2) * 100);
      label = 'Aligned with your values';
      emoji = pct >= 70 ? '🟢' : pct >= 40 ? '🟡' : '🔴';
    }
  } else {
    pct = Math.round(((score + 1) / 2) * 100);
    label = 'Aligned with your values';
    emoji = pct >= 70 ? '🟢' : pct >= 40 ? '🟡' : '🔴';
  }

  const getColor = (p) => {
    if (beliefResult?.dealBreakerHit) return 'from-red-600 to-red-800';
    if (p >= 70) return 'from-emerald-500 to-emerald-700';
    if (p >= 50) return 'from-yellow-500 to-amber-600';
    if (p >= 30) return 'from-orange-500 to-orange-700';
    return 'from-red-500 to-red-700';
  };

  // Plain english summary
  let summary = '';
  if (political?.donations?.total > 0) {
    const total = political.donations.total;
    summary = `${companyName} donated $${total.toLocaleString()} to political causes`;
  }

  return (
    <div className={`bg-gradient-to-br ${getColor(pct)} rounded-2xl p-6 text-white text-center shadow-lg`}>
      <div className="text-5xl font-black mb-1">
        {beliefResult?.dealBreakerHit ? emoji : `${pct}%`}
      </div>
      <p className="text-lg font-bold tracking-wide">
        {beliefResult?.dealBreakerHit ? 'Deal Breaker' : label}
      </p>
      {beliefResult && !beliefResult.dealBreakerHit && beliefResult.label && (
        <p className="text-sm text-white/80 mt-1">{beliefResult.label}</p>
      )}
      {beliefResult?.dealBreakerHit && (
        <p className="text-sm text-white/80 mt-1">This company conflicts with one of your deal-breaker issues</p>
      )}
      {summary && (
        <p className="text-xs text-white/60 mt-2">{summary}</p>
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
        className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-500 text-white text-xs font-semibold rounded-lg hover:bg-indigo-600 active:bg-indigo-700 transition-colors"
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
              className="block px-4 py-3 text-sm text-gray-700 hover:bg-teal-50 active:bg-teal-100 hover:text-teal-700 transition-colors border-b border-gray-100 last:border-0"
            >
              {s.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function AddToListButton({ item }) {
  const [added, setAdded] = useState(false);
  const handleAdd = () => {
    const wasNew = addToShoppingList(item);
    setAdded(true);
    if (wasNew && navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setAdded(false), 2000);
  };
  return (
    <button
      onClick={handleAdd}
      className={`inline-block px-6 py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${
        added ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700'
      }`}
    >
      {added ? '✓ Added!' : '📝 Add to List'}
    </button>
  );
}

function ShareButton({ product, parentCompany, beliefResult }) {
  const [copied, setCopied] = useState(false);

  const getText = () => {
    const pct = beliefResult?.pct ?? null;
    if (beliefResult?.dealBreakerHit) {
      return `🚫 ${parentCompany.name} (makes ${product.name || product.brand}) hit one of my deal breakers on DollarVote!`;
    }
    if (pct != null) {
      return `${pct >= 60 ? '👍' : '👎'} ${parentCompany.name} (makes ${product.name || product.brand}) scores ${pct}% aligned with my values on DollarVote!`;
    }
    return `I just looked up ${product.name || product.brand} on DollarVote — it's made by ${parentCompany.name}!`;
  };

  const handleShare = async () => {
    const text = getText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DollarVote — Vote With Your Dollar',
          text,
          url: window.location.href,
        });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* clipboard failed */ }
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-block px-6 py-2.5 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 active:bg-indigo-700 active:scale-95 transition-all"
    >
      {copied ? '✓ Copied!' : '📤 Share'}
    </button>
  );
}

// Skeleton loader
function ResultSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="bg-white rounded-2xl shadow-lg p-5">
        <div className="flex gap-4 items-start">
          <div className="w-20 h-20 bg-gray-200 rounded-xl" />
          <div className="flex-1 space-y-3 pt-1">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      </div>
      <div className="h-32 bg-gray-200 rounded-2xl" />
      <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-5 bg-gray-200 rounded w-1/2" />
        <div className="h-20 bg-gray-100 rounded-xl" />
      </div>
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
    return <ResultSkeleton />;
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="text-5xl">😕</div>
        <h2 className="text-lg font-bold text-gray-800">We couldn't find that product</h2>
        <p className="text-sm text-gray-600">
          {error.includes('404') || error.includes('not found')
            ? "This product isn't in our database yet."
            : 'Something went wrong. Please try again.'}
        </p>
        <div className="pt-2 space-y-2">
          <Link to="/" className="inline-block px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 active:bg-teal-800 transition-colors">
            🔍 Search by Brand
          </Link>
          <p className="text-xs text-gray-400">
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
          </div>
        </div>
      </div>

      {/* BIG alignment score */}
      {parentCompany && (beliefResult || political) && (
        <AlignmentHero
          score={oldAlignment}
          beliefResult={beliefResult}
          companyName={parentCompany.name}
          political={political}
        />
      )}

      {/* Parent company details */}
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

          {/* Issue breakdown */}
          {companyIssues && Object.keys(companyIssues).length > 0 && (
            <IssueBreakdown
              triggers={beliefResult?.triggers || []}
              companyIssues={companyIssues}
              beliefProfile={useBeliefs ? beliefProfile : null}
            />
          )}

          {/* Plain English donation summary */}
          {political && political.donations?.total > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 space-y-1">
              <p className="text-sm font-semibold text-gray-700">
                💰 {parentCompany.name} donated ${(political.donations.total).toLocaleString()} to political causes
              </p>
              {political.donations.percentDem != null && political.donations.percentRep != null && (
                <DonationBar percentDem={political.donations.percentDem} percentRep={political.donations.percentRep} />
              )}
            </div>
          )}

          {/* No issue data notice */}
          {useBeliefs && (!companyIssues || Object.keys(companyIssues).length === 0) && (
            <p className="text-xs text-gray-400 italic bg-gray-50 rounded-lg p-2">
              We don't have detailed issue data for this company yet. Score is based on PAC donations only.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-5 text-center text-gray-500 text-sm">
          <p>🔍 Researching this brand now...</p>
          <p className="text-xs mt-1">We're looking up this company across news, public records, and government filings. Check back shortly!</p>
          <div className="mt-3 animate-pulse flex justify-center">
            <div className="h-2 w-32 bg-teal-200 rounded"></div>
          </div>
        </div>
      )}

      {/* Alternatives — prominent header */}
      {alts.length > 0 ? (
        <div className="space-y-3">
          <div className="bg-teal-50 rounded-xl px-4 py-3">
            <h3 className="font-bold text-base text-teal-800">Try these instead</h3>
            <p className="text-xs text-teal-600">Products that better match your values</p>
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
                      <span className={`${badgeColor} text-white text-sm font-bold px-3 py-1 rounded-full shrink-0`}>
                        {alt.alignment?.dealBreakerHit ? '🚫' : `${pct}%`}
                      </span>
                    </div>
                  </div>
                </div>
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
                        className="inline-flex items-center gap-1 px-4 py-2 bg-teal-600 text-white text-xs font-semibold rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors">
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
                    <AddToListButton item={{
                      name: alt.name || alt.brand || 'Alternative',
                      brand: alt.brand,
                      barcode: alt.barcode || null,
                      companyName: alt.parentCompany?.name || '',
                      alignmentPct: alt.alignment?.dealBreakerHit ? 0 : (alt.alignment?.pct ?? 50),
                      dealBreaker: alt.alignment?.dealBreakerHit || false,
                      buyLink: alt.buyLink || null,
                    }} />
                  </div>
                  <span className="text-[10px] text-gray-300">affiliate link</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : !loading && parentCompany && (
        <div className="bg-white rounded-2xl shadow p-5 text-center text-sm text-gray-500">
          <p>We couldn't find alternatives in our database yet.</p>
        </div>
      )}

      {/* Actions: Share + Add to List + Scan Again */}
      <div className="flex flex-wrap justify-center gap-2 pt-2 pb-4">
        {parentCompany && (
          <ShareButton product={product} parentCompany={parentCompany} beliefResult={beliefResult} />
        )}
        {parentCompany && (
          <AddToListButton
            item={{
              name: product.name || product.brand || 'Unknown Product',
              brand: product.brand,
              barcode: upc.startsWith('search-') ? null : upc,
              companyName: parentCompany.name,
              alignmentPct: beliefResult?.dealBreakerHit ? 0 : (beliefResult?.pct ?? Math.round(((oldAlignment + 1) / 2) * 100)),
              dealBreaker: beliefResult?.dealBreakerHit || false,
              buyLink: null,
            }}
          />
        )}
        <Link
          to="/"
          className="inline-block px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 active:bg-teal-800 active:scale-95 transition-all"
        >
          🔍 Search Another
        </Link>
      </div>
    </div>
  );
}
