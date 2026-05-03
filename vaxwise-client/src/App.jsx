import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnimalsPage from './pages/AnimalsPage';
import VaccinationsPage from './pages/VaccinationsPage';
import HealthPage from './pages/HealthPage';
import CertificatesPage from './pages/CertificatesPage';
import FarmsPage from './pages/FarmsPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" />;
}

export default function App() {
  return (
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
  );
}