'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { GeneratedConceptRow, MaterialRow, MediaAssetRow, ProjectRow } from '@/lib/types';
import { labelize } from '@/lib/taxonomy';
import { Badge, Button, Spinner } from './ui';
import { Confidence, VisualEstimateNote } from './MaterialList';

interface ReuseStudioProps {
  material: MaterialRow;
  project: ProjectRow;
  mediaAsset: MediaAssetRow;
  initialConcepts: GeneratedConceptRow[];
}

const PRESET_REQUESTS: Record<string, string[]> = {
  'wooden-door': [
    'Modern acoustic office room divider',
    'Executive conference worktable',
    'Fluted architectural wall paneling',
  ],
  timber: [
    'Suspended linear timber ceiling baffles',
    'Solid wood bench and planter installation',
    'Exhibition reception desk',
  ],
  window: [
    'Internal glazed acoustic partition wall',
    'Heritage display vitrine casing',
    'Architectural greenhouse room divider',
  ],
  'steel-member': [
    'Cantilevered shelving frame system',
    'Exposed industrial staircase stringer',
    'Modular architectural trellis',
  ],
  brick: [
    'Dry-stacked interior acoustic feature wall',
    'Thermal mass hearth and seating podium',
    'Exposed courtyard architectural planter',
  ],
  tile: [
    'Bespoke terrazzo countertop mosaic',
    'Geometric acoustic wall mosaic',
    'Refurbished wet-room splashback feature',
  ],
  'lighting-fixture': [
    'Retrofit architectural linear pendant array',
    'Ambient hospitality ceiling feature',
    'Refurbished directional gallery spotlight system',
  ],
  cabinet: [
    'Modular storage locker bank with brass accents',
    'Floating media credenza with natural patina',
    'Workshop tool wall with integrated task lights',
  ],
  pipe: [
    'Industrial handrail and balustrade system',
    'Exposed conduit display rack',
    'Bespoke pendant chandelier armature',
  ],
  'other-material': [
    'Contemporary architectural installation',
    'Bespoke interior feature element',
    'Designer second-life display fixture',
  ],
};

