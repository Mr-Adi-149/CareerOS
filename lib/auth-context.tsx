'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type UserRole = 'candidate' | 'recruiter';

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  companyName?: string;
};

type StoredUser = AuthUser & { password: string };
type AuthResult = { success: true } | { success: false; error: string };

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => AuthResult;
  register: (input: Omit<StoredUser, 'id'>) => AuthResult;
  logout: () => void;
};

const USERS_KEY = 'db_users';
const SESSION_KEY = 'active_session';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const isUser = (value: unknown): value is AuthUser => {
  if (!value || typeof value !== 'object') return false;
  const user = value as AuthUser;
  return typeof user.id === 'string' && typeof user.username === 'string' && typeof user.email === 'string' && (user.role === 'candidate' || user.role === 'recruiter');
};

function readUsers(): StoredUser[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    return Array.isArray(value) ? value.filter((user): user is StoredUser => isUser(user) && typeof (user as { password?: unknown }).password === 'string') : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      setUser(isUser(stored) ? stored : null);
    } catch {
      localStorage.removeItem(SESSION_KEY);
    } finally {
      setHydrated(true);
    }

    const syncSession = (event: StorageEvent) => {
      if (event.key !== SESSION_KEY) return;
      try {
        const next: unknown = event.newValue ? JSON.parse(event.newValue) : null;
        setUser(isUser(next) ? next : null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener('storage', syncSession);
    return () => window.removeEventListener('storage', syncSession);
  }, []);

  const establishSession = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
  }, []);

  const register = useCallback((input: Omit<StoredUser, 'id'>): AuthResult => {
    const users = readUsers();
    const email = input.email.trim().toLowerCase();
    if (users.some((item) => item.email.toLowerCase() === email)) {
      return { success: false, error: 'An account with this email already exists.' };
    }
    const companyName = input.role === 'recruiter' ? input.companyName?.trim() : undefined;
    if (input.role === 'recruiter' && !companyName) {
      return { success: false, error: 'Company name is required for recruiter accounts.' };
    }
    const storedUser: StoredUser = { ...input, id: crypto.randomUUID(), email, username: input.username.trim(), companyName };
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, storedUser]));
    const session: AuthUser = { id: storedUser.id, username: storedUser.username, email: storedUser.email, role: storedUser.role, companyName: storedUser.companyName };
    establishSession(session);
    return { success: true };
  }, [establishSession]);

  const login = useCallback((email: string, password: string): AuthResult => {
    const existing = readUsers().find((item) => item.email.toLowerCase() === email.trim().toLowerCase());
    if (!existing || existing.password !== password) return { success: false, error: 'Email or password is incorrect.' };
    const session: AuthUser = { id: existing.id, username: existing.username, email: existing.email, role: existing.role, companyName: existing.companyName };
    establishSession(session);
    return { success: true };
  }, [establishSession]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const value = useMemo(() => ({ user, hydrated, isAuthenticated: Boolean(user), login, register, logout }), [user, hydrated, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
