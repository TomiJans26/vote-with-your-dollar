import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getScanHistory, isAuthenticated } from '../lib/api';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      setLoading(false);
      return;
    }
    getScanHistory()
      .then(h => setHistory(h))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  if (!isAuthenticated()) {
    return (
      <div className="p-6 text-center space-y-4 pt-12">
        <div className="text-5xl">📋</div>
        <h2 className="text-lg font-bold text-gray-800">Scan History</h2>
        <p className="text-sm text-gray-500">Sign in to track your scan history across sessions.</p>
        <Link to="/login" className="inline-block mt-2 px-6 py-2 bg-teal-600 text-white rounded-xl font-semibold">
          Sign In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-200 border-t-teal-600" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center pt-2">
        <h2 className="text-xl font-bold text-teal-800">📋 Scan History</h2>
        <p className="text-sm text-gray-500 mt-1">
          {history.length > 0
            ? `${history.length} product${history.length !== 1 ? 's' : ''} scanned`
            : 'No scans yet — go scan something!'}
        </p>
      </div>

      {history.length === 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-3">
          <div className="text-5xl">🛒</div>
          <p className="text-sm text-gray-500">Your scan history will appear here.</p>
          <Link to="/" className="inline-block mt-2 px-6 py-2 bg-teal-600 text-white rounded-xl font-semibold text-sm">
            Start Scanning
          </Link>
        </div>
      )}

      {history.map((item) => {
        const date = item.scanned_at ? new Date(item.scanned_at) : null;
        const scoreColor = item.alignment_score != null
          ? item.alignment_score >= 70 ? 'bg-emerald-500' : item.alignment_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
          : 'bg-gray-300';

        return (
          <Link
            key={item.id}
            to={`/result/${item.upc}`}
            className="block bg-white rounded-2xl shadow-lg p-4 hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
                📦
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {item.product_name || item.brand || 'Unknown Product'}
                </p>
                {item.parent_company && (
                  <p className="text-xs text-gray-500 truncate">{item.parent_company}</p>
                )}
                {date && (
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at{' '}
                    {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}
              </div>
              {item.alignment_score != null && (
                <span className={`${scoreColor} text-white text-xs font-bold px-2 py-1 rounded-full shrink-0`}>
                  {item.alignment_score}%
                </span>
              )}
              <span className="text-gray-300 text-sm shrink-0">→</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
