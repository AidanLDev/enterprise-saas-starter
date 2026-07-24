'use client';

import { useAuth } from '@/components/auth-provider';
import RoleBadge from '@/components/ui/RoleBadge';

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
          Role: <RoleBadge role={user.role} />
        </p>
      )}
    </div>
  );
}
