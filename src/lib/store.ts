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
  cldCreateProject,
  cldGetProject,
  cldListProjects,
  cldListMediaAssets,
  cldGetMediaAsset,
  cldRegisterMediaAsset,
  cldSaveMaterials,
  cldGetMaterials,
  cldSaveConcepts,
} from './cloudinary/persist';

// ─── DEMO SEED DATA (always available, in-memory) ─────────────────────────────

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
    name: 'Harbour Street Office Strip-out',
    location: 'Rotterdam, NL',
    project_type: 'Interior fit-out & Deconstruction',
    description: 'Commercial 4th-floor office deconstruction. Reclaiming solid timber doors, acoustic ceiling panels, modular partitions, and architectural steel fittings.',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: DEMO_PROJECT2_ID,
    name: 'Victoria Docks Brick Warehouse',
    location: 'London, UK',
    project_type: 'Demolition & Salvage',
    description: 'Late Victorian masonry warehouse strip-out. Salvaging structural pitch pine timber beams, reclaimed London stock bricks, and industrial steel trusses.',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const DEMO_MEDIA: MediaAssetRow[] = [
  {
    id: MEDIA1_ID, project_id: DEMO_PROJECT_ID,
    cloudinary_public_id: 'samples/paper', cloudinary_asset_id: 'sample_asset_1', resource_type: 'image',
    secure_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80',
    original_filename: 'interior-partition-doors.jpg', mime_type: 'image/jpeg',
    status: 'uploaded', analysis_status: 'complete',
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: MEDIA2_ID, project_id: DEMO_PROJECT_ID,
    cloudinary_public_id: 'cld-sample-4', cloudinary_asset_id: 'sample_asset_2', resource_type: 'image',
    secure_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1600&auto=format&fit=crop&q=80',
    original_filename: 'hardwood-framing-timbers.jpg', mime_type: 'image/jpeg',
    status: 'uploaded', analysis_status: 'complete',
    created_at: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: MEDIA3_ID, project_id: DEMO_PROJECT_ID,
    cloudinary_public_id: 'cld-sample-2', cloudinary_asset_id: 'sample_asset_3', resource_type: 'image',
    secure_url: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&auto=format&fit=crop&q=80',
    original_filename: 'industrial-pendant-fittings.jpg', mime_type: 'image/jpeg',
    status: 'uploaded', analysis_status: 'complete',
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), updated_at: new Date().toISOString(),
  },
];

const DEMO_MATERIALS: MaterialRow[] = [
  {
    id: MAT1_ID, project_id: DEMO_PROJECT_ID, media_asset_id: MEDIA1_ID,
    material_type: 'wooden-door', visual_condition: 'appears-reusable', visible_damage: ['minor-surface-wear'],
    context_description: 'Solid core timber door panels mounted in interior commercial partition wall. Hardware intact.',
    reuse_candidate: true, ai_confidence: 0.94, review_status: 'approved', quantity_estimate: 6,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: MAT2_ID, project_id: DEMO_PROJECT_ID, media_asset_id: MEDIA1_ID,
    material_type: 'steel-member', visual_condition: 'appears-intact', visible_damage: [],
    context_description: 'Extruded aluminum/steel perimeter glazing tracks and framing anchors.',
    reuse_candidate: true, ai_confidence: 0.88, review_status: 'approved', quantity_estimate: 12,
    created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: MAT3_ID, project_id: DEMO_PROJECT_ID, media_asset_id: MEDIA2_ID,
    material_type: 'timber', visual_condition: 'appears-reusable', visible_damage: ['minor-surface-wear'],
    context_description: 'Reclaimed architectural timber beams and battens with visible natural grain and warm patina.',
    reuse_candidate: true, ai_confidence: 0.96, review_status: 'approved', quantity_estimate: 24,
    created_at: new Date(Date.now() - 3600000 * 24 * 1.5).toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: MAT4_ID, project_id: DEMO_PROJECT_ID, media_asset_id: MEDIA3_ID,
    material_type: 'lighting-fixture', visual_condition: 'appears-intact', visible_damage: [],
    context_description: 'Suspended architectural downlights and track luminaires in brushed finish.',
    reuse_candidate: true, ai_confidence: 0.91, review_status: 'approved', quantity_estimate: 14,
    created_at: new Date(Date.now() - 3600000 * 24 * 1).toISOString(), updated_at: new Date().toISOString(),
  },
];

