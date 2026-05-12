import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../api/authApi';
import { useMobile } from '../hooks/useMobile';
import { useFormErrors } from '../hooks/useFormErrors';
import FieldError from '../components/FieldError';
import { ShieldCheck } from 'lucide-react';

const SELF_REGISTER_ROLES = ['FarmOwner', 'Admin'];

const inp = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors';
const lbl = 'block mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const { login } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const loginErr = useFormErrors();

  const [regForm, setRegForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', role: 'FarmOwner' });
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const regErr = useFormErrors();

  const handleLogin = async (e) => {
    e.preventDefault();
    const ok = loginErr.validate({
      email:    () => !loginForm.email.trim() ? 'Email is required' : !/\S+@\S+\.\S+/.test(loginForm.email) ? 'Enter a valid email address' : '',
      password: () => !loginForm.password ? 'Password is required' : '',
    });
    if (!ok) return;
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
    const ok = regErr.validate({
      fullName:        () => !regForm.fullName.trim() ? 'Full name is required' : '',
      email:           () => !regForm.email.trim() ? 'Email is required' : !/\S+@\S+\.\S+/.test(regForm.email) ? 'Enter a valid email address' : '',
      password:        () => !regForm.password ? 'Password is required' : regForm.password.length < 8 ? 'Password must be at least 8 characters' : '',
      confirmPassword: () => !regForm.confirmPassword ? 'Please confirm your password' : regForm.confirmPassword !== regForm.password ? 'Passwords do not match' : '',
    });
    if (!ok) return;
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

  const inpCls = (field) => `${inp} ${field.error ? 'border-red-500/50 focus:ring-red-500/30 focus:border-red-500' : field.touched && !field.error ? 'border-teal-500/40' : ''}`;

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* Left panel */}
      {!isMobile && (
        <div className="w-[44%] bg-slate-800 border-r border-slate-700 flex flex-col justify-between p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #14B8A6 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
                <ShieldCheck size={20} className="text-slate-900" />
              </div>
              <span className="text-xl font-bold text-slate-50 tracking-tight">VaxWise</span>
            </div>
            <h1 className="text-4xl font-bold text-slate-50 leading-tight mb-4">
              South Africa's<br /><span className="text-teal-400">Biosecurity</span><br />Operating System
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
              DALRRD aligned · POPIA compliant · SHA-256 tamper-proof vaccination records.
            </p>
          </div>
          <div className="relative">
            <div className="flex gap-7 mb-8">
              {[['🐄', 'Livestock'], ['💉', 'Vaccinations'], ['📜', 'Certificates']].map(([icon, label]) => (
                <div key={label}>
                  <div className="text-xl mb-1">{icon}</div>
                  <p className="text-[10px] text-slate-600 uppercase tracking-wide">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-700">© 2026 VaxWise · v1.0.0</p>
          </div>
        </div>
      )}

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[400px]">
          {isMobile && (
            <div className="flex items-center justify-center gap-2.5 mb-7">
              <div className="w-9 h-9 bg-teal-500 rounded-xl flex items-center justify-center">
                <ShieldCheck size={18} className="text-slate-900" />
              </div>
              <span className="text-lg font-bold text-slate-50">VaxWise</span>
            </div>
          )}

          {/* Tab switcher */}
          <div className="flex bg-slate-800 border border-slate-700 rounded-xl p-1 mb-5">
            {[{ key: 'login', label: 'Sign In' }, { key: 'register', label: 'Create Account' }].map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setLoginError(''); setRegError(''); setRegSuccess(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  tab === t.key
                    ? 'bg-teal-500 text-slate-900'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8">
            {tab === 'login' ? (
              <form onSubmit={handleLogin}>
                <h2 className="text-xl font-bold text-slate-50 mb-1">Welcome back</h2>
                <p className="text-sm text-slate-400 mb-6">Sign in to continue to VaxWise</p>
                <div className="mb-4">
                  <label className={lbl}>Email Address</label>
                  <input type="email" value={loginForm.email}
                    onChange={loginErr.field('email').onChange(e => setL('email', e.target.value))}
                    className={inpCls(loginErr.field('email'))}
                    onFocus={loginErr.field('email').onFocus} onBlur={loginErr.field('email').onBlur}
                    placeholder="you@example.com" />
                  <FieldError msg={loginErr.field('email').error} />
                </div>
                <div className="mb-5">
                  <label className={lbl}>Password</label>
                  <input type="password" value={loginForm.password}
                    onChange={loginErr.field('password').onChange(e => setL('password', e.target.value))}
                    className={inpCls(loginErr.field('password'))}
                    onFocus={loginErr.field('password').onFocus} onBlur={loginErr.field('password').onBlur}
                    placeholder="••••••••" />
                  <FieldError msg={loginErr.field('password').error} />
                </div>
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 text-red-400 text-xs mb-4">{loginError}</div>
                )}
                <button type="submit" disabled={loginLoading}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg text-sm transition-colors">
                  {loginLoading ? 'Signing in…' : 'Sign In'}
                </button>
                <p className="text-center mt-4 text-xs text-slate-500">
                  <Link to="/forgot-password" className="text-teal-400 hover:text-teal-300">Forgot your password?</Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <h2 className="text-xl font-bold text-slate-50 mb-1">Create account</h2>
                <p className="text-xs text-slate-400 mb-5">Register as a Farm Owner or Admin. Other roles join via invitation link.</p>
                <div className="grid gap-3.5 mb-4">
                  <div>
                    <label className={lbl}>Full Name</label>
                    <input value={regForm.fullName}
                      onChange={regErr.field('fullName').onChange(e => setR('fullName', e.target.value))}
                      className={inpCls(regErr.field('fullName'))}
                      onFocus={regErr.field('fullName').onFocus} onBlur={regErr.field('fullName').onBlur}
                      placeholder="Thabo Nkosi" />
                    <FieldError msg={regErr.field('fullName').error} />
                  </div>
                  <div>
                    <label className={lbl}>Email Address</label>
                    <input type="email" value={regForm.email}
                      onChange={regErr.field('email').onChange(e => setR('email', e.target.value))}
                      className={inpCls(regErr.field('email'))}
                      onFocus={regErr.field('email').onFocus} onBlur={regErr.field('email').onBlur}
                      placeholder="you@example.com" />
                    <FieldError msg={regErr.field('email').error} />
                  </div>
                  <div>
                    <label className={lbl}>Role</label>
                    <select value={regForm.role} onChange={e => setR('role', e.target.value)} className={inp}>
                      {SELF_REGISTER_ROLES.map(r => <option key={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={lbl}>Password</label>
                    <input type="password" value={regForm.password}
                      onChange={regErr.field('password').onChange(e => setR('password', e.target.value))}
                      className={inpCls(regErr.field('password'))}
                      onFocus={regErr.field('password').onFocus} onBlur={regErr.field('password').onBlur}
                      placeholder="Min. 8 characters" />
                    <FieldError msg={regErr.field('password').error} />
                  </div>
                  <div>
                    <label className={lbl}>Confirm Password</label>
                    <input type="password" value={regForm.confirmPassword}
                      onChange={regErr.field('confirmPassword').onChange(e => setR('confirmPassword', e.target.value))}
                      className={inpCls(regErr.field('confirmPassword'))}
                      onFocus={regErr.field('confirmPassword').onFocus} onBlur={regErr.field('confirmPassword').onBlur}
                      placeholder="Repeat password" />
                    <FieldError msg={regErr.field('confirmPassword').error} />
                  </div>
                </div>
                {regError && <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2.5 text-red-400 text-xs mb-3">{regError}</div>}
                {regSuccess && <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg px-3 py-2.5 text-teal-400 text-xs font-semibold mb-3">✓ {regSuccess}</div>}
                <button type="submit" disabled={regLoading}
                  className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-semibold rounded-lg text-sm transition-colors">
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
