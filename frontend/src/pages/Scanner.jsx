import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchProducts } from '../lib/api';

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
    <div className="p-4 space-y-6">
      {/* Hero */}
      <div className="text-center pt-6 pb-2">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          See where your money<br />really goes
        </h2>
        <p className="text-sm text-gray-500 mt-2">
          Search any product or brand to see who's behind it
        </p>
      </div>

      {/* Search bar — PRIMARY action */}
      <div className="relative">
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search for a product or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-4 rounded-2xl border-2 border-gray-200 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none text-base bg-white shadow-sm transition-all"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults(null); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 active:text-gray-800 p-1 transition-colors"
            >✕</button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchQuery.length >= 2 && (
          <div className="absolute z-20 w-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-200 max-h-80 overflow-y-auto">
            {searchLoading && (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                      <div className="h-2 bg-gray-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!searchLoading && !hasResults && (
              <div className="p-4 text-center text-sm text-gray-500">
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
                className="w-full text-left px-4 py-3 hover:bg-teal-50 active:bg-teal-100 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors"
              >
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-lg shrink-0">
                  {r.type === 'company' ? '🏢' : '🏷️'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{r.brand}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {r.company.name} {r.company.industry ? `· ${r.company.industry}` : ''}
                  </p>
                  {r.matchingBrands && r.matchingBrands.length > 1 && (
                    <p className="text-[10px] text-gray-400 truncate">
                      Also: {r.matchingBrands.slice(1, 4).join(', ')}
                    </p>
                  )}
                </div>
                <span className="text-gray-300 text-xs shrink-0">→</span>
              </button>
            ))}

            {/* Separator */}
            {searchResults?.results?.length > 0 && searchResults?.offResults?.length > 0 && (
              <div className="px-4 py-1.5 bg-gray-50 text-[10px] text-gray-400 uppercase font-semibold">
                Products from Open Food Facts
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
                className="w-full text-left px-4 py-3 hover:bg-teal-50 active:bg-teal-100 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors"
              >
                {r.image ? (
                  <img src={r.image} alt="" className="w-10 h-10 object-contain rounded-lg bg-gray-50 shrink-0" />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg shrink-0">📦</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{r.name}</p>
                  {r.brand && <p className="text-xs text-gray-500 truncate">{r.brand}</p>}
                </div>
                <span className="text-gray-300 text-xs shrink-0">→</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Example chips — product names, not UPCs */}
      <div className="text-center">
        <p className="text-xs text-gray-400 mb-2">Try an example:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {EXAMPLES.map(ex => (
            <button
              key={ex.upc}
              onClick={() => navigate(`/result/${ex.upc}`)}
              className="text-sm px-4 py-2 bg-white text-teal-700 rounded-full border border-teal-200 hover:bg-teal-50 active:bg-teal-100 transition-colors shadow-sm font-medium"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400">or</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Scanner — SECONDARY action */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
        <div className="relative">
          <div
            id="scanner-region"
            className={`w-full ${scanning ? 'min-h-[300px]' : 'h-0'}`}
          />
          {scanning && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" />
              <div className="relative z-10 w-[280px] h-[140px]">
                <div className="absolute top-0 left-0 w-6 h-6 border-emerald-400 rounded-tl-lg" style={{borderWidth: '3px 0 0 3px', borderStyle: 'solid', borderColor: '#34d399'}} />
                <div className="absolute top-0 right-0 w-6 h-6 rounded-tr-lg" style={{borderWidth: '3px 3px 0 0', borderStyle: 'solid', borderColor: '#34d399'}} />
                <div className="absolute bottom-0 left-0 w-6 h-6 rounded-bl-lg" style={{borderWidth: '0 0 3px 3px', borderStyle: 'solid', borderColor: '#34d399'}} />
                <div className="absolute bottom-0 right-0 w-6 h-6 rounded-br-lg" style={{borderWidth: '0 3px 3px 0', borderStyle: 'solid', borderColor: '#34d399'}} />
                <div className="absolute left-2 right-2 h-0.5 bg-emerald-400/80 animate-pulse top-1/2" />
              </div>
              <p className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-xs z-10">
                Align barcode within the frame
              </p>
            </div>
          )}
        </div>
        {!scanning ? (
          <button
            onClick={startScanner}
            className="w-full py-3.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 active:bg-teal-100 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">📷</span> Scan a Barcode
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full py-3 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors"
          >
            ✕ Stop Scanner
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-center bg-amber-50 text-amber-700 rounded-xl p-3">{error}</p>
      )}
    </div>
  );
}
