'use client';

import { SubmitEvent, useState } from 'react';
import Link from '@/app/components/ui/Link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../components/auth-provider';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Text from '@/app/components/ui/Text';

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signIn(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setSubmitting(false);
    }
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
