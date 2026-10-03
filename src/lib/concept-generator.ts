import 'server-only';
import type { GeneratedConceptRow, MaterialRow, MediaAssetRow } from './types';
import { labelize } from './taxonomy';
import { generateImageToImage } from './cloudinary/client';
import { AppError } from './errors';

export interface ConceptSpec {
  conceptType: string;
  title: string;
  prompt: string;
}

/**
 * Builds 3 distinct second-life concept specifications using the real source material
 * and Cloudinary's reference-image generative pipeline.
 */
export function buildConceptSpecs(material: MaterialRow, requestPrompt: string): ConceptSpec[] {
  const label = labelize(material.material_type);
  const promptClean = requestPrompt.trim() || 'Modern architectural installation';

  return [
    {
      conceptType: 'Architectural Partition',
      title: `Modular ${label} Partition Screen`,
      prompt: `Using this reclaimed ${label} as the primary source material, visualize a plausible second-life design for: ${promptClean}. Reclaimed ${label} modular partition screen in a contemporary Scandinavian commercial interior with warm ambient directional lighting. Preserve recognizable surface characteristics and visible texture of the reclaimed material. Polished architectural concept visualization, not an engineering recommendation.`,
    },
    {
      conceptType: 'Bespoke Joinery',
      title: `Custom ${label} Studio Workstation & Joinery`,
      prompt: `Using this reclaimed ${label} as the primary source material, visualize a plausible second-life design for: ${promptClean}. Minimalist bespoke studio workstation with joinery elements crafted from reclaimed ${label}, complemented by dark powder-coated metal framing. Preserve visible natural grain, texture and patina. Architectural interior concept visualization, not an engineering recommendation.`,
    },
    {
      conceptType: 'Feature Installation',
      title: `Acoustic ${label} Wall Feature`,
      prompt: `Using this reclaimed ${label} as the primary surface visual element, visualize a plausible second-life design for: ${promptClean}. Architectural wall cladding with recessed warm LED perimeter lighting, rhythmic texture repetition and reclaimed material craftsmanship. Exhibition gallery interior. Concept visualization, not an engineering recommendation.`,
    },
  ];
}

/**
 * Generates 3 second-life concept images via Cloudinary Image Generation (image_to_image).
 * Each generated concept receives a NEW generated Cloudinary asset with its own unique public_id and secure_url.
 * NO Unsplash fallback images are used in this real generation path.
 */
export async function generateConceptsForMaterial(
  material: MaterialRow,
  mediaAsset: MediaAssetRow,
  requestPrompt: string,
  requestId: string | null = null,
): Promise<Array<Omit<GeneratedConceptRow, 'id' | 'created_at'>>> {
  const specs = buildConceptSpecs(material, requestPrompt);
  const sourceUrl = mediaAsset.secure_url;

  if (!sourceUrl) {
    throw new AppError(400, 'missing_source_url', 'Source media asset has no valid URL for concept generation.');
  }

  // Generate concepts in parallel using Cloudinary Image Generation
  const settled = await Promise.allSettled(
    specs.map(async (spec) => {
      const conceptId = crypto.randomUUID();
      const targetPublicId = `raw-reuse/concepts/${conceptId}`;
      const generated = await generateImageToImage({
        prompt: spec.prompt,
        referenceImageUrl: sourceUrl,
        targetPublicId,
      });

      return {
        material_id: material.id,
        reuse_request_id: requestId,
        prompt: spec.prompt,
        concept_type: spec.conceptType,
        cloudinary_public_id: generated.publicId, // NEW unique generated Cloudinary asset public_id
        secure_url: generated.secureUrl, // NEW unique generated Cloudinary asset URL
      };
    }),
  );

  const successful: Array<Omit<GeneratedConceptRow, 'id' | 'created_at'>> = [];
  const errors: string[] = [];

  for (const res of settled) {
    if (res.status === 'fulfilled') {
      successful.push(res.value);
    } else {
      errors.push(res.reason instanceof Error ? res.reason.message : String(res.reason));
    }
  }

  if (successful.length === 0) {
    const errorDetail = errors[0] || 'Unknown Cloudinary error';
    throw new AppError(
      502,
      'concept_generation_failed',
      `Cloudinary Image Generation failed: ${errorDetail}. Ensure the Image Generation add-on is active on your Cloudinary cloud.`,
    );
  }

  return successful;
}
