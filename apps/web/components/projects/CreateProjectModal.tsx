'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import TextArea from '@/components/ui/TextArea';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { projectName: string; projectDescription: string }) => void;
}

export default function CreateProjectModal({ isOpen, onClose, onSubmit }: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  function reset() {
    setProjectName('');
    setProjectDescription('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim()) return;
    onSubmit({ projectName: projectName.trim(), projectDescription: projectDescription.trim() });
    reset();
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New project" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          required
        />

        <TextArea
          label="Description"
          onChange={(e) => setProjectDescription(e.target.value)}
          value={projectDescription}
        />

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <div className="flex-1">
            <Button type="submit" disabled={!projectName.trim()}>
              Create project
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
