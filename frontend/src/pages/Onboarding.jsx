import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ISSUE_CATEGORIES } from '../lib/issues';
import { getBeliefProfile, saveBeliefProfile, setOnboardingComplete } from '../lib/prefs';
import { isAuthenticated, saveBeliefProfileToServer } from '../lib/api';

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
    <div className="min-h-screen bg-gray-50 p-4 space-y-4">
      <div className="text-center pt-6 pb-2">
        <div className="text-5xl mb-3">🗳️</div>
        <h2 className="text-2xl font-extrabold text-gray-900">What issues matter to you?</h2>
        <p className="text-sm text-gray-500 mt-2">
          Tap to select. Long-press or double-tap for deal breakers.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
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
              className={`text-left p-3 rounded-xl border-2 transition-all active:scale-95 ${
                isDealBreaker
                  ? 'border-red-400 bg-red-50 shadow-md'
                  : isSelected
                    ? 'border-teal-500 bg-teal-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`text-lg ${isSelected || isDealBreaker ? '' : 'grayscale opacity-50'}`}>{issue.catEmoji}</span>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-semibold leading-tight ${
                    isDealBreaker ? 'text-red-700' : isSelected ? 'text-teal-800' : 'text-gray-600'
                  }`}>
                    {issue.name}
                  </p>
                </div>
              </div>
              {isDealBreaker && (
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-red-500 text-white rounded-full font-bold">DEAL BREAKER</span>
              )}
              {isSelected && !isDealBreaker && (
                <div className="mt-1 text-right">
                  <span className="text-teal-600 text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-center text-xs text-gray-400">
        {selected.length === 0 ? 'Tap at least one to continue' : `${selected.length} selected${dealBreakers.length > 0 ? ` · ${dealBreakers.length} deal breaker${dealBreakers.length > 1 ? 's' : ''}` : ''}`}
      </div>

      <div className="flex flex-col gap-3 pt-2 pb-6">
        <button
          onClick={onNext}
          disabled={selected.length === 0}
          className="w-full py-3.5 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 active:bg-teal-800 transition-colors disabled:opacity-40 text-base shadow-lg"
        >
          Done — Start Scanning →
        </button>
        <button
          onClick={onSkip}
          className="w-full py-3 text-sm text-gray-400 hover:text-gray-600 active:text-gray-800 transition-colors"
        >
          Skip — show me everything
        </button>
      </div>
    </div>
  );
}

export default function Onboarding({ onComplete, initialProfile }) {
  const navigate = useNavigate();
  const [selectedIssues, setSelectedIssues] = useState(() => {
    const existing = initialProfile || getBeliefProfile();
    return Object.keys(existing).filter(k => existing[k]?.importance > 0);
  });
  const [dealBreakers, setDealBreakers] = useState(() => {
    const existing = initialProfile || getBeliefProfile();
    return Object.keys(existing).filter(k => existing[k]?.importance === 3);
  });

  const toggleIssue = useCallback((id) => {
    setSelectedIssues(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      // Also remove from deal breakers if deselected
      if (prev.includes(id)) {
        setDealBreakers(db => db.filter(x => x !== id));
      }
      return next;
    });
  }, []);

  const toggleDealBreaker = useCallback((id) => {
    setDealBreakers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const finish = (skipAll = false) => {
    const profile = {};
    if (!skipAll) {
      selectedIssues.forEach(id => {
        const isDealBreaker = dealBreakers.includes(id);
        profile[id] = {
          stance: 0,
          importance: isDealBreaker ? 3 : 2,
          is_deal_breaker: isDealBreaker,
        };
      });
    }

    saveBeliefProfile(profile);
    setOnboardingComplete();
    if (isAuthenticated()) {
      saveBeliefProfileToServer(profile);
    }
    if (onComplete) {
      onComplete(profile);
    } else {
      navigate('/');
    }
  };

  return (
    <IssuePickStep
      selected={selectedIssues}
      dealBreakers={dealBreakers}
      onToggle={toggleIssue}
      onToggleDealBreaker={toggleDealBreaker}
      onNext={() => finish(false)}
      onSkip={() => finish(true)}
    />
  );
}