const DEMO_REUSE_REQUESTS: ReuseRequestRow[] = [
  {
    id: REQ1_ID, project_id: DEMO_PROJECT_ID, title: 'Modern acoustic office room divider',
    description: 'Looking to build modular acoustic partition dividers for a collaborative co-working studio.',
    style: 'Modern Nordic Minimalist', target_dimensions: '2.2m H × 3.6m W modular span',
    budget_text: 'Mid-range commercial fit-out',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(), updated_at: new Date().toISOString(),
  },
];

const DEMO_MATCHES: ReuseMatchRow[] = [
  {
    id: MATCH1_ID, material_id: MAT1_ID, reuse_request_id: REQ1_ID, match_score: 94.5,
    reason: 'Dimensions (2.1m standard leaf) and solid-core timber construction align directly with modular room divider framing.',
    created_at: new Date(Date.now() - 3600000 * 17).toISOString(),
  },
];

const DEMO_CONCEPTS: GeneratedConceptRow[] = [
  {
    id: CONC1_ID, material_id: MAT1_ID, reuse_request_id: REQ1_ID,
    prompt: 'Modular acoustic privacy screen crafted from reclaimed solid timber door panels.',
    concept_type: 'Modular Partition Screen', cloudinary_public_id: null,
    secure_url: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=1200&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
  },
  {
    id: CONC2_ID, material_id: MAT1_ID, reuse_request_id: REQ1_ID,
    prompt: 'Executive meeting table from reclaimed solid wood door leaf on brushed steel bases.',
    concept_type: 'Bespoke Studio Table', cloudinary_public_id: null,
    secure_url: 'https://images.unsplash.com/photo-1530629013299-6cb10d168419?w=1200&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
  },
  {
    id: CONC3_ID, material_id: MAT1_ID, reuse_request_id: REQ1_ID,
    prompt: 'Architectural wall cladding with alternating fluted timber panels and LED edge lighting.',
    concept_type: 'Architectural Feature Cladding', cloudinary_public_id: null,
    secure_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
  },
];

const DEMO_PROJECT_IDS = new Set([DEMO_PROJECT_ID, DEMO_PROJECT2_ID]);
const DEMO_MATERIAL_IDS = new Set(DEMO_MATERIALS.map(m => m.id));

// Volatile in-memory for reuse requests/matches (transient, not worth persisting)
declare global { var __volatileStore: { reuseRequests: Map<string, ReuseRequestRow>; reuseMatches: Map<string, ReuseMatchRow> } | undefined; }

function getVolatile() {
  if (!global.__volatileStore) {
    global.__volatileStore = {
      reuseRequests: new Map(DEMO_REUSE_REQUESTS.map(r => [r.id, r])),
      reuseMatches: new Map(DEMO_MATCHES.map(m => [m.id, m])),
    };
  }
  return global.__volatileStore;
}

// ─── STORE ────────────────────────────────────────────────────────────────────

