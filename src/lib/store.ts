import 'server-only';
import type {
  GeneratedConceptRow,
  MaterialRow,
  MediaAssetRow,
  OpportunityData,
  ProjectRow,
  ReuseMatchRow,
  ReuseRequestRow,
} from './types';
import { labelize } from './taxonomy';
import {
  deleteJson,
  downloadJson,
  listRawResources,
  uploadJson,
} from './cloudinary/persist';

// ─── DEMO SEED DATA (Always available for instant exploration) ────────────────

const DEMO_PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const DEMO_PROJECT2_ID = '22222222-2222-4222-8222-222222222222';
const MEDIA1_ID = 'aaaa1111-1111-4111-8111-aaaaaaaaaaaa';
const MEDIA2_ID = 'aaaa2222-2222-4222-8222-aaaaaaaaaaaa';
const MEDIA3_ID = 'aaaa3333-3333-4333-8333-aaaaaaaaaaaa';
const MAT1_ID = 'bbbb1111-1111-4111-8111-bbbbbbbbbbbb';
const MAT2_ID = 'bbbb2222-2222-4222-8222-bbbbbbbbbbbb';
const MAT3_ID = 'bbbb3333-3333-4333-8333-bbbbbbbbbbbb';
const MAT4_ID = 'bbbb4444-4444-4444-8444-bbbbbbbbbbbb';
const REQ1_ID = 'cccc1111-1111-4111-8111-cccccccccccc';
const MATCH1_ID = 'dddd1111-1111-4111-8111-dddddddddddd';
const CONC1_ID = 'eeee1111-1111-4111-8111-eeeeeeeeeeee';
const CONC2_ID = 'eeee2222-2222-4222-8222-eeeeeeeeeeee';
const CONC3_ID = 'eeee3333-3333-4333-8333-eeeeeeeeeeee';

