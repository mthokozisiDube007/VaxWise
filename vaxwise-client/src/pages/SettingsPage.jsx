import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const inp = 'w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-50 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors';
const lbl = 'block mb-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider';
const card = 'bg-slate-800 border border-slate-700 rounded-xl p-5 mb-5';

export default function SettingsPage() {
  const { user, logout, activeFarmId } = useAuth();
  const navigate = useNavigate();

  const name = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User';
  const email = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '—';
  const role = user?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '—';
  const savc = user?.['SavcNumber'];
  const userId = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
  const expiry = user?.exp ? new Date(user.exp * 1000).toLocaleString('en-ZA') : '—';

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = () => { logout(); navigate('/login'); };

  const profileRows = [
    { label: 'Email Address', value: email },
    { label: 'Role', value: role },
    { label: 'User ID', value: `#${userId}`, mono: true },
    ...(savc ? [{ label: 'SAVC Registration', value: savc, mono: true }] : []),
    { label: 'Active Farm', value: activeFarmId ? `Farm #${activeFarmId}` : 'None selected' },
  ];

  return (
    <div className="text-slate-50">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-50 mb-1">Settings</h1>
        <p className="text-slate-400 text-sm">Account profile and session information</p>
      </div>

      <div className={card}>
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700">
          <div className="w-[60px] h-[60px] rounded-full bg-teal-500 text-slate-900 flex items-center justify-center font-bold text-[22px] shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-slate-50 font-bold text-xl mb-1.5">{name}</p>
            <span className="bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-full text-[11px] font-bold border border-slate-700">{role}</span>
          </div>
        </div>

        {profileRows.map(({ label, value, mono }, i) => (
          <div key={label} className={`flex justify-between items-center py-3.5 ${i === profileRows.length - 1 ? '' : 'border-b border-slate-700'}`}>
            <div>
              <p className={lbl}>{label}</p>
              <p className={`text-sm font-semibold ${mono ? 'font-mono text-[13px] text-slate-400' : 'text-slate-50'}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className={card}>
        <h3 className="text-lg font-semibold text-slate-50 mb-1">Active Session</h3>
        <p className="text-slate-400 text-[13px] mb-5">JWT Bearer authentication (HS256)</p>
        <div className="flex justify-between items-center py-3.5">
          <div>
            <p className={lbl}>Token Expires</p>
            <p className="font-mono text-[13px] font-semibold text-slate-400">{expiry}</p>
          </div>
        </div>
      </div>

      <div className={card}>
        <h3 className="text-lg font-semibold text-slate-50 mb-5">About VaxWise</h3>
        {[
          { label: 'Version', value: 'v1.0.0' },
          { label: 'Platform', value: 'Biosecurity Operating System — South Africa' },
          { label: 'Compliance', value: 'DALRRD Aligned · POPIA Compliant' },
          { label: 'Backend', value: 'ASP.NET Core 10 · localhost:5200' },
        ].map(({ label, value }, i, arr) => (
          <div key={label} className={`flex justify-between items-center py-3.5 ${i === arr.length - 1 ? '' : 'border-b border-slate-700'}`}>
            <div>
              <p className={lbl}>{label}</p>
              <p className="text-sm font-semibold text-slate-50">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 border border-red-500/25 rounded-xl p-5 mb-5">
        <h3 className="text-lg font-semibold text-red-400 mb-1.5">Sign Out</h3>
        <p className="text-slate-400 text-[13px] mb-5">You will be returned to the login screen. Your data is saved.</p>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg text-sm transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
