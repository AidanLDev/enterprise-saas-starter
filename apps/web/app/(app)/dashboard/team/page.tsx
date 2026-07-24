'use client';

import { useEffect, useOptimistic, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { apiFetch } from '@/lib/api';
import type { User, UserRole } from '@saas-starter/shared';
import ErrorText from '@/components/ui/Typography/ErrorText';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Table from '@/components/ui/Table';
import RoleBadge from '@/components/ui/RoleBadge';
import { usePaginatedFetch } from '@/hooks/usePaginatedFetch';

const ROLE_OPTIONS = [
  { value: 'user', label: 'User' },
  { value: 'admin', label: 'Admin' },
];

export default function TeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';

  const {
    data: users,
    setData: setUsers,
    lastKey,
    loading,
    error,
    setError,
    loadMore,
  } = usePaginatedFetch<User>('/admin/users', {
    enabled: isAdmin,
    errorMessage: 'Failed to load users',
  });
  const [optimisticUsers, addOptimisticUser] = useOptimistic(users, (current, newUser: User) => {
    return [...current.filter((u) => u.id !== newUser.id), newUser];
  });

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('user');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/dashboard');
  }, [user, router]);

  async function handleRoleChange(userId: string, newRole: UserRole) {
    try {
      await apiFetch(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    }
  }

  async function handleDeleteUser(userId: string) {
    try {
      await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  }

  async function handleInvite() {
    setInviting(true);
    setInviteMessage('');
    const email = inviteEmail;
    const role = inviteRole;
    const optimisticUser: User = {
      id: crypto.randomUUID(),
      email,
      role,
      createdAt: new Date().toISOString(),
    };
    addOptimisticUser(optimisticUser);
    try {
      await apiFetch('/admin/invite', {
        method: 'POST',
        body: JSON.stringify({ email, role }),
      });
      setUsers((prev) => [
        ...prev.filter((existingUser) => existingUser.id !== optimisticUser.id),
        optimisticUser,
      ]);
      setInviteMessage(`Invitation sent to ${email}`);
      setInviteEmail('');
      setInviteRole('user');
    } catch (err) {
      setInviteMessage(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  }

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Team</h1>
        <Button onClick={() => setShowInvite(!showInvite)} fullWidth={false} className="px-4">
          Invite user
        </Button>
      </div>

      {/* Invite form */}
      {showInvite && (
        <form
          action={handleInvite}
          className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50"
                placeholder="user@example.com"
              />
            </div>
            <div className="w-32">
              <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Role
              </label>
              <Select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                options={ROLE_OPTIONS}
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={inviting} fullWidth={false} className="px-4">
                {inviting ? 'Sending…' : 'Send invite'}
              </Button>
            </div>
          </div>
          {inviteMessage && (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{inviteMessage}</p>
          )}
        </form>
      )}

      {error && <ErrorText errorMessage={error} />}

      {/* Users table */}
      <Table
        columns={[
          {
            key: 'email',
            header: 'Email',
            render: (u) => <span className="text-zinc-900 dark:text-zinc-50">{u.email}</span>,
          },
          {
            key: 'role',
            header: 'Role',
            render: (u) => <RoleBadge role={u.role} />,
          },
          {
            key: 'joined',
            header: 'Joined',
            render: (u) => (
              <span className="text-zinc-500 dark:text-zinc-400">
                {new Date(u.createdAt).toLocaleDateString()}
              </span>
            ),
          },
          {
            key: 'actions',
            header: 'Actions',
            align: 'right',
            render: (u) =>
              u.email !== user?.email && (
                <div className="flex items-center justify-end gap-2">
                  <Select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                    options={ROLE_OPTIONS}
                    className="rounded border border-zinc-300 bg-transparent px-2 py-1 text-xs text-zinc-700 outline-none dark:border-zinc-700 dark:bg-zinc-700 dark:text-zinc-300"
                  />
                  <Button
                    onClick={() => handleDeleteUser(u.id)}
                    variant="danger"
                    size="sm"
                    fullWidth={false}
                    className="border border-red-300 bg-transparent dark:border-red-800"
                  >
                    Delete
                  </Button>
                </div>
              ),
          },
        ]}
        rows={optimisticUsers}
        rowKey={(u) => u.id}
        loading={loading}
        emptyMessage="No users found"
      />

      {lastKey && (
        <Button
          onClick={() => loadMore()}
          variant="secondary"
          className="border-zinc-300 dark:border-zinc-700"
        >
          Load more
        </Button>
      )}
    </div>
  );
}
