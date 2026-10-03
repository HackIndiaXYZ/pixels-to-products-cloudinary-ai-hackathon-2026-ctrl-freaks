import 'server-only';
import { AppError } from '@/lib/errors';
import { store } from '@/lib/store';
import type { MaterialRow, MediaAssetRow, ProjectRow, ReuseRequestRow } from '@/lib/types';

export type Loaded<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } };

/** Lets pages render cleanly or catch error states gracefully. */
export async function attempt<T>(fn: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof AppError) {
      return { ok: false, error: { code: error.code, message: error.message } };
    }
    console.error('[data] unexpected error', error);
    return { ok: false, error: { code: 'unknown_error', message: 'Failed to load data.' } };
  }
}

export interface ProjectSummary extends ProjectRow {
  media_count: number;
  material_count: number;
}

export async function listProjects(): Promise<ProjectSummary[]> {
  return await store.listProjects();
}

export async function getProject(id: string): Promise<ProjectRow> {
  const project = await store.getProject(id);
  if (!project) throw new AppError(404, 'not_found', 'Project not found.');
  return project;
}

export async function getProjectWorkspace(id: string) {
  const project = await getProject(id);
  const [media, materials, reuseRequests] = await Promise.all([
    store.getMediaAssets(id),
    store.getMaterials(id),
    store.listReuseRequests(id),
  ]);
  return {
    project,
    media: media as MediaAssetRow[],
    materials: materials as MaterialRow[],
    reuseRequests: reuseRequests as ReuseRequestRow[],
  };
}

export async function getMaterialDetail(id: string) {
  const material = await store.getMaterial(id);
  if (!material) throw new AppError(404, 'not_found', 'Material not found.');
  const [project, mediaAsset, concepts] = await Promise.all([
    store.getProject(material.project_id),
    store.getMediaAsset(material.media_asset_id),
    store.getConceptsForMaterial(material.id),
  ]);
  if (!project || !mediaAsset) throw new AppError(404, 'not_found', 'Source project or media asset missing.');
  return { material, project, mediaAsset, concepts };
}

export async function getOpportunityData(materialId: string) {
  const data = await store.getOpportunity(materialId);
  if (!data) throw new AppError(404, 'not_found', 'Opportunity not found.');
  return data;
}
