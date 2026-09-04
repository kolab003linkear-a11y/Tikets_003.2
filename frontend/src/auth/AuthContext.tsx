import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { AuthResponse, AuthUser, createGuestSession, getMe, login, register, updateMe } from '../api/client';

const TOKEN_KEY = 'tiKets.auth.token';
const USER_KEY = 'tiKets.auth.user';

const isWeb = Platform.OS === 'web';

async function getStoredValue(key: string) {
  return isWeb ? globalThis.localStorage.getItem(key) : SecureStore.getItemAsync(key);
}

async function setStoredValue(key: string, value: string) {
  if (isWeb) globalThis.localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

async function deleteStoredValue(key: string) {
  if (isWeb) globalThis.localStorage.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
}

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  restoring: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInAdmin: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  startGuestSession: (email: string, fullName: string, phone: string) => Promise<AuthResponse>;
  updateProfile: (profile: { email: string; fullName?: string; phone?: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    Promise.all([getStoredValue(TOKEN_KEY), getStoredValue(USER_KEY)])
      .then(async ([storedToken, storedUser]) => {
        if (storedToken && storedUser) {
          try {
            const response = await getMe(storedToken);
            setToken(storedToken);
            setUser(response.user);
            console.log('[AuthContext] Restored session from storage:', response.user?.role);
          } catch (error) {
            console.error('[AuthContext] Failed to restore session:', error);
            // An expired session returns the app to anonymous browsing.
            await deleteStoredValue(TOKEN_KEY);
            await deleteStoredValue(USER_KEY);
          }
        }
      })
      .catch(() => {
        void deleteStoredValue(TOKEN_KEY);
        void deleteStoredValue(USER_KEY);
      })
      .finally(() => setRestoring(false));
  }, []);

  const saveSession = async (nextToken: string, nextUser: AuthUser) => {
    await Promise.all([setStoredValue(TOKEN_KEY, nextToken), setStoredValue(USER_KEY, JSON.stringify(nextUser))]);
    setToken(nextToken);
    setUser(nextUser);
  };

  const signIn = async (email: string, password: string) => {
    const response = await login(email, password);
    await saveSession(response.token, response.user);
  };

  const signInAdmin = async (email: string, password: string) => {
    const response = await login(email, password);
    if (response.user.role !== 'ADMIN') throw new Error('Estas credenciales no tienen acceso de administrador.');
    await saveSession(response.token, response.user);
  };

  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const response = await register(email, password, fullName, phone);
    await saveSession(response.token, response.user);
  };

  const startGuestSession = async (email: string, fullName: string, phone: string) => {
    const response = await createGuestSession(email, fullName, phone);
    await saveSession(response.token, response.user);
    return response;
  };

  const updateProfile = async (profile: { email: string; fullName?: string; phone?: string }) => {
    if (!token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
    const response = await updateMe(token, profile);
    await setStoredValue(USER_KEY, JSON.stringify(response.user));
    setUser(response.user);
  };

  const signOut = async () => {
    await Promise.all([deleteStoredValue(TOKEN_KEY), deleteStoredValue(USER_KEY)]);
    setToken(null);
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, token, restoring, signIn, signInAdmin, signUp, startGuestSession, updateProfile, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
