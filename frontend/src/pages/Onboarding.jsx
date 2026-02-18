import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ISSUE_CATEGORIES, STANCE_LABELS, IMPORTANCE_LEVELS, ALL_ISSUES } from '../lib/issues';
import { getBeliefProfile, saveBeliefProfile, setOnboardingComplete } from '../lib/prefs';
import { isAuthenticated, saveBeliefProfileToServer } from '../lib/api';

function ProgressBar({ current, total }) {
  const pct = Math.round(((current + 1) / total) * 100);
  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className="h-full bg-teal-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function StanceSlider({ value, onChange, leftLabel, rightLabel }) {
  const abs = Math.abs(value);
  const direction = value < 0 ? leftLabel : value > 0 ? rightLabel : '';
  const displayLabel = value === 0 ? '🤷 Neutral' : `${direction} (${abs}/5)`;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs font-semibold px-0.5">
        <span className="text-blue-600">← {leftLabel}</span>
        <span className="text-gray-400 text-[10px]">Neutral</span>
        <span className="text-red-600">{rightLabel} →</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-blue-400 w-4 text-right">5</span>
        <input
          type="range"
          min={-5} max={5} step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full accent-teal-600"
        />
        <span className="text-[10px] text-red-400 w-4">5</span>
      </div>
      <div className="text-center">
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${
          value === 0 ? 'bg-gray-100 text-gray-600' :
          value < 0 ? (abs >= 4 ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 text-blue-700') :
          (abs >= 4 ? 'bg-red-200 text-red-800' : 'bg-red-100 text-red-700')
        }`}>
          {displayLabel}
        </span>
      </div>
    </div>
  );
}

function ImportanceSelector({ value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {IMPORTANCE_LEVELS.map(level => (
        <button
          key={level.value}
          onClick={() => onChange(level.value)}
          className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${
            value === level.value
              ? level.bgClass + ' border-transparent scale-105'
              : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
          } ${level.value === 3 && value === 3 ? 'animate-pulse' : ''}`}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}

function IssueCard({ issue, belief, onUpdate }) {
  const stance = belief?.stance ?? 0;
  const importance = belief?.importance ?? 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-800 text-sm">{issue.name}</h4>
          <p className="text-xs text-gray-400 mt-0.5">{issue.description}</p>
        </div>
        <button
          onClick={() => onUpdate(issue.id, null)}
          className="text-xs text-gray-300 hover:text-gray-500 shrink-0 ml-2"
          title="Skip this issue"
        >
          Skip
        </button>
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-1 font-medium">Your stance</p>
        <StanceSlider value={stance} onChange={v => onUpdate(issue.id, { stance: v, importance })} leftLabel={issue.leftLabel || 'Oppose'} rightLabel={issue.rightLabel || 'Support'} />
      </div>

      <div>
        <p className="text-xs text-gray-500 mb-1.5 font-medium">How much do you care?</p>
        <ImportanceSelector value={importance} onChange={v => onUpdate(issue.id, { stance, importance: v })} />
      </div>
    </div>
  );
}

function WelcomeStep({ onNext }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
      <div className="text-6xl">🗳️</div>
      <h2 className="text-2xl font-bold text-teal-800">Let's figure out what matters to you</h2>
      <p className="text-gray-500 max-w-sm">
        We'll walk through a few topics so we can show you how companies align with <em>your</em> values.
      </p>
      <p className="text-sm text-gray-400">No judgment. Just clarity. ✨</p>
      <button
        onClick={onNext}
        className="mt-4 px-8 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors text-lg"
      >
        Let's Go →
      </button>
      <p className="text-xs text-gray-300">Takes about 2 minutes • Skip anything you want</p>
    </div>
  );
}

