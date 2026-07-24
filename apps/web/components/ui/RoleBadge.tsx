import type { UserRole } from '@saas-starter/shared';

interface IRoleBadgeProps {
  role: UserRole;
}

const roleClasses: Record<UserRole, string> = {
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  user: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
};

export default function RoleBadge({ role }: Readonly<IRoleBadgeProps>) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${roleClasses[role]}`}
    >
      {role}
    </span>
  );
}
