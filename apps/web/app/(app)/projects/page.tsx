'use client';

import { useCallback, useEffect, useState } from 'react';
import ProjectsHeader from '@/components/projects/ProjectsHeader';
import { useAuth } from '@/components/auth-provider';
import { apiFetch } from '@/lib/api';
import { Project } from '@saas-starter/shared';
import ErrorText from '@/components/ui/Typography/ErrorText';
import ProjectCard from '@/components/projects/ProjectCard';
import EditProjectModal from '@/components/projects/EditProjectModal';
import Button from '@/components/ui/Button';

interface ProjectsResponse {
  data: Project[];
  lastKey?: string;
}

export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [error, setError] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [lastKey, setLastKey] = useState<string | undefined>();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [search, setSearch] = useState('');

  const fetchProjects = useCallback(async (cursor?: string) => {
    try {
      const params = cursor ? `?lastKey=${cursor}` : '';
      const res = await apiFetch<ProjectsResponse>(`/projects${params}`);
      if (cursor) {
        setProjects((prev) => [...prev, ...res.data]);
      } else {
        setProjects(res.data);
      }
      setLastKey(res.lastKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await apiFetch(`/projects/${id}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleUpdate = useCallback(
    async (id: string, data: { projectName: string; projectDescription: string }) => {
      const res = await apiFetch<{ data: Project }>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setProjects((prev) => prev.map((p) => (p.id === id ? res.data : p)));
    },
    []
  );

  const filtered = search.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiFetch<ProjectsResponse>('/projects')
      .then((res) => {
        if (!cancelled) {
          setProjects(res.data);
          setLastKey(res.lastKey);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load projects');
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="flex flex-col gap-6 p-6">
      <ProjectsHeader onProjectCreated={() => fetchProjects()} />
      {error && <ErrorText errorMessage={error} />}

      {/* Search / filter bar */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          aria-label="Filter projects by title"
          placeholder="Filter projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-9 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800 sm:max-w-xs"
        />
        {search && (
          <button
            type="button"
            aria-label="Clear filter"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <svg width="13" height="13" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path
                d="M1 1l10 10M11 1L1 11"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>

      {filtered.length === 0 && !error && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {search ? `No projects match "${search}".` : 'No projects yet.'}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((proj) => (
          <ProjectCard
            key={proj.id}
            project={proj}
            isAdmin={isAdmin}
            onEdit={setEditingProject}
            onDelete={handleDelete}
          />
        ))}
      </div>
      {lastKey && !search && (
        <div className="flex justify-center">
          <Button onClick={() => fetchProjects(lastKey)}>Load more</Button>
        </div>
      )}
      <EditProjectModal
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSubmit={handleUpdate}
      />
    </div>
  );
}
