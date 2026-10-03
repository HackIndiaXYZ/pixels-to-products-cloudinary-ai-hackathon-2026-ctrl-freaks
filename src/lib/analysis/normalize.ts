import { MATERIAL_TYPES, VISUAL_CONDITIONS, type MaterialType, type VisualCondition } from '../taxonomy.ts';

/** Pull a JSON object out of a model reply, tolerating code fences and surrounding prose. */
export function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  const candidate = fenced?.[1] ?? trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end <= start) throw new Error('No JSON object found in model output');
    return JSON.parse(candidate.slice(start, end + 1));
  }
}

const slug = (value: string) => value.trim().toLowerCase().replace(/[\s_]+/g, '-');

export function normalizeMaterialType(value: string): MaterialType {
  const s = slug(value);
  return (MATERIAL_TYPES as readonly string[]).includes(s) ? (s as MaterialType) : 'other-material';
}

export function normalizeCondition(value: string): VisualCondition {
  const s = slug(value);
  return (VISUAL_CONDITIONS as readonly string[]).includes(s) ? (s as VisualCondition) : 'uncertain';
}

export function normalizeDamage(values: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const v of values) {
    const s = slug(v);
    if (s) seen.add(s.slice(0, 40));
  }
  return [...seen].slice(0, 8);
}

/**
 * The product only makes visual estimates. Drop any sentence that claims
 * structural, load-bearing, code, certification, safety or hidden-defect
 * knowledge, or exact dimensions.
 */
const FORBIDDEN_CLAIMS =
  /structur|load[- ]?bearing|code[- ]?compl|certif|\bsafe(ty)?\b|hidden (defect|damage)|exact dimension|engineer/i;

export function sanitizeVisualText(text: string, maxLength = 300): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => !FORBIDDEN_CLAIMS.test(s));
  return sentences.join(' ').trim().slice(0, maxLength);
}

export const round4 = (n: number) => Math.round(n * 10000) / 10000;
