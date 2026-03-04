import { Ban } from 'lucide-react';

export default function AlignmentBadge({ alignment, beliefResult, size = 'md', showRing = false }) {
  let emoji, label, colors, ringColor, percentage;

  // New belief-based result takes priority
  if (beliefResult) {
    percentage = beliefResult.pct ?? Math.round(((beliefResult.score + 1) / 2) * 100);
    
    if (beliefResult.dealBreakerHit) {
      emoji = null; // We'll use Ban icon instead
      label = 'Hard No 🚫';
      colors = 'bg-gradient-to-br from-danger to-danger/80 text-white shadow-lg shadow-danger/30';
      ringColor = '#ff006e';
    } else if (beliefResult.color === 'green') {
      emoji = '✨';
      label = "This one's a keeper!";
      colors = 'bg-gradient-to-br from-accent-cyan/30 to-aligned/30 text-accent-cyan border-2 border-accent-cyan/40 shadow-lg shadow-accent-cyan/20';
      ringColor = '#00f5d4';
    } else if (beliefResult.color === 'lightgreen') {
      emoji = '✓';
      label = 'Good match';
      colors = 'bg-gradient-to-br from-aligned/20 to-aligned/10 text-aligned border-2 border-aligned/30';
      ringColor = '#06d6a0';
    } else if (beliefResult.color === 'yellow') {
      emoji = '🤔';
      label = 'Mixed bag';
      colors = 'bg-gradient-to-br from-warning/20 to-warning/10 text-warning border-2 border-warning/30';
      ringColor = '#ffd166';
    } else if (beliefResult.color === 'orange') {
      emoji = '⚠️';
      label = 'Might want to rethink this';
      colors = 'bg-gradient-to-br from-warning/20 to-warning/10 text-warning border-2 border-warning/30';
      ringColor = '#ffd166';
    } else if (beliefResult.color === 'red') {
      emoji = '👎';
      label = 'Poor match';
      colors = 'bg-gradient-to-br from-danger/20 to-danger/10 text-danger border-2 border-danger/30 shadow-lg shadow-danger/10';
      ringColor = '#ff006e';
    } else {
      emoji = '?';
      label = 'No data';
      colors = 'bg-white/5 text-dark-text-secondary border border-dark-border';
      ringColor = '#6b7280';
    }
  } else {
    // Fallback to old alignment number
    const abs = Math.abs(alignment || 0);
    percentage = Math.round(((alignment + 1) / 2) * 100);
    
    if (!alignment || abs < 0.1) {
      emoji = '~';
      label = 'Neutral';
      colors = 'bg-white/5 text-dark-text-secondary border border-dark-border';
      ringColor = '#6b7280';
    } else if (alignment > 0) {
      emoji = abs > 0.5 ? '✨' : '✓';
      label = abs > 0.5 ? 'Great match! 💚' : 'Good match';
      colors = abs > 0.5 
        ? 'bg-gradient-to-br from-accent-cyan/30 to-aligned/30 text-accent-cyan border-2 border-accent-cyan/40 shadow-lg shadow-accent-cyan/20' 
        : 'bg-gradient-to-br from-aligned/20 to-aligned/10 text-aligned border-2 border-aligned/30';
      ringColor = abs > 0.5 ? '#00f5d4' : '#06d6a0';
    } else {
      emoji = abs > 0.5 ? '👎' : '⚠️';
      label = abs > 0.5 ? 'Poor match' : 'Weak match';
      colors = abs > 0.5 
        ? 'bg-gradient-to-br from-danger/20 to-danger/10 text-danger border-2 border-danger/30 shadow-lg shadow-danger/10' 
        : 'bg-gradient-to-br from-warning/20 to-warning/10 text-warning border-2 border-warning/30';
      ringColor = abs > 0.5 ? '#ff006e' : '#ffd166';
    }
  }

  const sizeClass = size === 'sm' ? 'text-xs px-3 py-1.5' : size === 'lg' ? 'text-base px-5 py-3' : 'text-sm px-4 py-2';

  // If showRing, render as circular progress
  if (showRing) {
    const circumference = 2 * Math.PI * 54; // radius = 54
    const offset = circumference - (percentage / 100) * circumference;
    const isDealBreaker = beliefResult?.dealBreakerHit;

    return (
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-32 h-32">
          {/* Background circle */}
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="54"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="64"
              cy="64"
              r="54"
              stroke={ringColor}
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={isDealBreaker ? 0 : offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 8px ${ringColor}40)`
              }}
            />
          </svg>
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isDealBreaker ? (
              <>
                <Ban size={32} className="text-danger mb-1" strokeWidth={2.5} />
                <span className="text-xs font-bold text-danger">BLOCKED</span>
              </>
            ) : (
              <>
                <span className="text-3xl font-black animate-countUp" style={{ color: ringColor }}>
                  {percentage}%
                </span>
                <span className="text-[10px] text-dark-text-muted uppercase tracking-wide font-semibold mt-0.5">
                  Aligned
                </span>
              </>
            )}
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold text-sm px-4 py-2 ${colors}`}>
          {beliefResult?.dealBreakerHit ? (
            <>
              <Ban size={14} />
              {label}
            </>
          ) : (
            <>
              {emoji && <span className="text-base">{emoji}</span>}
              {label}
            </>
          )}
        </span>
      </div>
    );
  }

  // Regular badge (inline)
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${sizeClass} ${colors}`}>
      {beliefResult?.dealBreakerHit ? (
        <>
          <Ban size={size === 'sm' ? 12 : 14} />
          {label}
        </>
      ) : (
        <>
          {emoji && <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{emoji}</span>}
          {label}
        </>
      )}
    </span>
  );
}
