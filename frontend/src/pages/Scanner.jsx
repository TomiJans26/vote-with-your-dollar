import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchProducts } from '../lib/api';
import { Search, Camera, X, Building2, Tag, Package } from 'lucide-react';

const EXAMPLES = [
  { label: 'Coca-Cola', upc: '049000006346' },
  { label: 'Tostitos', upc: '028400064057' },
  { label: "Kellogg's", upc: '038000138416' },
  { label: 'Pepsi', upc: '012000001536' },
];

export default function Scanner() {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef(null);
  const scannerRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }
    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const data = await searchProducts(searchQuery);
        setSearchResults(data);
      } catch {
        setSearchResults({ results: [], offResults: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery]);

  const startScanner = useCallback(async () => {
    setError('');
    setScanning(true);
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('scanner-region');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 150 } },
        (decodedText) => {
          scanner.stop().catch(() => {});
          setScanning(false);
          if (navigator.vibrate) navigator.vibrate(100);
          navigate(`/result/${decodedText}`);
        },
        () => {}
      );
    } catch {
      setScanning(false);
      setError('Could not access camera. Try searching by name instead!');
    }
  }, [navigate]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const hasResults = searchResults && (searchResults.results?.length > 0 || searchResults.offResults?.length > 0);

  return (
    <div className="p-4 space-y-8 animate-slideUp">
      {/* Hero Section */}
      <div className="text-center pt-8 pb-4 space-y-3">
        <h2 className="text-4xl font-black tracking-tighter leading-tight">
          Scan. Know.
          <br />
          <span className="text-gradient">Choose.</span>
        </h2>
        <p className="text-sm text-dark-text-secondary max-w-xs mx-auto">
          Every purchase is a vote. Make yours count.
        </p>
      </div>

      {/* Search bar — PRIMARY action */}
      <div className="relative">
        <div className="relative">
          <Search 
            size={20} 
            className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-text-muted"
          />
          <input
            type="text"
            placeholder="Search for a product or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-4 rounded-full glass-card focus:ring-2 focus:ring-aligned/50 outline-none text-base placeholder:text-dark-text-muted transition-all"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults(null); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-text-muted hover:text-dark-text active:text-aligned p-1 transition-colors rounded-full hover:bg-white/5"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchQuery.length >= 2 && (
          <div className="absolute z-20 w-full mt-2 glass-card rounded-3xl shadow-2xl max-h-96 overflow-y-auto no-scrollbar">
            {searchLoading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-white/10 rounded-full w-3/4" />
                      <div className="h-2 bg-white/5 rounded-full w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searchLoading && !hasResults && (
              <div className="p-6 text-center text-sm text-dark-text-secondary">
                No results for "{searchQuery}"
              </div>
            )}

            {/* Brand/company matches */}
            {searchResults?.results?.map((r, i) => (
              <button
                key={`brand-${i}`}
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                  navigate(`/result/search-${r.company.id}`);
                }}
                className="w-full text-left px-4 py-3.5 hover:bg-white/5 active:bg-white/10 flex items-center gap-3 border-b border-dark-border-subtle last:border-0 first:rounded-t-3xl last:rounded-b-3xl transition-colors group"
              >
                <div className="w-12 h-12 bg-aligned/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-aligned/20 transition-colors">
                  {r.type === 'company' ? <Building2 size={20} className="text-aligned" /> : <Tag size={20} className="text-aligned" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{r.brand}</p>
                  <p className="text-xs text-dark-text-secondary truncate">
                    {r.company.name} {r.company.industry ? `· ${r.company.industry}` : ''}
                  </p>
                  {r.matchingBrands && r.matchingBrands.length > 1 && (
                    <p className="text-[10px] text-dark-text-muted truncate mt-0.5">
                      Also: {r.matchingBrands.slice(1, 4).join(', ')}
                    </p>
                  )}
                </div>
                <span className="text-dark-text-muted text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
            ))}

            {/* Separator */}
            {searchResults?.results?.length > 0 && searchResults?.offResults?.length > 0 && (
              <div className="px-4 py-2 bg-white/5 backdrop-blur">
                <p className="text-[10px] text-dark-text-muted uppercase font-semibold tracking-wider">
                  Products
                </p>
              </div>
            )}

            {/* Open Food Facts results */}
            {searchResults?.offResults?.map((r, i) => (
              <button
                key={`off-${i}`}
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults(null);
                  navigate(`/result/${r.barcode}`);
                }}
                className="w-full text-left px-4 py-3.5 hover:bg-white/5 active:bg-white/10 flex items-center gap-3 border-b border-dark-border-subtle last:border-0 last:rounded-b-3xl transition-colors group"
              >
                {r.image ? (
                  <img src={r.image} alt="" className="w-12 h-12 object-contain rounded-2xl bg-dark-bg-elevated shrink-0" />
                ) : (
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0">
                    <Package size={20} className="text-dark-text-muted" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{r.name}</p>
                  {r.brand && <p className="text-xs text-dark-text-secondary truncate">{r.brand}</p>}
                </div>
                <span className="text-dark-text-muted text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Example chips */}
      <div className="text-center space-y-3">
        <p className="text-xs text-dark-text-muted uppercase tracking-wider font-medium">Try an example</p>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map(ex => (
            <button
              key={ex.upc}
              onClick={() => navigate(`/result/${ex.upc}`)}
              className="text-sm px-5 py-2.5 glass-card text-dark-text rounded-full hover:bg-white/10 active:scale-95 transition-all font-medium border border-dark-border"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 py-2">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-dark-border to-transparent" />
        <span className="text-xs text-dark-text-muted font-medium">or</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-dark-border to-transparent" />
      </div>

      {/* Scanner — SECONDARY action with pulsing effect */}
      <div className="glass-card rounded-3xl overflow-hidden shadow-xl border border-dark-border">
        <div className="relative">
          <div
            id="scanner-region"
            className={`w-full transition-all ${scanning ? 'min-h-[320px]' : 'h-0'}`}
          />
          {scanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="relative z-10 w-[280px] h-[140px]">
                {/* Corner indicators */}
                <div className="absolute top-0 left-0 w-8 h-8 border-aligned rounded-tl-2xl" style={{borderWidth: '3px 0 0 3px'}} />
                <div className="absolute top-0 right-0 w-8 h-8 border-aligned rounded-tr-2xl" style={{borderWidth: '3px 3px 0 0'}} />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-aligned rounded-bl-2xl" style={{borderWidth: '0 0 3px 3px'}} />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-aligned rounded-br-2xl" style={{borderWidth: '0 3px 3px 0'}} />
                {/* Scan line */}
                <div className="absolute left-4 right-4 h-0.5 bg-aligned/80 animate-pulse top-1/2 shadow-lg shadow-aligned/50" />
              </div>
              <p className="absolute bottom-6 left-0 right-0 text-center text-white/90 text-sm font-medium z-10">
                Align barcode within the frame
              </p>
            </div>
          )}
        </div>
        {!scanning ? (
          <button
            onClick={startScanner}
            className="w-full py-4 text-sm font-semibold text-dark-text hover:bg-white/5 active:bg-white/10 transition-all flex items-center justify-center gap-2.5 group animate-glow"
          >
            <Camera size={22} className="text-aligned group-hover:scale-110 transition-transform" />
            <span>Scan a Barcode</span>
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full py-4 text-sm font-medium bg-white/5 text-dark-text-secondary hover:bg-white/10 active:bg-white/15 transition-colors flex items-center justify-center gap-2"
          >
            <X size={18} />
            Stop Scanner
          </button>
        )}
      </div>

      {error && (
        <div className="glass-card rounded-2xl p-4 border border-warning/30 bg-warning/5">
          <p className="text-sm text-center text-warning">{error}</p>
        </div>
      )}
    </div>
  );
}
