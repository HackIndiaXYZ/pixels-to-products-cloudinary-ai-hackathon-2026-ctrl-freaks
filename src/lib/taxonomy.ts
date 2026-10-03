// Source of truth: docs/MASTER_BUILD_SPEC.md ("Material taxonomy", "Visual condition vocabulary").

export const MATERIAL_TYPES = [
  'wooden-door',
  'timber',
  'window',
  'steel-member',
  'brick',
  'tile',
  'lighting-fixture',
  'cabinet',
  'pipe',
  'other-material',
] as const;

export type MaterialType = (typeof MATERIAL_TYPES)[number];

export const VISUAL_CONDITIONS = [
  'appears-intact',
  'appears-reusable',
  'minor-surface-wear',
  'visible-damage',
  'broken',
  'rust/corrosion',
  'obstructed',
  'uncertain',
] as const;

export type VisualCondition = (typeof VISUAL_CONDITIONS)[number];

/** Descriptions used as AI Vision tagging definitions (max 10 allowed by the API). */
export const TAG_DEFINITIONS: ReadonlyArray<{ name: MaterialType; description: string }> = [
  { name: 'wooden-door', description: 'Does the image show a wooden door or door leaf?' },
  { name: 'timber', description: 'Does the image show timber beams, joists, planks, boards or other lumber?' },
  { name: 'window', description: 'Does the image show a window, window frame or glazing unit?' },
  { name: 'steel-member', description: 'Does the image show a steel beam, column, angle, channel or other structural-looking steel section?' },
  { name: 'brick', description: 'Does the image show bricks or brickwork?' },
  { name: 'tile', description: 'Does the image show floor, wall or roof tiles?' },
  { name: 'lighting-fixture', description: 'Does the image show a light fitting, lamp or luminaire?' },
  { name: 'cabinet', description: 'Does the image show a cabinet, cupboard, shelving unit or built-in joinery?' },
  { name: 'pipe', description: 'Does the image show pipes, tubing or conduit?' },
  { name: 'other-material', description: 'Does the image show another construction material or installed element that could plausibly be recovered?' },
];

export function labelize(value: string): string {
  const spaced = value.replace(/[-_/]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
