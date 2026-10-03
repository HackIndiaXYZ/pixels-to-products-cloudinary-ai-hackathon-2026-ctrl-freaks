import type { Metadata } from 'next';
import { NewProjectForm } from '@/components/NewProjectForm';
import { PageHeader } from '@/components/ui';

export const metadata: Metadata = { title: 'New project' };

export default function NewProjectPage() {
  return (
    <div className="animate-rise">
      <PageHeader eyebrow="Step 1 · Project" title="Start a new site" lead="Name the project. You will upload site media next." />
      <NewProjectForm />
    </div>
  );
}
