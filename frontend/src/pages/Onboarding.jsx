import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ISSUE_CATEGORIES, IMPORTANCE_LEVELS } from '../lib/issues';
import { getBeliefProfile, saveBeliefProfile, setOnboardingComplete } from '../lib/prefs';
import { isAuthenticated, saveBeliefProfileToServer } from '../lib/api';

/*
  NEW ONBOARDING FLOW:
  Step 1: Welcome — what DollarVote does
  Step 2: Quick Pick — tap the 3-5 issues you care MOST about (no sliders, just tap)
  Step 3: Deal Breakers — which of those are absolute deal breakers?
  Step 4: Done — start scanning, with nudge to set granular preferences later
*/

function WelcomeStep({ onNext }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 space-y-6">
      <div className="text-6xl">🗳️</div>
      <h2 className="text-2xl font-bold text-teal-800">Every Dollar Is a Vote</h2>
      <p className="text-gray-500 max-w-sm leading-relaxed">
        When you buy something, your money supports that company's values — their lobbying, their donations, their politics.
      </p>
      <p className="text-gray-500 max-w-sm leading-relaxed">
        <strong>DollarVote</strong> shows you where the money goes and helps you shop aligned with <em>your</em> values.
      </p>
      <button
        onClick={onNext}
        className="mt-4 px-8 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors text-lg shadow-lg"
      >
        Get Started →
      </button>
      <p className="text-xs text-gray-300">30 seconds • No judgment</p>
    </div>
  );
}

function QuickPickStep({ selected, onToggle, onNext, onBack }) {
  const allIssues = ISSUE_CATEGORIES.flatMap(cat =>
    cat.issues.map(i => ({ ...i, catEmoji: cat.emoji, catName: cat.name }))
  );

  return (
    <div className="p-4 space-y-4">
      <div className="text-center py-2">
        <h3 className="text-lg font-bold text-teal-800">What matters to you?</h3>
        <p className="text-sm text-gray-400">Tap the issues you care about. Pick as many or as few as you want.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {allIssues.map(issue => {
          const isSelected = selected.includes(issue.id);
          return (
            <button
              key={issue.id}
              onClick={() => onToggle(issue.id)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                isSelected
                  ? 'border-teal-500 bg-teal-50 shadow-md scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className={`text-lg ${isSelected ? '' : 'grayscale opacity-50'}`}>{issue.catEmoji}</span>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold leading-tight ${isSelected ? 'text-teal-800' : 'text-gray-600'}`}>
                    {issue.name}
                  </p>
                </div>
              </div>
              {isSelected && (
                <div className="mt-1 text-right">
                  <span className="text-teal-600 text-xs font-bold">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="text-center text-xs text-gray-400">
        {selected.length === 0 ? 'Tap at least one to continue' : `${selected.length} selected`}
      </div>

      <div className="flex justify-between items-center pt-4 pb-6">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
        <button
          onClick={onNext}
          disabled={selected.length === 0}
          className="px-6 py-2 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function DealBreakerStep({ selectedIssues, dealBreakers, onToggle, onNext, onBack }) {
  const allIssues = ISSUE_CATEGORIES.flatMap(cat => cat.issues);
  const myIssues = allIssues.filter(i => selectedIssues.includes(i.id));

  return (
    <div className="p-4 space-y-4">
      <div className="text-center py-2">
        <span className="text-4xl">🚫</span>
        <h3 className="text-lg font-bold text-teal-800 mt-2">Any deal breakers?</h3>
        <p className="text-sm text-gray-400">
          If a company is on the wrong side of a deal breaker, we'll <strong>always warn you</strong> — no matter what.
        </p>
      </div>

      <div className="space-y-2">
        {myIssues.map(issue => {
          const isDealBreaker = dealBreakers.includes(issue.id);
          return (
            <button
              key={issue.id}
              onClick={() => onToggle(issue.id)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                isDealBreaker
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${isDealBreaker ? 'text-red-700' : 'text-gray-700'}`}>
                  {issue.name}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  isDealBreaker ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {isDealBreaker ? '🚫 DEAL BREAKER' : 'Important'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <p className="text-xs text-gray-300 text-center">
        Deal breakers are optional. You can always change these later.
      </p>

      <div className="flex justify-between items-center pt-4 pb-6">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">← Back</button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
        >
          {dealBreakers.length > 0 ? "I'm Set →" : "Skip for Now →"}
        </button>
      </div>
    </div>
  );
}

function DoneStep({ issueCount, dealBreakerCount, onFinish }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
      <div className="text-6xl">🎉</div>
      <h2 className="text-2xl font-bold text-teal-800">You're all set!</h2>

      <div className="bg-white rounded-2xl shadow-lg p-5 space-y-2 max-w-xs w-full">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">Issues tracked</span>
          <span className="text-lg font-bold text-teal-700">{issueCount}</span>
        </div>
        {dealBreakerCount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Deal breakers</span>
            <span className="text-lg font-bold text-red-500">{dealBreakerCount}</span>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 max-w-sm">
        Start scanning products to see how they align with your values.
        We'll track your purchases and show you where your money really goes.
      </p>

      <button
        onClick={onFinish}
        className="mt-4 px-8 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors text-lg shadow-lg"
      >
        Start Scanning 📸
      </button>

      <p className="text-xs text-gray-300">
        💡 You can fine-tune your stances and add more detail in Settings anytime.
      </p>
    </div>
  );
}

export default function Onboarding({ onComplete, initialProfile }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [selectedIssues, setSelectedIssues] = useState(() => {
    // Pre-select from existing profile
    const existing = initialProfile || getBeliefProfile();
    return Object.keys(existing).filter(k => existing[k]?.importance > 0);
  });
  const [dealBreakers, setDealBreakers] = useState(() => {
    const existing = initialProfile || getBeliefProfile();
    return Object.keys(existing).filter(k => existing[k]?.importance === 3);
  });

  const toggleIssue = useCallback((id) => {
    setSelectedIssues(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    // Also remove from deal breakers if deselected
    setDealBreakers(prev => prev.filter(x => x !== id || selectedIssues.includes(id)));
  }, [selectedIssues]);

  const toggleDealBreaker = useCallback((id) => {
    setDealBreakers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const finish = () => {
    // Build profile: selected issues get importance 2 ("Very Important"),
    // deal breakers get importance 3, stance defaults to 0 (neutral — they can refine later)
    const profile = {};
    selectedIssues.forEach(id => {
      const isDealBreaker = dealBreakers.includes(id);
      profile[id] = {
        stance: 0, // neutral by default, they refine in settings
        importance: isDealBreaker ? 3 : 2,
        is_deal_breaker: isDealBreaker,
      };
    });

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

  switch (step) {
    case 0:
      return <WelcomeStep onNext={() => setStep(1)} />;
    case 1:
      return (
        <QuickPickStep
          selected={selectedIssues}
          onToggle={toggleIssue}
          onNext={() => selectedIssues.length > 0 && setStep(2)}
          onBack={() => setStep(0)}
        />
      );
    case 2:
      return (
        <DealBreakerStep
          selectedIssues={selectedIssues}
          dealBreakers={dealBreakers}
          onToggle={toggleDealBreaker}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      );
    case 3:
      return (
        <DoneStep
          issueCount={selectedIssues.length}
          dealBreakerCount={dealBreakers.length}
          onFinish={finish}
        />
      );
    default:
      return <WelcomeStep onNext={() => setStep(1)} />;
  }
}
