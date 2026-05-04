import { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';
import { setToken, setFarmId, getToken } from '../api/tokenStore';
import { setUnauthorizedHandler } from '../api/axiosConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children, onLogout }) {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [activeFarmId, setActiveFarmIdState] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync('vaxwise_token');
        if (saved) {
          const decoded = jwtDecode(saved);
          if (decoded.exp * 1000 > Date.now()) {
            setToken(saved);
            setTokenState(saved);
            setUser(decoded);
          } else {
            await SecureStore.deleteItemAsync('vaxwise_token');
          }
        }
        const savedFarm = await SecureStore.getItemAsync('vaxwise_farm_id');
        if (savedFarm) {
          const id = parseInt(savedFarm);
          setFarmId(id);
          setActiveFarmIdState(id);
        }
      } catch {}
      setReady(true);
    })();

    setUnauthorizedHandler(async () => {
      await SecureStore.deleteItemAsync('vaxwise_token');
      await SecureStore.deleteItemAsync('vaxwise_farm_id');
      setToken(null);
      setFarmId(null);
      setTokenState(null);
      setUser(null);
      setActiveFarmIdState(null);
      if (onLogout) onLogout();
    });
  }, []);

  const login = async (newToken) => {
    await SecureStore.setItemAsync('vaxwise_token', newToken);
    const decoded = jwtDecode(newToken);
    setToken(newToken);
    setTokenState(newToken);
    setUser(decoded);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('vaxwise_token');
    await SecureStore.deleteItemAsync('vaxwise_farm_id');
    setToken(null);
    setFarmId(null);
    setTokenState(null);
    setUser(null);
    setActiveFarmIdState(null);
  };

  const selectFarm = async (farmId) => {
    if (farmId) {
      await SecureStore.setItemAsync('vaxwise_farm_id', String(farmId));
      setFarmId(parseInt(farmId));
      setActiveFarmIdState(parseInt(farmId));
    } else {
      await SecureStore.deleteItemAsync('vaxwise_farm_id');
      setFarmId(null);
      setActiveFarmIdState(null);
    }
  };

  const hasRole = (role) => {
    if (!user) return false;
    return user['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] === role;
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, hasRole, activeFarmId, selectFarm, ready }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
