import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/authApi';

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111812', fontFamily: "'DM Sans', sans-serif", padding: '40px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '36px', background: '#22C55E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '17px' }}>🛡️</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', fontWeight: '700', color: '#F0EDE8' }}>VaxWise</span>
        </div>

        <div style={{ background: '#1A2B1F', borderRadius: '16px', padding: '36px', border: '1px solid #1F3326' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#F0EDE8', marginBottom: '4px' }}>Reset password</h2>
          <p style={{ color: '#8C8677', fontSize: '14px', marginBottom: '28px' }}>Enter your email and we'll send a reset link</p>

          {sent ? (
            <div style={{ background: '#0A2518', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '16px', color: '#22C55E', fontSize: '14px', lineHeight: '1.6' }}>
              ✓ If that email exists in our system, a reset link has been sent. Check your inbox.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={lbl}>Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  style={inp} placeholder="you@example.com"
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
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#8C8677' }}>
            Remember your password?{' '}
            <Link to="/login" style={{ color: '#22C55E', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
