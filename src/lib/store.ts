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

// In-memory store with demo seeds for hackathon speed and reliability
interface DatabaseState {
  projects: Map<string, ProjectRow>;
  mediaAssets: Map<string, MediaAssetRow>;
  materials: Map<string, MaterialRow>;
  reuseRequests: Map<string, ReuseRequestRow>;
  reuseMatches: Map<string, ReuseMatchRow>;
  generatedConcepts: Map<string, GeneratedConceptRow>;
}

declare global {
  var __rawReuseDb: DatabaseState | undefined;
}

function initDb(): DatabaseState {
  if (global.__rawReuseDb) return global.__rawReuseDb;

  const db: DatabaseState = {
    projects: new Map(),
    mediaAssets: new Map(),
    materials: new Map(),
    reuseRequests: new Map(),
    reuseMatches: new Map(),
    generatedConcepts: new Map(),
  };

  // Seed Demo Project 1: Harbour Street Office Strip-out
  const demoProjectId = '11111111-1111-4111-8111-111111111111';
  db.projects.set(demoProjectId, {
    id: demoProjectId,
    name: 'Harbour Street Office Strip-out',
    location: 'Rotterdam, NL',
    project_type: 'Interior fit-out & Deconstruction',
    description: 'Commercial 4th-floor commercial office space deconstruction. Reclaiming solid timber doors, acoustic ceiling panels, modular partitions, and architectural steel fittings.',
    created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed Demo Project 2: Victoria Docks Industrial Warehouse
  const demoProject2Id = '22222222-2222-4222-8222-222222222222';
  db.projects.set(demoProject2Id, {
    id: demoProject2Id,
    name: 'Victoria Docks Brick Warehouse',
    location: 'London, UK',
    project_type: 'Demolition & Salvage',
    description: 'Late Victorian masonry warehouse strip-out. Salvaging structural pitch pine timber beams, reclaimed London stock bricks, and industrial steel trusses.',
    created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed Media Assets for Demo 1 using Cloudinary sample assets
  const media1Id = 'aaaa1111-1111-4111-8111-aaaaaaaaaaaa';
  db.mediaAssets.set(media1Id, {
    id: media1Id,
    project_id: demoProjectId,
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
  });

  const media2Id = 'aaaa2222-2222-4222-8222-aaaaaaaaaaaa';
  db.mediaAssets.set(media2Id, {
    id: media2Id,
    project_id: demoProjectId,
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
  });

  const media3Id = 'aaaa3333-3333-4333-8333-aaaaaaaaaaaa';
  db.mediaAssets.set(media3Id, {
    id: media3Id,
    project_id: demoProjectId,
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
  });

  // Seed Materials for Media 1
  const mat1Id = 'bbbb1111-1111-4111-8111-bbbbbbbbbbbb';
  db.materials.set(mat1Id, {
    id: mat1Id,
    project_id: demoProjectId,
    media_asset_id: media1Id,
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
  });

  const mat2Id = 'bbbb2222-2222-4222-8222-bbbbbbbbbbbb';
  db.materials.set(mat2Id, {
    id: mat2Id,
    project_id: demoProjectId,
    media_asset_id: media1Id,
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
  });

  // Seed Materials for Media 2
  const mat3Id = 'bbbb3333-3333-4333-8333-bbbbbbbbbbbb';
  db.materials.set(mat3Id, {
    id: mat3Id,
    project_id: demoProjectId,
    media_asset_id: media2Id,
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
  });

  // Seed Materials for Media 3
  const mat4Id = 'bbbb4444-4444-4444-8444-bbbbbbbbbbbb';
  db.materials.set(mat4Id, {
    id: mat4Id,
    project_id: demoProjectId,
    media_asset_id: media3Id,
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
  });

  // Seed Reuse Request
  const req1Id = 'cccc1111-1111-4111-8111-cccccccccccc';
  db.reuseRequests.set(req1Id, {
    id: req1Id,
    project_id: demoProjectId,
    title: 'Modern acoustic office room divider',
    description: 'Looking to build modular acoustic partition dividers for a collaborative co-working studio using reclaimed timber doors or structural slats.',
    style: 'Modern Nordic Minimalist',
    target_dimensions: '2.2m H × 3.6m W modular span',
    budget_text: 'Mid-range commercial fit-out',
    created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Seed Match
  const match1Id = 'dddd1111-1111-4111-8111-dddddddddddd';
  db.reuseMatches.set(match1Id, {
    id: match1Id,
    material_id: mat1Id,
    reuse_request_id: req1Id,
    match_score: 94.5,
    reason: 'Dimensions (2.1m standard leaf) and solid-core timber construction align directly with modular room divider framing. Visible surface wear can be preserved or lightly sanded for biophilic acoustic aesthetics.',
    created_at: new Date(Date.now() - 3600000 * 17).toISOString(),
  });

  // Seed Generated Concepts for Material 1
  const conc1Id = 'eeee1111-1111-4111-8111-eeeeeeeeeeee';
  db.generatedConcepts.set(conc1Id, {
    id: conc1Id,
    material_id: mat1Id,
    reuse_request_id: req1Id,
    prompt: 'Modular acoustic privacy screen crafted from reclaimed solid timber door panels with brass pivot hardware and slatted ventilation inserts.',
    concept_type: 'Modular Partition Screen',
    cloudinary_public_id: null,
    secure_url: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=1200&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 3600000 * 16).toISOString(),
  });

  const conc2Id = 'eeee2222-2222-4222-8222-eeeeeeeeeeee';
  db.generatedConcepts.set(conc2Id, {
    id: conc2Id,
    material_id: mat1Id,
    reuse_request_id: req1Id,
    prompt: 'Executive meeting table centerpiece fabricated from reclaimed solid wood door leaf mounted on brushed steel trestle bases.',
    concept_type: 'Bespoke Studio Table',
    cloudinary_public_id: null,
    secure_url: 'https://images.unsplash.com/photo-1530629013299-6cb10d168419?w=1200&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 3600000 * 15).toISOString(),
  });

  const conc3Id = 'eeee3333-3333-4333-8333-eeeeeeeeeeee';
  db.generatedConcepts.set(conc3Id, {
    id: conc3Id,
    material_id: mat1Id,
    reuse_request_id: req1Id,
    prompt: 'Architectural wall cladding with alternating fluted timber panels and integrated soft-glow ambient LED edge lighting.',
    concept_type: 'Architectural Feature Cladding',
    cloudinary_public_id: null,
    secure_url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
    created_at: new Date(Date.now() - 3600000 * 14).toISOString(),
  });

  global.__rawReuseDb = db;
  return db;
}

export const store = {
  // Projects
  async listProjects(): Promise<Array<ProjectRow & { media_count: number; material_count: number }>> {
    const db = initDb();
    const list = Array.from(db.projects.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return list.map((p) => {
      const media_count = Array.from(db.mediaAssets.values()).filter((m) => m.project_id === p.id).length;
      const material_count = Array.from(db.materials.values()).filter((m) => m.project_id === p.id).length;
      return { ...p, media_count, material_count };
    });
  },

  async getProject(id: string): Promise<ProjectRow | null> {
    const db = initDb();
    return db.projects.get(id) ?? null;
  },

  async createProject(input: { name: string; location?: string | null; project_type?: string | null; description?: string | null }): Promise<ProjectRow> {
    const db = initDb();
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
    db.projects.set(id, project);
    return project;
  },

  // Media Assets
  async getMediaAssets(projectId: string): Promise<MediaAssetRow[]> {
    const db = initDb();
    return Array.from(db.mediaAssets.values())
      .filter((m) => m.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getMediaAsset(id: string): Promise<MediaAssetRow | null> {
    const db = initDb();
    return db.mediaAssets.get(id) ?? null;
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
    const db = initDb();
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
    db.mediaAssets.set(id, asset);
    return asset;
  },

  async updateMediaAssetStatus(id: string, status: MediaAssetRow['analysis_status']): Promise<void> {
    const db = initDb();
    const asset = db.mediaAssets.get(id);
    if (asset) {
      asset.analysis_status = status;
      asset.updated_at = new Date().toISOString();
    }
  },

  // Materials
  async getMaterials(projectId: string): Promise<MaterialRow[]> {
    const db = initDb();
    return Array.from(db.materials.values())
      .filter((m) => m.project_id === projectId)
      .sort((a, b) => (b.ai_confidence ?? 0) - (a.ai_confidence ?? 0));
  },

  async getMaterial(id: string): Promise<MaterialRow | null> {
    const db = initDb();
    return db.materials.get(id) ?? null;
  },

  async saveMaterials(materials: Array<Omit<MaterialRow, 'id' | 'created_at' | 'updated_at'>>): Promise<MaterialRow[]> {
    const db = initDb();
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
      db.materials.set(id, row);
      created.push(row);
    }
    return created;
  },

  async deletePendingMaterials(mediaAssetId: string): Promise<void> {
    const db = initDb();
    for (const [id, m] of db.materials.entries()) {
      if (m.media_asset_id === mediaAssetId && m.review_status === 'ai_pending') {
        db.materials.delete(id);
      }
    }
  },

  // Reuse Requests
  async listReuseRequests(projectId: string): Promise<ReuseRequestRow[]> {
    const db = initDb();
    return Array.from(db.reuseRequests.values())
      .filter((r) => r.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getReuseRequest(id: string): Promise<ReuseRequestRow | null> {
    const db = initDb();
    return db.reuseRequests.get(id) ?? null;
  },

  async createReuseRequest(input: {
    project_id: string;
    title: string;
    description: string;
    style?: string | null;
    target_dimensions?: string | null;
    budget_text?: string | null;
  }): Promise<{ request: ReuseRequestRow; matches: ReuseMatchRow[] }> {
    const db = initDb();
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
    db.reuseRequests.set(reqId, request);

    // Run transparent matching against candidate materials
    const materials = await this.getMaterials(input.project_id);
    const matches: ReuseMatchRow[] = [];
    const query = `${request.title} ${request.description} ${request.style ?? ''}`.toLowerCase();

    for (const mat of materials) {
      let score = 65;
      const reasons: string[] = [];

      // Type compatibility
      if (
        (query.includes('divider') || query.includes('partition') || query.includes('screen') || query.includes('door')) &&
        (mat.material_type === 'wooden-door' || mat.material_type === 'timber' || mat.material_type === 'steel-member')
      ) {
        score += 24;
        reasons.push(`Material form (${labelize(mat.material_type)}) matches structural requirements for space partitioning.`);
      } else if (
        (query.includes('table') || query.includes('desk') || query.includes('counter') || query.includes('bench')) &&
        (mat.material_type === 'timber' || mat.material_type === 'wooden-door')
      ) {
        score += 26;
        reasons.push(`Surface area and thickness of ${labelize(mat.material_type)} is ideal for horizontal worktops.`);
      } else if (
        (query.includes('light') || query.includes('lamp') || query.includes('luminaire')) &&
        mat.material_type === 'lighting-fixture'
      ) {
        score += 30;
        reasons.push('Electrical casing and optical assembly can be re-lamped or retrofitted directly.');
      } else if (
        (query.includes('wall') || query.includes('cladding') || query.includes('acoustic') || query.includes('facade')) &&
        (mat.material_type === 'timber' || mat.material_type === 'brick' || mat.material_type === 'tile')
      ) {
        score += 22;
        reasons.push(`Surface modularity of ${labelize(mat.material_type)} enables decorative acoustic or feature panelling.`);
      } else if (mat.reuse_candidate) {
        score += 10;
        reasons.push(`Good general reuse suitability with versatile dimensions.`);
      }

      // Condition bonus
      if (mat.visual_condition === 'appears-intact' || mat.visual_condition === 'appears-reusable') {
        score += 8;
        reasons.push('High visual integrity: low preparation required prior to finishing.');
      } else if (mat.visible_damage.length > 0) {
        score -= 5;
        reasons.push(`Requires minor reclamation prep due to: ${mat.visible_damage.join(', ')}.`);
      }

      // Confidence factor
      if (mat.ai_confidence && mat.ai_confidence > 0.9) score += 3;

      const finalScore = Math.min(98, Math.max(45, score));
      const matchRow: ReuseMatchRow = {
        id: crypto.randomUUID(),
        material_id: mat.id,
        reuse_request_id: reqId,
        match_score: finalScore,
        reason: reasons.join(' ') || 'Compatible construction element for secondary fabrication.',
        created_at: now,
      };
      db.reuseMatches.set(matchRow.id, matchRow);
      matches.push(matchRow);
    }

    matches.sort((a, b) => b.match_score - a.match_score);
    return { request, matches };
  },

  async getMatchesForRequest(requestId: string): Promise<Array<ReuseMatchRow & { material: MaterialRow; sourceMedia: MediaAssetRow | null }>> {
    const db = initDb();
    const matches = Array.from(db.reuseMatches.values())
      .filter((m) => m.reuse_request_id === requestId)
      .sort((a, b) => b.match_score - a.match_score);

    return matches.map((m) => {
      const material = db.materials.get(m.material_id)!;
      const sourceMedia = material ? db.mediaAssets.get(material.media_asset_id) ?? null : null;
      return { ...m, material, sourceMedia };
    });
  },

  // Generated Concepts
  async getConceptsForMaterial(materialId: string): Promise<GeneratedConceptRow[]> {
    const db = initDb();
    return Array.from(db.generatedConcepts.values())
      .filter((c) => c.material_id === materialId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async saveConcepts(concepts: Array<Omit<GeneratedConceptRow, 'id' | 'created_at'>>): Promise<GeneratedConceptRow[]> {
    const db = initDb();
    const now = new Date().toISOString();
    const saved: GeneratedConceptRow[] = [];
    for (const c of concepts) {
      const id = crypto.randomUUID();
      const row: GeneratedConceptRow = {
        id,
        ...c,
        created_at: now,
      };
      db.generatedConcepts.set(id, row);
      saved.push(row);
    }
    return saved;
  },

  // Opportunity / Share Page
  async getOpportunity(materialId: string): Promise<OpportunityData | null> {
    const db = initDb();
    const material = db.materials.get(materialId);
    if (!material) return null;
    const project = db.projects.get(material.project_id);
    const sourceMedia = db.mediaAssets.get(material.media_asset_id);
    if (!project || !sourceMedia) return null;

    // Find any match / request
    const match = Array.from(db.reuseMatches.values()).find((m) => m.material_id === materialId) ?? null;
    const reuseRequest = match ? db.reuseRequests.get(match.reuse_request_id) ?? null : null;
    const concepts = Array.from(db.generatedConcepts.values()).filter((c) => c.material_id === materialId);

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
