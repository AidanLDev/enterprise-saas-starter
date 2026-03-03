'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import * as auth from '../lib/auth';

interface AuthUser {
  email: string;
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
  signOut: () => void;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auth
      .getCurrentSession()
      .then((session) => {
        if (session) {
          const payload = session.getIdToken().decodePayload();
          setUser({ email: payload.email });
        }
      })
      .catch(() => {
        // No valid session — that's fine
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const session = await auth.signIn(email, password);
    const payload = session.getIdToken().decodePayload();
    setUser({ email: payload.email });
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
