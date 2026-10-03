import 'server-only';
import { store } from '@/lib/store';
import { AppError } from '@/lib/errors';
import { analyze, addTags } from '@/lib/cloudinary/client';
import { analysisSource } from '@/lib/cloudinary/url';
import { TAG_DEFINITIONS } from '@/lib/taxonomy';
import type { AnalyzeResult, MaterialRow, MediaAssetRow } from '@/lib/types';
import { buildVisionPrompt, parseAnalysis } from './schema';

interface GeneralResponse {
  data?: { analysis?: { responses?: Array<{ value?: string }> } };
}
interface TaggingResponse {
  data?: { analysis?: { tags?: Array<{ name: string }> } };
}

const STALE_PROCESSING_MS = 2 * 60_000;

async function setStatus(id: string, analysis_status: MediaAssetRow['analysis_status']) {
  await store.updateMediaAssetStatus(id, analysis_status);
}

/**
 * Real pipeline: Cloudinary AI Vision (General, JSON Schema) + AI Vision Tagging
 * -> validate -> persist materials in store -> tag the Cloudinary asset.
 *
 * Adheres strictly to the requirement:
 * "No fake successful AI results when the real API fails."
 * If Cloudinary AI Vision fails:
 * - mark analysis failed
 * - return a useful error
 * - allow retry
 * - create NO material records
 * - NEVER fabricate material type/confidence/condition.
 */
export async function analyzeMediaAsset(mediaAssetId: string): Promise<AnalyzeResult> {
  const asset = await store.getMediaAsset(mediaAssetId);
  if (!asset) throw new AppError(404, 'not_found', 'Media asset not found.');

  if (asset.resource_type !== 'image') {
    throw new AppError(422, 'unsupported_media', 'Only images can be analyzed in this version.');
  }
  if (asset.analysis_status === 'processing' && Date.now() - new Date(asset.updated_at).getTime() < STALE_PROCESSING_MS) {
    throw new AppError(409, 'already_processing', 'This image is already being analyzed.');
  }

  await setStatus(asset.id, 'processing');

  try {
    const source = { uri: analysisSource(asset.secure_url) };
    const warnings: string[] = [];

    // Call Cloudinary AI Vision (General with structured JSON schema) + AI Vision Tagging
    const [general, tagging] = await Promise.allSettled([
      analyze<GeneralResponse>('ai_vision_general', { source, prompts: [buildVisionPrompt()] }),
      analyze<TaggingResponse>('ai_vision_tagging', { source, tag_definitions: TAG_DEFINITIONS }),
    ]);

    if (general.status === 'rejected') {
      const reason = general.reason;
      const msg = reason instanceof Error ? reason.message : String(reason);
      throw new AppError(
        502,
        'ai_vision_failed',
        `Cloudinary AI Vision analysis failed: ${msg}. Please ensure the Cloudinary AI Vision add-on is active on your Cloudinary cloud. You can retry analysis once activated.`,
      );
    }

    const raw = general.value.data?.analysis?.responses?.[0]?.value;
    if (typeof raw !== 'string') {
      throw new AppError(502, 'cloudinary_unexpected_response', 'Cloudinary AI Vision returned an unexpected response structure.');
    }

    const parsed = parseAnalysis(raw);
    const sceneSummary = parsed.sceneSummary;
    const parsedMaterials = parsed.materials.map((m) => ({
      ...m,
      project_id: asset.project_id,
      media_asset_id: asset.id,
      review_status: 'ai_pending',
    }));

    const tagSet = new Set<string>(['rr-analyzed']);
    for (const m of parsed.materials) tagSet.add(`rr-${m.material_type}`);

    if (tagging.status === 'fulfilled') {
      const taggedByModel = (tagging.value.data?.analysis?.tags ?? []).map((t) => t.name);
      for (const name of taggedByModel) tagSet.add(`rr-${name}`);
    } else {
      warnings.push('Cloudinary AI Vision custom tagging was unavailable; material tags derived from general vision model.');
    }

    // Persist real materials discovered by Cloudinary AI Vision
    await store.deletePendingMaterials(asset.id);
    let inserted: MaterialRow[] = [];
    if (parsedMaterials.length > 0) {
      inserted = await store.saveMaterials(parsedMaterials);
    }

    // Write tags back to Cloudinary
    try {
      if (asset.cloudinary_public_id) {
        await addTags(asset.cloudinary_public_id, [...tagSet]);
      }
    } catch (tagError) {
      console.warn('[pipeline] tag write notice:', tagError instanceof Error ? tagError.message : tagError);
    }

    await setStatus(asset.id, 'complete');
    return { mediaAssetId: asset.id, sceneSummary, materials: inserted, warnings };
  } catch (error) {
    // On any failure: mark analysis as 'failed', create NO material records, and rethrow
    await setStatus(asset.id, 'failed').catch(() => undefined);
    throw error;
  }
}
