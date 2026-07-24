import { useEffect, useRef, useState } from 'react';

interface IUseResendCountdownOptions {
  seconds?: number;
  onResend: () => Promise<void>;
}

export function useResendCountdown({ seconds = 30, onResend }: IUseResendCountdownOptions) {
  const [countdown, setCountdown] = useState(seconds);
  const [resending, setResending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function runTimer() {
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
  }

  useEffect(() => {
    runTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // Runs once on mount to start the initial countdown; resend() restarts it explicitly.
  }, []);

  async function resend() {
    setResending(true);
    try {
      await onResend();
      setCountdown(seconds);
      runTimer();
    } finally {
      setResending(false);
    }
  }

  return { countdown, resending, resend };
}
