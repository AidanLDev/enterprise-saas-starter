'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../components/auth-provider';

function NavLink({
  href,
  children,
  active,
}: {
  href: string;
  children: React.ReactNode;
  active: boolean;
}) {
  return (
    <a
      href={href}
      className={`block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50'
      }`}
    >
      {children}
    </a>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-zinc-50 font-sans dark:bg-black">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="p-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h2>
        </div>

        <nav className="flex-1 space-y-1 px-2">
          <NavLink href="/dashboard" active={pathname === '/dashboard'}>
            Overview
          </NavLink>
          {user.role === 'admin' && (
            <NavLink href="/dashboard/team" active={pathname === '/dashboard/team'}>
              Team
            </NavLink>
          )}
        </nav>

        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
          <button
            onClick={() => {
              signOut();
              router.push('/login');
            }}
            className="mt-2 w-full rounded-lg border border-zinc-300 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
