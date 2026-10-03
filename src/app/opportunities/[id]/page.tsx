import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { Badge, PageHeader, SetupNeeded } from '@/components/ui';
import { Confidence, VisualEstimateNote } from '@/components/MaterialList';
import { ShareActions } from '@/components/ShareActions';
import { attempt, getOpportunityData } from '@/lib/data';
import { labelize } from '@/lib/taxonomy';

export const metadata: Metadata = { title: 'Reuse Opportunity · RAW → REUSE' };
export const dynamic = 'force-dynamic';

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const result = await attempt(() => getOpportunityData(id));
  if (!result.ok) {
    if (result.error.code === 'not_found') notFound();
    return <SetupNeeded message={result.error.message} />;
  }
  const { project, material, sourceMedia, reuseRequest, match, concepts } = result.data;
  const label = labelize(material.material_type);

  return (
    <div className="animate-rise space-y-12">
      {/* Top Header & Share Actions */}
      <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ink-800 pb-8">
        <div>
          <Link
            href={`/materials/${material.id}`}
            className="font-mono text-xs text-bone-400 hover:text-accent transition-colors mb-2 inline-block"
          >
            ← Back to Material Detail
          </Link>
          <PageHeader
            eyebrow={`Verified Circular Opportunity · ${project.name}`}
            title={`Second-Life Opportunity: Reclaimed ${label}`}
            lead={`Recovered directly from site deconstruction in ${project.location || 'site'}. Visual condition classified via Cloudinary AI Vision.`}
          />
        </div>
        <ShareActions title={`Second-Life Opportunity: Reclaimed ${label}`} />
      </div>

      {/* Origin & Provenance Summary */}
      <section className="grid gap-6 rounded-xl border border-ink-700 bg-ink-900 p-6 sm:grid-cols-3 sm:p-8">
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-bone-400">
            Source Origin
          </span>
          <h3 className="mt-1 font-display text-xl text-bone-50">{project.name}</h3>
          <p className="mt-1 text-xs text-bone-300">{project.location || 'Commercial Site'}</p>
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-bone-400">
            Material Classification
          </span>
          <h3 className="mt-1 font-display text-xl text-accent">{label}</h3>
          <p className="mt-1 text-xs text-bone-300">
            {material.quantity_estimate ? `Est. ${material.quantity_estimate} units available` : 'Batch salvage'}
          </p>
        </div>
        <div>
          <span className="font-mono text-xs uppercase tracking-wider text-bone-400">
            Visual Condition
          </span>
          <div className="mt-2 flex items-center gap-2">
            <Badge tone="accent">{material.visual_condition ? labelize(material.visual_condition) : 'Reusable'}</Badge>
            <Confidence value={material.ai_confidence} />
          </div>
        </div>
      </section>

      {/* Real Source Media vs Matching Assessment */}
      <section className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900 p-6">
          <span className="font-mono text-xs uppercase tracking-wider text-accent block mb-4">
            Source Inspection Media
          </span>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-ink-950">
            <Image
              src={sourceMedia.secure_url}
              alt={sourceMedia.original_filename ?? 'Source inspection'}
              fill
              unoptimized
              className="object-cover"
            />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-bone-300">
            {material.context_description || 'Identified from site media capture.'}
          </p>
          <div className="mt-4 border-t border-ink-800 pt-3">
            <VisualEstimateNote />
          </div>
        </div>

        {/* Reuse Plan & Transparent Matching Rationale */}
        <div className="flex flex-col rounded-xl border border-ink-700 bg-ink-900 p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-ink-800 pb-4">
            <span className="font-mono text-xs uppercase tracking-wider text-accent">
              Matching Engine Assessment
            </span>
            {match ? (
              <span className="rounded bg-accent/10 px-2.5 py-1 font-mono text-xs font-bold text-accent">
                {match.match_score}% Match Compatibility
              </span>
            ) : null}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-bone-400">
                Target Application
              </span>
              <h4 className="mt-1 font-display text-2xl text-bone-50">
                {reuseRequest?.title || `Architectural ${label} Repurposing`}
              </h4>
            </div>

            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-bone-400">
                Transparent Compatibility Rationale
              </span>
              <p className="mt-1.5 text-sm leading-relaxed text-bone-300">
                {match?.reason ||
                  `The material form and visible integrity of this reclaimed ${label} provide sound geometry and authentic character, requiring minor finish preparation before installation.`}
              </p>
            </div>

            <div className="rounded-lg border border-ink-800 bg-ink-950/70 p-4">
              <span className="font-mono text-xs text-bone-400 block mb-1">
                Circular Impact Metric:
              </span>
              <p className="text-xs text-bone-200">
                Preserving reclaimed elements directly diverts embodied carbon and reduces virgin material procurement in new architectural fit-outs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Generated Second-Life Concepts */}
      <section className="border-t border-ink-800 pt-10">
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-wider text-accent">
            Concept Visualizations
          </p>
          <h2 className="mt-1 font-display text-3xl text-bone-50">
            Second-Life Concept Visualizations ({concepts.length})
          </h2>
          <p className="mt-2 text-sm text-bone-300">
            Concept visualizations generated using the actual reclaimed {label} as the source reference.
          </p>
        </div>

        {concepts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-700 p-12 text-center">
            <p className="font-display text-xl text-bone-200">No concept visualizations saved yet</p>
            <p className="mt-2 text-sm text-bone-400">
              Return to the Reuse Studio to generate second-life concepts for this material.
            </p>
            <Link
              href={`/materials/${material.id}`}
              className="mt-4 inline-flex h-10 items-center rounded-md bg-accent px-4 text-xs font-semibold text-ink-950"
            >
              Open Reuse Studio →
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {concepts.map((concept, idx) => (
              <article
                key={concept.id || idx}
                className="overflow-hidden rounded-xl border border-ink-700 bg-ink-900"
              >
                <div className="relative aspect-[16/11] bg-ink-950">
                  <Image
                    src={concept.secure_url}
                    alt={concept.concept_type}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="rounded bg-accent px-2 py-0.5 font-mono text-[10px] font-bold text-ink-950 uppercase">
                      Proposal #{idx + 1}
                    </span>
                    <span className="font-mono text-[10px] uppercase text-bone-300">
                      {concept.concept_type}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <span className="font-mono text-xs uppercase tracking-wider text-accent">
                    Concept Visualization
                  </span>
                  <h4 className="mt-1 font-display text-xl text-bone-50">{concept.concept_type}</h4>
                  <p className="mt-3 text-xs leading-relaxed text-bone-300">
                    {concept.prompt}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
