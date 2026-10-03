'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { MaterialRow, MediaAssetRow, ProjectRow, ReuseRequestRow } from '@/lib/types';
import { labelize, MATERIAL_TYPES } from '@/lib/taxonomy';
import { Badge, Button } from './ui';
import { Confidence } from './MaterialList';

interface ProjectInventoryProps {
  project: ProjectRow;
  materials: MaterialRow[];
  media: MediaAssetRow[];
  reuseRequests: ReuseRequestRow[];
}

export function ProjectInventory({
  project,
  materials,
  media,
  reuseRequests,
}: ProjectInventoryProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'media' | 'reuse'>('inventory');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [reusableOnly, setReusableOnly] = useState(false);

  // Map media assets by id for fast lookups
  const mediaMap = useMemo(() => {
    const map = new Map<string, MediaAssetRow>();
    for (const m of media) map.set(m.id, m);
    return map;
  }, [media]);

  // Filtered materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      if (typeFilter !== 'all' && m.material_type !== typeFilter) return false;
      if (reusableOnly && !m.reuse_candidate) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const typeMatch = m.material_type.toLowerCase().includes(q);
        const condMatch = m.visual_condition?.toLowerCase().includes(q);
        const ctxMatch = m.context_description?.toLowerCase().includes(q);
        if (!typeMatch && !condMatch && !ctxMatch) return false;
      }
      return true;
    });
  }, [materials, typeFilter, reusableOnly, search]);

  const reusableCount = materials.filter((m) => m.reuse_candidate).length;

  return (
    <div>
      {/* Navigation Tabs */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-ink-800 pb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`rounded-md px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
              activeTab === 'inventory'
                ? 'bg-accent font-semibold text-ink-950'
                : 'text-bone-400 hover:bg-ink-800 hover:text-bone-100'
            }`}
          >
            Discovered Inventory ({materials.length})
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`rounded-md px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
              activeTab === 'media'
                ? 'bg-accent font-semibold text-ink-950'
                : 'text-bone-400 hover:bg-ink-800 hover:text-bone-100'
            }`}
          >
            Site Media ({media.length})
          </button>
          <button
            onClick={() => setActiveTab('reuse')}
            className={`rounded-md px-3.5 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
              activeTab === 'reuse'
                ? 'bg-accent font-semibold text-ink-950'
                : 'text-bone-400 hover:bg-ink-800 hover:text-bone-100'
            }`}
          >
            Reuse Studio ({reuseRequests.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/projects/${project.id}/upload`}
            className="inline-flex h-9 items-center rounded-md bg-accent px-4 text-xs font-semibold text-ink-950 transition-colors hover:bg-accent-strong"
          >
            + Upload Media
          </Link>
        </div>
      </div>

      {/* Tab: Discovered Inventory */}
      {activeTab === 'inventory' && (
        <div>
          {/* Search & Filter Bar */}
          <div className="mb-6 grid gap-4 rounded-lg border border-ink-800 bg-ink-900/60 p-4 sm:grid-cols-[1fr_auto_auto]">
            <input
              type="text"
              placeholder="Search by material type, condition, or context..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field h-10 text-sm"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="field h-10 text-sm"
            >
              <option value="all">All Taxonomy Types</option>
              {MATERIAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {labelize(t)}
                </option>
              ))}
            </select>
            <Button
              variant={reusableOnly ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setReusableOnly(!reusableOnly)}
              className="h-10 text-xs"
            >
              {reusableOnly ? '✓ Reusable only' : 'Show reusable only'}
            </Button>
          </div>

          {/* Stats Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between text-xs text-bone-400">
            <span>
              Showing {filteredMaterials.length} of {materials.length} material candidates (
              {reusableCount} classified as reusable)
            </span>
            <span className="font-mono text-[11px] text-bone-500">Cloudinary AI Vision Pipeline</span>
          </div>

          {/* Material Cards Grid */}
          {filteredMaterials.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ink-700 p-12 text-center">
              <p className="text-lg font-display text-bone-200">No materials matched your filter</p>
              <p className="mt-2 text-sm text-bone-400">
                Try loosening your search terms or upload more site photos to discover additional recoverable assets.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('all');
                  setReusableOnly(false);
                }}
                className="mt-4"
              >
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMaterials.map((material) => {
                const asset = mediaMap.get(material.media_asset_id);
                const imageUrl = asset?.secure_url || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800';

                return (
                  <article
                    key={material.id}
                    className="group flex flex-col overflow-hidden rounded-lg border border-ink-700 bg-ink-900 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-accent/60"
                  >
                    {/* Media Preview */}
                    <div className="relative aspect-[16/10] overflow-hidden bg-ink-800">
                      <Image
                        src={imageUrl}
                        alt={`Identified ${material.material_type}`}
                        fill
                        unoptimized
                        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <Badge tone={material.reuse_candidate ? 'accent' : 'neutral'}>
                          {material.reuse_candidate ? 'Appears Reusable' : 'Reuse Unclear'}
                        </Badge>
                        <Confidence value={material.ai_confidence} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-xl text-bone-50 group-hover:text-accent">
                          {labelize(material.material_type)}
                        </h3>
                        {material.quantity_estimate ? (
                          <span className="font-mono text-xs text-bone-400">
                            ≈ {material.quantity_estimate} units
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {material.visual_condition ? (
                          <Badge>{labelize(material.visual_condition)}</Badge>
                        ) : null}
                        {material.visible_damage.map((d) => (
                          <Badge key={d} tone="danger">
                            {labelize(d)}
                          </Badge>
                        ))}
                      </div>

                      <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-bone-300">
                        {material.context_description || 'Identified from site media capture.'}
                      </p>

                      <div className="mt-auto pt-5">
                        <Link
                          href={`/materials/${material.id}`}
                          className="flex h-10 w-full items-center justify-center rounded-md border border-ink-600 bg-ink-800 text-xs font-medium text-bone-50 transition-colors group-hover:border-accent group-hover:bg-accent group-hover:text-ink-950"
                        >
                          Find a Second Life →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab: Site Media */}
      {activeTab === 'media' && (
        <div className="space-y-6">
          <p className="text-xs text-bone-400">
            Source media uploaded to Cloudinary. Each image is processed through Cloudinary AI Vision for taxonomy tagging and structured scene analysis.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((asset) => (
              <div
                key={asset.id}
                className="overflow-hidden rounded-lg border border-ink-700 bg-ink-900"
              >
                <div className="relative aspect-[4/3] bg-ink-800">
                  <Image
                    src={asset.secure_url}
                    alt={asset.original_filename ?? 'Site image'}
                    fill
                    unoptimized
                    sizes="33vw"
                    className="object-cover"
                  />
                  <div className="absolute right-3 top-3">
                    <Badge tone={asset.analysis_status === 'complete' ? 'ok' : 'neutral'}>
                      {asset.analysis_status}
                    </Badge>
                  </div>
                </div>
                <div className="p-4">
                  <p className="truncate font-mono text-xs text-bone-200">
                    {asset.original_filename || asset.cloudinary_public_id}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-bone-500">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Reuse Studio */}
      {activeTab === 'reuse' && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs text-bone-400">
              Active reuse requests matched against discovered materials in this project.
            </p>
          </div>

          {reuseRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-ink-700 p-12 text-center">
              <p className="font-display text-xl text-bone-200">No reuse requests yet</p>
              <p className="mt-2 text-sm text-bone-400">
                Pick any material from the inventory and click &quot;Find a Second Life&quot; to generate concept visualizations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reuseRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-lg border border-ink-700 bg-ink-900 p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs uppercase tracking-wider text-accent">
                        {req.style || 'Custom reuse'}
                      </span>
                      <h3 className="mt-1 font-display text-2xl text-bone-50">{req.title}</h3>
                      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-bone-300">
                        {req.description}
                      </p>
                    </div>
                    {req.target_dimensions ? (
                      <span className="rounded border border-ink-700 bg-ink-800 px-3 py-1 font-mono text-xs text-bone-300">
                        {req.target_dimensions}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
