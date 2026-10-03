import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { PageHeader, SetupNeeded } from '@/components/ui';
import { ProjectInventory } from '@/components/ProjectInventory';
import { attempt, getProjectWorkspace } from '@/lib/data';

export const metadata: Metadata = { title: 'Project Workspace · RAW → REUSE' };
export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const result = await attempt(() => getProjectWorkspace(id));
  if (!result.ok) {
    if (result.error.code === 'not_found') notFound();
    return <SetupNeeded message={result.error.message} />;
  }
  const { project, media, materials, reuseRequests } = result.data;

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow={[project.project_type, project.location].filter(Boolean).join(' · ') || 'Construction Project'}
        title={project.name}
        lead={project.description ?? undefined}
      />

      <div className="mt-8">
        <ProjectInventory
          project={project}
          materials={materials}
          media={media}
          reuseRequests={reuseRequests}
        />
      </div>
    </div>
  );
}
