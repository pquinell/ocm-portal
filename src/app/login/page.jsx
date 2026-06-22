'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, forgotPassword, confirmForgotPassword } = useAuth();

  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setView('reset');
    } catch (err) {
      setError(err.message || 'Could not send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await confirmForgotPassword(email, code, newPassword);
      setSuccessMessage('Password reset successfully. You can now sign in.');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setPassword('');
      setView('login');
    } catch (err) {
      setError(err.message || 'Could not reset password.');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    setView('login');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-linear-to-br from-red-500 to-rose-700 mb-4 text-xl">
            🎄
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">OCM Staff Portal</h1>
          <p className="text-white/30 text-sm mt-1">2026 Applications</p>
        </div>

        {successMessage && (
          <div className="rounded-xl bg-green-900/30 border border-green-800/50 px-4 py-3 text-sm text-green-300 mb-4">
            {successMessage}
          </div>
        )}

        {/* Sign in form */}
        {view === 'login' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setSuccessMessage(''); }}
                  required
                  autoComplete="email"
                  placeholder="you@oseg.ca"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-white/50 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setError(''); setSuccessMessage(''); setView('forgot'); }}
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-900/30 border border-red-800/50 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-semibold text-sm py-3 rounded-xl hover:bg-white/90 active:bg-white/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        )}

        {/* Forgot password — send code */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div>
              <p className="text-sm text-white/50 mb-4">
                Enter your email and we&apos;ll send you a reset code.
              </p>
              <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@oseg.ca"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
              />
            </div>

            {error && (
              <div className="rounded-xl bg-red-900/30 border border-red-800/50 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-semibold text-sm py-3 rounded-xl hover:bg-white/90 active:bg-white/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send reset code'
              )}
            </button>

            <button type="button" onClick={goToLogin} className="w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors pt-1">
              Back to sign in
            </button>
          </form>
        )}

        {/* Reset password — enter code + new password */}
        {view === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-white/50">
                Check your email for a reset code.
              </p>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                  Reset code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                  autoComplete="one-time-code"
                  placeholder="123456"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-900/30 border border-red-800/50 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-semibold text-sm py-3 rounded-xl hover:bg-white/90 active:bg-white/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />
                  Resetting...
                </span>
              ) : (
                'Reset password'
              )}
            </button>

            <button type="button" onClick={goToLogin} className="w-full text-center text-xs text-white/30 hover:text-white/60 transition-colors pt-1">
              Back to sign in
            </button>
          </form>
        )}

        {view === 'login' && (
          <p className="text-center text-xs text-white/30 mt-4">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-white/60 hover:text-white transition-colors">
              Create one
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
