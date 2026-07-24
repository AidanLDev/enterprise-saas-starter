'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import Button from '@/components/ui/Button';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import { apiFetch } from '@/lib/api';
import type { Project } from '@saas-starter/shared';

interface ProjectsHeaderProps {
  onProjectCreated?: () => void;
}

export default function ProjectsHeader({ onProjectCreated }: ProjectsHeaderProps) {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return <span>Loading...</span>;
  const isAdmin = user.role === 'admin';

  async function handleCreateProject(data: { projectName: string; projectDescription: string }) {
    setError(null);
    try {
      await apiFetch<{ data: Project }>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          projectName: data.projectName,
          projectDescription: data.projectDescription,
        }),
      });
      onProjectCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  }

  return (
    <div>
      <div className="flex w-full items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Projects</h1>
        {isAdmin && (
          <Button onClick={() => setIsModalOpen(true)} fullWidth={false} className="px-4">
            Create project
          </Button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}
