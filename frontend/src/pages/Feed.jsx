import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, ExternalLink, Newspaper, Search } from 'lucide-react';

export default function Feed() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [interactions, setInteractions] = useState({});

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

  const handleInteraction = (signalId, type) => {
    setInteractions(prev => ({
      ...prev,
      [signalId]: interactions[signalId] === type ? null : type
    }));
    if (navigator.vibrate) navigator.vibrate(30);
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCompanyInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="glass-card rounded-3xl p-4 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-white/10 rounded-full w-3/4" />
                <div className="h-2 bg-white/5 rounded-full w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="glass-card rounded-3xl p-6 text-center border border-danger/30">
          <p className="text-danger text-sm font-medium">Error loading feed: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 animate-slideUp">
      {/* Header */}
      <div className="text-center pt-4 pb-2">
        <h2 className="text-3xl font-black tracking-tight">
          News <span className="text-gradient">Feed</span>
        </h2>
        <p className="text-sm text-dark-text-secondary mt-2">
          Recent actions from companies you care about
        </p>
      </div>

      {signals.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-aligned/10 flex items-center justify-center">
            <Newspaper size={32} className="text-aligned/50" />
          </div>
          <p className="text-sm font-semibold text-dark-text mb-2">No recent signals</p>
          <p className="text-xs text-dark-text-secondary mb-6">
            We'll update this feed as we track more company actions
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-aligned to-aligned/80 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-aligned/20 transition-all active:scale-95"
          >
            <Search size={18} />
            Scan a Product
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => {
            const interaction = interactions[signal.id];
            const companyInitial = getCompanyInitial(signal.company);
            const relativeTime = getRelativeTime(signal.date);

            return (
              <div 
                key={signal.id} 
                className="glass-card rounded-3xl p-4 space-y-3 border border-dark-border hover:border-dark-border transition-all group"
              >
                <div className="flex items-start gap-3">
                  {/* Company logo placeholder */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-aligned/20 to-aligned/10 flex items-center justify-center shrink-0 font-bold text-aligned border border-aligned/20">
                    {companyInitial}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold text-sm text-dark-text leading-tight">
                        {signal.company}
                      </p>
                      {relativeTime && (
                        <span className="text-[10px] text-dark-text-muted shrink-0 font-medium">
                          {relativeTime}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-dark-text-secondary leading-relaxed">
                      {signal.title}
                    </p>
                  </div>
                </div>
                
                {/* Source label */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-dark-text-muted uppercase tracking-wider font-semibold px-2 py-1 bg-white/5 rounded-lg">
                    {signal.source || 'News'}
                  </span>
                  
                  {/* Interaction buttons */}
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleInteraction(signal.id, 'up')}
                      className={`p-2 rounded-xl transition-all active:scale-90 ${
                        interaction === 'up' 
                          ? 'bg-aligned/20 text-aligned' 
                          : 'hover:bg-white/5 text-dark-text-muted hover:text-aligned'
                      }`}
                      title="Helpful"
                    >
                      <ThumbsUp size={16} strokeWidth={2.5} />
                    </button>
                    <button 
                      onClick={() => handleInteraction(signal.id, 'down')}
                      className={`p-2 rounded-xl transition-all active:scale-90 ${
                        interaction === 'down' 
                          ? 'bg-danger/20 text-danger' 
                          : 'hover:bg-white/5 text-dark-text-muted hover:text-danger'
                      }`}
                      title="Not helpful"
                    >
                      <ThumbsDown size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Read more link */}
                {signal.url && (
                  <a
                    href={signal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs text-aligned hover:text-aligned/80 font-semibold group/link pt-1"
                  >
                    <ExternalLink size={14} className="group-hover/link:scale-110 transition-transform" />
                    Read Full Story
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CTA at bottom */}
      {signals.length > 0 && (
        <div className="text-center pt-6 pb-2">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-8 py-3 glass-card rounded-full font-semibold hover:bg-white/10 transition-all active:scale-95 border border-dark-border"
          >
            <Search size={18} />
            Scan a Product
          </Link>
        </div>
      )}
    </div>
  );
}
