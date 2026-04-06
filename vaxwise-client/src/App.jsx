import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnimalsPage from './pages/AnimalsPage';
import VaccinationsPage from './pages/VaccinationsPage';
import HealthPage from './pages/HealthPage';
import Layout from './components/Layout';

// Protected route — redirects to login if not authenticated
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
      </Route>
    </Routes>
  );
}