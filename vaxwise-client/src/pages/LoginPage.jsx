import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../api/authApi';

const ROLES = ['FarmOwner', 'FarmManager', 'Worker', 'Vet', 'Government', 'Inspector'];
const inp = { width: '100%', padding: '11px 14px', borderRadius: '9px', border: '1.5px solid #E0D9CE', fontSize: '14px', boxSizing: 'border-box', background: '#FDFCF8', color: '#1A1A18', outline: 'none', fontFamily: "'DM Sans', sans-serif" };
const lbl = { display: 'block', marginBottom: '6px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.6px' };

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  const [regForm, setRegForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: 'FarmOwner', savcNumber: '' });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true); setLoginError('');
    try { const data = await loginUser(loginForm.email, loginForm.password); login(data.token); navigate('/'); }
    catch { setLoginError('Invalid email or password. Please try again.'); }
    finally { setLoginLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (regForm.password !== regForm.confirmPassword) { setRegError('Passwords do not match.'); return; }
    setRegLoading(true); setRegError(''); setRegSuccess('');
    try {
      await registerUser({ fullName: regForm.fullName, email: regForm.email, password: regForm.password, role: regForm.role, ...(regForm.role === 'Vet' && regForm.savcNumber ? { savcNumber: regForm.savcNumber } : {}) });
      setRegSuccess('Account created successfully.');
      setRegForm({ fullName: '', email: '', password: '', confirmPassword: '', role: 'FarmOwner', savcNumber: '' });
      setTimeout(() => { setTab('login'); setRegSuccess(''); }, 1800);
    } catch (err) { setRegError(err?.response?.data?.message || 'Registration failed. Email may already be in use.'); }
    finally { setRegLoading(false); }
  };

  const setL = (k, v) => setLoginForm(f => ({ ...f, [k]: v }));
  const setR = (k, v) => setRegForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Left panel */}
      <div style={{ width: '44%', background: '#0B1F14', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 44px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(201,133,11,0.07) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '72px' }}>
            <div style={{ width: '40px', height: '40px', background: '#C9850B', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '19px' }}>🛡️</div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', fontWeight: '700', color: '#FFF' }}>VaxWise</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '38px', fontWeight: '700', color: '#FFF', lineHeight: '1.18', marginBottom: '20px' }}>
            South Africa's<br /><span style={{ color: '#C9850B' }}>Biosecurity</span><br />Operating System
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: '1.75', maxWidth: '300px' }}>
            DALRRD aligned · POPIA compliant · SHA-256 tamper-proof vaccination records.
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: '28px', marginBottom: '36px' }}>
            {[['🐄', 'Livestock'], ['💉', 'Vaccinations'], ['📜', 'Certificates']].map(([icon, label]) => (
              <div key={label}>
                <div style={{ fontSize: '22px', marginBottom: '4px' }}>{icon}</div>
                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)' }}>© 2026 VaxWise · v1.0.0</p>
        </div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, background: '#F0EBE1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          <div style={{ display: 'flex', background: 'white', borderRadius: '12px', padding: '4px', marginBottom: '24px', boxShadow: '0 1px 6px rgba(11,31,20,0.07)' }}>
            {[{ key: 'login', label: 'Sign In' }, { key: 'register', label: 'Create Account' }].map(t => (
              <button key={t.key} onClick={() => { setTab(t.key); setLoginError(''); setRegError(''); setRegSuccess(''); }}
                style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '9px', cursor: 'pointer', fontSize: '14px', fontWeight: tab === t.key ? '700' : '400', background: tab === t.key ? '#0B1F14' : 'transparent', color: tab === t.key ? '#FFF' : '#8C8677', fontFamily: "'DM Sans', sans-serif" }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '36px', boxShadow: '0 2px 20px rgba(11,31,20,0.07)' }}>
            {tab === 'login' && (
              <form onSubmit={handleLogin}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#0B1F14', marginBottom: '4px' }}>Welcome back</h2>
                <p style={{ color: '#8C8677', fontSize: '14px', marginBottom: '28px' }}>Sign in to continue to VaxWise</p>
                <div style={{ marginBottom: '16px' }}><label style={lbl}>Email Address</label><input type="email" value={loginForm.email} onChange={e => setL('email', e.target.value)} required style={inp} placeholder="you@example.com" /></div>
                <div style={{ marginBottom: '24px' }}><label style={lbl}>Password</label><input type="password" value={loginForm.password} onChange={e => setL('password', e.target.value)} required style={inp} placeholder="••••••••" /></div>
                {loginError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', color: '#DC2626', fontSize: '13px', marginBottom: '18px' }}>{loginError}</div>}
                <button type="submit" disabled={loginLoading} style={{ width: '100%', padding: '13px', background: '#0B1F14', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', cursor: 'pointer', fontWeight: '600', fontFamily: "'DM Sans', sans-serif" }}>
                  {loginLoading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>
            )}
            {tab === 'register' && (
              <form onSubmit={handleRegister}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '24px', color: '#0B1F14', marginBottom: '4px' }}>Create account</h2>
                <p style={{ color: '#8C8677', fontSize: '14px', marginBottom: '24px' }}>Join VaxWise as a farm operator or vet</p>
                <div style={{ display: 'grid', gap: '14px', marginBottom: '20px' }}>
                  <div><label style={lbl}>Full Name</label><input value={regForm.fullName} onChange={e => setR('fullName', e.target.value)} required style={inp} placeholder="Thabo Nkosi" /></div>
                  <div><label style={lbl}>Email Address</label><input type="email" value={regForm.email} onChange={e => setR('email', e.target.value)} required style={inp} placeholder="you@example.com" /></div>
                  <div><label style={lbl}>Role</label><select value={regForm.role} onChange={e => setR('role', e.target.value)} style={{ ...inp, cursor: 'pointer' }}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
                  {regForm.role === 'Vet' && <div><label style={lbl}>SAVC Number</label><input value={regForm.savcNumber} onChange={e => setR('savcNumber', e.target.value)} placeholder="e.g. SAVC-12345" style={inp} /></div>}
                  <div><label style={lbl}>Password</label><input type="password" value={regForm.password} onChange={e => setR('password', e.target.value)} required minLength={6} style={inp} placeholder="Min. 6 characters" /></div>
                  <div><label style={lbl}>Confirm Password</label><input type="password" value={regForm.confirmPassword} onChange={e => setR('confirmPassword', e.target.value)} required style={inp} placeholder="Repeat password" /></div>
                </div>
                {regError && <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', padding: '10px 14px', color: '#DC2626', fontSize: '13px', marginBottom: '14px' }}>{regError}</div>}
                {regSuccess && <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: '8px', padding: '10px 14px', color: '#15803D', fontSize: '13px', fontWeight: '600', marginBottom: '14px' }}>✓ {regSuccess}</div>}
                <button type="submit" disabled={regLoading} style={{ width: '100%', padding: '13px', background: '#C9850B', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', cursor: 'pointer', fontWeight: '600', fontFamily: "'DM Sans', sans-serif" }}>
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
