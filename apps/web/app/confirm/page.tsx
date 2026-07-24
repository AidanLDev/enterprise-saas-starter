'use client';

import { SubmitEvent, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import Button from '@/components/ui/Button';

const RESEND_COOLDOWN = 30;

function ConfirmForm() {
  const { confirmSignUp, signIn, resendConfirmationCode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
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
      await resendConfirmationCode(email);
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
      await confirmSignUp(email, code);

      const pendingPassword = sessionStorage.getItem('pendingPassword');
      if (pendingPassword) {
        sessionStorage.removeItem('pendingPassword');
        await signIn(email, pendingPassword);
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Confirmation failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow dark:bg-zinc-900"
    >
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Confirm email</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        We sent a verification code to your email. Enter it below.
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

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Confirming…' : 'Confirm'}
      </Button>

      {/* TODO: Create Typeography components */}
      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        {countdown > 0 ? (
          <>Resend code in {countdown}s</>
        ) : (
          <Button
            type="button"
            variant="link"
            fullWidth={false}
            disabled={resending}
            onClick={handleResend}
            className="cursor-pointer"
          >
            {resending ? 'Resending…' : 'Resend code'}
          </Button>
        )}
      </p>
    </form>
  );
}

export default function ConfirmPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <ConfirmForm />
      </Suspense>
    </div>
  );
}
