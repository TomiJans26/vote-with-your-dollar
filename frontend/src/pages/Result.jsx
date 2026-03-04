import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { scanProduct, getAlternatives, trackClick } from '../lib/api';
import { getPrefs, getAlignment, getBeliefProfile, getBeliefAlignment, hasCompletedOnboarding } from '../lib/prefs';
import { addToShoppingList } from './ShoppingList';
import DonationBar from '../components/DonationBar';
import AlignmentBadge from '../components/AlignmentBadge';
import IssueBreakdown from '../components/IssueBreakdown';
import { ExternalLink, Share2, Plus, Search, Ban, ShoppingCart, Store, Package } from 'lucide-react';

function AlignmentHero({ score, beliefResult, companyName, political }) {
  const isDealBreaker = beliefResult?.dealBreakerHit;
  const pct = isDealBreaker ? 0 : (beliefResult?.pct ?? Math.round(((score + 1) / 2) * 100));

  return (
    <div className={`glass-card rounded-3xl p-8 text-center shadow-2xl border transition-all ${
      isDealBreaker 
        ? 'border-danger/50 glow-red' 
        : pct >= 70 
          ? 'border-aligned/50 glow-green' 
          : 'border-warning/50'
    }`}>
      <AlignmentBadge alignment={score} beliefResult={beliefResult} showRing={true} />
      
      {political?.donations?.total > 0 && (
        <p className="text-xs text-dark-text-secondary mt-4">
          {companyName} donated <span className="font-bold text-dark-text">${political.donations.total.toLocaleString()}</span> to political causes
        </p>
      )}
    </div>
  );
}

