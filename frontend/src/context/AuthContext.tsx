import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import type { MenuItem, User } from '../types';

interface AuthContextProps {
  user: User | null;
  token: string | null;
  menuItems: MenuItem[];
  loading: boolean;
  login: (login: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  refreshMenu: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('menuItems');
    return saved ? JSON.parse(saved) : [];
  });

  // Si ya tenemos token y usuario en caché, no bloqueamos la interfaz con pantalla de carga
  const [loading, setLoading] = useState<boolean>(() => {
    return !localStorage.getItem('token');
  });

  // Carga del menú dinámico según el Rol del usuario (Req. 2)
  const fetchMenu = async () => {
    try {
      const res = await api.get('/auth/menu');
      if (res.data.success) {
        setMenuItems(res.data.menu);
        localStorage.setItem('menuItems', JSON.stringify(res.data.menu));
      }
    } catch (err) {
      console.error('Error al cargar menú dinámico:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          // Consultar sesión y menú en paralelo para máxima velocidad
          const [resMe, resMenu] = await Promise.all([
            api.get('/auth/me'),
            api.get('/auth/menu')
          ]);

          if (resMe.data.success) {
            setUser(resMe.data.user);
            localStorage.setItem('user', JSON.stringify(resMe.data.user));
          }
          if (resMenu.data.success) {
            setMenuItems(resMenu.data.menu);
            localStorage.setItem('menuItems', JSON.stringify(resMenu.data.menu));
          }
        } catch {
          setUser(null);
          setToken(null);
          setMenuItems([]);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          localStorage.removeItem('menuItems');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (loginInput: string, pass: string) => {
    try {
      const res = await api.post('/auth/login', {
        login: loginInput,
        password: pass,
      });

      if (res.data.success) {
        const t = res.data.token;
        const u = res.data.user;
        setToken(t);
        setUser(u);
        localStorage.setItem('token', t);
        localStorage.setItem('user', JSON.stringify(u));
        await fetchMenu();
        return { success: true, message: res.data.message };
      }
      return { success: false, message: res.data.message || 'Error de autenticación' };
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error de conexión con el servidor.';
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setToken(null);
      setMenuItems([]);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('menuItems');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        menuItems,
        loading,
        login,
        logout,
        refreshMenu: fetchMenu,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
