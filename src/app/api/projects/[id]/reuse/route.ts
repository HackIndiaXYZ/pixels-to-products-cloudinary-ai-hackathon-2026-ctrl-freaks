import { NextResponse } from 'next/server';
import { z } from 'zod';
import { route, readJson } from '@/lib/api';
import { store } from '@/lib/store';
import { getProject } from '@/lib/data';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  title: z.string().trim().min(2, 'Provide a title for the reuse request.').max(140),
  description: z.string().trim().min(5, 'Provide a description of the second-life concept.').max(1000),
  style: z.string().trim().max(100).optional(),
  target_dimensions: z.string().trim().max(120).optional(),
  budget_text: z.string().trim().max(100).optional(),
});

export const GET = route<{ params: Promise<{ id: string }> }>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const projectId = z.string().uuid().parse(id);
  await getProject(projectId);
  const requests = await store.listReuseRequests(projectId);
  return NextResponse.json({ requests });
});

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, ctx) => {
  const { id } = await ctx.params;
  const projectId = z.string().uuid().parse(id);
  await getProject(projectId);
  const input = bodySchema.parse(await readJson(req));

  const result = await store.createReuseRequest({
    project_id: projectId,
    title: input.title,
    description: input.description,
    style: input.style ?? null,
    target_dimensions: input.target_dimensions ?? null,
    budget_text: input.budget_text ?? null,
  });

  return NextResponse.json(result, { status: 201 });
});
