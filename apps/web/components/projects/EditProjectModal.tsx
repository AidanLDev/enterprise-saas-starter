'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';
import type { Project } from '@saas-starter/shared';

interface EditProjectModalProps {
  project: Project | null;
  onClose: () => void;
  onSubmit: (
    id: string,
    data: { projectName: string; projectDescription: string }
  ) => Promise<void>;
}

interface EditFormProps {
  project: Project;
  onClose: () => void;
  onSubmit: EditProjectModalProps['onSubmit'];
}

function EditForm({ project, onClose, onSubmit }: EditFormProps) {
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!projectName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(project.id, {
        projectName: projectName.trim(),
        projectDescription: projectDescription.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Project name"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        required
      />
      <TextArea
        label="Description"
        value={projectDescription}
        onChange={(e) => setProjectDescription(e.target.value)}
      />
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2 pt-1">
        <div className="flex-1">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
        </div>
        <div className="flex-1">
          <Button type="submit" disabled={!projectName.trim() || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default function EditProjectModal({ project, onClose, onSubmit }: EditProjectModalProps) {
  return (
    <Modal isOpen={!!project} onClose={onClose} title="Edit project" size="md">
      {project && (
        <EditForm key={project.id} project={project} onClose={onClose} onSubmit={onSubmit} />
      )}
    </Modal>
  );
}
