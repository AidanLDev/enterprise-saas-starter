'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';
import Button from '@/components/ui/Button';

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

export function SidebarNav() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!user) return null;

  return (
    <aside className="flex w-56 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="p-4">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h2>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        <NavLink href="/dashboard" active={pathname === '/dashboard'}>
          Overview
        </NavLink>
        <NavLink href="/projects" active={pathname === '/projects'}>
          Projects
        </NavLink>
        {user.role === 'admin' && (
          <NavLink href="/dashboard/team" active={pathname === '/dashboard/team'}>
            Team
          </NavLink>
        )}
      </nav>

      <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
        <Button
          onClick={() => {
            signOut();
            router.push('/login');
          }}
          variant="secondary"
          size="sm"
          className="mt-2 border-zinc-300 py-1.5 dark:border-zinc-700"
        >
          Sign out
        </Button>
      </div>
    </aside>
  );
}
