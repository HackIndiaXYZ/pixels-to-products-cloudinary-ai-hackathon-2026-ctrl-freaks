'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Spinner } from './ui';

const TYPES = ['Demolition', 'Renovation', 'Deconstruction', 'Interior fit-out'] as const;

export function NewProjectForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') ?? ''),
      location: String(form.get('location') ?? ''),
      project_type: String(form.get('project_type') ?? '') || undefined,
      description: String(form.get('description') ?? ''),
    };
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { project?: { id: string }; error?: { message: string } };
      if (!res.ok || !body.project) throw new Error(body.error?.message ?? 'Could not create the project.');
      router.push(`/projects/${body.project.id}/upload`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the project.');
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6" noValidate>
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-bone-100">
          Project name
        </label>
        <input id="name" name="name" required minLength={2} maxLength={120} className="field" placeholder="Harbour Street office strip-out" autoFocus />
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="location" className="mb-2 block text-sm font-medium text-bone-100">
            Location <span className="font-normal text-bone-500">· optional</span>
          </label>
          <input id="location" name="location" maxLength={160} className="field" placeholder="Rotterdam, NL" />
        </div>
        <div>
          <label htmlFor="project_type" className="mb-2 block text-sm font-medium text-bone-100">
            Project type <span className="font-normal text-bone-500">· optional</span>
          </label>
          <select id="project_type" name="project_type" className="field" defaultValue="">
            <option value="">Select…</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium text-bone-100">
          Notes <span className="font-normal text-bone-500">· optional</span>
        </label>
        <textarea id="description" name="description" rows={4} maxLength={1000} className="field resize-y" placeholder="What is being taken out, and when?" />
      </div>
      {error ? (
        <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <>
            <Spinner /> Creating…
          </>
        ) : (
          'Create project and upload media'
        )}
      </Button>
    </form>
  );
}
