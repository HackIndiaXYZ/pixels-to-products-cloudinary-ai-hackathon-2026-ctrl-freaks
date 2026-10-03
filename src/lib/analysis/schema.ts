import { z } from 'zod';
import { AppError } from '@/lib/errors';
import { MATERIAL_TYPES, VISUAL_CONDITIONS } from '@/lib/taxonomy';
import {
  extractJson,
  normalizeCondition,
  normalizeDamage,
  normalizeMaterialType,
  round4,
  sanitizeVisualText,
} from './normalize';

const rawMaterial = z.object({
  type: z.string().min(1),
  confidence: z.coerce.number().min(0).max(1),
  visual_condition: z.string().min(1),
  visible_damage: z.array(z.string()).optional().default([]),
  context: z.string().optional().default(''),
  reuse_candidate: z.boolean(),
  quantity_estimate: z.coerce.number().positive().max(10_000).nullable().optional(),
});

const rawAnalysis = z.object({
  materials: z.array(rawMaterial).max(25),
  scene_summary: z.string().optional().default(''),
});

export interface ParsedMaterial {
  material_type: string;
  ai_confidence: number;
  visual_condition: string;
  visible_damage: string[];
  context_description: string;
  reuse_candidate: boolean;
  quantity_estimate: number | null;
}

export interface ParsedAnalysis {
  materials: ParsedMaterial[];
  sceneSummary: string;
}

/** JSON Schema embedded in the AI Vision prompt (structured output). */
export const AI_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['materials', 'scene_summary'],
  properties: {
    materials: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['type', 'confidence', 'visual_condition', 'visible_damage', 'context', 'reuse_candidate', 'quantity_estimate'],
        properties: {
          type: { type: 'string', enum: [...MATERIAL_TYPES] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          visual_condition: { type: 'string', enum: [...VISUAL_CONDITIONS] },
          visible_damage: { type: 'array', items: { type: 'string', enum: [...VISUAL_CONDITIONS] } },
          context: { type: 'string' },
          reuse_candidate: { type: 'boolean' },
          quantity_estimate: { type: ['number', 'null'] },
        },
      },
    },
    scene_summary: { type: 'string' },
  },
} as const;

/** Spec prompt (docs/MASTER_BUILD_SPEC.md) + taxonomy + JSON Schema. */
export function buildVisionPrompt(): string {
  return [
    'Analyze this construction or demolition site media for potentially recoverable materials.',
    'Identify visible construction materials or installed elements that may be reusable.',
    'For each candidate: classify using the supplied taxonomy; give confidence 0..1; describe only visually observable condition; list visible damage/wear; describe surrounding context; decide whether it appears potentially reusable from visual evidence only.',
    'Do not infer structural integrity, hidden defects, exact dimensions, load-bearing capacity, engineering safety, or code compliance.',
    `Taxonomy: ${MATERIAL_TYPES.join(', ')}.`,
    `Visual condition vocabulary: ${VISUAL_CONDITIONS.join(', ')}.`,
    'If nothing recoverable is visible, return an empty materials array.',
    'Return strict JSON only (no prose, no code fences) matching this JSON Schema:',
    JSON.stringify(AI_JSON_SCHEMA),
  ].join('\n');
}

/** Validate model output and normalise it to the taxonomy. Throws AppError on invalid output. */
export function parseAnalysis(raw: string): ParsedAnalysis {
  let json: unknown;
  try {
    json = extractJson(raw);
  } catch {
    throw new AppError(502, 'ai_invalid_output', 'AI Vision did not return valid JSON. Try analyzing again.');
  }
  const parsed = rawAnalysis.safeParse(json);
  if (!parsed.success) {
    console.error('[analysis] schema mismatch', parsed.error.issues.slice(0, 3));
    throw new AppError(502, 'ai_invalid_output', 'AI Vision returned an unexpected structure. Try analyzing again.');
  }
  return {
    sceneSummary: sanitizeVisualText(parsed.data.scene_summary, 500),
    materials: parsed.data.materials.map((m) => ({
      material_type: normalizeMaterialType(m.type),
      ai_confidence: round4(m.confidence),
      visual_condition: normalizeCondition(m.visual_condition),
      visible_damage: normalizeDamage(m.visible_damage),
      context_description: sanitizeVisualText(m.context),
      reuse_candidate: m.reuse_candidate,
      quantity_estimate: m.quantity_estimate ?? null,
    })),
  };
}
