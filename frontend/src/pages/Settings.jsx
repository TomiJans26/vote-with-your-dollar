import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getBeliefProfile, getProfileSummary, saveBeliefProfile, setOnboardingComplete } from '../lib/prefs';
import { ISSUE_CATEGORIES, STANCE_LABELS, IMPORTANCE_LEVELS, ALL_ISSUES } from '../lib/issues';
import { useAuth } from '../App';
import { logout as apiLogout, deleteAccount, isAuthenticated, saveBeliefProfileToServer } from '../lib/api';
import { User, Mail, LogOut, Trash2, ChevronRight, Info, FileText, Lock, RotateCcw, Ban } from 'lucide-react';

// Modern Toggle Switch Component
function ToggleSwitch({ checked, onChange, label, isDanger = false }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full group"
    >
      <span className={`text-sm font-medium ${isDanger && checked ? 'text-danger' : 'text-dark-text-secondary'}`}>
        {label}
      </span>
      <div className={`relative w-14 h-7 rounded-full transition-all ${
        checked 
          ? isDanger ? 'bg-gradient-to-r from-danger to-danger/80 shadow-lg shadow-danger/30' : 'bg-gradient-to-r from-accent-cyan to-aligned shadow-lg shadow-accent-cyan/30' 
          : 'bg-white/10'
      }`}>
        <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all ${
          checked ? 'translate-x-7' : 'translate-x-0'
        } ${checked ? 'shadow-xl' : ''}`} />
      </div>
    </button>
  );
}

// Custom Range Slider Component
function StanceSlider({ value, onChange, leftLabel, rightLabel }) {
  const getLabel = (v) => {
    if (v === 0) return 'Neutral';
    if (v <= -8) return 'Strongly ' + leftLabel;
    if (v <= -4) return 'Lean ' + leftLabel;
    if (v >= 8) return 'Strongly ' + rightLabel;
    if (v >= 4) return 'Lean ' + rightLabel;
    return v < 0 ? 'Slightly ' + leftLabel : 'Slightly ' + rightLabel;
  };
  
  const percentage = ((value + 10) / 20) * 100;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold px-1">
        <span className="text-dem">← {leftLabel}</span>
        <span className="text-rep">{rightLabel} →</span>
      </div>
      <div className="relative">
        {/* Track */}
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          {/* Gradient fill */}
          <div 
            className={`h-full transition-all duration-200 ${
              value < 0 ? 'bg-gradient-to-r from-dem to-transparent' :
              value > 0 ? 'bg-gradient-to-r from-transparent to-rep' :
              'bg-white/20'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {/* Thumb */}
        <input
          type="range" 
          min={-10} 
          max={10} 
          step={1} 
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
        />
        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 transition-all pointer-events-none ${
            value < 0 ? 'bg-dem border-dem shadow-lg shadow-dem/30' :
            value > 0 ? 'bg-rep border-rep shadow-lg shadow-rep/30' :
            'bg-dark-text-muted border-dark-text-muted'
          }`}
          style={{ left: `calc(${percentage}% - 12px)` }}
        />
      </div>
      <div className="text-center">
        <span className={`text-[11px] font-bold px-3 py-1 rounded-full glass-card ${
          value === 0 ? 'text-dark-text-muted' :
          value < 0 ? 'text-dem' : 'text-rep'
        }`}>
          {getLabel(value)}
        </span>
      </div>
    </div>
  );
}

function GranularEditor({ profile, onUpdate, onSave }) {
  return (
    <div className="space-y-4 pb-6">
      <div className="text-center py-4">
        <h3 className="text-2xl font-black tracking-tight">
          Fine-Tune Your <span className="text-gradient">Values</span>
        </h3>
        <p className="text-sm text-dark-text-secondary mt-2">
          Set exactly where you stand on each issue
        </p>
      </div>

      {ISSUE_CATEGORIES.map(cat => (
        <div key={cat.id} className="space-y-2">
          <p className="text-xs font-bold text-dark-text-muted uppercase tracking-wider px-1">
            {cat.emoji} {cat.name}
          </p>
          {cat.issues.map(issue => {
            const belief = profile[issue.id] || { stance: 0, importance: 0 };
            const isActive = belief.importance > 0;
            const isDealBreaker = belief.importance === 3;

            return (
              <div
                key={issue.id}
                className={`glass-card rounded-2xl p-4 space-y-3 border transition-all ${
                  isDealBreaker ? 'border-danger/50 glow-red' : 
                  isActive ? 'border-aligned/50' : 
                  'border-dark-border hover:border-dark-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-dark-text flex-1">{issue.name}</p>
                  <div className="flex gap-1 shrink-0">
                    {IMPORTANCE_LEVELS.map(level => (
                      <button
                        key={level.value}
                        onClick={() => onUpdate(issue.id, { ...belief, importance: level.value })}
                        className={`text-[9px] px-2 py-1 rounded-lg font-bold transition-all ${
                          belief.importance === level.value
                            ? level.bgClass + ' scale-105 shadow-lg'
                            : 'bg-white/5 text-dark-text-muted hover:bg-white/10'
                        }`}
                        title={level.label}
                      >
                        {level.value === 3 ? <Ban size={10} /> : level.value === 0 ? '—' : level.value}
                      </button>
                    ))}
                  </div>
                </div>

                {isActive && (
                  <>
                    <StanceSlider
                      value={belief.stance}
                      onChange={v => onUpdate(issue.id, { ...belief, stance: v })}
                      leftLabel={issue.leftLabel || 'Oppose'}
                      rightLabel={issue.rightLabel || 'Support'}
                    />
                    <div className="pt-2">
                      <ToggleSwitch
                        checked={belief.is_deal_breaker || belief.importance === 3}
                        onChange={(checked) => onUpdate(issue.id, { 
                          ...belief, 
                          is_deal_breaker: checked,
                          importance: checked ? 3 : (belief.importance === 3 ? 2 : belief.importance)
                        })}
                        label="Deal Breaker (block companies)"
                        isDanger={true}
                      />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <div className="text-center pt-6 sticky bottom-4">
        <button
          onClick={onSave}
          className="px-8 py-4 bg-gradient-to-r from-aligned to-aligned/80 text-white rounded-full font-bold hover:shadow-2xl hover:shadow-aligned/30 transition-all active:scale-95 text-base"
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
      <div className="p-4 animate-slideUp">
        <button
          onClick={() => setEditing(false)}
          className="text-sm text-dark-text-secondary hover:text-dark-text mb-4 flex items-center gap-2"
        >
          ← Back to Settings
        </button>
        <GranularEditor profile={profile} onUpdate={updateIssue} onSave={saveProfile} />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-6 animate-slideUp">
      <div className="text-center pt-6 pb-4">
        <div className="text-6xl mb-3 animate-pulse">⚙️</div>
        <h2 className="text-4xl font-black tracking-tight">
          <span className="text-gradient-purple">Settings</span>
        </h2>
      </div>

      {saved && (
        <div className="glass-card rounded-2xl p-4 text-center border border-aligned/30 bg-aligned/10">
          <p className="text-sm text-aligned font-bold">✅ Preferences saved!</p>
        </div>
      )}

      {/* Account section */}
      {user ? (
        <div className="glass-card rounded-3xl p-5 space-y-4 border border-dark-border">
          <p className="text-xs font-bold text-dark-text-muted uppercase tracking-wider">Account</p>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User size={16} className="text-dark-text-muted" />
              <span className="font-semibold text-dark-text">{user.username}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail size={16} className="text-dark-text-muted" />
              <span className="text-dark-text-secondary">{user.email}</span>
            </div>
          </div>
          <div className="flex gap-2 pt-2 border-t border-dark-border-subtle">
            <button
              onClick={doLogout}
              className="flex items-center gap-2 px-4 py-2.5 text-sm glass-card rounded-xl hover:bg-white/10 transition-colors font-medium"
            >
              <LogOut size={16} />
              Sign Out
            </button>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 rounded-xl transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-danger font-medium">Sure?</span>
                <button onClick={doDelete} className="px-3 py-1.5 text-xs bg-danger text-white rounded-lg font-bold">Yes</button>
                <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-xs glass-card rounded-lg">Cancel</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl p-6 text-center space-y-4 border border-dark-border">
          <p className="text-sm text-dark-text-secondary">Sign in to sync across devices and get report cards</p>
          <div className="flex justify-center gap-3">
            <Link to="/login" className="px-6 py-2.5 bg-gradient-to-r from-aligned to-aligned/80 text-white rounded-full text-sm font-bold hover:shadow-lg hover:shadow-aligned/20 transition-all">Sign In</Link>
            <Link to="/register" className="px-6 py-2.5 glass-card rounded-full text-sm font-bold hover:bg-white/10 transition-colors border border-dark-border">Sign Up</Link>
          </div>
        </div>
      )}

      {/* Values overview */}
      <div className="glass-card rounded-3xl p-5 space-y-4 border border-dark-border">
        <div className="flex justify-between items-center">
          <p className="text-xs font-bold text-dark-text-muted uppercase tracking-wider">Your Values</p>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1 text-xs text-aligned font-bold hover:text-aligned/80 transition-colors"
          >
            Edit
            <ChevronRight size={14} />
          </button>
        </div>

        {summary.total > 0 ? (
          <>
            <div className="flex gap-6">
              <div>
                <p className="text-3xl font-black text-aligned">{summary.total}</p>
                <p className="text-[10px] text-dark-text-muted uppercase tracking-wider font-bold">Issues tracked</p>
              </div>
              {summary.dealBreakers > 0 && (
                <div>
                  <p className="text-3xl font-black text-danger">{summary.dealBreakers}</p>
                  <p className="text-[10px] text-dark-text-muted uppercase tracking-wider font-bold">Deal breakers</p>
                </div>
              )}
            </div>

            {/* Deal breakers highlighted - DRAMATIC */}
            {summary.dealBreakers > 0 && (
              <div className="glass-card rounded-3xl p-5 space-y-3 border-2 border-danger/50 bg-gradient-to-br from-danger/20 to-danger/10 shadow-2xl shadow-danger/30 glow-red">
                <div className="flex items-center gap-2.5">
                  <div className="text-2xl animate-pulse">🔥</div>
                  <div className="flex-1">
                    <p className="text-sm text-danger uppercase font-black tracking-wider">Hard Stops</p>
                    <p className="text-xs text-danger/80 font-bold">Non-negotiable deal breakers</p>
                  </div>
                </div>
                {ISSUE_CATEGORIES.flatMap(cat => cat.issues)
                  .filter(i => profile[i.id]?.importance === 3)
                  .map(issue => (
                    <div key={issue.id} className="flex items-center gap-2 pl-2">
                      <Ban size={14} className="text-danger shrink-0" />
                      <p className="text-sm text-danger font-black">{issue.name}</p>
                    </div>
                  ))
                }
                <p className="text-xs text-danger/70 mt-3 pl-2 font-medium leading-relaxed">
                  We'll block any company that conflicts with these 🚫
                </p>
              </div>
            )}

            {/* Quick issue list */}
            <div className="space-y-1 border-t border-dark-border-subtle pt-3">
              {ISSUE_CATEGORIES.map(cat => {
                const active = cat.issues.filter(i => profile[i.id]?.importance > 0);
                if (!active.length) return null;
                return (
                  <div key={cat.id} className="flex items-center gap-3 text-sm py-1 px-2 rounded-xl hover:bg-white/5 transition-colors">
                    <span className="text-base">{cat.emoji}</span>
                    <span className="text-dark-text-secondary text-xs font-medium flex-1">{cat.name}</span>
                    <span className="text-[10px] text-dark-text-muted font-bold bg-white/5 px-2 py-0.5 rounded-full">{active.length}</span>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-sm text-dark-text-secondary mb-3">No values set up yet</p>
            <button
              onClick={() => setEditing(true)}
              className="px-6 py-2.5 bg-gradient-to-r from-aligned to-aligned/80 text-white rounded-full text-sm font-bold hover:shadow-lg hover:shadow-aligned/20 transition-all"
            >
              Set Up Now
            </button>
          </div>
        )}
      </div>

      {/* Links */}
      <div className="space-y-2">
        <Link to="/about" className="flex items-center justify-between glass-card rounded-2xl p-4 hover:bg-white/10 transition-colors border border-dark-border group">
          <div className="flex items-center gap-3">
            <Info size={18} className="text-dark-text-muted" />
            <span className="text-sm font-medium text-dark-text-secondary">About DollarVote</span>
          </div>
          <ChevronRight size={18} className="text-dark-text-muted group-hover:text-dark-text transition-colors" />
        </Link>
        <Link to="/terms" className="flex items-center justify-between glass-card rounded-2xl p-4 hover:bg-white/10 transition-colors border border-dark-border group">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-dark-text-muted" />
            <span className="text-sm font-medium text-dark-text-secondary">Terms of Service</span>
          </div>
          <ChevronRight size={18} className="text-dark-text-muted group-hover:text-dark-text transition-colors" />
        </Link>
        <Link to="/privacy" className="flex items-center justify-between glass-card rounded-2xl p-4 hover:bg-white/10 transition-colors border border-dark-border group">
          <div className="flex items-center gap-3">
            <Lock size={18} className="text-dark-text-muted" />
            <span className="text-sm font-medium text-dark-text-secondary">Privacy Policy</span>
          </div>
          <ChevronRight size={18} className="text-dark-text-muted group-hover:text-dark-text transition-colors" />
        </Link>
      </div>

      {/* Reset */}
      {summary.total > 0 && (
        <div className="text-center pt-4">
          <button
            onClick={() => {
              if (confirm('Reset all values? This cannot be undone.')) {
                saveBeliefProfile({});
                setProfile({});
                if (isAuthenticated()) saveBeliefProfileToServer({});
              }
            }}
            className="flex items-center gap-2 text-xs text-dark-text-muted hover:text-danger transition-colors mx-auto font-medium"
          >
            <RotateCcw size={12} />
            Reset all values
          </button>
        </div>
      )}
    </div>
  );
}
