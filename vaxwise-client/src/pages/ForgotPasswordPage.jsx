import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { forgotPassword } from '../api/authApi';

const inp = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors';
const lbl = 'block mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await forgotPassword(email);
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-7">
          <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
            <ShieldCheck size={18} className="text-slate-900" />
          </div>
          <span className="text-lg font-bold text-slate-50">VaxWise</span>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-slate-50 mb-1">Reset password</h2>
          <p className="text-sm text-slate-400 mb-7">Enter your email and we'll send a reset link</p>

          {sent ? (
            <div className="bg-teal-500/10 border border-teal-500/25 rounded-lg px-4 py-4 text-teal-400 text-sm leading-relaxed">
              ✓ If that email exists in our system, a reset link has been sent. Check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-5">
                <label className={lbl}>Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className={inp} placeholder="you@example.com"
                />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-3.5 py-2.5 text-red-400 text-sm mb-4">{error}</div>
              )}
              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg text-sm transition-colors"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="text-center mt-5 text-sm text-slate-400">
            Remember your password?{' '}
            <Link to="/login" className="text-teal-400 font-semibold hover:text-teal-300 transition-colors">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
