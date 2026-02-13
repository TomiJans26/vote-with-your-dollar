export default function AlignmentBadge({ alignment, beliefResult, size = 'md' }) {
  let emoji, label, colors;

  // New belief-based result takes priority
  if (beliefResult) {
    if (beliefResult.dealBreakerHit) {
      emoji = '🚫';
      label = 'Deal Breaker';
      colors = 'bg-red-600 text-white animate-pulse';
    } else if (beliefResult.color === 'green') {
      emoji = '👍'; label = 'Great match'; colors = 'bg-emerald-100 text-emerald-700';
    } else if (beliefResult.color === 'lightgreen') {
      emoji = '👍'; label = 'Good match'; colors = 'bg-emerald-50 text-emerald-600';
    } else if (beliefResult.color === 'yellow') {
      emoji = '➖'; label = 'Mixed'; colors = 'bg-yellow-100 text-yellow-700';
    } else if (beliefResult.color === 'orange') {
      emoji = '👎'; label = 'Weak match'; colors = 'bg-orange-100 text-orange-700';
    } else if (beliefResult.color === 'red') {
      emoji = '👎'; label = 'Poor match'; colors = 'bg-rose-100 text-rose-700';
    } else {
      emoji = '❓'; label = 'No data'; colors = 'bg-gray-100 text-gray-500';
    }
  } else {
    // Fallback to old alignment number
    const abs = Math.abs(alignment || 0);
    if (!alignment || abs < 0.1) {
      emoji = '➖'; label = 'Neutral'; colors = 'bg-gray-100 text-gray-600';
    } else if (alignment > 0) {
      emoji = '👍';
      label = abs > 0.5 ? 'Great match' : 'Good match';
      colors = abs > 0.5 ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-50 text-emerald-600';
    } else {
      emoji = '👎';
      label = abs > 0.5 ? 'Poor match' : 'Weak match';
      colors = abs > 0.5 ? 'bg-rose-100 text-rose-700' : 'bg-rose-50 text-rose-600';
    }
  }

  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClass} ${colors}`}>
      {emoji} {label}
    </span>
  );
}
