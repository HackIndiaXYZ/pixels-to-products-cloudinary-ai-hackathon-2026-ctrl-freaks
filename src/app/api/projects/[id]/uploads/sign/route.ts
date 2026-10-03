import { NextResponse } from 'next/server';
import { z } from 'zod';
import { route } from '@/lib/api';
import { createUploadSignature } from '@/lib/cloudinary/client';
import { getProject } from '@/lib/data';

export const dynamic = 'force-dynamic';

export const POST = route<{ params: Promise<{ id: string }> }>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const projectId = z.string().uuid().parse(id);
  await getProject(projectId); // 404 unless the project exists
  return NextResponse.json(createUploadSignature(projectId));
});
