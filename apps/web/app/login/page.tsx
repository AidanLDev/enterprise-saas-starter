'use client';

import { SubmitEvent, useState } from 'react';
import Link from '@/components/ui/Link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { isNewPasswordRequired } from '../../lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Text from '@/components/ui/Typography/Text';

export default function LoginPage() {
  const { signIn, completeNewPassword } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New password challenge state (for invited users)
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (isNewPasswordRequired(err)) {
        setNeedsNewPassword(true);
      } else {
        setError(err instanceof Error ? err.message : 'Sign-in failed');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSetNewPassword(e: SubmitEvent) {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await completeNewPassword(newPassword);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set new password');
    } finally {
      setSubmitting(false);
    }
  }

  if (needsNewPassword) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <form
          onSubmit={handleSetNewPassword}
          className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow dark:bg-zinc-900"
        >
          <Text variant="heading">Set new password</Text>
          <Text variant="body">
            You were invited to join. Please set a new password to continue.
          </Text>

          {error && <Text variant="error">{error}</Text>}

          <Input
            label="New password"
            value={newPassword}
            required
            onChange={(e) => setNewPassword(e.target.value)}
            type="password"
          />

          <Input
            label="Confirm password"
            value={confirmPassword}
            required
            onChange={(e) => setConfirmPassword(e.target.value)}
            type="password"
          />

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Setting password…' : 'Set password'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-xl bg-white p-8 shadow dark:bg-zinc-900"
      >
        <Text variant="heading">Sign in</Text>

        {error && <Text variant="error">{error}</Text>}

        <Input
          label="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />

        <div>
          <Input
            label="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
          <Link
            href={
              email ? `/forgot-password?email=${encodeURIComponent(email)}` : '/forgot-password'
            }
          >
            <span className="mt-2">Forgot password?</span>
          </Link>
        </div>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
        <Text variant="caption">
          Don&apos;t have an account? <Link href="/signup">Sign up</Link>
        </Text>
      </form>
    </div>
  );
}
