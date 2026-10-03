import { NextResponse } from 'next/server';
import { z } from 'zod';
import { route } from '@/lib/api';
import { analyzeMediaAsset } from '@/lib/analysis/pipeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const POST = route<{ params: Promise<{ id: string }> }>(async (_req, ctx) => {
  const { id } = await ctx.params;
  const mediaAssetId = z.string().uuid().parse(id);
  return NextResponse.json(await analyzeMediaAsset(mediaAssetId));
});
