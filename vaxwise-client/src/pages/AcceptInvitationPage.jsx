import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInvitation, acceptInvitation } from '../api/invitationsApi';

const inp = {
  width: '100%', padding: '11px 14px', borderRadius: '8px',
  border: '1.5px solid #2D4A34', fontSize: '14px', boxSizing: 'border-box',
  background: '#162219', color: '#F0EDE8', outline: 'none',
  fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.15s',
};
const lbl = {
  display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '600',
  color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.6px',
};

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111812', color: '#8C8677', fontFamily: "'DM Sans', sans-serif" }}>
      Verifying invitation…
    </div>
  );

  if (inviteError) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111812', fontFamily: "'DM Sans', sans-serif", padding: '40px' }}>
      <div style={{ background: '#1A0A0A', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '40px', maxWidth: '400px', textAlign: 'center' }}>
        <p style={{ fontSize: '32px', marginBottom: '12px' }}>⚠️</p>
        <p style={{ color: '#EF4444', fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>Invitation Invalid</p>
        <p style={{ color: '#8C8677', fontSize: '14px' }}>{inviteError}</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111812', fontFamily: "'DM Sans', sans-serif", padding: '40px' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '36px', background: '#22C55E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>🛡️</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '700', color: '#F0EDE8' }}>VaxWise</span>
        </div>

        {/* Invitation summary */}
        <div style={{ background: '#0A2518', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px' }}>
          <p style={{ fontSize: '11px', color: '#8C8677', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px' }}>You've been invited to</p>
          <p style={{ fontSize: '18px', fontFamily: "'Playfair Display', serif", color: '#F0EDE8', fontWeight: '700', marginBottom: '4px' }}>{invite.farmName}</p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ background: '#162219', color: '#22C55E', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #2D4A34' }}>{invite.role}</span>
            {invite.customTitle && <span style={{ background: '#162219', color: '#8C8677', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', border: '1px solid #2D4A34' }}>{invite.customTitle}</span>}
          </div>
          <p style={{ fontSize: '12px', color: '#4A4A42', marginTop: '8px' }}>Invited by {invite.invitedByName}</p>
        </div>

        <div style={{ background: '#1A2B1F', borderRadius: '16px', padding: '32px', border: '1px solid #1F3326' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#F0EDE8', marginBottom: '4px' }}>Create your account</h2>
          <p style={{ color: '#8C8677', fontSize: '13px', marginBottom: '24px' }}>Signing up as <strong style={{ color: '#F0EDE8' }}>{invite.email}</strong></p>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
              <div>
                <label style={lbl}>Full Name</label>
                <input value={form.fullName} onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))} required style={inp} placeholder="Your full name"
                  onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
              </div>
              {invite.role === 'Vet' && (
                <div>
                  <label style={lbl}>SAVC Number</label>
                  <input value={form.savcNumber} onChange={e => setForm(f => ({ ...f, savcNumber: e.target.value }))} style={inp} placeholder="e.g. SAVC-12345"
                    onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
                </div>
              )}
              <div>
                <label style={lbl}>Password</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required minLength={6} style={inp} placeholder="Min. 6 characters"
                  onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
              </div>
              <div>
                <label style={lbl}>Confirm Password</label>
                <input type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required style={inp} placeholder="Repeat password"
                  onFocus={e => e.target.style.borderColor = '#22C55E'} onBlur={e => e.target.style.borderColor = '#2D4A34'} />
              </div>
            </div>
            {error && (
              <div style={{ background: '#1A0A0A', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#EF4444', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
            )}
            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '13px', background: '#22C55E', color: '#0B1F14', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Creating account…' : 'Accept Invitation & Join'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
