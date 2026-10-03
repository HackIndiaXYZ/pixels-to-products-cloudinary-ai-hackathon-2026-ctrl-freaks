import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signParams } from '../src/lib/cloudinary/signing.ts';
import { deliveryUrl, analysisSource } from '../src/lib/cloudinary/url.ts';
import {
  extractJson,
  normalizeCondition,
  normalizeDamage,
  normalizeMaterialType,
  sanitizeVisualText,
} from '../src/lib/analysis/normalize.ts';
import { TAG_DEFINITIONS, MATERIAL_TYPES } from '../src/lib/taxonomy.ts';

test('signParams sorts keys, skips empty values and matches an independent SHA-1', () => {
  const sig = signParams(
    { timestamp: 1700000000, tags: 'raw-reuse,project-abc', folder: 'raw-reuse/abc', upload_preset: undefined, empty: '' },
    'sekret',
  );
  assert.equal(sig, 'f10088f6c5fd43244e31f0b4ecd810d0676e4396');
});

test('deliveryUrl inserts the transformation after /upload/ and leaves other URLs alone', () => {
  const url = 'https://res.cloudinary.com/demo/image/upload/v123/raw-reuse/p/a.jpg';
  assert.equal(deliveryUrl(url, 'w_10'), 'https://res.cloudinary.com/demo/image/upload/w_10/v123/raw-reuse/p/a.jpg');
  assert.equal(deliveryUrl('https://example.com/a.jpg', 'w_10'), 'https://example.com/a.jpg');
  assert.match(analysisSource(url), /\/upload\/c_limit,w_1600,q_auto\/v123\//);
});

test('extractJson handles plain JSON, fenced JSON and JSON wrapped in prose', () => {
  assert.deepEqual(extractJson('{"a":1}'), { a: 1 });
  assert.deepEqual(extractJson('```json\n{"a":2}\n```'), { a: 2 });
  assert.deepEqual(extractJson('Here you go: {"a":3} hope that helps'), { a: 3 });
  assert.throws(() => extractJson('no json here'));
});

test('taxonomy normalisation maps unknown values to safe fallbacks', () => {
  assert.equal(normalizeMaterialType('Wooden Door'), 'wooden-door');
  assert.equal(normalizeMaterialType('steel_member'), 'steel-member');
  assert.equal(normalizeMaterialType('concrete slab'), 'other-material');
  assert.equal(normalizeCondition('Appears Reusable'), 'appears-reusable');
  assert.equal(normalizeCondition('rust/corrosion'), 'rust/corrosion');
  assert.equal(normalizeCondition('pristine'), 'uncertain');
  assert.deepEqual(normalizeDamage(['Minor Surface Wear', 'minor-surface-wear', '']), ['minor-surface-wear']);
});

test('sanitizeVisualText removes sentences that make structural or safety claims', () => {
  const out = sanitizeVisualText(
    'Interior doorway with painted frame. The door is structurally sound. It looks load-bearing. Light scuffing on the lower panel.',
  );
  assert.equal(out, 'Interior doorway with painted frame. Light scuffing on the lower panel.');
  assert.equal(sanitizeVisualText('Certified safe to reuse.'), '');
});

test('tag definitions cover the taxonomy exactly and respect the API limit of 10', () => {
  assert.equal(TAG_DEFINITIONS.length, 10);
  assert.deepEqual(TAG_DEFINITIONS.map((t) => t.name), [...MATERIAL_TYPES]);
});
