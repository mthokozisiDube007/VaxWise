import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Route-level code splitting — each page is a separate chunk loaded on demand
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnimalsPage = lazy(() => import('./pages/AnimalsPage'));
const VaccinationsPage = lazy(() => import('./pages/VaccinationsPage'));
const HealthPage = lazy(() => import('./pages/HealthPage'));
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'));
const FarmsPage = lazy(() => import('./pages/FarmsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#111812', color: '#8C8677', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}>
    Loading…
  </div>
);

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="animals" element={<AnimalsPage />} />
          <Route path="vaccinations" element={<VaccinationsPage />} />
          <Route path="health" element={<HealthPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="farms" element={<FarmsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