export const store = {
  async listProjects(): Promise<Array<ProjectRow & { media_count: number; material_count: number }>> {
    let cldProjects: ProjectRow[] = [];
    try { cldProjects = (await cldListProjects()).filter(p => !DEMO_PROJECT_IDS.has(p.id)); } catch { /* graceful */ }
    return [...DEMO_PROJECTS, ...cldProjects].map(p => ({ ...p, media_count: 0, material_count: 0 }));
  },

  async getProject(id: string): Promise<ProjectRow | null> {
    const demo = DEMO_PROJECTS.find(p => p.id === id);
    if (demo) return demo;
    try { return await cldGetProject(id); } catch { return null; }
  },

  async createProject(input: { name: string; location?: string | null; project_type?: string | null; description?: string | null }): Promise<ProjectRow> {
    const id = crypto.randomUUID();
    return cldCreateProject({ id, name: input.name.trim(), location: input.location?.trim() || null, project_type: input.project_type?.trim() || null, description: input.description?.trim() || null });
  },

  async getMediaAssets(projectId: string): Promise<MediaAssetRow[]> {
    if (DEMO_PROJECT_IDS.has(projectId)) return DEMO_MEDIA.filter(m => m.project_id === projectId);
    try { return (await cldListMediaAssets(projectId)) as MediaAssetRow[]; } catch { return []; }
  },

  async getMediaAsset(id: string): Promise<MediaAssetRow | null> {
    return DEMO_MEDIA.find(m => m.id === id) ?? null;
  },

  async getMediaAssetByPublicId(publicId: string): Promise<MediaAssetRow | null> {
    const demo = DEMO_MEDIA.find(m => m.cloudinary_public_id === publicId);
    if (demo) return demo;
    try { return (await cldGetMediaAsset(publicId)) as MediaAssetRow | null; } catch { return null; }
  },

  async createMediaAsset(input: {
    project_id: string; cloudinary_public_id: string; cloudinary_asset_id?: string | null;
    resource_type?: string; secure_url: string; original_filename?: string | null; mime_type?: string | null;
  }): Promise<MediaAssetRow> {
    if (DEMO_PROJECT_IDS.has(input.project_id)) {
      const now = new Date().toISOString();
      return { id: crypto.randomUUID(), project_id: input.project_id, cloudinary_public_id: input.cloudinary_public_id, cloudinary_asset_id: input.cloudinary_asset_id || null, resource_type: 'image', secure_url: input.secure_url, original_filename: input.original_filename || null, mime_type: input.mime_type || null, status: 'uploaded', analysis_status: 'pending', created_at: now, updated_at: now };
    }
    return (await cldRegisterMediaAsset(input)) as MediaAssetRow;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateMediaAssetStatus(_id: string, _status: MediaAssetRow['analysis_status']): Promise<void> {
    // Status updated when materials are saved via cldSaveMaterials
  },

  async getMaterials(projectId: string): Promise<MaterialRow[]> {
    if (DEMO_PROJECT_IDS.has(projectId)) return DEMO_MATERIALS.filter(m => m.project_id === projectId).sort((a, b) => (b.ai_confidence ?? 0) - (a.ai_confidence ?? 0));
    try {
      const assets = await cldListMediaAssets(projectId);
      const all: MaterialRow[] = [];
      for (const asset of assets) {
        const mats = (await cldGetMaterials(asset.cloudinary_public_id)) as MaterialRow[];
        all.push(...mats);
      }
      return all.sort((a, b) => (b.ai_confidence ?? 0) - (a.ai_confidence ?? 0));
    } catch { return []; }
  },

  async getMaterial(id: string): Promise<MaterialRow | null> {
    return DEMO_MATERIALS.find(m => m.id === id) ?? null;
  },

  async saveMaterials(materials: Array<Omit<MaterialRow, 'id' | 'created_at' | 'updated_at'>>): Promise<MaterialRow[]> {
    const now = new Date().toISOString();
    const created: MaterialRow[] = materials.map(m => ({ id: crypto.randomUUID(), ...m, created_at: now, updated_at: now }));
    // Group by media asset public_id and persist to Cloudinary
    const byAsset = new Map<string, { publicId: string; mats: MaterialRow[] }>();
    for (const m of created) {
      if (DEMO_MATERIAL_IDS.has(m.media_asset_id)) continue;
      // Find publicId for this asset
      const assets = await cldListMediaAssets(m.project_id).catch(() => []);
      const asset = assets.find(a => a.id === m.media_asset_id);
      if (!asset) continue;
      const existing = byAsset.get(asset.cloudinary_public_id) ?? { publicId: asset.cloudinary_public_id, mats: [] };
      existing.mats.push(m);
      byAsset.set(asset.cloudinary_public_id, existing);
    }
    for (const { publicId, mats } of byAsset.values()) {
      await cldSaveMaterials(publicId, mats).catch(() => {/* non-fatal */});
    }
    return created;
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async deletePendingMaterials(_mediaAssetId: string): Promise<void> { /* handled via overwrite on save */ },

  async listReuseRequests(projectId: string): Promise<ReuseRequestRow[]> {
    return Array.from(getVolatile().reuseRequests.values()).filter(r => r.project_id === projectId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getReuseRequest(id: string): Promise<ReuseRequestRow | null> {
    return getVolatile().reuseRequests.get(id) ?? null;
  },

  async createReuseRequest(input: { project_id: string; title: string; description: string; style?: string | null; target_dimensions?: string | null; budget_text?: string | null }): Promise<{ request: ReuseRequestRow; matches: ReuseMatchRow[] }> {
    const v = getVolatile();
    const reqId = crypto.randomUUID();
    const now = new Date().toISOString();
    const request: ReuseRequestRow = { id: reqId, project_id: input.project_id, title: input.title.trim(), description: input.description.trim(), style: input.style?.trim() || null, target_dimensions: input.target_dimensions?.trim() || null, budget_text: input.budget_text?.trim() || null, created_at: now, updated_at: now };
    v.reuseRequests.set(reqId, request);
    const materials = await this.getMaterials(input.project_id);
    const matches: ReuseMatchRow[] = [];
    const query = `${request.title} ${request.description} ${request.style ?? ''}`.toLowerCase();
    for (const mat of materials) {
      let score = 65; const reasons: string[] = [];
      if ((query.includes('divider') || query.includes('partition') || query.includes('screen') || query.includes('door')) && (mat.material_type === 'wooden-door' || mat.material_type === 'timber' || mat.material_type === 'steel-member')) { score += 24; reasons.push(`Material form (${labelize(mat.material_type)}) matches structural requirements for space partitioning.`); }
      else if ((query.includes('table') || query.includes('desk') || query.includes('counter') || query.includes('bench')) && (mat.material_type === 'timber' || mat.material_type === 'wooden-door')) { score += 26; reasons.push(`Surface area and thickness of ${labelize(mat.material_type)} is ideal for horizontal worktops.`); }
      else if ((query.includes('light') || query.includes('lamp') || query.includes('luminaire')) && mat.material_type === 'lighting-fixture') { score += 30; reasons.push('Electrical casing and optical assembly can be re-lamped or retrofitted directly.'); }
      else if ((query.includes('wall') || query.includes('cladding') || query.includes('acoustic') || query.includes('facade')) && (mat.material_type === 'timber' || mat.material_type === 'brick' || mat.material_type === 'tile')) { score += 22; reasons.push(`Surface modularity of ${labelize(mat.material_type)} enables decorative acoustic or feature panelling.`); }
      else if (mat.reuse_candidate) { score += 10; reasons.push('Good general reuse suitability with versatile dimensions.'); }
      if (mat.visual_condition === 'appears-intact' || mat.visual_condition === 'appears-reusable') { score += 8; reasons.push('High visual integrity: low preparation required prior to finishing.'); }
      else if (mat.visible_damage.length > 0) { score -= 5; reasons.push(`Requires minor reclamation prep due to: ${mat.visible_damage.join(', ')}.`); }
      if (mat.ai_confidence && mat.ai_confidence > 0.9) score += 3;
      const matchRow: ReuseMatchRow = { id: crypto.randomUUID(), material_id: mat.id, reuse_request_id: reqId, match_score: Math.min(98, Math.max(45, score)), reason: reasons.join(' ') || 'Compatible construction element for secondary fabrication.', created_at: now };
      v.reuseMatches.set(matchRow.id, matchRow);
      matches.push(matchRow);
    }
    matches.sort((a, b) => b.match_score - a.match_score);
    return { request, matches };
  },

  async getMatchesForRequest(requestId: string): Promise<Array<ReuseMatchRow & { material: MaterialRow; sourceMedia: MediaAssetRow | null }>> {
    const v = getVolatile();
    return Array.from(v.reuseMatches.values()).filter(m => m.reuse_request_id === requestId).sort((a, b) => b.match_score - a.match_score).map(m => {
      const material = DEMO_MATERIALS.find(mat => mat.id === m.material_id) ?? (null as unknown as MaterialRow);
      const sourceMedia = material ? (DEMO_MEDIA.find(a => a.id === material.media_asset_id) ?? null) : null;
      return { ...m, material, sourceMedia };
    });
  },

  async getConceptsForMaterial(materialId: string): Promise<GeneratedConceptRow[]> {
    if (DEMO_MATERIAL_IDS.has(materialId)) return DEMO_CONCEPTS.filter(c => c.material_id === materialId);
    return [];
  },

  async saveConcepts(concepts: Array<Omit<GeneratedConceptRow, 'id' | 'created_at'>>): Promise<GeneratedConceptRow[]> {
    const now = new Date().toISOString();
    const saved: GeneratedConceptRow[] = concepts.map(c => ({ id: crypto.randomUUID(), ...c, created_at: now }));
    const pubId = saved[0]?.cloudinary_public_id ?? null;
    if (pubId) {
      try { await cldSaveConcepts(pubId, saved); } catch { /* non-fatal */ }
    }
    return saved;
  },

  async getOpportunity(materialId: string): Promise<OpportunityData | null> {
    const v = getVolatile();
    const material = DEMO_MATERIALS.find(m => m.id === materialId);
    if (!material) return null;
    const project = DEMO_PROJECTS.find(p => p.id === material.project_id);
    const sourceMedia = DEMO_MEDIA.find(a => a.id === material.media_asset_id);
    if (!project || !sourceMedia) return null;
    const match = Array.from(v.reuseMatches.values()).find(m => m.material_id === materialId) ?? null;
    const reuseRequest = match ? v.reuseRequests.get(match.reuse_request_id) ?? null : null;
    const concepts = DEMO_CONCEPTS.filter(c => c.material_id === materialId);
    return { project, material, sourceMedia, reuseRequest, match, concepts };
  },
};
