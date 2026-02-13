import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchProducts } from '../lib/api';

export default function Scanner() {
  const navigate = useNavigate();
  const [manualUpc, setManualUpc] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimeout = useRef(null);
  const videoRef = useRef(null);
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

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const upc = manualUpc.trim();
    if (upc.length >= 8) {
      navigate(`/result/${upc}`);
    }
  };

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
          navigate(`/result/${decodedText}`);
        },
        () => {}
      );
    } catch (err) {
      setScanning(false);
      setError('Camera access denied or not available. Use manual entry below.');
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
      <div className="text-center pt-4">
        <div className="text-5xl mb-2">🛒</div>
        <h2 className="text-xl font-bold text-teal-800">Scan a Product</h2>
        <p className="text-sm text-gray-600 mt-1">
          See who's behind the brands you buy and where the money goes.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">🔍</span>
          <input
            type="text"
            placeholder="Search products or brands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none text-base bg-white shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            >✕</button>
          )}
        </div>

        {/* Search results dropdown */}
        {searchQuery.length >= 2 && (
          <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-200 max-h-80 overflow-y-auto">
            {searchLoading && (
              <div className="p-4 text-center text-sm text-gray-500">
                <span className="animate-pulse">Searching...</span>
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
                  // Navigate to a scan result using first matching brand
                  // For brand matches, we go to company view
                  navigate(`/result/search-${r.company.id}`);
                }}
                className="w-full text-left px-4 py-3 hover:bg-teal-50 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors"
              >
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center text-lg shrink-0">
                  {r.type === 'company' ? '🏢' : '🏷️'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{r.brand}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {r.company.name} • {r.company.industry || ''}
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
                className="w-full text-left px-4 py-3 hover:bg-teal-50 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors"
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

      {/* Scanner area */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div
          id="scanner-region"
          className={`w-full ${scanning ? 'min-h-[280px]' : 'h-0'}`}
        />
        {!scanning ? (
          <button
            onClick={startScanner}
            className="w-full py-5 text-lg font-semibold bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-2xl">📸</span> Scan Barcode
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full py-3 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            ✕ Stop Scanner
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm text-center bg-red-50 rounded-lg p-3">{error}</p>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="text-xs text-gray-500 uppercase">or enter manually</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>

      {/* Manual entry */}
      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          placeholder="Enter UPC barcode..."
          value={manualUpc}
          onChange={(e) => setManualUpc(e.target.value)}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 outline-none text-lg"
        />
        <button
          type="submit"
          disabled={manualUpc.trim().length < 8}
          className="px-5 py-3 bg-teal-600 text-white rounded-xl font-semibold disabled:opacity-40 hover:bg-teal-700 transition-colors"
        >
          Go
        </button>
      </form>

      {/* Example UPCs */}
      <div className="text-center">
        <p className="text-xs text-gray-400 mb-2">Try these examples:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {['049000006346', '028400064057', '038000138416', '012000001536'].map(upc => (
            <button
              key={upc}
              onClick={() => navigate(`/result/${upc}`)}
              className="text-xs px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors"
            >
              {upc}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
