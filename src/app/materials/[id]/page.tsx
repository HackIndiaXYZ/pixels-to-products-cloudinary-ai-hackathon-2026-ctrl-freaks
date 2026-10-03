import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import Link from 'next/link';
import { PageHeader, SetupNeeded } from '@/components/ui';
import { ReuseStudio } from '@/components/ReuseStudio';
import { attempt, getMaterialDetail } from '@/lib/data';
import { labelize } from '@/lib/taxonomy';

export const metadata: Metadata = { title: 'Material Reuse Studio · RAW → REUSE' };
export const dynamic = 'force-dynamic';

export default async function MaterialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const result = await attempt(() => getMaterialDetail(id));
  if (!result.ok) {
    if (result.error.code === 'not_found') notFound();
    return <SetupNeeded message={result.error.message} />;
  }
  const { material, project, mediaAsset, concepts } = result.data;

  return (
    <div className="animate-rise space-y-8">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="font-mono text-xs text-bone-400 hover:text-accent transition-colors mb-3 inline-block"
        >
          ← Back to {project.name}
        </Link>
        <PageHeader
          eyebrow={`${project.name} · ${labelize(material.material_type)}`}
          title={`Reclaimed ${labelize(material.material_type)}`}
          lead="Visual inspection report and second-life concept visualization studio."
        />
      </div>

      <ReuseStudio
        material={material}
        project={project}
        mediaAsset={mediaAsset}
        initialConcepts={concepts}
      />
    </div>
  );
}
