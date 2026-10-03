import { NextResponse } from 'next/server';
import { z } from 'zod';
import { route, readJson } from '@/lib/api';
import { store } from '@/lib/store';
import { listProjects } from '@/lib/data';

export const dynamic = 'force-dynamic';

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

const createProject = z.object({
  name: z.string().trim().min(2, 'Give the project a name.').max(120),
  location: optionalText(160),
  project_type: z.enum(['Demolition', 'Renovation', 'Deconstruction', 'Interior fit-out']).optional(),
  description: optionalText(1000),
});

export const GET = route(async () => {
  return NextResponse.json({ projects: await listProjects() });
});

export const POST = route(async (req) => {
  const input = createProject.parse(await readJson(req));
  const project = await store.createProject({
    name: input.name,
    location: input.location,
    project_type: input.project_type ?? null,
    description: input.description,
  });
  return NextResponse.json({ project }, { status: 201 });
});