export function ReuseStudio({
  material,
  project,
  mediaAsset,
  initialConcepts,
}: ReuseStudioProps) {
  const [concepts, setConcepts] = useState<GeneratedConceptRow[]>(initialConcepts);
  const [requestText, setRequestText] = useState(
    PRESET_REQUESTS[material.material_type]?.[0] ?? 'Modern acoustic office room divider',
  );
  const [style, setStyle] = useState('Modern Scandinavian Minimalist');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = PRESET_REQUESTS[material.material_type] ?? PRESET_REQUESTS['other-material'];

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!requestText.trim()) return;

    setError(null);
    setGenerating(true);

    try {
      const res = await fetch(`/api/materials/${material.id}/concept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${requestText}. Style: ${style}`,
        }),
      });

      const data = (await res.json()) as { concepts?: GeneratedConceptRow[]; error?: { message?: string } };
      if (!res.ok || !data.concepts) {
        throw new Error(data.error?.message || 'Concept generation failed.');
      }

      setConcepts(data.concepts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate concepts.');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-12">
      {/* Hero 2-Column: Real Source Media & Reuse Studio */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
        {/* Left Column: Real Construction Material & Cloudinary AI Diagnostics */}
        <section className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900 p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-ink-800 pb-4">
            <span className="font-mono text-xs uppercase tracking-wider text-accent">
              Cloudinary AI Source Media · {project.name}
            </span>
            <span className="font-mono text-xs text-bone-400">
              ID: {material.id.slice(0, 8)}
            </span>
          </div>

          <div className="relative mt-6 aspect-[4/3] overflow-hidden rounded-lg bg-ink-950">
            <Image
              src={mediaAsset.secure_url}
              alt={`Reclaimed ${material.material_type} in situ`}
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
              <Badge tone={material.reuse_candidate ? 'accent' : 'neutral'}>
                {material.reuse_candidate ? 'Appears Reusable' : 'Reuse Unclear'}
              </Badge>
              <Confidence value={material.ai_confidence} />
            </div>
          </div>

          {/* AI Inspection Findings */}
          <div className="mt-6 space-y-4">
            <div>
              <h3 className="font-display text-2xl text-bone-50">
                {labelize(material.material_type)}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-bone-300">
                {material.context_description || 'Identified from site media capture.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {material.visual_condition ? (
                <Badge>{labelize(material.visual_condition)}</Badge>
              ) : null}
              {material.visible_damage.map((d) => (
                <Badge key={d} tone="danger">
                  {labelize(d)}
                </Badge>
              ))}
              {material.quantity_estimate ? (
                <Badge tone="neutral">Est. Quantity: {material.quantity_estimate} units</Badge>
              ) : null}
            </div>

            <div className="border-t border-ink-800 pt-4">
              <VisualEstimateNote />
            </div>
          </div>
        </section>

        {/* Right Column: "Find a Second Life" Engine */}
        <section className="flex flex-col rounded-xl border border-accent/40 bg-gradient-to-b from-ink-900 to-ink-950 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-wider text-accent">
              Second-Life Engine
            </span>
          </div>

          <h2 className="mt-3 font-display text-3xl text-bone-50">Find a Second Life</h2>
          <p className="mt-2 text-sm leading-relaxed text-bone-300">
            Define a circular reuse opportunity for this real material. Cloudinary transforms the source asset into 3 conceptual architectural visualizations.
          </p>

          <form onSubmit={handleGenerate} className="mt-6 flex flex-1 flex-col space-y-5">
            <div>
              <label htmlFor="requestText" className="mb-2 block font-mono text-xs text-bone-200">
                Reuse Concept Request
              </label>
              <input
                id="requestText"
                type="text"
                value={requestText}
                onChange={(e) => setRequestText(e.target.value)}
                required
                className="field text-sm"
                placeholder="e.g. Modern acoustic office room divider"
              />
            </div>

            {/* Quick Presets */}
            <div>
              <span className="mb-2 block font-mono text-[11px] uppercase tracking-wider text-bone-400">
                Suggested Presets for {labelize(material.material_type)}:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets?.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setRequestText(p)}
                    className="rounded border border-ink-700 bg-ink-800/80 px-2.5 py-1 text-xs text-bone-300 transition-colors hover:border-accent hover:text-bone-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="styleSelect" className="mb-2 block font-mono text-xs text-bone-200">
                Design Language & Style
              </label>
              <select
                id="styleSelect"
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="field text-sm"
              >
                <option value="Modern Scandinavian Minimalist">Modern Scandinavian Minimalist</option>
                <option value="Warm Industrial Heritage">Warm Industrial Heritage</option>
                <option value="Biophilic Circular Architecture">Biophilic Circular Architecture</option>
                <option value="Contemporary Executive Joinery">Contemporary Executive Joinery</option>
                <option value="Bauhaus Functionalism">Bauhaus Functionalism</option>
              </select>
            </div>

            {error ? (
              <p role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-xs text-danger">
                {error}
              </p>
            ) : null}

            <div className="pt-2">
              <Button type="submit" size="lg" className="w-full" disabled={generating}>
                {generating ? (
                  <>
                    <Spinner /> Generating 3 Concepts…
                  </>
                ) : (
                  'Generate Second-Life Visualizations →'
                )}
              </Button>
            </div>

            {/* Visual Process Pipeline Indicators */}
            <div className="mt-auto border-t border-ink-800 pt-4">
              <p className="font-mono text-[11px] uppercase tracking-wider text-bone-500 mb-2">
                Processing pipeline:
              </p>
              <div className="flex items-center justify-between text-[11px] font-mono text-bone-400">
                <span className="text-ok">✓ Source Upload</span>
                <span className="text-ok">✓ Cloudinary AI Vision</span>
                <span className={generating ? 'text-accent animate-pulse font-bold' : 'text-ok'}>
                  {generating ? '● Transforming' : '✓ Re-contextualization'}
                </span>
                <span className={concepts.length > 0 ? 'text-ok font-bold' : 'text-bone-600'}>
                  ✓ 3 Concepts
                </span>
              </div>
            </div>
          </form>
        </section>
      </div>

      {/* Generated Concepts Gallery */}
      <section className="border-t border-ink-800 pt-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-accent">
              Concept Visualizations
            </p>
            <h2 className="mt-1 font-display text-3xl text-bone-50">
              Second-Life Proposals ({concepts.length})
            </h2>
            <p className="mt-2 text-sm text-bone-300">
              Architectural concepts produced from the real source material. Labeled as concept visualizations.
            </p>
          </div>

          {concepts.length > 0 ? (
            <Link
              href={`/opportunities/${material.id}`}
              className="inline-flex h-11 items-center rounded-md bg-accent px-5 text-sm font-semibold text-ink-950 transition-colors hover:bg-accent-strong"
            >
              Open Shareable Opportunity Page →
            </Link>
          ) : null}
        </div>

        {concepts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-700 p-12 text-center">
            <p className="font-display text-xl text-bone-200">No concepts generated yet</p>
            <p className="mt-2 text-sm text-bone-400 max-w-md mx-auto">
              Use the form above to trigger second-life concept visualizations for this reclaimed{' '}
              {labelize(material.material_type)}.
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {concepts.map((concept, index) => (
              <article
                key={concept.id || index}
                className="group flex flex-col overflow-hidden rounded-xl border border-ink-700 bg-ink-900 transition-all hover:border-accent/80 hover:shadow-2xl hover:shadow-accent/5"
              >
                <div className="relative aspect-[16/11] overflow-hidden bg-ink-950">
                  <Image
                    src={concept.secure_url}
                    alt={concept.concept_type}
                    fill
                    unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="rounded bg-accent/90 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-ink-950">
                      Concept #{index + 1}
                    </span>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-bone-300">
                      {concept.concept_type}
                    </span>
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <span className="font-mono text-xs uppercase tracking-wider text-accent">
                    Concept Visualization
                  </span>
                  <h4 className="mt-1 font-display text-xl text-bone-50">{concept.concept_type}</h4>
                  <p className="mt-3 text-xs leading-relaxed text-bone-300 line-clamp-3">
                    {concept.prompt}
                  </p>

                  <div className="mt-auto pt-6 border-t border-ink-800 flex items-center justify-between">
                    <span className="font-mono text-[11px] text-bone-500">
                      Derived from {labelize(material.material_type)}
                    </span>
                    <Link
                      href={`/opportunities/${material.id}`}
                      className="text-xs font-semibold text-accent hover:text-accent-strong"
                    >
                      Share Opportunity →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
