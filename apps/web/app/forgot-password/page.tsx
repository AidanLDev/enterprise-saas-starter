'use client';

import { SubmitEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../components/auth-provider';

function ForgotPasswordForm() {
  const { forgotPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(emailParam);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await forgotPassword(email);
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow dark:bg-zinc-900"
    >
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Reset password</h1>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Enter your email and we&apos;ll send you a verification code to reset your password.
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

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {submitting ? 'Sending code…' : 'Send reset code'}
      </button>

      <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/login" className="font-medium text-zinc-900 dark:text-zinc-50">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
