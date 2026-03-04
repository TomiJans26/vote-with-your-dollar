import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../lib/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState('email'); // 'email' | 'code'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputs = useRef([]);

  // Resend cooldown timer
  useState(() => {
    const interval = setInterval(() => {
      setResendCooldown(c => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  });

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep('code');
      setSuccess('Check your email for a 6-digit code.');
      setResendCooldown(60);
      setTimeout(() => inputs.current[0]?.focus(), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < 5) inputs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) setCode(pasted.split(''));
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    const codeStr = code.join('');
    if (codeStr.length !== 6) { setError('Enter the full 6-digit code'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    try {
      await resetPassword(email, codeStr, newPassword);
      setSuccess('Password reset! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await forgotPassword(email);
      setResendCooldown(60);
      setSuccess('New code sent! Check your email.');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg p-4">
      <div className="w-full max-w-sm space-y-6 animate-slideUp">
        <div className="text-center">
          <div className="text-5xl mb-2">🔑</div>
          <h1 className="text-2xl font-bold text-gradient">Reset Password</h1>
          <p className="text-sm text-dark-text-secondary mt-1">
            {step === 'email' ? "Enter your email to get a reset code" : "Enter the code and your new password"}
          </p>
        </div>

        <div className="glass-card rounded-2xl shadow-lg p-6 space-y-4 border border-dark-border">
          {error && <div className="text-sm text-danger bg-danger/10 rounded-lg p-3 border border-danger/30">{error}</div>}
          {success && <div className="text-sm text-aligned bg-aligned/10 rounded-lg p-3 border border-aligned/30">{success}</div>}

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dark-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aligned focus:border-transparent placeholder-dark-text-muted"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-aligned text-white rounded-xl font-semibold hover:bg-aligned/90 transition-colors disabled:opacity-50 active:scale-95"
              >
                {loading ? 'Sending...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dark-text-secondary mb-2 text-center">Verification Code</label>
                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => inputs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className="w-11 h-13 text-center text-xl font-bold bg-white/5 border-2 border-white/10 text-white rounded-lg focus:border-aligned focus:ring-2 focus:ring-aligned/20 outline-none transition-all"
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-text-secondary mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aligned focus:border-transparent placeholder-dark-text-muted"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-text-secondary mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-aligned focus:border-transparent placeholder-dark-text-muted"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-aligned text-white rounded-xl font-semibold hover:bg-aligned/90 transition-colors disabled:opacity-50 active:scale-95"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="text-aligned text-sm hover:underline disabled:text-dark-text-muted disabled:no-underline"
                >
                  {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : "Didn't get the code? Resend"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-dark-text-secondary">
          Remember your password?{' '}
          <Link to="/login" className="text-aligned font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
