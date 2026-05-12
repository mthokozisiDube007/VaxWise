import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getFarms } from '../api/farmsApi';
import { useMobile } from '../hooks/useMobile';
import {
  LayoutGrid, Beef, Syringe, Activity, FileText,
  Home, ShieldAlert, Settings, LogOut, ChevronDown,
  Menu, X,
} from 'lucide-react';

const FARM_FREE_ROUTES = ['/farms', '/settings', '/admin'];

const NAV_GROUPS = [
  {
    label: 'Core',
    links: [
      { to: '/', label: 'Dashboard', Icon: LayoutGrid },
      { to: '/animals', label: 'Animals', Icon: Beef },
    ],
  },
  {
    label: 'Management',
    links: [
      { to: '/vaccinations', label: 'Vaccinations', Icon: Syringe },
      { to: '/health', label: 'Health', Icon: Activity },
    ],
  },
  {
    label: 'Compliance',
    links: [
      { to: '/certificates', label: 'Certificates', Icon: FileText },
    ],
  },
];

export default function Layout() {
  const { user, logout, hasRole, activeFarmId, selectFarm } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  const userName = user?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || 'User';
  const userRole = user?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || '';
  const needsFarmSelect = hasRole('FarmOwner') || hasRole('Admin');
  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const farmGateActive = needsFarmSelect && !activeFarmId && !FARM_FREE_ROUTES.includes(pathname);

  const { data: farms = [] } = useQuery({ queryKey: ['farms'], queryFn: getFarms, enabled: needsFarmSelect });
  const activeFarmName = farms.find(f => f.farmId == activeFarmId)?.farmName;

  const handleLogout = () => { logout(); navigate('/login'); };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm border-l-2 transition-colors duration-150 ${
      isActive
        ? 'bg-teal-500/10 border-teal-500 text-teal-400 font-semibold'
        : 'border-transparent text-slate-500 hover:text-slate-300'
    }`;

  const Sidebar = (
    <nav className="w-[220px] min-w-[220px] bg-slate-800 border-r border-slate-700 flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-50 tracking-tight">VaxWise</div>
            <div className="text-[9px] text-slate-500 uppercase tracking-wide">Biosecurity · ZA</div>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto text-slate-500 hover:text-slate-300 p-1">
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Farm selector */}
      {needsFarmSelect && (
        <div className="px-4 py-3 border-b border-slate-700">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Active Farm</p>
          <div className="relative">
            <select
              value={activeFarmId ?? ''}
              onChange={e => selectFarm(e.target.value || null)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border appearance-none cursor-pointer outline-none focus:ring-1 focus:ring-teal-500 ${
                activeFarmId
                  ? 'border-teal-500/30 text-teal-400'
                  : 'border-red-500/30 text-red-400'
              }`}
            >
              <option value="">— Select a farm —</option>
              {farms.map(f => <option key={f.farmId} value={f.farmId}>{f.farmName}</option>)}
            </select>
            <Home size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          {!activeFarmId && <p className="text-[10px] text-red-400 mt-1">Select a farm to continue</p>}
        </div>
      )}

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 flex flex-col gap-1">
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="mb-3">
            <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1.5 mb-1">{group.label}</p>
            <div className="flex flex-col gap-0.5">
              {group.links.map(({ to, label, Icon }) => (
                <NavLink key={to} to={to} end={to === '/'} className={navLinkClass}>
                  <Icon size={15} strokeWidth={1.75} />
                  {label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        <div className="mb-2">
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest px-1.5 mb-1">Admin</p>
          <div className="flex flex-col gap-0.5">
            {(hasRole('FarmOwner') || hasRole('Admin')) && (
              <NavLink to="/farms" className={navLinkClass}>
                <Home size={15} strokeWidth={1.75} /> Farms
              </NavLink>
            )}
            {hasRole('Admin') && (
              <NavLink to="/admin" className={navLinkClass}>
                <ShieldAlert size={15} strokeWidth={1.75} /> Login Monitor
              </NavLink>
            )}
            <NavLink to="/settings" className={navLinkClass}>
              <Settings size={15} strokeWidth={1.75} /> Settings
            </NavLink>
          </div>
        </div>
      </div>

      {/* User area */}
      <div className="px-3.5 py-3 border-t border-slate-700">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-slate-900 font-bold text-xs shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-50 truncate">{userName}</p>
            <p className="text-xs text-slate-500">{userRole}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium bg-red-500/10 text-red-300 border border-red-500/20 rounded-lg hover:bg-red-500/15 transition-colors"
        >
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-40" />
      )}

      {/* Sidebar */}
      {isMobile ? (
        <div className={`fixed left-0 top-0 bottom-0 z-50 transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {Sidebar}
        </div>
      ) : Sidebar}

      {/* Main */}
      <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
        {/* Mobile top bar */}
        {isMobile && (
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 sticky top-0 z-30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-teal-500 rounded-lg flex items-center justify-center shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <span className="text-sm font-bold text-slate-50">VaxWise</span>
            </div>
            <div className="flex items-center gap-2">
              {needsFarmSelect && activeFarmId && (
                <span className="text-[11px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full border border-teal-500/20 max-w-[110px] truncate">
                  {activeFarmName || 'Farm'}
                </span>
              )}
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:text-slate-50">
                <Menu size={18} />
              </button>
            </div>
          </div>
        )}

        {farmGateActive ? (
          <div className="flex items-center justify-center flex-1 p-8">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center max-w-sm w-full">
              <div className="w-14 h-14 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Home size={24} className="text-slate-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-50 mb-2">Select a Farm</h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {isMobile ? 'Tap ☰ and choose a farm to begin.' : 'Choose a farm from the sidebar to begin managing your livestock data.'}
              </p>
              {farms.length === 0 && (
                <p className="text-red-400 text-xs mt-4">
                  No farms yet.{' '}
                  <NavLink to="/farms" className="text-teal-400 underline">Create one here.</NavLink>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className={isMobile ? 'p-4' : 'p-8'}>
            <Outlet />
          </div>
        )}
      </main>
    </div>
  );
}
