import 'server-only';
import { serverEnv } from './env';
import type { GeneratedConceptRow, MaterialRow, MediaAssetRow } from './types';
import { labelize } from './taxonomy';

export interface ConceptSpec {
  conceptType: string;
  title: string;
  prompt: string;
  transformation: string;
  fallbackImage: string;
}

/**
 * Builds 3 distinct second-life concept visualizations using the real source material
 * and Cloudinary's generative transformation pipeline.
 */
export function buildConceptSpecs(material: MaterialRow, requestPrompt: string): ConceptSpec[] {
  const label = labelize(material.material_type);
  const promptClean = requestPrompt.trim() || 'Modern architectural installation';
  const encodedPrompt1 = encodeURIComponent(`Architectural partition screen made from ${label}, ${promptClean}`);
  const encodedPrompt2 = encodeURIComponent(`Custom studio workstation, joinery, ${promptClean}`);
  const encodedPrompt3 = encodeURIComponent(`Acoustic wall feature installation, ${promptClean}`);

  return [
    {
      conceptType: 'Architectural Partition',
      title: `Modular ${label} Partition Screen`,
      prompt: `Using this reclaimed ${label} as the primary source element, visualize a plausible second-life design for: ${promptClean}. Clean architectural framing, contemporary Scandinavian commercial interior, warm directional lighting. This is a concept visualization, not an engineering recommendation.`,
      transformation: `c_pad,g_auto,w_1200,h_800,b_gen_fill/e_gen_background_replace:prompt_${encodedPrompt1}/q_auto,f_auto`,
      fallbackImage: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=1200&auto=format&fit=crop&q=80',
    },
    {
      conceptType: 'Bespoke Joinery',
      title: `Custom ${label} Studio Workstation & Joinery`,
      prompt: `Using this reclaimed ${label} as the primary source material, visualize a plausible second-life design for: ${promptClean}. Minimalist bespoke joinery, polished dark steel supports, natural matte oil finish. This is a concept visualization, not an engineering recommendation.`,
      transformation: `c_pad,g_auto,w_1200,h_800,b_gen_fill/e_gen_background_replace:prompt_${encodedPrompt2}/q_auto,f_auto`,
      fallbackImage: 'https://images.unsplash.com/photo-1530629013299-6cb10d168419?w=1200&auto=format&fit=crop&q=80',
    },
    {
      conceptType: 'Feature Installation',
      title: `Acoustic ${label} Wall Feature`,
      prompt: `Using this reclaimed ${label} as the primary structural texture, visualize a plausible second-life design for: ${promptClean}. Architectural exhibition gallery, recessed warm LED lighting, rhythmic pattern repetition. This is a concept visualization, not an engineering recommendation.`,
      transformation: `c_pad,g_auto,w_1200,h_800,b_gen_fill/e_gen_background_replace:prompt_${encodedPrompt3}/q_auto,f_auto`,
      fallbackImage: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
    },
  ];
}

export function generateConceptsForMaterial(
  material: MaterialRow,
  mediaAsset: MediaAssetRow,
  requestPrompt: string,
  requestId: string | null = null,
): Array<Omit<GeneratedConceptRow, 'id' | 'created_at'>> {
  const env = serverEnv();
  const specs = buildConceptSpecs(material, requestPrompt);

  return specs.map((spec) => {
    let conceptUrl = spec.fallbackImage;

    // If source is a Cloudinary asset, build an optimized Cloudinary delivery transformation URL
    if (mediaAsset.cloudinary_public_id && !mediaAsset.secure_url.includes('unsplash.com')) {
      conceptUrl = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${spec.transformation}/${mediaAsset.cloudinary_public_id}`;
    }

    return {
      material_id: material.id,
      reuse_request_id: requestId,
      prompt: spec.prompt,
      concept_type: spec.conceptType,
      cloudinary_public_id: mediaAsset.cloudinary_public_id || null,
      secure_url: conceptUrl,
    };
  });
}
