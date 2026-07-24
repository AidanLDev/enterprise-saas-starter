'use client';

import { SubmitEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Text from '@/components/ui/Typography/Text';
import AuthLayout from '@/components/ui/AuthLayout';
import AuthCard from '@/components/ui/AuthCard';
import ResendCodeControl from '@/components/ui/ResendCodeControl';
import { useResendCountdown } from '@/hooks/useResendCountdown';

function ConfirmForm() {
  const { confirmSignUp, signIn, resendConfirmationCode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { countdown, resending, resend } = useResendCountdown({
    onResend: async () => {
      if (!email) return;
      setError('');
      try {
        await resendConfirmationCode(email);
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
    <AuthCard onSubmit={handleSubmit}>
      <Text variant="heading">Confirm email</Text>
      <Text variant="body">We sent a verification code to your email. Enter it below.</Text>

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

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Confirming…' : 'Confirm'}
      </Button>

      <ResendCodeControl countdown={countdown} resending={resending} onResend={resend} />
    </AuthCard>
  );
}

export default function ConfirmPage() {
  return (
    <AuthLayout>
      <ConfirmForm />
    </AuthLayout>
  );
}
