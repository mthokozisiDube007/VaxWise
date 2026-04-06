import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // On app load check if token exists in localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('vaxwise_token');
    if (savedToken) {
      try {
        const decoded = jwtDecode(savedToken);
        // Check if token is expired
        if (decoded.exp * 1000 > Date.now()) {
          setToken(savedToken);
          setUser(decoded);
        } else {
          localStorage.removeItem('vaxwise_token');
        }
      } catch {
        localStorage.removeItem('vaxwise_token');
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
    setToken(null);
    setUser(null);
  };

  // Helper to check user role
  const hasRole = (role) => {
    if (!user) return false;
    const userRole = user['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
    return userRole === role;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);