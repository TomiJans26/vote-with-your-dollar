import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'dollarvote_shopping_list';

export function getShoppingList() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}

export function addToShoppingList(item) {
  const list = getShoppingList();
  // Avoid duplicates by barcode or name+company
  const exists = list.some(i =>
    (item.barcode && i.barcode === item.barcode) ||
    (item.name === i.name && item.companyName === i.companyName)
  );
  if (!exists) {
    list.push({ ...item, addedAt: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }
  return !exists;
}

export function removeFromShoppingList(index) {
  const list = getShoppingList();
  list.splice(index, 1);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

export function clearShoppingList() {
  localStorage.removeItem(STORAGE_KEY);
}

export default function ShoppingList() {
  const [list, setList] = useState(getShoppingList);

  // Sync on focus (if user adds from another tab/page)
  useEffect(() => {
    const handleFocus = () => setList(getShoppingList());
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleRemove = (index) => {
    const updated = removeFromShoppingList(index);
    setList([...updated]);
  };

  const handleClear = () => {
    if (window.confirm('Clear your entire shopping list?')) {
      clearShoppingList();
      setList([]);
    }
  };

  // Calculate overall alignment
  const itemsWithScores = list.filter(i => typeof i.alignmentPct === 'number');
  const avgAlignment = itemsWithScores.length > 0
    ? Math.round(itemsWithScores.reduce((sum, i) => sum + i.alignmentPct, 0) / itemsWithScores.length)
    : null;

  const getScoreColor = (pct) => {
    if (pct >= 70) return 'text-emerald-600 bg-emerald-50';
    if (pct >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getScoreBg = (pct) => {
    if (pct >= 70) return 'bg-emerald-500';
    if (pct >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="text-center pt-4">
        <div className="text-5xl mb-2">📝</div>
        <h2 className="text-xl font-bold text-teal-800">Shopping List</h2>
        <p className="text-sm text-gray-600 mt-1">
          Save products and track your overall alignment.
        </p>
      </div>

      {/* Overall score */}
      {avgAlignment !== null && list.length > 0 && (
        <div className={`rounded-2xl p-4 text-center ${
          avgAlignment >= 70 ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
          avgAlignment >= 40 ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
          'bg-gradient-to-br from-red-500 to-red-700'
        } text-white shadow-lg`}>
          <p className="text-sm font-medium opacity-80">List Alignment Score</p>
          <p className="text-4xl font-black mt-1">{avgAlignment}%</p>
          <p className="text-xs opacity-70 mt-1">{itemsWithScores.length} of {list.length} items scored</p>
        </div>
      )}

      {/* Items */}
      {list.length > 0 ? (
        <div className="space-y-2">
          {list.map((item, i) => (
            <div key={item.barcode || `${item.name}-${i}`} className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3">
              {/* Score badge */}
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-white font-bold text-sm ${
                item.dealBreaker ? 'bg-red-500' :
                typeof item.alignmentPct === 'number' ? getScoreBg(item.alignmentPct) : 'bg-gray-300'
              }`}>
                {item.dealBreaker ? '🚫' :
                 typeof item.alignmentPct === 'number' ? `${item.alignmentPct}%` : '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{item.name}</p>
                {item.companyName && (
                  <p className="text-xs text-gray-500 truncate">{item.brand ? `${item.brand} · ` : ''}{item.companyName}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                {item.barcode && (
                  <Link
                    to={`/result/${item.barcode}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-teal-600 transition-colors text-sm"
                    title="View details"
                  >
                    🔍
                  </Link>
                )}
                {item.buyLink && (
                  <a
                    href={item.buyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-teal-600 transition-colors text-sm"
                    title="Buy on Amazon"
                  >
                    🛒
                  </a>
                )}
                <button
                  onClick={() => handleRemove(i)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors text-sm"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {/* Clear all */}
          <div className="text-center pt-2">
            <button
              onClick={handleClear}
              className="text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              Clear entire list
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-3">
          <div className="text-4xl">🛒</div>
          <p className="text-gray-500 font-medium">Your list is empty</p>
          <p className="text-sm text-gray-400">Scan products or browse alternatives to add items.</p>
          <Link
            to="/"
            className="inline-block mt-2 px-6 py-2 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
          >
            📸 Start Scanning
          </Link>
        </div>
      )}
    </div>
  );
}
