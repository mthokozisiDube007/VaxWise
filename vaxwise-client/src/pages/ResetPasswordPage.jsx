import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { resetPassword } from '../api/authApi';

const inp = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors';
const lbl = 'block mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      await resetPassword(token, form.newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Token is invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400 text-sm">
      Invalid reset link.{' '}
      <Link to="/forgot-password" className="text-teal-400 ml-2 hover:text-teal-300 transition-colors">Request a new one.</Link>
    </div>
  );

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
          <h2 className="text-2xl font-bold text-slate-50 mb-1">New password</h2>
          <p className="text-sm text-slate-400 mb-7">Choose a strong password for your account</p>

          {success ? (
            <div className="bg-teal-500/10 border border-teal-500/25 rounded-lg px-4 py-4 text-teal-400 text-sm">
              ✓ Password reset successfully. Redirecting to sign in…
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className={lbl}>New Password</label>
                <input
                  type="password" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                  required minLength={6} className={inp} placeholder="Min. 6 characters"
                />
              </div>
              <div className="mb-5">
                <label className={lbl}>Confirm Password</label>
                <input
                  type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  required className={inp} placeholder="Repeat password"
                />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-3.5 py-2.5 text-red-400 text-sm mb-4">{error}</div>
              )}
              <button
                type="submit" disabled={loading}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg text-sm transition-colors"
              >
                {loading ? 'Saving…' : 'Set New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
