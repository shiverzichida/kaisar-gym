'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export interface UserAccount {
  id?: string;
  username: string;
  fullName: string;
  role: string;
  phone?: string;
  email?: string;
}

interface AuthContextType {
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  demoAccounts: UserAccount[];
  switchRole: (username: string) => Promise<UserAccount | null>;
  login: (username: string, password?: string) => Promise<UserAccount>;
  logout: () => void;
  loading: boolean;
}

const defaultUser: UserAccount = {
  username: 'owner',
  fullName: 'Kaisar Putra',
  role: 'Super Admin',
};

const AuthContext = createContext<AuthContextType>({
  currentUser: defaultUser,
  setCurrentUser: () => {},
  demoAccounts: [],
  switchRole: async () => null,
  login: async () => defaultUser,
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserAccount>(defaultUser);
  const [demoAccounts, setDemoAccounts] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Load persisted user on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kaisar_gym_user');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch {}

    // Fetch demo accounts
    apiFetch<UserAccount[]>('/auth/demo-accounts')
      .then((accs) => {
        if (Array.isArray(accs)) {
          setDemoAccounts(accs);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (username: string, password?: string): Promise<UserAccount> => {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (res?.user) {
        setCurrentUser(res.user);
        localStorage.setItem('kaisar_gym_user', JSON.stringify(res.user));
        if (res.accessToken) {
          localStorage.setItem('kaisar_gym_token', res.accessToken);
        }
        return res.user;
      }
      throw new Error('Gagal memverifikasi akun pengguna');
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem('kaisar_gym_user');
    localStorage.removeItem('kaisar_gym_token');
    setCurrentUser(defaultUser);
  }, []);

  const switchRole = useCallback(
    async (username: string): Promise<UserAccount | null> => {
      try {
        const user = await login(username, 'QUICK_DEMO');
        return user;
      } catch (err: any) {
        console.error('Gagal beralih role:', err.message || err);
      }
      return null;
    },
    [login],
  );

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        demoAccounts,
        switchRole,
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
