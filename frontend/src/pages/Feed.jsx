import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Feed() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/signals/recent?limit=20')
      .then(res => res.json())
      .then(data => {
        setSignals(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-3 animate-pulse">
        <div className="h-24 bg-gray-200 rounded-xl" />
        <div className="h-24 bg-gray-200 rounded-xl" />
        <div className="h-24 bg-gray-200 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 text-sm">Error loading feed: {error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      <div className="text-center py-2">
        <h2 className="text-xl font-bold text-teal-800">News Feed</h2>
        <p className="text-xs text-gray-500 mt-1">Recent signals from companies you care about</p>
      </div>

      {signals.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-center text-gray-500">
          <p className="text-2xl mb-2">📰</p>
          <p className="text-sm">No recent signals to show</p>
          <p className="text-xs text-gray-400 mt-1">We'll update this feed as we track more company actions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => (
            <div key={signal.id} className="bg-white rounded-xl shadow-sm p-4 space-y-2 border-l-4 border-teal-500">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 leading-tight">{signal.company}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{signal.title}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button 
                    className="text-lg hover:scale-110 active:scale-95 transition-transform"
                    title="Helpful"
                  >
                    👍
                  </button>
                  <button 
                    className="text-lg hover:scale-110 active:scale-95 transition-transform"
                    title="Not helpful"
                  >
                    👎
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>{signal.source || 'News'}</span>
                {signal.date && (
                  <span>{new Date(signal.date).toLocaleDateString()}</span>
                )}
              </div>

              {signal.url && (
                <a
                  href={signal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  📄 Read More →
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="text-center pt-4 pb-2">
        <Link 
          to="/" 
          className="inline-block px-6 py-2.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
        >
          🔍 Scan a Product
        </Link>
      </div>
    </div>
  );
}
