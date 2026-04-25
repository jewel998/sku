import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AuthService, type AuthState } from '../services/authService';
import { firebaseClient } from '../services/firebaseClient';

interface AuthContextValue extends AuthState {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const services = firebaseClient.getServices();
const authService = new AuthService(
  services?.auth ?? null,
  services?.db ?? null,
  services?.googleProvider ?? null,
);

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => authService.getState());

  useEffect(() => authService.subscribe(setState), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signIn: () => authService.signIn(),
      signOut: () => authService.signOut(),
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
