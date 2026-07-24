'use client';

import { SubmitEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Text from '@/components/ui/Typography/Text';
import AuthLayout from '@/components/ui/AuthLayout';
import AuthCard from '@/components/ui/AuthCard';
import Link from '@/components/ui/Link';

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
    <AuthCard onSubmit={handleSubmit}>
      <Text variant="heading">Reset password</Text>
      <Text variant="body">
        Enter your email and we&apos;ll send you a verification code to reset your password.
      </Text>

      {error && <Text variant="error">{error}</Text>}

      <Input
        label="Email"
        value={email}
        required
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Sending code…' : 'Send reset code'}
      </Button>

      <Text variant="caption">
        <Link href="/login">Back to sign in</Link>
      </Text>
    </AuthCard>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
