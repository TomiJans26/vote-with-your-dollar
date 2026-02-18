import { ALL_ISSUES } from '../lib/issues';

export default function IssueBreakdown({ triggers, companyIssues, beliefProfile }) {
  if ((!triggers || triggers.length === 0) && !companyIssues) return null;

  let items = [];
  if (companyIssues && Object.keys(companyIssues).length > 0) {
    for (const [issueId, data] of Object.entries(companyIssues)) {
      const issueDef = ALL_ISSUES.find(i => i.id === issueId);
      const belief = beliefProfile?.[issueId];
      const trigger = triggers?.find(t => t.issueId === issueId);

      // Both on -5 to +5 scale
      const userStance = belief ? belief.stance : 0;
      const companyStance = typeof data.stance === 'number' ? data.stance : 0;
      const isDealBreaker = belief?.importance === 3;
      const importance = belief?.importance || 0;

      // Distance-based alignment per issue (0-100%)
      const gap = Math.abs(userStance - companyStance); // 0 to 10
      const alignmentPct = Math.round((1 - gap / 10) * 100); // 100% = perfect, 0% = opposite

      // Skip no-data stances for alignment display
      const companyConf = (data.confidence || '').toLowerCase();
      const hasData = !(companyStance === 0 && (companyConf === 'low' || companyConf === 'none' || !data.confidence));

      items.push({
        issueId,
        issueName: issueDef?.name || issueId.replace(/_/g, ' '),
        emoji: getCategoryEmoji(issueId),
        companyStance,
        userStance,
        alignmentPct,
        hasData,
        isDealBreaker,
        importance,
        confidence: data.confidence || 'low',
        notes: data.notes,
        type: trigger?.type || (hasData && belief && importance > 0
          ? (gap <= 2 ? 'aligned' : gap >= 7 ? 'misaligned' : 'neutral')
          : 'neutral'),
      });
    }

    // Sort: deal breakers first, then by importance desc, then by alignment
    items.sort((a, b) => {
      if (a.isDealBreaker !== b.isDealBreaker) return a.isDealBreaker ? -1 : 1;
      if (a.importance !== b.importance) return b.importance - a.importance;
      return b.alignmentPct - a.alignmentPct;
    });
  } else if (triggers && triggers.length > 0) {
    items = triggers.map(t => ({
      ...t,
      emoji: getCategoryEmoji(t.issueId),
      isDealBreaker: t.type === 'dealbreaker',
      importance: t.type === 'dealbreaker' ? 3 : 1,
      alignmentPct: t.gap != null ? Math.round((1 - t.gap / 10) * 100) : 50,
      hasData: true,
      confidence: 'medium',
    }));
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-2 mt-3">
      <p className="text-xs uppercase text-gray-400 font-semibold tracking-wide">
        📊 Issue-by-Issue Breakdown
      </p>
      <div className="space-y-1.5">
        {items.map((item, i) => (
          <IssueBar key={item.issueId || i} item={item} />
        ))}
      </div>
    </div>
  );
}

function IssueBar({ item }) {
  const { issueName, emoji, companyStance, userStance, alignmentPct, hasData, isDealBreaker, importance, confidence, notes, type } = item;

  // Bar width = alignment percentage
  const barWidth = Math.max(5, alignmentPct);

  // Color based on alignment percentage
  let barColor, bgColor, borderColor, textColor;
  if (isDealBreaker && type === 'dealbreaker') {
    barColor = 'bg-red-500';
    bgColor = 'bg-red-50';
    borderColor = 'border-red-300';
    textColor = 'text-red-800';
  } else if (alignmentPct >= 70) {
    barColor = 'bg-emerald-500';
    bgColor = 'bg-emerald-50/50';
    borderColor = 'border-emerald-200';
    textColor = 'text-emerald-800';
  } else if (alignmentPct >= 40) {
    barColor = 'bg-yellow-500';
    bgColor = 'bg-yellow-50/50';
    borderColor = 'border-yellow-200';
    textColor = 'text-yellow-800';
  } else {
    barColor = 'bg-orange-500';
    bgColor = 'bg-orange-50/50';
    borderColor = 'border-orange-200';
    textColor = 'text-orange-800';
  }

  if (!hasData) {
    barColor = 'bg-gray-300';
    bgColor = 'bg-gray-50/50';
    borderColor = 'border-gray-200';
    textColor = 'text-gray-500';
  }

  // Confidence indicator
  const confidenceDots = confidence === 'high' || confidence === 'HIGH' ? '●●●' : confidence === 'medium' || confidence === 'MEDIUM' ? '●●○' : '●○○';

  // Stance label using 5-0-5 scale
  const stanceLabel = (val) => {
    if (val >= 4) return 'Strongly supports';
    if (val >= 2) return 'Leans support';
    if (val <= -4) return 'Strongly opposes';
    if (val <= -2) return 'Leans oppose';
    return 'Neutral';
  };

  return (
    <div className={`rounded-lg border p-2.5 ${bgColor} ${borderColor}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm shrink-0">{emoji}</span>
          <span className={`text-xs font-semibold truncate ${textColor}`}>{issueName}</span>
          {isDealBreaker && (
            <span className="shrink-0 text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold leading-none">
              DEAL BREAKER
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-400 shrink-0 ml-1" title={`Confidence: ${confidence}`}>
          {confidenceDots}
        </span>
      </div>

      {/* Alignment bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Stance + alignment % */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-gray-500">
          {stanceLabel(companyStance)}
          {importance > 0 && hasData && ` · ${alignmentPct}% aligned`}
        </span>
        <span className={`text-[10px] font-medium ${
          type === 'aligned' ? 'text-emerald-600' : 
          type === 'misaligned' || type === 'dealbreaker' ? 'text-red-600' : 
          'text-gray-400'
        }`}>
          {type === 'aligned' ? '✓ Aligned' : type === 'misaligned' ? '✗ Misaligned' : type === 'dealbreaker' ? '🚫 Conflict' : hasData ? '' : 'No data'}
        </span>
      </div>

      {notes && (
        <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{notes}</p>
      )}
    </div>
  );
}

function getCategoryEmoji(issueId) {
  const map = {
    abortion: '🤰', lgbtq_rights: '🏳️‍🌈', racial_justice: '✊', immigration: '🌎',
    religious_liberty: '⛪', death_penalty: '⚖️', workers_rights: '👷', minimum_wage: '💵',
    corporate_tax: '🏢', free_trade: '🚢', climate_change: '🌡️', renewable_energy: '☀️',
    environmental_regulations: '🌲', animal_rights: '🐾', gun_control: '🔫',
    military_spending: '🎖️', police_reform: '👮', drug_policy: '💊',
    universal_healthcare: '🏥', education_funding: '📚', student_debt: '🎓',
    vaccine_policy: '💉',
  };
  return map[issueId] || '📌';
}
