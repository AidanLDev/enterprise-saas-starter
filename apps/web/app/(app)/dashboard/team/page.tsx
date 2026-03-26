'use client';

import { useCallback, useEffect, useOptimistic, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../components/auth-provider';
import { apiFetch } from '../../../lib/api';
import type { User, UserRole } from '@saas-starter/shared';

interface UsersResponse {
  data: User[];
  lastKey?: string;
}

export default function TeamPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [optimisticUsers, addOptimisticUser] = useOptimistic(users, (current, newUser: User) => {
    return [...current.filter((u) => u.id !== newUser.id), newUser];
  });
  const [lastKey, setLastKey] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('user');
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');

  const fetchUsers = useCallback(async (cursor?: string) => {
    try {
      const params = cursor ? `?lastKey=${cursor}` : '';
      const res = await apiFetch<UsersResponse>(`/admin/users${params}`);
      if (cursor) {
        setUsers((prev) => [...prev, ...res.data]);
      } else {
        setUsers(res.data);
      }
      setLastKey(res.lastKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    if (user) fetchUsers();
  }, [user, router, fetchUsers]);

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
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Invite user
        </button>
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
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:text-zinc-50"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={inviting}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                {inviting ? 'Sending…' : 'Send invite'}
              </button>
            </div>
          </div>
          {inviteMessage && (
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{inviteMessage}</p>
          )}
        </form>
      )}

      {error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Users table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                Email
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                Role
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                Joined
              </th>
              <th className="px-4 py-3 text-right font-medium text-zinc-500 dark:text-zinc-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  Loading…
                </td>
              </tr>
            ) : optimisticUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No users found
                </td>
              </tr>
            ) : (
              optimisticUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/50"
                >
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-50">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {u.email !== user?.email && (
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="rounded border border-zinc-300 bg-transparent px-2 py-1 text-xs text-zinc-700 outline-none dark:border-zinc-700 dark:text-zinc-300"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {lastKey && (
        <button
          onClick={() => fetchUsers(lastKey)}
          className="w-full rounded-lg border border-zinc-300 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Load more
        </button>
      )}
    </div>
  );
}
