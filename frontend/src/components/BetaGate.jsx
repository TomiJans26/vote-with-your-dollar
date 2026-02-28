import { useState } from 'react';

const BETA_CODE = 'DOLLARVOTE2026';
const STORAGE_KEY = 'dollarvote_beta_access';

export function hasBetaAccess() {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export default function BetaGate({ children }) {
  const [hasAccess, setHasAccess] = useState(hasBetaAccess);
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  if (hasAccess) return children;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim().toUpperCase() === BETA_CODE) {
      localStorage.setItem(STORAGE_KEY, 'true');
      setHasAccess(true);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className={`max-w-sm w-full text-center ${shake ? 'animate-shake' : ''}`}>
        {/* Logo */}
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-4">
            <span className="text-3xl">🗳️</span>
          </div>
          <h1 className="text-3xl font-bold text-white">DollarVote</h1>
          <p className="text-emerald-400 mt-1 text-sm font-medium tracking-wide uppercase">Private Beta</p>
        </div>

        {/* Code input */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(false); }}
              placeholder="Enter beta code"
              className={`w-full px-4 py-3 rounded-xl bg-gray-900 border text-white text-center text-lg tracking-widest placeholder:text-gray-600 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors ${
                error ? 'border-red-500' : 'border-gray-800'
              }`}
              autoFocus
              autoComplete="off"
            />
            {error && (
              <p className="text-red-400 text-sm mt-2">Invalid code. Try again.</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
          >
            Enter
          </button>
        </form>

        <p className="text-gray-600 text-xs mt-8">
          Vote with your dollar. Every purchase is a choice.
        </p>
      </div>
    </div>
  );
}
