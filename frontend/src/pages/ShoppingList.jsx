import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingCart, ExternalLink, X, Ban, Trash2 } from 'lucide-react';

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
    if (navigator.vibrate) navigator.vibrate(30);
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
    if (pct >= 70) return 'bg-aligned text-white';
    if (pct >= 40) return 'bg-warning text-white';
    return 'bg-danger text-white';
  };

  return (
    <div className="p-4 space-y-6 pb-safe animate-slideUp">
      {/* Header */}
      <div className="text-center pt-6 pb-4">
        <div className="text-7xl mb-3 animate-bounce">🛒</div>
        <h2 className="text-4xl font-black tracking-tight">
          Shopping <span className="text-gradient-purple">List</span>
        </h2>
        <p className="text-base font-bold text-dark-text-secondary mt-3">
          Your conscious shopping starts here 🌱
        </p>
      </div>

      {/* Overall score - DRAMATIC */}
      {avgAlignment !== null && list.length > 0 && (
        <div className={`glass-card rounded-3xl p-10 text-center shadow-2xl border-2 transition-all ${
          avgAlignment >= 70 ? 'border-accent-cyan/60 bg-gradient-to-br from-accent-cyan/10 to-aligned/10 glow-green' :
          avgAlignment >= 40 ? 'border-warning/60 bg-gradient-to-br from-warning/10 to-warning/5' :
          'border-danger/60 bg-gradient-to-br from-danger/10 to-danger/5 glow-red'
        }`}>
          <p className="text-xs font-black text-dark-text-secondary uppercase tracking-widest mb-2">
            List Alignment Score
          </p>
          <p className={`text-7xl font-black mt-3 mb-3 animate-countUp drop-shadow-2xl ${
            avgAlignment >= 70 ? 'text-gradient' :
            avgAlignment >= 40 ? 'text-warning' :
            'text-danger'
          }`}>
            {avgAlignment}%
          </p>
          <p className="text-sm text-dark-text-muted font-bold">
            {itemsWithScores.length} of {list.length} items scored
          </p>
        </div>
      )}

      {/* Items */}
      {list.length > 0 ? (
        <div className="space-y-2.5">
          {list.map((item, i) => (
            <div 
              key={item.barcode || `${item.name}-${i}`} 
              className="glass-card rounded-2xl p-4 flex items-center gap-3 border border-dark-border hover:border-dark-border transition-all group"
            >
              {/* Score badge */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 font-black text-sm transition-all ${
                item.dealBreaker ? 'bg-danger text-white shadow-lg shadow-danger/30' :
                typeof item.alignmentPct === 'number' ? `${getScoreColor(item.alignmentPct)} shadow-lg` : 'bg-white/5 text-dark-text-muted'
              }`}>
                {item.dealBreaker ? <Ban size={20} /> :
                 typeof item.alignmentPct === 'number' ? `${item.alignmentPct}%` : '?'}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate text-dark-text">{item.name}</p>
                {item.companyName && (
                  <p className="text-xs text-dark-text-secondary truncate">
                    {item.brand ? `${item.brand} · ` : ''}{item.companyName}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.barcode && (
                  <Link
                    to={`/result/${item.barcode}`}
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-dark-text-muted hover:bg-aligned/20 hover:text-aligned transition-colors"
                    title="View details"
                  >
                    <Search size={16} />
                  </Link>
                )}
                {item.buyLink && (
                  <a
                    href={item.buyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 flex items-center justify-center rounded-xl text-dark-text-muted hover:bg-aligned/20 hover:text-aligned transition-colors"
                    title="Buy online"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <button
                  onClick={() => handleRemove(i)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-dark-text-muted hover:bg-danger/20 hover:text-danger transition-colors"
                  title="Remove"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}

          {/* Clear all */}
          <div className="text-center pt-4">
            <button
              onClick={handleClear}
              className="flex items-center gap-2 text-xs text-dark-text-muted hover:text-danger transition-colors mx-auto font-medium"
            >
              <Trash2 size={12} />
              Clear entire list
            </button>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-12 text-center space-y-6 border-2 border-dark-border hover:border-accent-purple/30 transition-all">
          <div className="text-8xl animate-bounce">🌱</div>
          <div>
            <p className="text-2xl font-black text-gradient-purple mb-3">Your list is empty!</p>
            <p className="text-base font-bold text-dark-text-secondary leading-relaxed max-w-xs mx-auto">
              Your conscious shopping list starts here
            </p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-accent-purple via-accent-violet to-accent-pink text-white rounded-full font-black text-lg hover:shadow-2xl hover:shadow-accent-purple/50 transition-all active:scale-95 mt-6 tracking-wide"
          >
            <Search size={24} />
            Start Scanning
          </Link>
        </div>
      )}
    </div>
  );
}
