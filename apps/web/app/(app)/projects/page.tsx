'use client';

import { useCallback, useState } from 'react';
import ProjectsHeader from '@/components/projects/ProjectsHeader';
import { useAuth } from '@/components/auth-provider';
import { apiFetch } from '@/lib/api';
import { Project } from '@saas-starter/shared';
import ErrorText from '@/components/ui/Typography/ErrorText';
import ProjectCard from '@/components/projects/ProjectCard';
import EditProjectModal from '@/components/projects/EditProjectModal';
import Button from '@/components/ui/Button';
import { SearchIcon } from '@/components/icons/SearchIcon';
import { CloseIcon } from '@/components/icons/CloseIcon';
import { usePaginatedFetch } from '@/hooks/usePaginatedFetch';

export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const {
    data: projects,
    setData: setProjects,
    lastKey,
    error,
    loadMore,
    refetch,
  } = usePaginatedFetch<Project>('/projects', {
    enabled: !!user,
    errorMessage: 'Failed to load projects',
  });
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [search, setSearch] = useState('');

  const handleDelete = useCallback(
    async (id: string) => {
      await apiFetch(`/projects/${id}`, { method: 'DELETE' });
      setProjects((prev) => prev.filter((p) => p.id !== id));
    },
    [setProjects]
  );

  const handleUpdate = useCallback(
    async (id: string, data: { projectName: string; projectDescription: string }) => {
      const res = await apiFetch<{ data: Project }>(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      setProjects((prev) => prev.map((p) => (p.id === id ? res.data : p)));
    },
    [setProjects]
  );

  const filtered = search.trim()
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    : projects;

  return (
    <div className="flex flex-col gap-6 p-6">
      <ProjectsHeader onProjectCreated={() => refetch()} />
      {error && <ErrorText errorMessage={error} />}

      {/* Search / filter bar */}
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
        <input
          type="search"
          aria-label="Filter projects by title"
          placeholder="Filter projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-9 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus:border-zinc-500 dark:focus:ring-zinc-800 sm:max-w-xs"
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            fullWidth={false}
            aria-label="Clear filter"
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 h-auto w-auto -translate-y-1/2 bg-transparent p-0.5 hover:bg-transparent dark:hover:bg-transparent"
          >
            <CloseIcon width="13" height="13" />
          </Button>
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
          <Button onClick={() => loadMore()}>Load more</Button>
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
