import { NextResponse } from 'next/server';
import { z } from 'zod';
import { route, readJson } from '@/lib/api';
import { getImageResource } from '@/lib/cloudinary/client';
import { store } from '@/lib/store';
import { getProject } from '@/lib/data';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

const body = z.object({
  publicId: z.string().min(1).max(300),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  originalFilename: z.string().trim().max(200).optional(),
});

/** Register an asset the browser uploaded straight to Cloudinary. */
export const POST = route<{ params: Promise<{ id: string }> }>(async (req, ctx) => {
  const { id } = await ctx.params;
  const projectId = z.string().uuid().parse(id);
  const input = body.parse(await readJson(req));
  await getProject(projectId);

  // The signature pins uploads to this folder; reject anything else.
  if (!input.publicId.startsWith(`raw-reuse/${projectId}/`)) {
    throw new AppError(400, 'invalid_asset', 'That upload does not belong to this project.');
  }

  const existingAssets = await store.getMediaAssets(projectId);
  const existing = existingAssets.find((a) => a.cloudinary_public_id === input.publicId);
  if (existing) return NextResponse.json({ mediaAsset: existing });

  // Read the asset back from Cloudinary
  const resource = await getImageResource(input.publicId);

  const mediaAsset = await store.createMediaAsset({
    project_id: projectId,
    cloudinary_public_id: resource.public_id,
    cloudinary_asset_id: resource.asset_id,
    resource_type: 'image',
    secure_url: resource.secure_url,
    original_filename: input.originalFilename || resource.original_filename || null,
    mime_type: input.mimeType,
  });

  return NextResponse.json({ mediaAsset }, { status: 201 });
});
