import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getBeliefProfile, getProfileSummary, saveBeliefProfile, setOnboardingComplete } from '../lib/prefs';
import { ISSUE_CATEGORIES, STANCE_LABELS, IMPORTANCE_LEVELS, ALL_ISSUES } from '../lib/issues';
import { useAuth } from '../App';
import { logout as apiLogout, deleteAccount, isAuthenticated, saveBeliefProfileToServer } from '../lib/api';

function StanceSlider({ value, onChange, leftLabel, rightLabel }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-semibold px-0.5">
        <span className="text-blue-500">← {leftLabel}</span>
        <span className="text-red-500">{rightLabel} →</span>
      </div>
      <input
        type="range" min={-5} max={5} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-teal-600"
      />
      <div className="text-center">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          value === 0 ? 'bg-gray-100 text-gray-500' :
          value < 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
        }`}>
          {STANCE_LABELS.find(s => s.value === value)?.label || 'Neutral'}
        </span>
      </div>
    </div>
  );
}

function GranularEditor({ profile, onUpdate, onSave }) {
  return (
    <div className="space-y-4">
      <div className="text-center py-2">
        <h3 className="text-lg font-bold text-teal-800">🎯 Fine-Tune Your Values</h3>
        <p className="text-xs text-gray-400">Set exactly where you stand on each issue</p>
      </div>

      {ISSUE_CATEGORIES.map(cat => (
        <div key={cat.id} className="space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase px-1">{cat.emoji} {cat.name}</p>
          {cat.issues.map(issue => {
            const belief = profile[issue.id] || { stance: 0, importance: 0 };
            const isActive = belief.importance > 0;
            const isDealBreaker = belief.importance === 3;

            return (
              <div
                key={issue.id}
                className={`bg-white rounded-xl shadow-sm p-3 space-y-2 border-l-4 ${
                  isDealBreaker ? 'border-red-500' : isActive ? 'border-teal-500' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <p className="text-sm font-medium text-gray-700">{issue.name}</p>
                  <div className="flex gap-1 shrink-0 ml-2">
                    {IMPORTANCE_LEVELS.map(level => (
                      <button
                        key={level.value}
                        onClick={() => onUpdate(issue.id, { ...belief, importance: level.value })}
                        className={`text-[9px] px-1.5 py-0.5 rounded-full transition-all ${
                          belief.importance === level.value
                            ? level.bgClass + ' scale-105'
                            : 'bg-gray-50 text-gray-300 hover:bg-gray-100'
                        }`}
                        title={level.label}
                      >
                        {level.value === 3 ? '🚫' : level.value === 0 ? '—' : level.value}
                      </button>
                    ))}
                  </div>
                </div>

                {isActive && (
                  <StanceSlider
                    value={belief.stance}
                    onChange={v => onUpdate(issue.id, { ...belief, stance: v })}
                    leftLabel={issue.leftLabel || 'Oppose'}
                    rightLabel={issue.rightLabel || 'Support'}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="text-center pt-4 pb-6">
        <button
          onClick={onSave}
          className="px-8 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors shadow-lg"
        >
          Save Preferences ✓
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();
  const [profile, setProfile] = useState(getBeliefProfile);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saved, setSaved] = useState(false);
  const summary = getProfileSummary(profile);

  const doLogout = () => {
    apiLogout();
    handleLogout();
    navigate('/');
  };

  const doDelete = async () => {
    try {
      await deleteAccount();
      handleLogout();
      navigate('/');
    } catch (err) {
      alert(err.message);
    }
  };

  const updateIssue = useCallback((issueId, value) => {
    setProfile(prev => ({ ...prev, [issueId]: value }));
  }, []);

  const saveProfile = () => {
    saveBeliefProfile(profile);
    setOnboardingComplete();
    if (isAuthenticated()) {
      saveBeliefProfileToServer(profile);
    }
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (editing) {
    return (
      <div className="p-4">
        <button
          onClick={() => setEditing(false)}
          className="text-sm text-gray-400 hover:text-gray-600 mb-2"
        >
          ← Back to Settings
        </button>
        <GranularEditor profile={profile} onUpdate={updateIssue} onSave={saveProfile} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      <div className="text-center pt-2">
        <h2 className="text-xl font-bold text-teal-800">Settings</h2>
      </div>

      {saved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center text-sm text-emerald-700 font-medium">
          ✅ Preferences saved!
        </div>
      )}

      {/* Account section */}
      {user ? (
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
          <p className="text-xs font-semibold text-gray-400 uppercase">Account</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-700">👤 <span className="font-medium">{user.username}</span></p>
            <p className="text-sm text-gray-500">✉️ {user.email}</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={doLogout}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Sign Out
            </button>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm text-red-400 hover:text-red-600 transition-colors"
              >
                Delete Account
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-500">Are you sure?</span>
                <button onClick={doDelete} className="px-3 py-1 text-xs bg-red-500 text-white rounded-lg">Yes, delete</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1 text-xs bg-gray-200 text-gray-600 rounded-lg">Cancel</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-5 text-center space-y-3">
          <p className="text-sm text-gray-500">Sign in to sync across devices and get report cards</p>
          <div className="flex justify-center gap-3">
            <Link to="/login" className="px-5 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors">Sign In</Link>
            <Link to="/register" className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Sign Up</Link>
          </div>
        </div>
      )}

      {/* Values overview */}
      <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
        <div className="flex justify-between items-center">
          <p className="text-xs font-semibold text-gray-400 uppercase">Your Values</p>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-teal-600 font-semibold hover:text-teal-700"
          >
            Edit →
          </button>
        </div>

        {summary.total > 0 ? (
          <>
            <div className="flex gap-4">
              <div>
                <p className="text-2xl font-bold text-teal-700">{summary.total}</p>
                <p className="text-[10px] text-gray-400">Issues tracked</p>
              </div>
              {summary.dealBreakers > 0 && (
                <div>
                  <p className="text-2xl font-bold text-red-500">{summary.dealBreakers}</p>
                  <p className="text-[10px] text-gray-400">Deal breakers</p>
                </div>
              )}
            </div>

            {/* Deal breakers highlighted */}
            {summary.dealBreakers > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 space-y-1">
                <p className="text-[10px] text-red-600 uppercase font-bold">🚫 Hard Stops</p>
                {ISSUE_CATEGORIES.flatMap(cat => cat.issues)
                  .filter(i => profile[i.id]?.importance === 3)
                  .map(issue => (
                    <p key={issue.id} className="text-xs text-red-700 font-medium">{issue.name}</p>
                  ))
                }
                <p className="text-[10px] text-red-400 mt-1">
                  We'll always warn you when a company conflicts with these.
                </p>
              </div>
            )}

            {/* Quick issue list */}
            <div className="space-y-1">
              {ISSUE_CATEGORIES.map(cat => {
                const active = cat.issues.filter(i => profile[i.id]?.importance > 0);
                if (!active.length) return null;
                return (
                  <div key={cat.id} className="flex items-center gap-2 text-sm py-0.5">
                    <span className="text-xs">{cat.emoji}</span>
                    <span className="text-gray-600 text-xs">{cat.name}</span>
                    <span className="text-[10px] text-gray-300 ml-auto">{active.length}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-400">No values set up yet</p>
            <button
              onClick={() => setEditing(true)}
              className="mt-2 px-5 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors"
            >
              Set Up Now
            </button>
          </div>
        )}
      </div>

      {/* Granular preferences nudge */}
      {summary.total > 0 && !Object.values(profile).some(v => v?.stance !== 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          <div className="flex-1">
            <p className="text-xs text-blue-700 font-medium">Get more precise scores</p>
            <p className="text-[10px] text-blue-500">
              Set your stance on each issue (not just which ones matter).
              This helps us find better alternatives for you.
            </p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 font-bold shrink-0"
          >
            Tune →
          </button>
        </div>
      )}

      {/* Links */}
      <div className="space-y-2">
        <Link to="/about" className="block bg-white rounded-xl shadow-sm p-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          ℹ️ About DollarVote
        </Link>
        <Link to="/terms" className="block bg-white rounded-xl shadow-sm p-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          📜 Terms of Service
        </Link>
        <Link to="/privacy" className="block bg-white rounded-xl shadow-sm p-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          🔒 Privacy Policy
        </Link>
      </div>

      {/* Reset */}
      {summary.total > 0 && (
        <div className="text-center pt-2 pb-4">
          <button
            onClick={() => {
              if (confirm('Reset all values? This cannot be undone.')) {
                saveBeliefProfile({});
                setProfile({});
                if (isAuthenticated()) saveBeliefProfileToServer({});
              }
            }}
            className="text-xs text-gray-300 underline hover:text-gray-500"
          >
            Reset all values
          </button>
        </div>
      )}
    </div>
  );
}
