'use client';

import { useState } from 'react';
import { Project } from '@saas-starter/shared';
import Button from '@/components/ui/Button';
import { FolderIcon } from '@/components/icons/FolderIcon';
import { PencilIcon } from '@/components/icons/PencilIcon';
import { TrashIcon } from '@/components/icons/TrashIcon';

interface IProjectCard {
  project: Project;
  isAdmin: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => Promise<void>;
}

export default function ProjectCard({
  project,
  isAdmin,
  onEdit,
  onDelete,
}: Readonly<IProjectCard>) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formattedDate = new Date(project.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete?.(project.id);
    } finally {
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:shadow-zinc-950/40">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <FolderIcon />
          </span>
          <h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {project.name}
          </h2>
        </div>

        {/* Actions — always visible on mobile, hover-revealed on desktop */}
        {isAdmin && (
          <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
            {confirming ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth={false}
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                  className="border-0 px-2 py-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth={false}
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting…' : 'Confirm'}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  onClick={() => onEdit?.(project)}
                  aria-label={`Edit ${project.name}`}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  fullWidth={false}
                  onClick={handleDelete}
                  aria-label={`Delete ${project.name}`}
                  className="hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                >
                  <TrashIcon />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      {project.description ? (
        <p className="line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
          {project.description}
        </p>
      ) : (
        <p className="text-sm italic text-zinc-400 dark:text-zinc-600">No description</p>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-1">
        <time dateTime={project.createdAt} className="text-xs text-zinc-400 dark:text-zinc-500">
          Created {formattedDate}
        </time>
      </div>
    </div>
  );
}
