'use client';

import { useAuth } from '@/components/auth-provider';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Overview</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Signed in as{' '}
        <span className="font-medium text-zinc-900 dark:text-zinc-50">{user.email}</span>
      </p>
      {user.role && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Role:{' '}
          <span className="inline-flex rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {user.role}
          </span>
        </p>
      )}
    </div>
  );
}
