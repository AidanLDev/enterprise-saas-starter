'use client';

import { SubmitEvent, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../components/auth-provider';

const RESEND_COOLDOWN = 30;

function ResetPasswordForm() {
  const { confirmForgotPassword, forgotPassword, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCountdown = useCallback(() => {
    setCountdown(RESEND_COOLDOWN);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startCountdown();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startCountdown]);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setError('');
    try {
      await forgotPassword(email);
      startCountdown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await confirmForgotPassword(email, code, newPassword);
      await signIn(email, newPassword);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow dark:bg-zinc-900"
    >
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Set new password</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Enter the verification code sent to your email and choose a new password.
      </p>

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <label className="block space-y-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Verification code</span>
        <input
          type="text"
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm tracking-widest outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">New password</span>
        <input
          type="password"
          required
          minLength={8}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {submitting ? 'Resetting…' : 'Reset password'}
      </button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        {countdown > 0 ? (
          <>Resend code in {countdown}s</>
        ) : (
          <button
            type="button"
            disabled={resending}
            onClick={handleResend}
            className="font-medium text-zinc-900 hover:underline disabled:opacity-50 dark:text-zinc-50 cursor-pointer dark:hover:text-zinc-200"
          >
            {resending ? 'Resending…' : 'Resend code'}
          </button>
        )}
      </p>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/login" className="font-medium text-zinc-900 dark:text-zinc-50">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
