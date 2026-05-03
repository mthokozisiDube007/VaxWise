import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getFarms } from '../api/farmsApi';

const NAV_GROUPS = [
  {
    label: 'Core',
    links: [
      { to: '/', label: 'Dashboard', icon: '▦' },
      { to: '/animals', label: 'Animals', icon: '◈' },
    ],
  },
  {
    label: 'Management',
    links: [
      { to: '/vaccinations', label: 'Vaccinations', icon: '◉' },
      { to: '/health', label: 'Health', icon: '♥' },
    ],
  },
  {
    label: 'Compliance',
    links: [
      { to: '/certificates', label: 'Certificates', icon: '◑' },
    ],
  },
];

const activeStyle = {
  display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px',
  borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '600',
  background: 'rgba(34,197,94,0.12)', color: '#22C55E', borderLeft: '3px solid #22C55E',
};

const inactiveStyle = {
  display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px',
  borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '400',
  color: 'rgba(255,255,255,0.45)', borderLeft: '3px solid transparent',
  transition: 'color 0.15s',
};

export default function Layout() {
  const { user, logout, hasRole, activeFarmId, selectFarm } = useAuth();
  const navigate = useNavigate();

  const userName = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User';
  const userRole = user?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
  const needsFarmSelect = hasRole('FarmOwner') || hasRole('Admin');
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const { data: farms = [] } = useQuery({ queryKey: ['farms'], queryFn: getFarms, enabled: needsFarmSelect });

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif", background: '#111812' }}>

      {/* Sidebar */}
      <nav style={{ width: '232px', minWidth: '232px', background: '#0B1F14', display: 'flex', flexDirection: 'column', overflowY: 'auto', borderRight: '1px solid #1F3326' }}>

        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', background: '#22C55E', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🛡️</div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '700', color: '#F0EDE8' }}>VaxWise</span>
          </div>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', marginLeft: '42px', letterSpacing: '0.7px', textTransform: 'uppercase' }}>Biosecurity OS · ZA</p>
        </div>

        {/* Farm Selector */}
        {needsFarmSelect && (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)', fontWeight: '600', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>Active Farm</p>
            <select
              value={activeFarmId ?? ''}
              onChange={e => selectFarm(e.target.value || null)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: activeFarmId ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(239,68,68,0.35)', background: 'rgba(255,255,255,0.04)', color: activeFarmId ? '#86EFAC' : '#FCA5A5', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
            >
              <option value="" style={{ background: '#0B1F14' }}>— Select a farm —</option>
              {farms.map(f => <option key={f.farmId} value={f.farmId} style={{ background: '#0B1F14', color: '#F0EDE8' }}>{f.farmName}</option>)}
            </select>
            {!activeFarmId && <p style={{ fontSize: '10px', color: '#FCA5A5', marginTop: '5px' }}>Select a farm to continue</p>}
          </div>
        )}

        {/* Navigation */}
        <div style={{ flex: 1, padding: '14px 12px' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: '22px' }}>
              <p style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.9px', textTransform: 'uppercase', padding: '0 6px', marginBottom: '4px' }}>{group.label}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.links.map(({ to, label, icon }) => (
                  <NavLink key={to} to={to} end={to === '/'}
                    style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                    <span style={{ fontSize: '11px', opacity: 0.55 }}>{icon}</span>
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          <div style={{ marginBottom: '8px' }}>
            <p style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.9px', textTransform: 'uppercase', padding: '0 6px', marginBottom: '4px' }}>Admin</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {(hasRole('FarmOwner') || hasRole('Admin')) && (
                <NavLink to="/farms" style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                  <span style={{ fontSize: '11px', opacity: 0.55 }}>◧</span> Farms
                </NavLink>
              )}
              {hasRole('Admin') && (
                <NavLink to="/admin" style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                  <span style={{ fontSize: '11px', opacity: 0.55 }}>◎</span> Login Monitor
                </NavLink>
              )}
              <NavLink to="/settings" style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                <span style={{ fontSize: '11px', opacity: 0.55 }}>⊙</span> Settings
              </NavLink>
            </div>
          </div>
        </div>

        {/* User area */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', color: '#0B1F14', flexShrink: 0 }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#F0EDE8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{userRole}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', fontFamily: "'DM Sans', sans-serif" }}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, background: '#111812', overflowY: 'auto' }}>
        {needsFarmSelect && !activeFarmId ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
            <div style={{ background: '#1A2B1F', borderRadius: '20px', padding: '48px 40px', border: '1px solid #2D4A34', textAlign: 'center', maxWidth: '400px' }}>
              <div style={{ width: '60px', height: '60px', background: '#162219', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 20px', border: '1px solid #2D4A34' }}>🏡</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#F0EDE8', marginBottom: '10px' }}>Select a Farm</h2>
              <p style={{ color: '#8C8677', fontSize: '14px', lineHeight: '1.6' }}>Choose a farm from the sidebar to begin managing your livestock data.</p>
              {farms.length === 0 && <p style={{ color: '#EF4444', marginTop: '16px', fontSize: '13px' }}>No farms yet. Create one in Farms.</p>}
            </div>
          </div>
        ) : (
          <div style={{ padding: '36px 40px' }}>
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
