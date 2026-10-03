import { NextResponse } from 'next/server';
import { z } from 'zod';
import { route, readJson } from '@/lib/api';
import { store } from '@/lib/store';
import { AppError } from '@/lib/errors';
import { generateConceptsForMaterial } from '@/lib/concept-generator';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  prompt: z.string().trim().min(3).max(500),
  reuseRequestId: z.string().uuid().optional().nullable(),
});

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, ctx) => {
  const { id } = await ctx.params;
  const materialId = z.string().uuid().parse(id);
  const material = await store.getMaterial(materialId);
  if (!material) throw new AppError(404, 'not_found', 'Material not found.');

  const mediaAsset = await store.getMediaAsset(material.media_asset_id);
  if (!mediaAsset) throw new AppError(404, 'not_found', 'Source media asset not found.');

  const input = bodySchema.parse(await readJson(req));
  const conceptDrafts = generateConceptsForMaterial(
    material,
    mediaAsset,
    input.prompt,
    input.reuseRequestId ?? null,
  );

  const concepts = await store.saveConcepts(conceptDrafts);
  return NextResponse.json({ concepts }, { status: 201 });
});
