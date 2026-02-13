import { ALL_ISSUES } from '../lib/issues';

export default function IssueBreakdown({ triggers, companyIssues, beliefProfile }) {
  if ((!triggers || triggers.length === 0) && !companyIssues) return null;

  // Build enriched issue list from companyIssues if available
  let items = [];
  if (companyIssues && Object.keys(companyIssues).length > 0) {
    for (const [issueId, data] of Object.entries(companyIssues)) {
      const issueDef = ALL_ISSUES.find(i => i.id === issueId);
      const belief = beliefProfile?.[issueId];
      const trigger = triggers?.find(t => t.issueId === issueId);

      const userStance = belief ? belief.stance / 2 : 0; // normalize -2..2 to -1..1
      const companyStance = data.stance;
      const isDealBreaker = belief?.importance === 3;
      const importance = belief?.importance || 0;

      // Agreement: positive = aligned, negative = misaligned
      const agreement = userStance !== 0 ? userStance * companyStance : 0;

      items.push({
        issueId,
        issueName: issueDef?.name || issueId.replace(/_/g, ' '),
        emoji: getCategoryEmoji(issueId),
        companyStance,
        userStance,
        agreement,
        isDealBreaker,
        importance,
        confidence: data.confidence || 'low',
        notes: data.notes,
        type: trigger?.type || (agreement > 0.2 ? 'aligned' : agreement < -0.2 ? 'misaligned' : 'neutral'),
      });
    }

    // Sort: deal breakers first, then by importance desc, then by |agreement| desc
    items.sort((a, b) => {
      if (a.isDealBreaker !== b.isDealBreaker) return a.isDealBreaker ? -1 : 1;
      if (a.importance !== b.importance) return b.importance - a.importance;
      return Math.abs(b.agreement) - Math.abs(a.agreement);
    });
  } else if (triggers && triggers.length > 0) {
    // Fallback to simple trigger display
    items = triggers.map(t => ({
      ...t,
      emoji: getCategoryEmoji(t.issueId),
      isDealBreaker: t.type === 'dealbreaker',
      importance: t.type === 'dealbreaker' ? 3 : 1,
      agreement: (t.userStance || 0) * (t.companyStance || 0),
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
  const { issueName, emoji, companyStance, agreement, isDealBreaker, confidence, notes, type } = item;

  // Bar width based on absolute stance magnitude
  const barWidth = Math.max(8, Math.abs(companyStance) * 100);

  // Color logic
  let barColor, bgColor, borderColor, textColor;
  if (isDealBreaker && type === 'dealbreaker') {
    barColor = 'bg-red-500';
    bgColor = 'bg-red-50';
    borderColor = 'border-red-300';
    textColor = 'text-red-800';
  } else if (type === 'aligned' || agreement > 0.2) {
    barColor = 'bg-emerald-500';
    bgColor = 'bg-emerald-50/50';
    borderColor = 'border-emerald-200';
    textColor = 'text-emerald-800';
  } else if (type === 'misaligned' || agreement < -0.2) {
    barColor = 'bg-orange-500';
    bgColor = 'bg-orange-50/50';
    borderColor = 'border-orange-200';
    textColor = 'text-orange-800';
  } else {
    // Neutral or no user stance — show political leaning
    barColor = companyStance > 0 ? 'bg-blue-500' : companyStance < 0 ? 'bg-red-400' : 'bg-gray-400';
    bgColor = 'bg-gray-50/50';
    borderColor = 'border-gray-200';
    textColor = 'text-gray-700';
  }

  // Confidence indicator
  const confidenceDots = confidence === 'high' ? '●●●' : confidence === 'medium' ? '●●○' : '●○○';

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

      {/* Horizontal bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>

      {/* Stance label + notes */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-gray-500">
          {companyStance > 0.5 ? 'Strongly supports' : companyStance > 0 ? 'Leans support' : companyStance < -0.5 ? 'Strongly opposes' : companyStance < 0 ? 'Leans oppose' : 'Neutral'}
        </span>
        <span className={`text-[10px] font-medium ${type === 'aligned' ? 'text-emerald-600' : type === 'misaligned' || type === 'dealbreaker' ? 'text-red-600' : 'text-gray-400'}`}>
          {type === 'aligned' ? '✓ Aligned' : type === 'misaligned' ? '✗ Misaligned' : type === 'dealbreaker' ? '🚫 Conflict' : ''}
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
