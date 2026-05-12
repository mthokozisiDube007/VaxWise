import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getInvitation, acceptInvitation } from '../api/invitationsApi';

const inp = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors';
const lbl = 'block mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider';

export default function AcceptInvitationPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const token = params.get('token') || '';

  const [invite, setInvite] = useState(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState('');

  const [form, setForm] = useState({ fullName: '', password: '', confirm: '', savcNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) { setInviteError('No invitation token found.'); setLoadingInvite(false); return; }
    getInvitation(token)
      .then(data => { setInvite(data); setLoadingInvite(false); })
      .catch(() => { setInviteError('This invitation is invalid or has expired.'); setLoadingInvite(false); });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const payload = { token, fullName: form.fullName, password: form.password };
      if (invite?.role === 'Vet' && form.savcNumber) payload.savcNumber = form.savcNumber;
      const data = await acceptInvitation(payload);
      login(data.token);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to accept invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingInvite) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
      Verifying invitation…
    </div>
  );

  if (inviteError) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-6">
      <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-10 max-w-sm w-full text-center">
        <p className="text-3xl mb-3">⚠️</p>
        <p className="text-red-400 font-bold text-base mb-2">Invitation Invalid</p>
        <p className="text-slate-400 text-sm">{inviteError}</p>
      </div>
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

        {/* Invitation summary */}
        <div className="bg-teal-500/10 border border-teal-500/25 rounded-xl px-5 py-4 mb-5">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">You've been invited to</p>
          <p className="text-lg font-bold text-slate-50 mb-1.5">{invite.farmName}</p>
          <div className="flex gap-2 flex-wrap">
            <span className="bg-slate-800 text-teal-400 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-slate-700">{invite.role}</span>
            {invite.customTitle && <span className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full text-[11px] border border-slate-700">{invite.customTitle}</span>}
          </div>
          <p className="text-xs text-slate-500 mt-2">Invited by {invite.invitedByName}</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-slate-50 mb-1">Create your account</h2>
          <p className="text-sm text-slate-400 mb-6">Signing up as <strong className="text-slate-50">{invite.email}</strong></p>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-3.5 mb-5">
              <div>
                <label className={lbl}>Full Name</label>
                <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required className={inp} placeholder="Your full name" />
              </div>
              {invite.role === 'Vet' && (
                <div>
                  <label className={lbl}>SAVC Number</label>
                  <input value={form.savcNumber} onChange={e => setForm(f => ({ ...f, savcNumber: e.target.value }))} className={inp} placeholder="e.g. SAVC-12345" />
                </div>
              )}
              <div>
                <label className={lbl}>Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} className={inp} placeholder="Min. 6 characters" />
              </div>
              <div>
                <label className={lbl}>Confirm Password</label>
                <input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required className={inp} placeholder="Repeat password" />
              </div>
            </div>
            {error && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-lg px-3.5 py-2.5 text-red-400 text-sm mb-4">{error}</div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg text-sm transition-colors"
            >
              {loading ? 'Creating account…' : 'Accept Invitation & Join'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
