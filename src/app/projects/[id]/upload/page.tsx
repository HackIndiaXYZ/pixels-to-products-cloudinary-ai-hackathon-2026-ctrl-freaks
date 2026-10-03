import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { UploadStudio } from '@/components/UploadStudio';
import { PageHeader, SetupNeeded } from '@/components/ui';
import { attempt, getProject } from '@/lib/data';

export const metadata: Metadata = { title: 'Upload site media' };
export const dynamic = 'force-dynamic';

export default async function UploadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const result = await attempt(() => getProject(id));
  if (!result.ok) {
    if (result.error.code === 'not_found') notFound();
    return <SetupNeeded message={result.error.message} />;
  }
  const project = result.data;

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow={`Step 2 · ${project.name}`}
        title="Upload site media"
        lead="Each photo is stored in Cloudinary, then analyzed by Cloudinary AI Vision. Results are saved to this project."
        actions={
          <Link href={`/projects/${project.id}`} className="text-sm font-medium text-bone-300 transition-colors hover:text-bone-50">
            Project overview →
          </Link>
        }
      />
      <UploadStudio projectId={project.id} />
    </div>
  );
}
