import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../lib/api';

export default function Register({ onAuth }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const data = await register(username, email, password);
      onAuth?.(data.user);
      navigate('/verify-email');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-2">🗳️</div>
          <h1 className="text-2xl font-bold text-teal-800">Create account</h1>
          <p className="text-sm text-gray-400 mt-1">Sync your values across devices</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="yourname"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Min 8 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 accent-teal-600"
            />
            <span>
              I agree to the{' '}
              <Link to="/terms" className="text-teal-600 hover:underline" target="_blank">Terms of Service</Link>
              {' '}and{' '}
              <Link to="/privacy" className="text-teal-600 hover:underline" target="_blank">Privacy Policy</Link>
            </span>
          </label>

          <button
            type="submit"
            disabled={loading || !agreed}
            className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-600 font-medium hover:underline">Sign in</Link>
        </p>

        <p className="text-center">
          <Link to="/" className="text-xs text-gray-300 hover:text-gray-500">Continue without account →</Link>
        </p>
      </div>
    </div>
  );
}
