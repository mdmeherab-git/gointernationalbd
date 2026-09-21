import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { api, ApiError, getSessionToken, setSessionToken } from './api';
import type { CurrentUser } from './types';

type AuthState = {
  user: CurrentUser | null;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (input: { name: string; phone: string; email?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = await getSessionToken();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const data = await api.get<{ ok: boolean; user: CurrentUser }>('/api/auth/profile');
      setUser(data.user);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await setSessionToken(null);
      }
      setUser(null);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      await refreshUser();
      setLoading(false);
    })();
  }, [refreshUser]);

  const login = useCallback(async (phone: string, password: string) => {
    const data = await api.post<{ ok: boolean; user: CurrentUser; sessionToken: string }>('/api/auth/login', {
      phone,
      password,
    });
    await setSessionToken(data.sessionToken);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (input: { name: string; phone: string; email?: string; password: string }) => {
      await api.post('/api/auth/register', input);
      // Registration doesn't create a session on the website either — log
      // in immediately afterward so the mobile flow feels like one step.
      await login(input.phone, input.password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Still clear local state even if the network call fails.
    }
    await setSessionToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, refreshUser }),
    [user, loading, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
