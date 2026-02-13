import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getBeliefProfile, getProfileSummary, saveBeliefProfile, setOnboardingComplete } from '../lib/prefs';
import { ISSUE_CATEGORIES, STANCE_LABELS, IMPORTANCE_LEVELS, ALL_ISSUES } from '../lib/issues';
import { useAuth } from '../App';
import { logout as apiLogout, deleteAccount, isAuthenticated, saveBeliefProfileToServer } from '../lib/api';
import Onboarding from './Onboarding';

export default function Settings() {
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();
  const [profile, setProfile] = useState(getBeliefProfile);
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  if (editing) {
    return (
      <Onboarding
        initialProfile={profile}
        onComplete={(newProfile) => {
          setProfile(newProfile);
          setEditing(false);
          if (isAuthenticated()) {
            saveBeliefProfileToServer(newProfile);
          }
        }}
      />
    );
  }

  return (
    <div className="p-4 space-y-5">
      <div className="text-center pt-2">
        <h2 className="text-xl font-bold text-teal-800">Settings</h2>
      </div>

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
          <p className="text-sm text-gray-500">Sign in to sync your values across devices</p>
          <div className="flex justify-center gap-3">
            <Link to="/login" className="px-5 py-2 bg-teal-600 text-white rounded-xl text-sm font-semibold hover:bg-teal-700 transition-colors">Sign In</Link>
            <Link to="/register" className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors">Sign Up</Link>
          </div>
        </div>
      )}

      {/* Values section */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-teal-800">Your Values</h3>
        <p className="text-sm text-gray-500 mt-1">These shape how we score companies for you.</p>
      </div>

      {/* Summary card */}
      <div className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-2xl font-bold text-teal-700">{summary.total}</p>
            <p className="text-xs text-gray-400">Issues configured</p>
          </div>
          {summary.dealBreakers > 0 && (
            <div className="text-right">
              <p className="text-2xl font-bold text-red-500">{summary.dealBreakers}</p>
              <p className="text-xs text-gray-400">Deal breakers</p>
            </div>
          )}
        </div>

        {summary.categories.length > 0 ? (
          <div className="space-y-2 pt-2">
            {summary.categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 text-sm">
                <span>{cat.emoji}</span>
                <span className="text-gray-600">{cat.name}</span>
                <span className="text-xs text-gray-300 ml-auto">{cat.activeCount} issue{cat.activeCount > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">
            No values configured yet. Set up your profile to get personalized scores!
          </p>
        )}
      </div>

      {/* Active issue details */}
      {summary.total > 0 && (
        <div className="space-y-2">
          {ISSUE_CATEGORIES.map(cat => {
            const catIssues = cat.issues.filter(i => profile[i.id]?.importance > 0);
            if (!catIssues.length) return null;
            return (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm p-3">
                <p className="text-[10px] font-semibold text-gray-400 uppercase">{cat.emoji} {cat.name}</p>
                <div className="mt-1 space-y-1">
                  {catIssues.map(issue => {
                    const b = profile[issue.id];
                    const stance = STANCE_LABELS.find(s => s.value === b.stance)?.label || 'Neutral';
                    const imp = IMPORTANCE_LEVELS.find(l => l.value === b.importance);
                    return (
                      <div key={issue.id} className="flex justify-between items-center text-xs">
                        <span className="text-gray-600 truncate mr-2">{issue.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-gray-400">{stance}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${imp?.bgClass}`}>{imp?.label}</span>
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

      {/* Edit button */}
      <div className="text-center pt-2 pb-4">
        <button
          onClick={() => setEditing(true)}
          className="px-8 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors"
        >
          ✏️ View / Edit My Values
        </button>
      </div>

      {/* Reset */}
      <div className="text-center">
        <button
          onClick={() => {
            saveBeliefProfile({});
            setProfile({});
            if (isAuthenticated()) saveBeliefProfileToServer({});
          }}
          className="text-sm text-gray-300 underline hover:text-gray-500"
        >
          Reset all values
        </button>
      </div>
    </div>
  );
}
