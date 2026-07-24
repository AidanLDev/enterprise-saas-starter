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
import ResendCodeControl from '@/components/ui/ResendCodeControl';
import { useResendCountdown } from '@/hooks/useResendCountdown';

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

  const { countdown, resending, resend } = useResendCountdown({
    onResend: async () => {
      if (!email) return;
      setError('');
      try {
        await forgotPassword(email);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to resend code');
      }
    },
  });

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
    <AuthCard onSubmit={handleSubmit}>
      <Text variant="heading">Set new password</Text>
      <Text variant="body">
        Enter the verification code sent to your email and choose a new password.
      </Text>

      {error && <Text variant="error">{error}</Text>}

      <Input
        label="Email"
        value={email}
        required
        onChange={(e) => setEmail(e.target.value)}
        type="email"
      />

      <Input
        label="Verification code"
        value={code}
        required
        onChange={(e) => setCode(e.target.value)}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        className="tracking-widest"
      />

      <Input
        label="New password"
        value={newPassword}
        required
        minLength={8}
        onChange={(e) => setNewPassword(e.target.value)}
        type="password"
      />

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Resetting…' : 'Reset password'}
      </Button>

      <ResendCodeControl countdown={countdown} resending={resending} onResend={resend} />

      <Text variant="caption">
        <Link href="/login">Back to sign in</Link>
      </Text>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <ResetPasswordForm />
    </AuthLayout>
  );
}
