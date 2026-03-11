'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import * as auth from '../lib/auth';
import type { UserRole } from '@saas-starter/shared';

interface AuthUser {
  email: string;
  role: UserRole | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  resendConfirmationCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>;
  completeNewPassword: (newPassword: string) => Promise<void>;
  signOut: () => void;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function extractRole(payload: Record<string, unknown>): UserRole | null {
  const groups = payload['cognito:groups'] as string[] | undefined;
  if (groups?.includes('admin')) return 'admin';
  if (groups?.includes('user')) return 'user';
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(() => {
    return auth
      .getCurrentSession()
      .then((session) => {
        if (session) {
          const payload = session.getIdToken().decodePayload();
          setUser({ email: payload.email, role: extractRole(payload) });
        } else {
          setUser(null);
        }
      })
      .catch(() => {
        setUser(null);
      });
  }, []);

  useEffect(() => {
    refreshSession().finally(() => setLoading(false));
  }, [refreshSession]);

  // Proactively refresh tokens every 45 minutes (tokens expire after 60 min)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(
      () => {
        refreshSession();
      },
      45 * 60 * 1000
    );
    return () => clearInterval(interval);
  }, [user, refreshSession]);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const session = await auth.signIn(email, password);
    const payload = session.getIdToken().decodePayload();
    setUser({ email: payload.email, role: extractRole(payload) });
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string) => {
    await auth.signUp(email, password);
  }, []);

  const handleConfirmSignUp = useCallback(async (email: string, code: string) => {
    await auth.confirmSignUp(email, code);
  }, []);

  const handleResendConfirmationCode = useCallback(async (email: string) => {
    await auth.resendConfirmationCode(email);
  }, []);

  const handleForgotPassword = useCallback(async (email: string) => {
    await auth.forgotPassword(email);
  }, []);

  const handleConfirmForgotPassword = useCallback(
    async (email: string, code: string, newPassword: string) => {
      await auth.confirmForgotPassword(email, code, newPassword);
    },
    []
  );

  const handleCompleteNewPassword = useCallback(async (newPassword: string) => {
    const session = await auth.completeNewPassword(newPassword);
    const payload = session.getIdToken().decodePayload();
    setUser({ email: payload.email, role: extractRole(payload) });
  }, []);

  const handleSignOut = useCallback(() => {
    auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn: handleSignIn,
        signUp: handleSignUp,
        confirmSignUp: handleConfirmSignUp,
        resendConfirmationCode: handleResendConfirmationCode,
        forgotPassword: handleForgotPassword,
        confirmForgotPassword: handleConfirmForgotPassword,
        completeNewPassword: handleCompleteNewPassword,
        signOut: handleSignOut,
        getIdToken: auth.getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