function CategoryStep({ category, profile, onUpdate, onNext, onBack, onFinishEarly, stepIndex, totalSteps }) {
  return (
    <div className="p-4 space-y-4">
      <ProgressBar current={stepIndex} total={totalSteps} />

      <div className="text-center py-2">
        <span className="text-3xl">{category.emoji}</span>
        <h3 className="text-lg font-bold text-teal-800 mt-1">{category.name}</h3>
        <p className="text-sm text-gray-400">{category.description}</p>
      </div>

      <div className="space-y-3">
        {category.issues.map(issue => (
          <IssueCard
            key={issue.id}
            issue={issue}
            belief={profile[issue.id]}
            onUpdate={onUpdate}
          />
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 pb-6">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">
          ← Back
        </button>
        <button
          onClick={onFinishEarly}
          className="text-xs text-gray-300 hover:text-gray-500 underline"
        >
          I'm done
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

function SummaryStep({ profile, onBack, onConfirm }) {
  const activeIssues = Object.entries(profile).filter(([_, v]) => v && v.importance > 0);
  const dealBreakers = activeIssues.filter(([_, v]) => v.importance === 3);

  return (
    <div className="p-4 space-y-4">
      <div className="text-center py-4">
        <span className="text-4xl">✅</span>
        <h3 className="text-xl font-bold text-teal-800 mt-2">Your Values Profile</h3>
        <p className="text-sm text-gray-400 mt-1">
          {activeIssues.length} issues configured
          {dealBreakers.length > 0 && ` • ${dealBreakers.length} deal breaker${dealBreakers.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {activeIssues.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No issues configured yet.</p>
          <p className="text-sm mt-1">Go back and set at least a few to get personalized results.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ISSUE_CATEGORIES.map(cat => {
            const catIssues = cat.issues
              .filter(i => profile[i.id]?.importance > 0)
              .map(i => ({ ...i, belief: profile[i.id] }));
            if (!catIssues.length) return null;
            return (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm p-3">
                <p className="text-xs font-semibold text-gray-400 uppercase">{cat.emoji} {cat.name}</p>
                <div className="mt-1.5 space-y-1">
                  {catIssues.map(i => {
                    const stanceLabel = STANCE_LABELS.find(s => s.value === i.belief.stance)?.label || 'Neutral';
                    const impLevel = IMPORTANCE_LEVELS.find(l => l.value === i.belief.importance);
                    return (
                      <div key={i.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-700">{i.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{stanceLabel}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${impLevel?.bgClass || ''}`}>
                            {impLevel?.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex justify-between items-center pt-4 pb-6">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-gray-600">
          ← Edit
        </button>
        <button
          onClick={onConfirm}
          className="px-8 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors text-lg"
        >
          Looks Good! ✨
        </button>
      </div>
    </div>
  );
}

export default function Onboarding({ onComplete, initialProfile }) {
  const navigate = useNavigate();
  // Steps: 0=welcome, 1..N=categories, N+1=summary
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(initialProfile || getBeliefProfile());

  const totalSteps = ISSUE_CATEGORIES.length + 2; // welcome + categories + summary

  const updateIssue = useCallback((issueId, value) => {
    setProfile(prev => {
      const next = { ...prev };
      if (value === null) {
        delete next[issueId];
      } else {
        next[issueId] = value;
      }
      return next;
    });
  }, []);

  const finish = () => {
    saveBeliefProfile(profile);
    setOnboardingComplete();
    // Sync to server if authenticated
    if (isAuthenticated()) {
      saveBeliefProfileToServer(profile);
    }
    if (onComplete) {
      onComplete(profile);
    } else {
      navigate('/');
    }
  };

  const goToSummary = () => setStep(ISSUE_CATEGORIES.length + 1);

  if (step === 0) {
    return <WelcomeStep onNext={() => setStep(1)} />;
  }

  if (step > ISSUE_CATEGORIES.length) {
    return <SummaryStep profile={profile} onBack={() => setStep(step - 1)} onConfirm={finish} />;
  }

  const category = ISSUE_CATEGORIES[step - 1];
  return (
    <CategoryStep
      category={category}
      profile={profile}
      onUpdate={updateIssue}
      onNext={() => setStep(step + 1)}
      onBack={() => setStep(step - 1)}
      onFinishEarly={goToSummary}
      stepIndex={step}
      totalSteps={totalSteps}
    />
  );
}
