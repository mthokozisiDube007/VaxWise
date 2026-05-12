import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Route-level code splitting — each page is a separate chunk loaded on demand
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AcceptInvitationPage = lazy(() => import('./pages/AcceptInvitationPage'));
const PublicVerifyPage = lazy(() => import('./pages/PublicVerifyPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const AnimalsPage = lazy(() => import('./pages/AnimalsPage'));
const VaccinationsPage = lazy(() => import('./pages/VaccinationsPage'));
const HealthPage = lazy(() => import('./pages/HealthPage'));
const CertificatesPage = lazy(() => import('./pages/CertificatesPage'));
const FarmsPage = lazy(() => import('./pages/FarmsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AnimalProfilePage = lazy(() => import('./pages/AnimalProfilePage'));

const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-500 text-sm">
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
        {/* Public routes — no auth required */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/accept" element={<AcceptInvitationPage />} />
        <Route path="/verify/:certId" element={<PublicVerifyPage />} />

        {/* Protected app routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="animals" element={<AnimalsPage />} />
          <Route path="animals/:id" element={<AnimalProfilePage />} />
          <Route path="vaccinations" element={<VaccinationsPage />} />
          <Route path="health" element={<HealthPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="farms" element={<FarmsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