function StoreDropdown({ storeLinks, brand, companyId, originalCompanyId }) {
  const [open, setOpen] = useState(false);
  const stores = [
    { key: 'walmart', label: 'Walmart', url: storeLinks.walmart },
    { key: 'target', label: 'Target', url: storeLinks.target },
    { key: 'kroger', label: 'Kroger', url: storeLinks.kroger },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 px-4 py-2.5 glass-card rounded-xl text-sm font-semibold hover:bg-white/10 transition-all border border-dark-border group"
      >
        <Store size={16} className="group-hover:scale-110 transition-transform" />
        Find in Store
      </button>
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div className="absolute left-0 mt-2 glass-card rounded-2xl shadow-2xl border border-dark-border z-20 min-w-[180px] overflow-hidden">
            {stores.map((s, i) => (
              <a
                key={s.key}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  trackClick(brand, companyId, originalCompanyId, s.key);
                  setOpen(false);
                }}
                className={`block px-4 py-3 text-sm text-dark-text-secondary hover:text-dark-text hover:bg-white/10 transition-colors ${
                  i < stores.length - 1 ? 'border-b border-dark-border-subtle' : ''
                }`}
              >
                {s.label}
              </a>
            ))}
          </div>
        </>
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
      className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${
        added 
          ? 'bg-aligned text-white shadow-lg shadow-aligned/30' 
          : 'glass-card hover:bg-white/10 border border-dark-border'
      }`}
    >
      {added ? (
        <>
          <Plus size={16} strokeWidth={3} />
          Added!
        </>
      ) : (
        <>
          <ShoppingCart size={16} />
          Add to List
        </>
      )}
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
      className="inline-flex items-center gap-2 px-5 py-2.5 glass-card rounded-xl font-semibold hover:bg-white/10 transition-all active:scale-95 border border-dark-border"
    >
      {copied ? (
        <>✓ Copied!</>
      ) : (
        <>
          <Share2 size={16} />
          Share
        </>
      )}
    </button>
  );
}

// Skeleton loader - SHIMMER EFFECT
function ResultSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="glass-card rounded-3xl p-6 border border-dark-border">
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 shimmer rounded-2xl shrink-0" />
            <div className="flex-1 space-y-3 pt-1">
              <div className="h-4 shimmer rounded-full w-3/4" />
              <div className="h-3 shimmer rounded-full w-1/2" />
            </div>
          </div>
        </div>
      ))}
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
      <div className="p-6 text-center space-y-8 animate-slideUp">
        <div className="text-8xl pt-12 animate-bounce">🔍</div>
        <div>
          <h2 className="text-3xl font-black text-gradient-purple mb-3">Oops! 🙈</h2>
          <p className="text-base font-bold text-dark-text-secondary max-w-sm mx-auto leading-relaxed">
            {error.includes('404') || error.includes('not found')
              ? "We haven't researched this one yet — but we will 🔮"
              : 'Something went sideways. Give it another shot!'}
          </p>
        </div>
        <div className="pt-4 space-y-4">
          <Link 
            to="/" 
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-accent-purple via-accent-violet to-accent-pink text-white rounded-full font-black text-lg hover:shadow-2xl hover:shadow-accent-purple/40 transition-all active:scale-95 tracking-wide"
          >
            <Search size={24} />
            Try Another Search
          </Link>
          <p className="text-sm text-dark-text-muted font-medium px-4">
            Try scanning that sketchy energy drink 👀
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
    <div className="p-4 space-y-5 pb-safe animate-slideUp">
      {/* Product card */}
      <div className="glass-card rounded-3xl p-5 border border-dark-border">
        <div className="flex gap-4 items-start">
          {product.image ? (
            <img
              src={product.image}
              alt=""
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }}
              className="w-24 h-24 object-contain rounded-2xl bg-dark-bg-elevated shrink-0 border border-dark-border-subtle"
            />
          ) : null}
          <div className="w-24 h-24 bg-dark-bg-elevated rounded-2xl items-center justify-center shrink-0 border border-dark-border-subtle" style={{ display: product.image ? 'none' : 'flex' }}>
            <Package size={32} className="text-dark-text-muted" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-black text-lg leading-tight break-words text-dark-text">{product.name || 'Unknown Product'}</h2>
            {product.brand && <p className="text-sm text-dark-text-secondary mt-1.5">{product.brand}</p>}
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
        <div className="glass-card rounded-3xl p-5 space-y-4 border border-dark-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-dark-text-muted font-bold tracking-wider">Parent Company</p>
              <h3 className="font-black text-xl text-dark-text mt-1">{parentCompany.name}</h3>
              {parentCompany.ticker && (
                <span className="text-xs text-dark-text-muted font-medium">{parentCompany.ticker}</span>
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

          {/* Political donations */}
          {political && political.donations?.total > 0 && (
            <div className="glass-card rounded-2xl p-4 space-y-2 border border-dark-border-subtle">
              <p className="text-sm font-bold text-dark-text">
                💰 Political Donations: <span className="text-aligned">${(political.donations.total).toLocaleString()}</span>
              </p>
              {political.donations.percentDem != null && political.donations.percentRep != null && (
                <DonationBar percentDem={political.donations.percentDem} percentRep={political.donations.percentRep} />
              )}
            </div>
          )}

          {/* No issue data notice */}
          {useBeliefs && (!companyIssues || Object.keys(companyIssues).length === 0) && (
            <p className="text-xs text-dark-text-muted italic glass-card rounded-xl p-3 border border-dark-border-subtle">
              We don't have detailed issue data for this company yet. Score is based on PAC donations only.
            </p>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-6 text-center border border-dark-border">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-aligned/10 flex items-center justify-center">
            <Search size={32} className="text-aligned/50 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-dark-text mb-2">Researching this brand...</p>
          <p className="text-xs text-dark-text-secondary">
            We're looking up this company across news, public records, and government filings. Check back shortly!
          </p>
        </div>
      )}

      {/* Alternatives */}
      {alts.length > 0 && (
        <div className="space-y-3">
          <div className="glass-card rounded-3xl px-6 py-5 border-2 border-accent-cyan/40 bg-gradient-to-br from-accent-cyan/10 to-aligned/10 shadow-xl shadow-accent-cyan/20">
            <h3 className="font-black text-xl text-gradient mb-2">✨ Try these instead</h3>
            <p className="text-sm font-bold text-dark-text-secondary">Better aligned with your values</p>
          </div>
          
          <div className="space-y-3">
            {alts.map((alt, i) => {
              const pct = alt.alignment?.pct ?? 50;
              const isDealBreaker = alt.alignment?.dealBreakerHit;
              
              return (
                <div 
                  key={alt.barcode || alt.parentCompany?.id || i} 
                  className={`glass-card rounded-3xl p-4 border-l-4 transition-all ${
                    isDealBreaker ? 'border-danger glow-red' : pct >= 70 ? 'border-aligned glow-green' : 'border-warning'
                  } border border-dark-border`}
                >
                  <div className="flex gap-3 items-start mb-3">
                    {alt.image ? (
                      <img 
                        src={alt.image} 
                        alt="" 
                        className="w-16 h-16 object-contain rounded-2xl bg-dark-bg-elevated shrink-0 border border-dark-border-subtle" 
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling && (e.target.nextSibling.style.display = 'flex'); }} 
                      />
                    ) : null}
                    <div className="w-16 h-16 bg-dark-bg-elevated rounded-2xl items-center justify-center shrink-0 border border-dark-border-subtle" style={{ display: alt.image ? 'none' : 'flex' }}>
                      <Package size={24} className="text-dark-text-muted" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm leading-tight text-dark-text truncate">
                            {alt.name || alt.brand || 'Alternative'}
                          </p>
                          {alt.brand && alt.brand !== alt.name && (
                            <p className="text-xs text-dark-text-secondary truncate">{alt.brand}</p>
                          )}
                          {alt.parentCompany && (
                            <p className="text-xs text-dark-text-muted">{alt.parentCompany.name}</p>
                          )}
                        </div>
                        
                        <div className={`shrink-0 font-black text-sm px-3 py-1.5 rounded-full ${
                          isDealBreaker ? 'bg-danger text-white' :
                          pct >= 70 ? 'bg-aligned text-white' :
                          pct >= 40 ? 'bg-warning text-white' :
                          'bg-danger text-white'
                        }`}>
                          {isDealBreaker ? <Ban size={14} /> : `${pct}%`}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {alt.alignment?.reasons?.length > 0 && (
                    <div className="mb-3 space-y-1 px-2 py-2 glass-card rounded-xl border border-dark-border-subtle">
                      {alt.alignment.reasons.slice(0, 2).map((reason, ri) => (
                        <p key={ri} className="text-xs text-dark-text-secondary leading-relaxed">{reason}</p>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {alt.buyLink && (
                      <a 
                        href={alt.buyLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={() => trackClick(alt.brand || alt.name, alt.parentCompany?.id || '', parentCompany?.id || '', 'amazon')}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-accent-cyan to-aligned text-white text-sm font-black rounded-xl hover:shadow-2xl hover:shadow-accent-cyan/40 active:scale-95 transition-all tracking-wide"
                      >
                        <ExternalLink size={16} />
                        Order Online
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
                      alignmentPct: isDealBreaker ? 0 : pct,
                      dealBreaker: isDealBreaker,
                      buyLink: alt.buyLink || null,
                    }} />
                  </div>
                  <span className="text-[9px] text-dark-text-muted mt-2 block">affiliate link</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-2 pt-4">
        {parentCompany && (
          <>
            <ShareButton product={product} parentCompany={parentCompany} beliefResult={beliefResult} />
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
          </>
        )}
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-accent-purple via-accent-violet to-accent-pink text-white rounded-full font-black text-base hover:shadow-2xl hover:shadow-accent-purple/40 transition-all active:scale-95 tracking-wide"
        >
          <Search size={20} />
          Search Another
        </Link>
      </div>
    </div>
  );
}
