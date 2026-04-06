import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Extract name from JWT claims
  const userName = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User';
  const userRole = user?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>

      {/* Sidebar */}
      <nav style={{
        width: '220px', background: '#1A5276', color: 'white',
        padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>🛡️ VaxWise</h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.7 }}>
            {userName} — {userRole}
          </p>
        </div>

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
        <Outlet />
      </main>
    </div>
  );
}