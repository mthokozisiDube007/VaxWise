import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { resetPassword } from '../api/authApi';

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111812', color: '#EF4444', fontFamily: "'DM Sans', sans-serif" }}>
      Invalid reset link. <Link to="/forgot-password" style={{ color: '#22C55E', marginLeft: '8px' }}>Request a new one.</Link>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111812', fontFamily: "'DM Sans', sans-serif", padding: '40px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '36px', background: '#22C55E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>🛡️</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '700', color: '#F0EDE8' }}>VaxWise</span>
        </div>

        <div style={{ background: '#1A2B1F', borderRadius: '16px', padding: '36px', border: '1px solid #1F3326' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#F0EDE8', marginBottom: '4px' }}>New password</h2>
          <p style={{ color: '#8C8677', fontSize: '14px', marginBottom: '28px' }}>Choose a strong password for your account</p>

          {success ? (
            <div style={{ background: '#0A2518', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '16px', color: '#22C55E', fontSize: '14px' }}>
              ✓ Password reset successfully. Redirecting to sign in…
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={lbl}>New Password</label>
                <input
                  type="password" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
                  required minLength={6} style={inp} placeholder="Min. 6 characters"
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = '#2D4A34'}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={lbl}>Confirm Password</label>
                <input
                  type="password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                  required style={inp} placeholder="Repeat password"
                  onFocus={e => e.target.style.borderColor = '#22C55E'}
                  onBlur={e => e.target.style.borderColor = '#2D4A34'}
                />
              </div>
              {error && (
                <div style={{ background: '#1A0A0A', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#EF4444', fontSize: '13px', marginBottom: '16px' }}>{error}</div>
              )}
              <button
                type="submit" disabled={loading}
                style={{ width: '100%', padding: '13px', background: '#22C55E', color: '#0B1F14', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontFamily: "'DM Sans', sans-serif", opacity: loading ? 0.7 : 1 }}
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
