import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ISSUE_CATEGORIES } from '../lib/issues';
import { getBeliefProfile, saveBeliefProfile, setOnboardingComplete } from '../lib/prefs';
import { isAuthenticated, saveBeliefProfileToServer } from '../lib/api';
import { Ban, Check } from 'lucide-react';

/*
  SIMPLIFIED ONBOARDING: 2 steps
  Step 1: "What issues matter to you?" — tap issues, mark deal breakers inline
  Step 2: Done → start scanning
  + Skip option at every step
*/

function IssuePickStep({ selected, dealBreakers, onToggle, onToggleDealBreaker, onNext, onSkip }) {
  const allIssues = ISSUE_CATEGORIES.flatMap(cat =>
    cat.issues.map(i => ({ ...i, catEmoji: cat.emoji, catName: cat.name }))
  );

  return (
    <div className="min-h-screen bg-dark-bg p-4 space-y-6 animate-slideUp">
      <div className="text-center pt-8 pb-4 space-y-3">
        <div className="text-6xl mb-4">🗳️</div>
        <h2 className="text-3xl font-black tracking-tight leading-tight">
          What issues<br />
          <span className="text-gradient">matter to you?</span>
        </h2>
        <p className="text-sm text-dark-text-secondary max-w-xs mx-auto">
          Tap to select. Long-press for deal breakers.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {allIssues.map(issue => {
          const isSelected = selected.includes(issue.id);
          const isDealBreaker = dealBreakers.includes(issue.id);
          return (
            <button
              key={issue.id}
              onClick={() => onToggle(issue.id)}
              onDoubleClick={(e) => {
                e.preventDefault();
                if (!isSelected) onToggle(issue.id);
                onToggleDealBreaker(issue.id);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!isSelected) onToggle(issue.id);
                onToggleDealBreaker(issue.id);
              }}
              className={`text-left p-4 rounded-2xl border-2 transition-all active:scale-95 ${
                isDealBreaker
                  ? 'border-danger/50 bg-danger/10 shadow-xl shadow-danger/20 glow-red'
                  : isSelected
                    ? 'border-aligned/50 bg-aligned/10 shadow-xl shadow-aligned/20 glow-green'
                    : 'border-dark-border glass-card hover:border-dark-border hover:bg-white/10'
              }`}
            >
              <div className="flex items-start gap-2.5 mb-2">
                <span className={`text-xl transition-all ${
                  (isSelected || isDealBreaker) ? 'scale-110' : 'opacity-50 grayscale'
                }`}>
                  {issue.catEmoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-bold leading-tight transition-colors ${
                    isDealBreaker ? 'text-danger' : isSelected ? 'text-aligned' : 'text-dark-text-secondary'
                  }`}>
                    {issue.name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2">
                {isDealBreaker ? (
                  <span className="inline-flex items-center gap-1 text-[9px] px-2 py-1 bg-danger text-white rounded-full font-black uppercase tracking-wide">
                    <Ban size={10} />
                    Deal Breaker
                  </span>
                ) : isSelected ? (
                  <div className="flex items-center gap-1 text-aligned text-xs font-bold">
                    <Check size={14} strokeWidth={3} />
                    Selected
                  </div>
                ) : (
                  <span className="text-[10px] text-dark-text-muted">Tap to select</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="text-center text-xs text-dark-text-muted font-medium py-2">
        {selected.length === 0 ? (
          'Tap at least one to continue'
        ) : (
          <>
            {selected.length} selected
            {dealBreakers.length > 0 && (
              <span className="text-danger ml-2">
                · {dealBreakers.length} deal breaker{dealBreakers.length > 1 ? 's' : ''}
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 pt-2 pb-safe sticky bottom-4">
        <button
          onClick={onNext}
          disabled={selected.length === 0}
          className="w-full py-4 bg-gradient-to-r from-aligned to-aligned/80 text-white rounded-full font-bold hover:shadow-2xl hover:shadow-aligned/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-base active:scale-95"
        >
          Done — Start Scanning →
        </button>
        <button
          onClick={onSkip}
          className="w-full py-3 text-sm text-dark-text-muted hover:text-dark-text transition-colors font-medium"
        >
          Skip — show me everything
        </button>
      </div>
    </div>
  );
}


export default function Onboarding() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);
  const [dealBreakers, setDealBreakers] = useState([]);

  const handleToggle = useCallback((issueId) => {
    setSelected(prev =>
      prev.includes(issueId) ? prev.filter(id => id !== issueId) : [...prev, issueId]
    );
  }, []);

  const handleToggleDealBreaker = useCallback((issueId) => {
    setDealBreakers(prev =>
      prev.includes(issueId) ? prev.filter(id => id !== issueId) : [...prev, issueId]
    );
    setSelected(prev =>
      prev.includes(issueId) ? prev : [...prev, issueId]
    );
  }, []);

  const finish = () => {
    const profile = {};
    selected.forEach(issueId => {
      profile[issueId] = {
        stance: 0,
        importance: dealBreakers.includes(issueId) ? 3 : 1,
        is_deal_breaker: dealBreakers.includes(issueId),
      };
    });
    saveBeliefProfile(profile);
    setOnboardingComplete();
    if (isAuthenticated()) {
      saveBeliefProfileToServer(profile);
    }
    navigate('/');
  };

  const skip = () => {
    setOnboardingComplete();
    navigate('/');
  };

  return (
    <IssuePickStep
      selected={selected}
      dealBreakers={dealBreakers}
      onToggle={handleToggle}
      onToggleDealBreaker={handleToggleDealBreaker}
      onNext={finish}
      onSkip={skip}
    />
  );
}
