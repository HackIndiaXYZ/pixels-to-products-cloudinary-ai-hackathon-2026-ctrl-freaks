import type { Metadata } from 'next';
import Link from 'next/link';
import { EmptyState, LinkButton, PageHeader, SetupNeeded } from '@/components/ui';
import { attempt, listProjects } from '@/lib/data';

export const metadata: Metadata = { title: 'Projects' };
export const dynamic = 'force-dynamic';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default async function ProjectsPage() {
  const result = await attempt(listProjects);
  if (!result.ok) return <SetupNeeded message={result.error.message} />;
  const projects = result.data;

  return (
    <div className="animate-rise">
      <PageHeader
        eyebrow="Projects"
        title="Your sites"
        lead="Each project holds the media from one site and the materials found in it."
        actions={projects.length > 0 ? <LinkButton href="/projects/new">New project</LinkButton> : null}
      />
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          body="Create a project, upload photos from a demolition or renovation site, and see what could be saved."
          action={<LinkButton href="/projects/new">Create your first project</LinkButton>}
        />
      ) : (
        <ul className="divide-y divide-ink-700 border-y hairline">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="group grid gap-2 py-6 transition-colors hover:bg-ink-900 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-8 sm:px-4"
              >
                <div>
                  <h2 className="text-2xl transition-colors group-hover:text-accent">{p.name}</h2>
                  <p className="mt-1 text-sm text-bone-400">{[p.project_type, p.location].filter(Boolean).join(' · ') || 'No details added'}</p>
                </div>
                <p className="font-mono text-xs text-bone-400">
                  {plural(p.media_count, 'photo')} · {plural(p.material_count, 'material')} · {fmt(p.created_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
