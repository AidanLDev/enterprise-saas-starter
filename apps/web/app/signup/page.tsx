'use client';

import { SubmitEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Text from '@/components/ui/Typography/Text';
import AuthLayout from '@/components/ui/AuthLayout';
import AuthCard from '@/components/ui/AuthCard';
import Link from '@/components/ui/Link';

export default function SignUpPage() {
  const { signUp } = useAuth();
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
      await signUp(email, password);
      sessionStorage.setItem('pendingPassword', password);
      router.push(`/confirm?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Sign-up failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <AuthCard onSubmit={handleSubmit}>
        <Text variant="heading">Create account</Text>

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
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
          <Text variant="body" className="mt-1 text-xs">
            Min 8 characters, uppercase, lowercase, digit
          </Text>
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </Button>

        <Text variant="caption">
          Already have an account? <Link href="/login">Sign in</Link>
        </Text>
      </AuthCard>
    </AuthLayout>
  );
}