const DEMO_PROJECTS: ProjectRow[] = [
  {
    id: DEMO_PROJECT_ID,
    name: '[Demo] Harbour Street Office Strip-out',
    location: 'Rotterdam, NL',
    project_type: 'Interior fit-out & Deconstruction',
    description: 'Commercial 4th-floor office deconstruction. Reclaiming solid timber doors, acoustic ceiling panels, modular partitions, and architectural steel fittings.',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: DEMO_PROJECT2_ID,
    name: '[Demo] Victoria Docks Brick Warehouse',
    location: 'London, UK',
    project_type: 'Demolition & Salvage',
    description: 'Late Victorian masonry warehouse strip-out. Salvaging pitch pine timber beams, reclaimed London stock bricks, and industrial steel trusses.',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEMO_MEDIA: MediaAssetRow[] = [
  {
    id: MEDIA1_ID,
    project_id: DEMO_PROJECT_ID,
    cloudinary_public_id: 'samples/paper',
    cloudinary_asset_id: 'sample_asset_1',
    resource_type: 'image',
    secure_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80',
    original_filename: 'interior-partition-doors.jpg',
    mime_type: 'image/jpeg',
    status: 'uploaded',
    analysis_status: 'complete',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: MEDIA2_ID,
    project_id: DEMO_PROJECT_ID,
    cloudinary_public_id: 'cld-sample-4',
    cloudinary_asset_id: 'sample_asset_2',
    resource_type: 'image',
    secure_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&auto=format&fit=crop&q=80',
    original_filename: 'hardwood-framing-timbers.jpg',
    mime_type: 'image/jpeg',
    status: 'uploaded',
    analysis_status: 'complete',
    created_at: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: MEDIA3_ID,
    project_id: DEMO_PROJECT_ID,
    cloudinary_public_id: 'cld-sample-2',
    cloudinary_asset_id: 'sample_asset_3',
    resource_type: 'image',
    secure_url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&auto=format&fit=crop&q=80',
    original_filename: 'industrial-pendant-fittings.jpg',
    mime_type: 'image/jpeg',
    status: 'uploaded',
    analysis_status: 'complete',
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEMO_MATERIALS: MaterialRow[] = [
  {
    id: MAT1_ID,
    project_id: DEMO_PROJECT_ID,
    media_asset_id: MEDIA1_ID,
    material_type: 'wooden-door',
    visual_condition: 'appears-reusable',
    visible_damage: ['minor-surface-wear'],
    context_description: 'Solid core timber door panels mounted in interior commercial partition wall. Hardware intact.',
    reuse_candidate: true,
    ai_confidence: 0.94,
    review_status: 'approved',
    quantity_estimate: 6,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: MAT2_ID,
    project_id: DEMO_PROJECT_ID,
    media_asset_id: MEDIA1_ID,
    material_type: 'steel-member',
    visual_condition: 'appears-intact',
    visible_damage: [],
    context_description: 'Extruded aluminum/steel perimeter glazing tracks and framing anchors.',
    reuse_candidate: true,
    ai_confidence: 0.88,
    review_status: 'approved',
    quantity_estimate: 12,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: MAT3_ID,
    project_id: DEMO_PROJECT_ID,
    media_asset_id: MEDIA2_ID,
    material_type: 'timber',
    visual_condition: 'appears-reusable',
    visible_damage: ['minor-surface-wear'],
    context_description: 'Reclaimed architectural timber beams and battens with visible natural grain and warm patina.',
    reuse_candidate: true,
    ai_confidence: 0.96,
    review_status: 'approved',
    quantity_estimate: 24,
    created_at: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: MAT4_ID,
    project_id: DEMO_PROJECT_ID,
    media_asset_id: MEDIA3_ID,
    material_type: 'lighting-fixture',
    visual_condition: 'appears-intact',
    visible_damage: [],
    context_description: 'Suspended architectural downlights and track luminaires in brushed finish.',
    reuse_candidate: true,
    ai_confidence: 0.91,
    review_status: 'approved',
    quantity_estimate: 14,
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEMO_REUSE_REQUESTS: ReuseRequestRow[] = [
  {
    id: REQ1_ID,
    project_id: DEMO_PROJECT_ID,
    title: 'Modern acoustic office room divider',
    description: 'Looking to build modular acoustic partition dividers for a collaborative co-working studio.',
    style: 'Modern Nordic Minimalist',
    target_dimensions: '2.2m H × 3.6m W modular span',
    budget_text: 'Mid-range commercial fit-out',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEMO_MATCHES: ReuseMatchRow[] = [
  {
    id: MATCH1_ID,
    material_id: MAT1_ID,
    reuse_request_id: REQ1_ID,
    match_score: 94.5,
    // Safe visual-only matching phrasing:
    reason: 'Standard 2.1m leaf and solid-core timber visually appear compatible for modular room divider framing, potentially suitable for further review.',
    created_at: new Date(Date.now() - 3600000 * 17).toISOString(),
  },
];

// Seeded demo concept examples clearly labeled as demonstration seeds:
const DEMO_CONCEPTS: GeneratedConceptRow[] = [
  {
    id: CONC1_ID,
    material_id: MAT1_ID,
    reuse_request_id: REQ1_ID,
    prompt: '[Seeded Demo Example] Modular acoustic privacy screen crafted from reclaimed solid timber door panels.',
    concept_type: 'Modular Partition Screen',
    cloudinary_public_id: null,
    secure_url: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=1200&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
  {
    id: CONC2_ID,
    material_id: MAT1_ID,
    reuse_request_id: REQ1_ID,
    prompt: '[Seeded Demo Example] Studio workstation table from reclaimed solid wood door leaf on brushed steel bases.',
    concept_type: 'Bespoke Studio Table',
    cloudinary_public_id: null,
    secure_url: 'https://images.unsplash.com/photo-1530629013299-6cb10d168419?w=1200&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
  },
  {
    id: CONC3_ID,
    material_id: MAT1_ID,
    reuse_request_id: REQ1_ID,
    prompt: '[Seeded Demo Example] Architectural wall cladding with alternating fluted timber panels and LED edge lighting.',
    concept_type: 'Architectural Feature Cladding',
    cloudinary_public_id: null,
    secure_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
];

const DEMO_PROJECT_IDS = new Set([DEMO_PROJECT_ID, DEMO_PROJECT2_ID]);
const DEMO_MATERIAL_IDS = new Set(DEMO_MATERIALS.map((m) => m.id));

// ─── PERSISTENT STORAGE ENGINE ────────────────────────────────────────────────
// Per-entity durable Cloudinary raw JSON storage.
// Fast in-process memory cache for warm lambda performance.

const PREFIX_PROJECTS = 'raw-reuse/db/projects/';
const PREFIX_MEDIA = 'raw-reuse/db/media/';
const PREFIX_MATERIALS = 'raw-reuse/db/materials/';
const PREFIX_REUSE_REQUESTS = 'raw-reuse/db/reuse-requests/';
const PREFIX_REUSE_MATCHES = 'raw-reuse/db/reuse-matches/';
const PREFIX_CONCEPTS = 'raw-reuse/db/concepts/';

function projectPublicId(id: string): string {
  return `${PREFIX_PROJECTS}${id}.json`;
}
function mediaPublicId(id: string): string {
  return `${PREFIX_MEDIA}${id}.json`;
}
function materialPublicId(id: string): string {
  return `${PREFIX_MATERIALS}${id}.json`;
}
function reuseRequestPublicId(id: string): string {
  return `${PREFIX_REUSE_REQUESTS}${id}.json`;
}
function reuseMatchPublicId(id: string): string {
  return `${PREFIX_REUSE_MATCHES}${id}.json`;
}
function conceptPublicId(id: string): string {
  return `${PREFIX_CONCEPTS}${id}.json`;
}

// In-process memory optimization caches:
const projectsCache = new Map<string, ProjectRow>();
const mediaCache = new Map<string, MediaAssetRow>();
const materialsCache = new Map<string, MaterialRow>();
const reuseRequestsCache = new Map<string, ReuseRequestRow>();
const reuseMatchesCache = new Map<string, ReuseMatchRow>();
const conceptsCache = new Map<string, GeneratedConceptRow>();

// ─── PUBLIC STORE API ─────────────────────────────────────────────────────────

export const store = {
  async listProjects(): Promise<Array<ProjectRow & { media_count: number; material_count: number }>> {
    const projectPublicIds = await listRawResources(PREFIX_PROJECTS);
    await Promise.all(
      projectPublicIds.map(async (pubId) => {
        const id = pubId.replace(PREFIX_PROJECTS, '').replace('.json', '');
        if (!projectsCache.has(id)) {
          const row = await downloadJson<ProjectRow>(pubId);
          if (row) projectsCache.set(id, row);
        }
      }),
    );

    const [mediaPublicIds, materialPublicIds] = await Promise.all([
      listRawResources(PREFIX_MEDIA),
      listRawResources(PREFIX_MATERIALS),
    ]);

    await Promise.all([
      ...mediaPublicIds.map(async (pubId) => {
        const id = pubId.replace(PREFIX_MEDIA, '').replace('.json', '');
        if (!mediaCache.has(id)) {
          const row = await downloadJson<MediaAssetRow>(pubId);
          if (row) mediaCache.set(id, row);
        }
      }),
      ...materialPublicIds.map(async (pubId) => {
        const id = pubId.replace(PREFIX_MATERIALS, '').replace('.json', '');
        if (!materialsCache.has(id)) {
          const row = await downloadJson<MaterialRow>(pubId);
          if (row) materialsCache.set(id, row);
        }
      }),
    ]);

    const persistentProjects = Array.from(projectsCache.values());
    const allProjects = [...DEMO_PROJECTS, ...persistentProjects.filter((p) => !DEMO_PROJECT_IDS.has(p.id))];

    return allProjects.map((p) => {
      const isDemo = DEMO_PROJECT_IDS.has(p.id);
      const mediaCount = isDemo
        ? DEMO_MEDIA.filter((m) => m.project_id === p.id).length
        : Array.from(mediaCache.values()).filter((m) => m.project_id === p.id).length;

      const matCount = isDemo
        ? DEMO_MATERIALS.filter((m) => m.project_id === p.id).length
        : Array.from(materialsCache.values()).filter((m) => m.project_id === p.id).length;

      return {
        ...p,
        media_count: mediaCount,
        material_count: matCount,
      };
    });
  },

  async getProject(id: string): Promise<ProjectRow | null> {
    const demo = DEMO_PROJECTS.find((p) => p.id === id);
    if (demo) return demo;

    if (projectsCache.has(id)) {
      return projectsCache.get(id)!;
    }

    const project = await downloadJson<ProjectRow>(projectPublicId(id));
    if (project) {
      projectsCache.set(id, project);
      return project;
    }

    return null;
  },

  async createProject(input: {
    name: string;
    location?: string | null;
    project_type?: string | null;
    description?: string | null;
  }): Promise<ProjectRow> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const project: ProjectRow = {
      id,
      name: input.name.trim(),
      location: input.location?.trim() || null,
      project_type: input.project_type?.trim() || null,
      description: input.description?.trim() || null,
      created_at: now,
      updated_at: now,
    };

    await uploadJson(projectPublicId(id), project);
    projectsCache.set(id, project);

    return project;
  },

  async getMediaAssets(projectId: string): Promise<MediaAssetRow[]> {
    if (DEMO_PROJECT_IDS.has(projectId)) {
      return DEMO_MEDIA.filter((m) => m.project_id === projectId);
    }

    const mediaPublicIds = await listRawResources(PREFIX_MEDIA);
    await Promise.all(
      mediaPublicIds.map(async (pubId) => {
        const id = pubId.replace(PREFIX_MEDIA, '').replace('.json', '');
        if (!mediaCache.has(id)) {
          const row = await downloadJson<MediaAssetRow>(pubId);
          if (row) mediaCache.set(id, row);
        }
      }),
    );

    return Array.from(mediaCache.values())
      .filter((m) => m.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getMediaAsset(id: string): Promise<MediaAssetRow | null> {
    const demo = DEMO_MEDIA.find((m) => m.id === id);
    if (demo) return demo;

    if (mediaCache.has(id)) {
      return mediaCache.get(id)!;
    }

    const asset = await downloadJson<MediaAssetRow>(mediaPublicId(id));
    if (asset) {
      mediaCache.set(id, asset);
      return asset;
    }

    return null;
  },

  async getMediaAssetByPublicId(publicId: string): Promise<MediaAssetRow | null> {
    const demo = DEMO_MEDIA.find((m) => m.cloudinary_public_id === publicId);
    if (demo) return demo;

    for (const asset of mediaCache.values()) {
      if (asset.cloudinary_public_id === publicId) return asset;
    }

    const mediaPublicIds = await listRawResources(PREFIX_MEDIA);
    for (const pubId of mediaPublicIds) {
      const id = pubId.replace(PREFIX_MEDIA, '').replace('.json', '');
      if (!mediaCache.has(id)) {
        const row = await downloadJson<MediaAssetRow>(pubId);
        if (row) {
          mediaCache.set(id, row);
          if (row.cloudinary_public_id === publicId) return row;
        }
      }
    }

    return null;
  },

  async createMediaAsset(input: {
    project_id: string;
    cloudinary_public_id: string;
    cloudinary_asset_id?: string | null;
    resource_type?: string;
    secure_url: string;
    original_filename?: string | null;
    mime_type?: string | null;
  }): Promise<MediaAssetRow> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const asset: MediaAssetRow = {
      id,
      project_id: input.project_id,
      cloudinary_public_id: input.cloudinary_public_id,
      cloudinary_asset_id: input.cloudinary_asset_id || null,
      resource_type: input.resource_type || 'image',
      secure_url: input.secure_url,
      original_filename: input.original_filename || null,
      mime_type: input.mime_type || null,
      status: 'uploaded',
      analysis_status: 'pending',
      created_at: now,
      updated_at: now,
    };

    await uploadJson(mediaPublicId(id), asset);
    mediaCache.set(id, asset);
    return asset;
  },

  async updateMediaAssetStatus(id: string, status: MediaAssetRow['analysis_status']): Promise<void> {
    const asset = await this.getMediaAsset(id);
    if (asset) {
      asset.analysis_status = status;
      asset.updated_at = new Date().toISOString();
      await uploadJson(mediaPublicId(id), asset);
      mediaCache.set(id, asset);
    }
  },

  async getMaterials(projectId: string): Promise<MaterialRow[]> {
    if (DEMO_PROJECT_IDS.has(projectId)) {
      return DEMO_MATERIALS.filter((m) => m.project_id === projectId).sort(
        (a, b) => (b.ai_confidence ?? 0) - (a.ai_confidence ?? 0),
      );
    }

    const matPublicIds = await listRawResources(PREFIX_MATERIALS);
    await Promise.all(
      matPublicIds.map(async (pubId) => {
        const id = pubId.replace(PREFIX_MATERIALS, '').replace('.json', '');
        if (!materialsCache.has(id)) {
          const row = await downloadJson<MaterialRow>(pubId);
          if (row) materialsCache.set(id, row);
        }
      }),
    );

    return Array.from(materialsCache.values())
      .filter((m) => m.project_id === projectId)
      .sort((a, b) => (b.ai_confidence ?? 0) - (a.ai_confidence ?? 0));
  },

  async getMaterial(id: string): Promise<MaterialRow | null> {
    const demo = DEMO_MATERIALS.find((m) => m.id === id);
    if (demo) return demo;

    if (materialsCache.has(id)) {
      return materialsCache.get(id)!;
    }

    const mat = await downloadJson<MaterialRow>(materialPublicId(id));
    if (mat) {
      materialsCache.set(id, mat);
      return mat;
    }

    return null;
  },

  async saveMaterials(
    materials: Array<Omit<MaterialRow, 'id' | 'created_at' | 'updated_at'>>,
  ): Promise<MaterialRow[]> {
    const now = new Date().toISOString();
    const created: MaterialRow[] = [];

    for (const m of materials) {
      const id = crypto.randomUUID();
      const row: MaterialRow = {
        id,
        ...m,
        created_at: now,
        updated_at: now,
      };
      await uploadJson(materialPublicId(id), row);
      materialsCache.set(id, row);
      created.push(row);
    }

    return created;
  },

  async deletePendingMaterials(mediaAssetId: string): Promise<void> {
    const matPublicIds = await listRawResources(PREFIX_MATERIALS);
    await Promise.all(
      matPublicIds.map(async (pubId) => {
        const id = pubId.replace(PREFIX_MATERIALS, '').replace('.json', '');
        if (!materialsCache.has(id)) {
          const row = await downloadJson<MaterialRow>(pubId);
          if (row) materialsCache.set(id, row);
        }
      }),
    );

    for (const [id, m] of materialsCache.entries()) {
      if (m.media_asset_id === mediaAssetId && m.review_status === 'ai_pending') {
        await deleteJson(materialPublicId(id));
        materialsCache.delete(id);
      }
    }
  },

  async listReuseRequests(projectId: string): Promise<ReuseRequestRow[]> {
    if (DEMO_PROJECT_IDS.has(projectId)) {
      return DEMO_REUSE_REQUESTS.filter((r) => r.project_id === projectId);
    }

    const reqPublicIds = await listRawResources(PREFIX_REUSE_REQUESTS);
    await Promise.all(
      reqPublicIds.map(async (pubId) => {
        const id = pubId.replace(PREFIX_REUSE_REQUESTS, '').replace('.json', '');
        if (!reuseRequestsCache.has(id)) {
          const row = await downloadJson<ReuseRequestRow>(pubId);
          if (row) reuseRequestsCache.set(id, row);
        }
      }),
    );

    return Array.from(reuseRequestsCache.values())
      .filter((r) => r.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getReuseRequest(id: string): Promise<ReuseRequestRow | null> {
    const demo = DEMO_REUSE_REQUESTS.find((r) => r.id === id);
    if (demo) return demo;

    if (reuseRequestsCache.has(id)) {
      return reuseRequestsCache.get(id)!;
    }

    const req = await downloadJson<ReuseRequestRow>(reuseRequestPublicId(id));
    if (req) {
      reuseRequestsCache.set(id, req);
      return req;
    }

    return null;
  },

  async createReuseRequest(input: {
    project_id: string;
    title: string;
    description: string;
    style?: string | null;
    target_dimensions?: string | null;
    budget_text?: string | null;
  }): Promise<{ request: ReuseRequestRow; matches: ReuseMatchRow[] }> {
    const reqId = crypto.randomUUID();
    const now = new Date().toISOString();
    const request: ReuseRequestRow = {
      id: reqId,
      project_id: input.project_id,
      title: input.title.trim(),
      description: input.description.trim(),
      style: input.style?.trim() || null,
      target_dimensions: input.target_dimensions?.trim() || null,
      budget_text: input.budget_text?.trim() || null,
      created_at: now,
      updated_at: now,
    };

    await uploadJson(reuseRequestPublicId(reqId), request);
    reuseRequestsCache.set(reqId, request);

    const materials = await this.getMaterials(input.project_id);
    const matches: ReuseMatchRow[] = [];
    const query = `${request.title} ${request.description} ${request.style ?? ''}`.toLowerCase();

    for (const mat of materials) {
      let score = 65;
      const reasons: string[] = [];

      if (
        (query.includes('divider') || query.includes('partition') || query.includes('screen') || query.includes('door')) &&
        (mat.material_type === 'wooden-door' || mat.material_type === 'timber' || mat.material_type === 'steel-member')
      ) {
        score += 24;
        reasons.push(
          `Material form (${labelize(mat.material_type)}) visually appears compatible with space partitioning geometry, potentially suitable for further review.`,
        );
      } else if (
        (query.includes('table') || query.includes('desk') || query.includes('counter') || query.includes('bench')) &&
        (mat.material_type === 'timber' || mat.material_type === 'wooden-door')
      ) {
        score += 26;
        reasons.push(
          `Surface area and thickness of ${labelize(mat.material_type)} visually appears compatible with horizontal worktop fabrication, potentially suitable for further review.`,
        );
      } else if (
        (query.includes('light') || query.includes('lamp') || query.includes('luminaire')) &&
        mat.material_type === 'lighting-fixture'
      ) {
        score += 30;
        reasons.push(
          'Electrical casing and optical assembly visually appear compatible for inspection and potential retrofitting.',
        );
      } else if (
        (query.includes('wall') || query.includes('cladding') || query.includes('acoustic') || query.includes('facade')) &&
        (mat.material_type === 'timber' || mat.material_type === 'brick' || mat.material_type === 'tile')
      ) {
        score += 22;
        reasons.push(
          `Surface modularity of ${labelize(mat.material_type)} visually appears compatible for decorative acoustic or wall feature review.`,
        );
      } else if (mat.reuse_candidate) {
        score += 10;
        reasons.push('Visually appears compatible as secondary reclamation candidate for further review.');
      }

      if (mat.visual_condition === 'appears-intact' || mat.visual_condition === 'appears-reusable') {
        score += 8;
        reasons.push('High visual integrity: low preparation required prior to finishing.');
      } else if (mat.visible_damage.length > 0) {
        score -= 5;
        reasons.push(`Requires minor reclamation prep due to: ${mat.visible_damage.join(', ')}.`);
      }

      if (mat.ai_confidence && mat.ai_confidence > 0.9) score += 3;

      const matchId = crypto.randomUUID();
      const matchRow: ReuseMatchRow = {
        id: matchId,
        material_id: mat.id,
        reuse_request_id: reqId,
        match_score: Math.min(98, Math.max(45, score)),
        reason: reasons.join(' ') || 'Visually appears compatible as secondary reclamation candidate for further review.',
        created_at: now,
      };

      await uploadJson(reuseMatchPublicId(matchId), matchRow);
      reuseMatchesCache.set(matchId, matchRow);
      matches.push(matchRow);
    }

    matches.sort((a, b) => b.match_score - a.match_score);
    return { request, matches };
  },

  async getMatchesForRequest(
    requestId: string,
  ): Promise<Array<ReuseMatchRow & { material: MaterialRow; sourceMedia: MediaAssetRow | null }>> {
    const demoMatches = DEMO_MATCHES.filter((m) => m.reuse_request_id === requestId);
    if (demoMatches.length > 0) {
      return demoMatches.map((m) => {
        const material = DEMO_MATERIALS.find((mat) => mat.id === m.material_id)!;
        const sourceMedia = material ? DEMO_MEDIA.find((a) => a.id === material.media_asset_id) ?? null : null;
        return { ...m, material, sourceMedia };
      });
    }

    const matchPublicIds = await listRawResources(PREFIX_REUSE_MATCHES);
    await Promise.all(
      matchPublicIds.map(async (pubId) => {
        const id = pubId.replace(PREFIX_REUSE_MATCHES, '').replace('.json', '');
        if (!reuseMatchesCache.has(id)) {
          const row = await downloadJson<ReuseMatchRow>(pubId);
          if (row) reuseMatchesCache.set(id, row);
        }
      }),
    );

    const matches = Array.from(reuseMatchesCache.values())
      .filter((m) => m.reuse_request_id === requestId)
      .sort((a, b) => b.match_score - a.match_score);

    const result: Array<ReuseMatchRow & { material: MaterialRow; sourceMedia: MediaAssetRow | null }> = [];
    for (const m of matches) {
      const material = await this.getMaterial(m.material_id);
      if (!material) continue;
      const sourceMedia = await this.getMediaAsset(material.media_asset_id);
      result.push({ ...m, material, sourceMedia });
    }
    return result;
  },

  async getConceptsForMaterial(materialId: string): Promise<GeneratedConceptRow[]> {
    if (DEMO_MATERIAL_IDS.has(materialId)) {
      return DEMO_CONCEPTS.filter((c) => c.material_id === materialId);
    }

    const conceptPublicIds = await listRawResources(PREFIX_CONCEPTS);
    await Promise.all(
      conceptPublicIds.map(async (pubId) => {
        const id = pubId.replace(PREFIX_CONCEPTS, '').replace('.json', '');
        if (!conceptsCache.has(id)) {
          const row = await downloadJson<GeneratedConceptRow>(pubId);
          if (row) conceptsCache.set(id, row);
        }
      }),
    );

    return Array.from(conceptsCache.values())
      .filter((c) => c.material_id === materialId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async saveConcepts(
    concepts: Array<Omit<GeneratedConceptRow, 'id' | 'created_at'>>,
  ): Promise<GeneratedConceptRow[]> {
    const now = new Date().toISOString();
    const saved: GeneratedConceptRow[] = [];

    for (const c of concepts) {
      const id = crypto.randomUUID();
      const row: GeneratedConceptRow = {
        id,
        ...c,
        created_at: now,
      };
      await uploadJson(conceptPublicId(id), row);
      conceptsCache.set(id, row);
      saved.push(row);
    }

    return saved;
  },

  async getOpportunity(materialId: string): Promise<OpportunityData | null> {
    const material = await this.getMaterial(materialId);
    if (!material) return null;

    const project = await this.getProject(material.project_id);
    const sourceMedia = await this.getMediaAsset(material.media_asset_id);
    if (!project || !sourceMedia) return null;

    let match: ReuseMatchRow | null = null;
    let reuseRequest: ReuseRequestRow | null = null;

    if (DEMO_MATERIAL_IDS.has(materialId)) {
      match = DEMO_MATCHES.find((m) => m.material_id === materialId) ?? null;
      reuseRequest = match ? DEMO_REUSE_REQUESTS.find((r) => r.id === match!.reuse_request_id) ?? null : null;
    } else {
      const matchPublicIds = await listRawResources(PREFIX_REUSE_MATCHES);
      await Promise.all(
        matchPublicIds.map(async (pubId) => {
          const id = pubId.replace(PREFIX_REUSE_MATCHES, '').replace('.json', '');
          if (!reuseMatchesCache.has(id)) {
            const row = await downloadJson<ReuseMatchRow>(pubId);
            if (row) reuseMatchesCache.set(id, row);
          }
        }),
      );
      match = Array.from(reuseMatchesCache.values()).find((m) => m.material_id === materialId) ?? null;

      if (match) {
        reuseRequest = await this.getReuseRequest(match.reuse_request_id);
      }
    }

    const concepts = await this.getConceptsForMaterial(materialId);
    return {
      project,
      material,
      sourceMedia,
      reuseRequest,
      match,
      concepts,
    };
  },
};
