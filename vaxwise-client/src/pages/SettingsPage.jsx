import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const S = {
  card: { background: '#1A2B1F', borderRadius: '14px', padding: '28px 32px', border: '1px solid #1F3326', marginBottom: '24px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1F3326' },
  lbl: { margin: '0 0 3px', fontSize: '11px', fontWeight: '600', color: '#8C8677', textTransform: 'uppercase', letterSpacing: '0.6px' },
  val: { margin: 0, fontSize: '14px', fontWeight: '600', color: '#F0EDE8' },
};

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
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#F0EDE8' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '32px', fontWeight: '700', color: '#F0EDE8', marginBottom: '4px' }}>Settings</h1>
        <p style={{ color: '#8C8677', fontSize: '14px' }}>Account profile and session information</p>
      </div>

      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid #1F3326' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#22C55E', color: '#0B1F14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '22px', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <p style={{ margin: '0 0 6px', fontFamily: "'Playfair Display', serif", fontWeight: '700', fontSize: '20px', color: '#F0EDE8' }}>{name}</p>
            <span style={{ background: '#1A2B1F', color: '#8C8677', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', border: '1px solid #2D4A34' }}>{role}</span>
          </div>
        </div>

        {profileRows.map(({ label, value, mono }, i) => (
          <div key={label} style={{ ...S.row, borderBottom: i === profileRows.length - 1 ? 'none' : '1px solid #1F3326' }}>
            <div>
              <p style={S.lbl}>{label}</p>
              <p style={{ ...S.val, fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit', fontSize: mono ? '13px' : '14px', color: mono ? '#8C8677' : '#F0EDE8' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={S.card}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#F0EDE8', marginBottom: '4px' }}>Active Session</h3>
        <p style={{ color: '#8C8677', fontSize: '13px', marginBottom: '20px' }}>JWT Bearer authentication (HS256)</p>
        <div style={{ ...S.row, borderBottom: 'none' }}>
          <div>
            <p style={S.lbl}>Token Expires</p>
            <p style={{ ...S.val, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', color: '#8C8677' }}>{expiry}</p>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#F0EDE8', marginBottom: '20px' }}>About VaxWise</h3>
        {[
          { label: 'Version', value: 'v1.0.0' },
          { label: 'Platform', value: 'Biosecurity Operating System — South Africa' },
          { label: 'Compliance', value: 'DALRRD Aligned · POPIA Compliant' },
          { label: 'Backend', value: 'ASP.NET Core 10 · localhost:5200' },
        ].map(({ label, value }, i, arr) => (
          <div key={label} style={{ ...S.row, borderBottom: i === arr.length - 1 ? 'none' : '1px solid #1F3326' }}>
            <div>
              <p style={S.lbl}>{label}</p>
              <p style={S.val}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ ...S.card, border: '1px solid rgba(239,68,68,0.25)' }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '18px', color: '#EF4444', marginBottom: '6px' }}>Sign Out</h3>
        <p style={{ color: '#8C8677', fontSize: '13px', marginBottom: '20px' }}>You will be returned to the login screen. Your data is saved.</p>
        <button
          onClick={handleLogout}
          style={{ background: '#EF4444', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
