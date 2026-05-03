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
  background: 'rgba(201,133,11,0.15)', color: '#C9850B', borderLeft: '3px solid #C9850B',
};

const inactiveStyle = {
  display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px',
  borderRadius: '8px', textDecoration: 'none', fontSize: '14px', fontWeight: '400',
  color: 'rgba(255,255,255,0.6)', borderLeft: '3px solid transparent',
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
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Sidebar */}
      <nav style={{ width: '232px', minWidth: '232px', background: '#0B1F14', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <div style={{ width: '32px', height: '32px', background: '#C9850B', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>🛡️</div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '700', color: '#FFFFFF' }}>VaxWise</span>
          </div>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginLeft: '42px', letterSpacing: '0.6px', textTransform: 'uppercase' }}>Biosecurity OS · ZA</p>
        </div>

        {/* Farm Selector */}
        {needsFarmSelect && (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.28)', fontWeight: '600', letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>Active Farm</p>
            <select
              value={activeFarmId ?? ''}
              onChange={e => selectFarm(e.target.value || null)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: activeFarmId ? '1px solid rgba(201,133,11,0.45)' : '1px solid rgba(220,38,38,0.45)', background: 'rgba(255,255,255,0.05)', color: activeFarmId ? '#F5DFA0' : '#FCA5A5', fontSize: '13px', cursor: 'pointer', outline: 'none' }}
            >
              <option value="" style={{ background: '#0B1F14' }}>— Select a farm —</option>
              {farms.map(f => <option key={f.farmId} value={f.farmId} style={{ background: '#122910', color: '#fff' }}>{f.farmName}</option>)}
            </select>
            {!activeFarmId && <p style={{ fontSize: '10px', color: '#FCA5A5', marginTop: '5px' }}>Select a farm to continue</p>}
          </div>
        )}

        {/* Navigation */}
        <div style={{ flex: 1, padding: '14px 12px' }}>
          {NAV_GROUPS.map(group => (
            <div key={group.label} style={{ marginBottom: '22px' }}>
              <p style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.9px', textTransform: 'uppercase', padding: '0 6px', marginBottom: '4px' }}>{group.label}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {group.links.map(({ to, label, icon }) => (
                  <NavLink key={to} to={to} end={to === '/'}
                    style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                    <span style={{ fontSize: '11px', opacity: 0.6 }}>{icon}</span>
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}

          <div style={{ marginBottom: '8px' }}>
            <p style={{ fontSize: '10px', fontWeight: '600', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.9px', textTransform: 'uppercase', padding: '0 6px', marginBottom: '4px' }}>Admin</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {(hasRole('FarmOwner') || hasRole('Admin')) && (
                <NavLink to="/farms" style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                  <span style={{ fontSize: '11px', opacity: 0.6 }}>◧</span> Farms
                </NavLink>
              )}
              <NavLink to="/settings" style={({ isActive }) => isActive ? activeStyle : inactiveStyle}>
                <span style={{ fontSize: '11px', opacity: 0.6 }}>⊙</span> Settings
              </NavLink>
            </div>
          </div>
        </div>

        {/* User area */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#C9850B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', color: '#0B1F14', flexShrink: 0 }}>{initials}</div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</p>
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)' }}>{userRole}</p>
            </div>
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: 'rgba(220,38,38,0.12)', color: '#FCA5A5', border: '1px solid rgba(220,38,38,0.22)', borderRadius: '7px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, background: '#F0EBE1', overflowY: 'auto' }}>
        {needsFarmSelect && !activeFarmId ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '40px' }}>
            <div style={{ background: 'white', borderRadius: '20px', padding: '48px 40px', boxShadow: '0 4px 24px rgba(11,31,20,0.1)', textAlign: 'center', maxWidth: '400px' }}>
              <div style={{ width: '60px', height: '60px', background: '#F0EBE1', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', margin: '0 auto 20px' }}>🏡</div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '22px', color: '#0B1F14', marginBottom: '10px' }}>Select a Farm</h2>
              <p style={{ color: '#6E6B60', fontSize: '14px', lineHeight: '1.6' }}>Choose a farm from the sidebar to begin managing your livestock data.</p>
              {farms.length === 0 && <p style={{ color: '#DC2626', marginTop: '16px', fontSize: '13px' }}>No farms yet. Create one in Farms.</p>}
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
