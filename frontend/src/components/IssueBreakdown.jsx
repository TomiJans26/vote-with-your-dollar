import { ALL_ISSUES } from '../lib/issues';
import { ExternalLink } from 'lucide-react';

export default function IssueBreakdown({ triggers, companyIssues, beliefProfile }) {
  if ((!triggers || triggers.length === 0) && !companyIssues) return null;

  let items = [];
  if (companyIssues && Object.keys(companyIssues).length > 0) {
    for (const [issueId, data] of Object.entries(companyIssues)) {
      const issueDef = ALL_ISSUES.find(i => i.id === issueId);
      const belief = beliefProfile?.[issueId];
      const trigger = triggers?.find(t => t.issueId === issueId);

      // User stances on -10 to +10 scale, company stances -1.0 to 1.0 (scaled to -10..+10)
      const userStance = belief ? belief.stance : 0;
      let companyStance = typeof data.stance === 'number' ? data.stance : 0;
      // Scale company stance from -1..1 to -10..10
      if (companyStance >= -1 && companyStance <= 1) {
        companyStance = companyStance * 10;
      }
      const isDealBreaker = belief?.importance === 3 || belief?.is_deal_breaker;
      const importance = belief?.importance || 0;

      // Distance-based alignment per issue (0-100%)
      const gap = Math.abs(userStance - companyStance); // 0 to 20
      const alignmentPct = Math.round((1 - gap / 20) * 100); // 100% = perfect, 0% = opposite

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
        sourceUrl: data.source_url || data.sourceUrl,
        type: trigger?.type || (hasData && belief && importance > 0
          ? (gap <= 4 ? 'aligned' : gap >= 14 ? 'misaligned' : 'neutral')
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
      alignmentPct: t.gap != null ? Math.round((1 - t.gap / 20) * 100) : 50,
      hasData: true,
      confidence: 'medium',
    }));
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-3 mt-4">
      <p className="text-xs uppercase text-dark-text-muted font-bold tracking-wider px-1">
        Issue Breakdown
      </p>
      <div className="space-y-2">
        {items.map((item, i) => (
          <IssueBar key={item.issueId || i} item={item} />
        ))}
      </div>
      <p className="text-[10px] text-dark-text-muted italic pt-2 px-1">
        Scores based on publicly available records. Tap sources to verify.
      </p>
    </div>
  );
}

function IssueBar({ item }) {
  const { issueName, emoji, companyStance, userStance, alignmentPct, hasData, isDealBreaker, importance, confidence, notes, sourceUrl, type } = item;

  // Bar width = alignment percentage
  const barWidth = Math.max(5, alignmentPct);

  // Color based on alignment percentage - GRADIENTS
  let barColor, bgColor, borderColor, textColor, shadowColor;
  if (isDealBreaker && type === 'dealbreaker') {
    barColor = 'bg-gradient-to-r from-danger to-danger/80';
    bgColor = 'bg-gradient-to-br from-danger/15 to-danger/5';
    borderColor = 'border-danger/40';
    textColor = 'text-danger';
    shadowColor = 'rgba(255, 0, 110, 0.4)';
  } else if (alignmentPct >= 70) {
    barColor = 'bg-gradient-to-r from-accent-cyan via-aligned to-accent-cyan';
    bgColor = 'bg-gradient-to-br from-accent-cyan/10 to-aligned/5';
    borderColor = 'border-accent-cyan/30';
    textColor = 'text-accent-cyan';
    shadowColor = 'rgba(0, 245, 212, 0.4)';
  } else if (alignmentPct >= 40) {
    barColor = 'bg-gradient-to-r from-warning to-warning/80';
    bgColor = 'bg-gradient-to-br from-warning/10 to-warning/5';
    borderColor = 'border-warning/30';
    textColor = 'text-warning';
    shadowColor = 'rgba(255, 209, 102, 0.4)';
  } else {
    barColor = 'bg-gradient-to-r from-danger to-danger/80';
    bgColor = 'bg-gradient-to-br from-danger/10 to-danger/5';
    borderColor = 'border-danger/30';
    textColor = 'text-danger';
    shadowColor = 'rgba(255, 0, 110, 0.4)';
  }

  if (!hasData) {
    barColor = 'bg-white/20';
    bgColor = 'bg-white/5';
    borderColor = 'border-dark-border';
    textColor = 'text-dark-text-secondary';
    shadowColor = 'transparent';
  }

  // Confidence indicator
  const confidenceDots = confidence === 'high' || confidence === 'HIGH' ? '●●●' : confidence === 'medium' || confidence === 'MEDIUM' ? '●●○' : '●○○';

  // Stance label using 10-0-10 scale
  const stanceLabel = (val) => {
    if (val >= 8) return 'Strongly supports';
    if (val >= 4) return 'Leans support';
    if (val <= -8) return 'Strongly opposes';
    if (val <= -4) return 'Leans oppose';
    return 'Neutral';
  };

  return (
    <div className={`glass-card rounded-3xl border-2 p-4 ${bgColor} ${borderColor} transition-all hover:bg-white/10 hover:shadow-xl`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-xl shrink-0">{emoji}</span>
          <span className={`text-base font-black truncate ${textColor}`}>{issueName}</span>
          {isDealBreaker && (
            <span className="shrink-0 text-[9px] bg-gradient-to-r from-danger to-danger/80 text-white px-2.5 py-1 rounded-full font-black leading-none uppercase tracking-wider shadow-lg shadow-danger/30">
              🔥 Deal Breaker
            </span>
          )}
        </div>
        <span className="text-[10px] text-dark-text-muted shrink-0 ml-2 font-bold" title={`Confidence: ${confidence}`}>
          {confidenceDots}
        </span>
      </div>

      {/* Alignment bar with GRADIENT & GLOW */}
      <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden backdrop-blur-sm">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ 
            width: `${barWidth}%`,
            boxShadow: hasData ? `0 0 12px ${shadowColor}, 0 0 24px ${shadowColor}` : 'none'
          }}
        />
      </div>

      {/* Stance + alignment % */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-dark-text-secondary font-medium">
          {stanceLabel(companyStance)}
          {importance > 0 && hasData && ` · ${alignmentPct}% aligned`}
        </span>
        <span className={`text-[11px] font-bold ${
          type === 'aligned' ? 'text-aligned' : 
          type === 'misaligned' || type === 'dealbreaker' ? 'text-danger' : 
          'text-dark-text-muted'
        }`}>
          {type === 'aligned' ? '✓ Aligned' : type === 'misaligned' ? '✗ Misaligned' : type === 'dealbreaker' ? '🚫 Conflict' : hasData ? '' : 'No data'}
        </span>
      </div>

      {notes && (
        <p className="text-[11px] text-dark-text-secondary mt-2 leading-relaxed border-t border-dark-border-subtle pt-2">
          {notes}
        </p>
      )}
      {sourceUrl && (
        <div className="mt-2 pt-2 border-t border-dark-border-subtle">
          <a 
            href={sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[11px] text-aligned hover:text-aligned/80 font-medium inline-flex items-center gap-1.5 hover:gap-2 transition-all group"
          >
            <ExternalLink size={12} className="group-hover:scale-110 transition-transform" />
            View Source
          </a>
        </div>
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
