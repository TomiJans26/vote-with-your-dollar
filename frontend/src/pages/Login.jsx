import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../lib/api';

export default function Login({ onAuth }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      onAuth?.(data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="w-full max-w-sm space-y-6 animate-slideUp">
        <div className="text-center">
          <div className="text-5xl mb-2">🗳️</div>
          <h1 className="text-2xl font-bold text-gradient">Welcome back</h1>
          <p className="text-sm text-dark-text-secondary mt-1">Sign in to sync your values</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-2xl shadow-lg p-6 space-y-4 border border-dark-border">
          {error && (
            <div className="text-sm text-danger bg-danger/10 rounded-lg p-3 border border-danger/30">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-dark-text-secondary mb-1">Email or Username</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aligned focus:border-transparent placeholder-dark-text-muted"
              placeholder="you@example.com or username"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-dark-text-secondary mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aligned focus:border-transparent placeholder-dark-text-muted"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-aligned text-white rounded-xl font-semibold hover:bg-aligned/90 transition-colors disabled:opacity-50 active:scale-95"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center">
            <Link to="/forgot-password" className="text-sm text-aligned hover:underline">Forgot password?</Link>
          </div>
        </form>

        <p className="text-center text-sm text-dark-text-secondary">
          Don't have an account?{' '}
          <Link to="/register" className="text-aligned font-medium hover:underline">Sign up</Link>
        </p>

        <p className="text-center">
          <Link to="/" className="text-xs text-dark-text-muted hover:text-dark-text-secondary">Continue without account →</Link>
        </p>
      </div>
    </div>
  );
}
