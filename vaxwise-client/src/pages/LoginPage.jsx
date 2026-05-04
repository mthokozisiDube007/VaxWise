import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../api/authApi';

// Only FarmOwner and Admin can self-register — all other roles are invitation-only
const SELF_REGISTER_ROLES = ['FarmOwner', 'Admin'];

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

const focusGreen = e => e.target.style.borderColor = '#22C55E';
const blurGreen = e => e.target.style.borderColor = '#2D4A34';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regForm, setRegForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: 'FarmOwner' });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true); setLoginError('');
    try {
      const data = await loginUser(loginForm.email, loginForm.password);
      login(data.token);
      navigate('/');
    } catch (err) {
      setLoginError(err?.response?.status === 401 ? 'Invalid email or password.' : 'Something went wrong. Please try again.');
    } finally { setLoginLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) { setRegError('Passwords do not match.'); return; }
    setRegLoading(true); setRegError(''); setRegSuccess('');
    try {
      const data = await registerUser({ fullName: regForm.fullName, email: regForm.email, password: regForm.password, role: regForm.role });
      setRegSuccess('Account created! Redirecting…');
      login(data.token);
      setTimeout(() => navigate('/farms'), 1000);
    } catch (err) { setRegError(err?.response?.data?.message || 'Registration failed. Email may already be in use.'); }
    finally { setRegLoading(false); }
  };

  const setL = (k, v) => setLoginForm(f => ({ ...f, [k]: v }));
  const setR = (k, v) => setRegForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', sans-serif", background: '#111812' }}>

      {/* Left panel */}
      <div style={{ width: '44%', background: '#0B1F14', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 44px', position: 'relative', overflow: 'hidden', borderRight: '1px solid #1F3326' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(34,197,94,0.05) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '72px' }}>
            <div style={{ width: '40px', height: '40px', background: '#22C55E', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px' }}>🛡️</div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: '700', color: '#F0EDE8' }}>VaxWise</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '38px', fontWeight: '700', color: '#F0EDE8', lineHeight: '1.18', marginBottom: '20px' }}>
            South Africa's<br /><span style={{ color: '#22C55E' }}>Biosecurity</span><br />Operating System
          </h1>
          <p style={{ color: 'rgba(240,237,232,0.45)', fontSize: '15px', lineHeight: '1.75', maxWidth: '300px' }}>
            DALRRD aligned · POPIA compliant · SHA-256 tamper-proof vaccination records.
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: '28px', marginBottom: '36px' }}>
            {[['🐄', 'Livestock'], ['💉', 'Vaccinations'], ['📜', 'Certificates']].map(([icon, label]) => (
              <div key={label}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
                <p style={{ fontSize: '10px', color: 'rgba(240,237,232,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(240,237,232,0.18)' }}>© 2026 VaxWise · v1.0.0</p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: '#111812', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ display: 'flex', background: '#162219', padding: '4px', borderRadius: '10px', marginBottom: '24px', border: '1px solid #1F3326' }}>
            {[{ key: 'login', label: 'Sign In' }, { key: 'register', label: 'Create Account' }].map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setLoginError(''); setRegError(''); setRegSuccess(''); }}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: tab === t.key ? '700' : '400', background: tab === t.key ? '#22C55E' : 'transparent', color: tab === t.key ? '#0B1F14' : '#8C8677', fontFamily: "'DM Sans', sans-serif" }}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ background: '#1A2B1F', borderRadius: '16px', padding: '36px', border: '1px solid #1F3326' }}>
            {tab === 'login' && (
              <form onSubmit={handleLogin}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#F0EDE8', marginBottom: '4px' }}>Welcome back</h2>
                <p style={{ color: '#8C8677', fontSize: '14px', marginBottom: '28px' }}>Sign in to continue to VaxWise</p>
                <div style={{ marginBottom: '16px' }}>
                  <label style={lbl}>Email Address</label>
                  <input type="email" value={loginForm.email} onChange={e => setL('email', e.target.value)} required style={inp} placeholder="you@example.com" onFocus={focusGreen} onBlur={blurGreen} />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={lbl}>Password</label>
                  <input type="password" value={loginForm.password} onChange={e => setL('password', e.target.value)} required style={inp} placeholder="••••••••" onFocus={focusGreen} onBlur={blurGreen} />
                </div>
                {loginError && (
                  <div style={{ background: '#1A0A0A', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#EF4444', fontSize: '13px', marginBottom: '18px' }}>{loginError}</div>
                )}
                <button
                  type="submit"
                  disabled={loginLoading}
                  style={{ width: '100%', padding: '13px', background: '#22C55E', color: '#0B1F14', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: loginLoading ? 'not-allowed' : 'pointer', fontWeight: '700', fontFamily: "'DM Sans', sans-serif", opacity: loginLoading ? 0.7 : 1 }}
                >
                  {loginLoading ? 'Signing in…' : 'Sign In'}
                </button>
                <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#8C8677' }}>
                  <Link to="/forgot-password" style={{ color: '#22C55E', textDecoration: 'none' }}>Forgot your password?</Link>
                </p>
              </form>
            )}
            {tab === 'register' && (
              <form onSubmit={handleRegister}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#F0EDE8', marginBottom: '4px' }}>Create account</h2>
                <p style={{ color: '#8C8677', fontSize: '14px', marginBottom: '24px' }}>Register as a Farm Owner or Admin. Other roles join via invitation link.</p>
                <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <label style={lbl}>Full Name</label>
                    <input value={regForm.fullName} onChange={e => setR('fullName', e.target.value)} required style={inp} placeholder="Thabo Nkosi" onFocus={focusGreen} onBlur={blurGreen} />
                  </div>
                  <div>
                    <label style={lbl}>Email Address</label>
                    <input type="email" value={regForm.email} onChange={e => setR('email', e.target.value)} required style={inp} placeholder="you@example.com" onFocus={focusGreen} onBlur={blurGreen} />
                  </div>
                  <div>
                    <label style={lbl}>Role</label>
                    <select value={regForm.role} onChange={e => setR('role', e.target.value)} style={{ ...inp, cursor: 'pointer' }} onFocus={focusGreen} onBlur={blurGreen}>
                      {SELF_REGISTER_ROLES.map(r => <option key={r} style={{ background: '#162219' }}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Password</label>
                    <input type="password" value={regForm.password} onChange={e => setR('password', e.target.value)} required minLength={6} style={inp} placeholder="Min. 6 characters" onFocus={focusGreen} onBlur={blurGreen} />
                  </div>
                  <div>
                    <label style={lbl}>Confirm Password</label>
                    <input type="password" value={regForm.confirmPassword} onChange={e => setR('confirmPassword', e.target.value)} required style={inp} placeholder="Repeat password" onFocus={focusGreen} onBlur={blurGreen} />
                  </div>
                </div>
                {regError && (
                  <div style={{ background: '#1A0A0A', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#EF4444', fontSize: '13px', marginBottom: '14px' }}>{regError}</div>
                )}
                {regSuccess && (
                  <div style={{ background: '#0A2518', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#22C55E', fontSize: '13px', fontWeight: '600', marginBottom: '14px' }}>✓ {regSuccess}</div>
                )}
                <button
                  type="submit"
                  disabled={regLoading}
                  style={{ width: '100%', padding: '13px', background: '#22C55E', color: '#0B1F14', border: 'none', borderRadius: '8px', fontSize: '15px', cursor: regLoading ? 'not-allowed' : 'pointer', fontWeight: '700', fontFamily: "'DM Sans', sans-serif", opacity: regLoading ? 0.7 : 1 }}
                >
                  {regLoading ? 'Creating account…' : 'Create Account'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
