import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const S = {
  card: { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '24px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0f0f0' },
  label: { fontSize: '13px', color: '#888', marginBottom: '4px' },
  value: { fontSize: '15px', fontWeight: 'bold', color: '#1A5276' },
};

export default function SettingsPage() {
  const { user, logout, activeFarmId } = useAuth();
  const navigate = useNavigate();

  const name = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User';
  const email = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || '—';
  const role = user?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '—';
  const savc = user?.['SavcNumber'];
  const userId = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
  const expiry = user?.exp ? new Date(user.exp * 1000).toLocaleString() : '—';

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div>
      <h1 style={{ color: '#1A5276', marginBottom: '24px' }}>⚙️ Settings</h1>

      {/* Profile */}
      <div style={S.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#1A5276', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>
            {initials}
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', color: '#1A5276' }}>{name}</p>
            <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>{role}</p>
          </div>
        </div>

        {[
          { label: 'Email Address', value: email },
          { label: 'Role', value: role },
          { label: 'User ID', value: `#${userId}` },
          ...(savc ? [{ label: 'SAVC Registration Number', value: savc }] : []),
          { label: 'Active Farm ID', value: activeFarmId ? `#${activeFarmId}` : 'None selected' },
        ].map(({ label, value }) => (
          <div key={label} style={S.row}>
            <div>
              <p style={{ margin: 0, ...S.label }}>{label}</p>
              <p style={{ margin: 0, ...S.value }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Session */}
      <div style={S.card}>
        <h3 style={{ margin: '0 0 16px', color: '#1A5276' }}>Active Session</h3>
        <div style={S.row}>
          <div>
            <p style={{ margin: 0, ...S.label }}>Token Expires</p>
            <p style={{ margin: 0, ...S.value }}>{expiry}</p>
          </div>
        </div>
        <div style={S.row}>
          <div>
            <p style={{ margin: 0, ...S.label }}>Authentication Method</p>
            <p style={{ margin: 0, ...S.value }}>JWT Bearer (HS256)</p>
          </div>
        </div>
      </div>

      {/* About */}
      <div style={S.card}>
        <h3 style={{ margin: '0 0 16px', color: '#1A5276' }}>About VaxWise</h3>
        {[
          { label: 'Version', value: 'v1.0.0' },
          { label: 'Platform', value: 'Biosecurity Operating System — South Africa' },
          { label: 'Compliance', value: 'DALRRD Aligned · POPIA Compliant' },
          { label: 'API', value: 'ASP.NET Core 10 — localhost:7232' },
        ].map(({ label, value }) => (
          <div key={label} style={S.row}>
            <div>
              <p style={{ margin: 0, ...S.label }}>{label}</p>
              <p style={{ margin: 0, ...S.value }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Danger zone */}
      <div style={{ ...S.card, border: '1px solid #FADBD8' }}>
        <h3 style={{ margin: '0 0 8px', color: '#C0392B' }}>Sign Out</h3>
        <p style={{ color: '#666', fontSize: '13px', marginBottom: '16px' }}>You will be returned to the login screen. Your data is saved.</p>
        <button onClick={handleLogout} style={{ background: '#E74C3C', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
          Sign Out
        </button>
      </div>
    </div>
  );
}
