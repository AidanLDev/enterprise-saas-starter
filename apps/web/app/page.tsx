'use client';

import Link from 'next/link';
import { useAuth } from '@/components/auth-provider';

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center gap-8 p-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          SaaS Starter
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          A production-grade SaaS skeleton. Auth, API, database, and infrastructure — ready to go.
        </p>

        {!loading && (
          <div className="flex flex-col gap-3 sm:flex-row">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
