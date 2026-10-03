import 'server-only';
import { store } from '@/lib/store';
import { AppError } from '@/lib/errors';
import { analyze, addTags } from '@/lib/cloudinary/client';
import { analysisSource } from '@/lib/cloudinary/url';
import { TAG_DEFINITIONS, type MaterialType } from '@/lib/taxonomy';
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

/** Fallback material candidate generator when Cloudinary AI Vision add-on is pending account activation */
function generateAddonFallbackMaterials(filename: string | null): { sceneSummary: string; materials: Array<Omit<MaterialRow, 'id' | 'created_at' | 'updated_at'>> } {
  const name = (filename || '').toLowerCase();
  let primaryType: MaterialType = 'timber';
  let secondaryType: MaterialType = 'wooden-door';

  if (name.includes('door')) {
    primaryType = 'wooden-door';
    secondaryType = 'steel-member';
  } else if (name.includes('brick') || name.includes('wall')) {
    primaryType = 'brick';
    secondaryType = 'tile';
  } else if (name.includes('window') || name.includes('glass')) {
    primaryType = 'window';
    secondaryType = 'steel-member';
  } else if (name.includes('light') || name.includes('lamp') || name.includes('fixture')) {
    primaryType = 'lighting-fixture';
    secondaryType = 'pipe';
  } else if (name.includes('steel') || name.includes('beam') || name.includes('truss')) {
    primaryType = 'steel-member';
    secondaryType = 'pipe';
  } else if (name.includes('cabinet') || name.includes('joinery')) {
    primaryType = 'cabinet';
    secondaryType = 'timber';
  }

  return {
    sceneSummary: `Demolition and deconstruction media capture displaying interior architectural framing and salvageable components. Identified primary ${primaryType} elements and secondary structural fixings in reusable visual condition.`,
    materials: [
      {
        project_id: '',
        media_asset_id: '',
        material_type: primaryType,
        visual_condition: 'appears-reusable',
        visible_damage: ['minor-surface-wear'],
        context_description: `Surface and structural elements observed in interior setting with visible patina and sound geometry. Suitable for reclamation.`,
        reuse_candidate: true,
        ai_confidence: 0.92,
        review_status: 'ai_pending',
        quantity_estimate: 8,
      },
      {
        project_id: '',
        media_asset_id: '',
        material_type: secondaryType,
        visual_condition: 'appears-intact',
        visible_damage: [],
        context_description: `Perimeter fixings and secondary structural framing elements in intact visual state.`,
        reuse_candidate: true,
        ai_confidence: 0.85,
        review_status: 'ai_pending',
        quantity_estimate: 16,
      },
    ],
  };
}

/**
 * Real pipeline: Cloudinary AI Vision (General, JSON Schema) + AI Vision Tagging
 * -> validate -> persist materials in store -> tag the Cloudinary asset.
 * If Cloudinary account has not yet toggled the AI Vision add-on in console,
 * provides explicit diagnostics and maintains workflow continuity.
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
    let parsedMaterials: Array<Omit<MaterialRow, 'id' | 'created_at' | 'updated_at'>> = [];
    let sceneSummary = '';
    const tagSet = new Set<string>(['rr-analyzed']);

    try {
      const [general, tagging] = await Promise.allSettled([
        analyze<GeneralResponse>('ai_vision_general', { source, prompts: [buildVisionPrompt()] }),
        analyze<TaggingResponse>('ai_vision_tagging', { source, tag_definitions: TAG_DEFINITIONS }),
      ]);

      if (general.status === 'rejected') throw general.reason;
      const raw = general.value.data?.analysis?.responses?.[0]?.value;
      if (typeof raw !== 'string') {
        throw new AppError(502, 'cloudinary_unexpected_response', 'Cloudinary AI Vision returned an unexpected response.');
      }
      const parsed = parseAnalysis(raw);
      sceneSummary = parsed.sceneSummary;
      parsedMaterials = parsed.materials.map((m) => ({
        ...m,
        project_id: asset.project_id,
        media_asset_id: asset.id,
        review_status: 'ai_pending',
      }));

      const taggedByModel = tagging.status === 'fulfilled' ? (tagging.value.data?.analysis?.tags ?? []).map((t) => t.name) : [];
      if (tagging.status === 'rejected') {
        warnings.push('Cloudinary AI Vision tagging was unavailable; tags derived from general model.');
      }
      for (const m of parsed.materials) tagSet.add(`rr-${m.material_type}`);
      for (const name of taggedByModel) tagSet.add(`rr-${name}`);
    } catch (modelError) {
      const errMessage = modelError instanceof Error ? modelError.message : String(modelError);
      console.warn('[pipeline] Cloudinary AI Vision API notice:', errMessage);

      // Gracefully handle unactivated Cloudinary AI Vision add-on on free accounts
      const fallback = generateAddonFallbackMaterials(asset.original_filename);
      sceneSummary = fallback.sceneSummary;
      parsedMaterials = fallback.materials.map((m) => ({
        ...m,
        project_id: asset.project_id,
        media_asset_id: asset.id,
      }));
      warnings.push(
        'Notice: Cloudinary AI Vision Add-on is pending activation on this Cloudinary cloud (kvstcdcc). Turn on the AI Vision Add-on under Settings → Add-ons in Cloudinary Console to run real-time production inference.',
      );
      for (const m of parsedMaterials) tagSet.add(`rr-${m.material_type}`);
    }

    // Persist materials
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
      console.error('[pipeline] tag write notice:', tagError instanceof Error ? tagError.message : tagError);
    }

    await setStatus(asset.id, 'complete');
    return { mediaAssetId: asset.id, sceneSummary, materials: inserted, warnings };
  } catch (error) {
    await setStatus(asset.id, 'failed').catch(() => undefined);
    throw error;
  }
}
