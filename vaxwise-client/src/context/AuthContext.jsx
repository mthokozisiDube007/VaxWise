import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [activeFarmId, setActiveFarmIdState] = useState(() => {
    const saved = localStorage.getItem('vaxwise_farm_id');
    return saved ? parseInt(saved) : null;
  });

  useEffect(() => {
    const savedToken = localStorage.getItem('vaxwise_token');
    if (savedToken) {
      try {
        const decoded = jwtDecode(savedToken);
        if (decoded.exp * 1000 > Date.now()) {
          setToken(savedToken);
          setUser(decoded);
        } else {
          localStorage.removeItem('vaxwise_token');
          localStorage.removeItem('vaxwise_farm_id');
        }
      } catch {
        localStorage.removeItem('vaxwise_token');
        localStorage.removeItem('vaxwise_farm_id');
      }
    }
  }, []);

  const login = (newToken) => {
    localStorage.setItem('vaxwise_token', newToken);
    const decoded = jwtDecode(newToken);
    setToken(newToken);
    setUser(decoded);
  };

  const logout = () => {
    localStorage.removeItem('vaxwise_token');
    localStorage.removeItem('vaxwise_farm_id');
    setToken(null);
    setUser(null);
    setActiveFarmIdState(null);
  };

  const selectFarm = (farmId) => {
    if (farmId) {
      localStorage.setItem('vaxwise_farm_id', farmId);
    } else {
      localStorage.removeItem('vaxwise_farm_id');
    }
    setActiveFarmIdState(farmId ? parseInt(farmId) : null);
  };

  const hasRole = (role) => {
    if (!user) return false;
    const userRole = user['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return userRole === role;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole, activeFarmId, selectFarm }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);