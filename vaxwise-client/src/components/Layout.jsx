import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getFarms } from '../api/farmsApi';

export default function Layout() {
  const { user, logout, hasRole, activeFarmId, selectFarm } = useAuth();
  const navigate = useNavigate();

  const userName = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User';
  const userRole = user?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
  const needsFarmSelect = hasRole('FarmOwner') || hasRole('Admin');

  const { data: farms = [] } = useQuery({
    queryKey: ['farms'],
    queryFn: getFarms,
    enabled: needsFarmSelect,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>

      {/* Sidebar */}
      <nav style={{
        width: '220px', background: '#1A5276', color: 'white',
        padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>🛡️ VaxWise</h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.7 }}>
            {userName} — {userRole}
          </p>
        </div>

        {/* Farm selector — FarmOwner and Admin only */}
        {needsFarmSelect && (
          <div style={{ marginBottom: '8px' }}>
            <label style={{ fontSize: '11px', opacity: 0.7, display: 'block', marginBottom: '4px' }}>
              ACTIVE FARM
            </label>
            <select
              value={activeFarmId ?? ''}
              onChange={(e) => selectFarm(e.target.value || null)}
              style={{
                width: '100%', padding: '6px 8px', borderRadius: '6px',
                border: activeFarmId ? '1px solid #2980B9' : '1px solid #E74C3C',
                background: '#154360', color: 'white', fontSize: '13px', cursor: 'pointer'
              }}
            >
              <option value="">— Select a farm —</option>
              {farms.map((f) => (
                <option key={f.farmId} value={f.farmId}>{f.farmName}</option>
              ))}
            </select>
            {!activeFarmId && (
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#E74C3C' }}>
                Select a farm to continue
              </p>
            )}
          </div>
        )}

        {[
          { to: '/', label: '📊 Dashboard' },
          { to: '/animals', label: '🐄 Animals' },
          { to: '/vaccinations', label: '💉 Vaccinations' },
          { to: '/health', label: '🏥 Health' },
        ].map(({ to, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              color: 'white', textDecoration: 'none',
              padding: '10px 12px', borderRadius: '6px',
              background: isActive ? '#154360' : 'transparent',
              fontSize: '14px'
            })}>
            {label}
          </NavLink>
        ))}

        <button onClick={handleLogout} style={{
          marginTop: 'auto', background: '#922B21', color: 'white',
          border: 'none', padding: '10px', borderRadius: '6px',
          cursor: 'pointer', fontSize: '14px'
        }}>
          Logout
        </button>
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, padding: '32px', background: '#F4F6F7' }}>
        {/* Block content for FarmOwner/Admin until a farm is selected */}
        {needsFarmSelect && !activeFarmId ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '60vh', gap: '16px'
          }}>
            <div style={{
              background: 'white', borderRadius: '12px', padding: '40px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center', maxWidth: '400px'
            }}>
              <p style={{ fontSize: '40px', margin: '0 0 16px' }}>🏡</p>
              <h2 style={{ color: '#1A5276', margin: '0 0 8px' }}>Select a Farm</h2>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                Choose a farm from the sidebar to start managing your livestock data.
              </p>
              {farms.length === 0 && (
                <p style={{ color: '#E74C3C', marginTop: '16px', fontSize: '13px' }}>
                  No farms found. Create a farm first.
                </p>
              )}
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
