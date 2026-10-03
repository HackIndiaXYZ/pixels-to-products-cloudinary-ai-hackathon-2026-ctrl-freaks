import 'server-only';
import { serverEnv } from '@/lib/env';
import { AppError } from '@/lib/errors';
import { signParams } from './signing';

const API = 'https://api.cloudinary.com';
const PROJECT_FOLDER = 'raw-reuse/_projects';

function basicAuth(): string {
  const env = serverEnv();
  return 'Basic ' + Buffer.from(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`).toString('base64');
}

async function cldFetch(url: string, init: RequestInit, label: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  try {
    return await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError')
      throw new AppError(504, 'cloudinary_timeout', `Cloudinary ${label} timed out.`);
    throw new AppError(502, 'cloudinary_unreachable', `Cannot reach Cloudinary (${label}).`);
  } finally {
    clearTimeout(timer);
  }
}

async function mustOk<T = unknown>(res: Response, label: string): Promise<T> {
  if (res.ok) return res.json() as Promise<T>;
  let msg = '';
  try { const b = await res.json() as { error?: { message?: string } }; msg = b.error?.message ?? ''; } catch { /**/ }
  throw new AppError(502, 'cloudinary_error', `Cloudinary ${label} failed (${res.status}): ${msg}`);
}

function CLOUD() { return serverEnv().CLOUDINARY_CLOUD_NAME; }

/** Encode plain object to Cloudinary context string (key=value|key=value). */
function encodeCtx(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${k}=${v.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/=/g, '\\=')}`)
    .join('|');
}

/** Update context key-value pairs on a Cloudinary asset. */
async function updateContext(publicId: string, ctx: Record<string, string>): Promise<void> {
  const env = serverEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const context = encodeCtx(ctx);
  const params = { context, public_ids: publicId, timestamp };
  const signature = signParams(params, env.CLOUDINARY_API_SECRET);
  const form = new URLSearchParams({
    context, public_ids: publicId, timestamp: String(timestamp),
    api_key: env.CLOUDINARY_API_KEY, signature,
  });
  const res = await cldFetch(`${API}/v1_1/${CLOUD()}/image/context`, { method: 'POST', body: form }, 'context update');
  await mustOk(res, 'context update');
}

/** Upload a tiny 1×1 placeholder PNG as a "record" asset for projects. */
async function uploadPlaceholder(publicId: string, ctx: Record<string, string>, tags: string[]): Promise<void> {
  const env = serverEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const context = encodeCtx(ctx);
  const tag = tags.join(',');
  const params: Record<string, string | number> = { context, overwrite: 'true', public_id: publicId, tag, timestamp };
  const signature = signParams(params, env.CLOUDINARY_API_SECRET);
  const PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const form = new FormData();
  form.append('file', `data:image/png;base64,${PIXEL}`);
  form.append('public_id', publicId);
  form.append('api_key', env.CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('context', context);
  form.append('tag', tag);
  form.append('overwrite', 'true');
  const res = await cldFetch(`${API}/v1_1/${CLOUD()}/image/upload`, { method: 'POST', body: form }, 'placeholder upload');
  await mustOk(res, 'placeholder upload');
}

type CldRawResource = {
  public_id: string;
  asset_id?: string;
  secure_url: string;
  format?: string;
  original_filename?: string;
  created_at?: string;
  context?: { custom?: Record<string, string> };
  tags?: string[];
};

async function fetchResource(publicId: string): Promise<CldRawResource> {
  const path = publicId.split('/').map(encodeURIComponent).join('/');
  const res = await cldFetch(
    `${API}/v1_1/${CLOUD()}/resources/image/upload/${path}?context=true&tags=true`,
    { headers: { Authorization: basicAuth() } },
    'resource fetch',
  );
  if (res.status === 404) throw new AppError(404, 'not_found', `Asset not found: ${publicId}`);
  return mustOk<CldRawResource>(res, 'resource fetch');
}

// ─── PROJECT ──────────────────────────────────────────────────────────────────

export interface CldProject {
  id: string; name: string; location: string | null; project_type: string | null;
  description: string | null; created_at: string; updated_at: string;
  media_count?: number; material_count?: number;
}

export async function cldCreateProject(input: {
  id: string; name: string; location?: string | null; project_type?: string | null; description?: string | null;
}): Promise<CldProject> {
  const now = new Date().toISOString();
  const ctx: Record<string, string> = {
    rr_type: 'project', rr_id: input.id, rr_name: input.name,
    rr_location: input.location ?? '', rr_project_type: input.project_type ?? '',
    rr_description: input.description ?? '', rr_created_at: now, rr_updated_at: now,
  };
  await uploadPlaceholder(`${PROJECT_FOLDER}/${input.id}`, ctx, ['rr-project-manifest', `rr-project-${input.id}`]);
  return { id: input.id, name: input.name, location: input.location ?? null, project_type: input.project_type ?? null, description: input.description ?? null, created_at: now, updated_at: now };
}

export async function cldGetProject(id: string): Promise<CldProject | null> {
  try {
    const r = await fetchResource(`${PROJECT_FOLDER}/${id}`);
    const ctx = r.context?.custom ?? {};
    return {
      id: ctx.rr_id ?? id, name: ctx.rr_name ?? 'Unnamed Project',
      location: ctx.rr_location || null, project_type: ctx.rr_project_type || null,
      description: ctx.rr_description || null,
      created_at: ctx.rr_created_at ?? r.created_at ?? new Date().toISOString(),
      updated_at: ctx.rr_updated_at ?? new Date().toISOString(),
    };
  } catch (e) { if (e instanceof AppError && e.status === 404) return null; throw e; }
}

export async function cldListProjects(): Promise<CldProject[]> {
  const res = await cldFetch(
    `${API}/v1_1/${CLOUD()}/resources/image?prefix=${encodeURIComponent(PROJECT_FOLDER)}&type=upload&context=true&max_results=50`,
    { headers: { Authorization: basicAuth() } },
    'list projects',
  );
  const data = await mustOk<{ resources?: CldRawResource[] }>(res, 'list projects');
  return (data.resources ?? [])
    .filter(r => r.context?.custom?.rr_type === 'project')
    .map(r => {
      const ctx = r.context!.custom!;
      return {
        id: ctx.rr_id ?? r.public_id.split('/').pop()!, name: ctx.rr_name ?? 'Unnamed Project',
        location: ctx.rr_location || null, project_type: ctx.rr_project_type || null,
        description: ctx.rr_description || null,
        created_at: ctx.rr_created_at ?? r.created_at ?? new Date().toISOString(),
        updated_at: ctx.rr_updated_at ?? new Date().toISOString(),
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

// ─── MEDIA ASSETS ─────────────────────────────────────────────────────────────

export type CldMediaAsset = {
  id: string; project_id: string; cloudinary_public_id: string; cloudinary_asset_id: string | null;
  resource_type: string; secure_url: string; original_filename: string | null; mime_type: string | null;
  status: string; analysis_status: string; created_at: string; updated_at: string;
};

function resourceToMediaAsset(r: CldRawResource, projectId: string): CldMediaAsset {
  const ctx = r.context?.custom ?? {};
  return {
    id: ctx.rr_media_id ?? r.asset_id ?? r.public_id,
    project_id: ctx.rr_project_id ?? projectId,
    cloudinary_public_id: r.public_id,
    cloudinary_asset_id: r.asset_id ?? null,
    resource_type: 'image',
    secure_url: r.secure_url,
    original_filename: r.original_filename ?? null,
    mime_type: r.format ? `image/${r.format}` : null,
    status: 'uploaded',
    analysis_status: ctx.rr_analysis_status ?? 'pending',
    created_at: ctx.rr_created_at ?? r.created_at ?? new Date().toISOString(),
    updated_at: ctx.rr_updated_at ?? new Date().toISOString(),
  };
}

export async function cldListMediaAssets(projectId: string): Promise<CldMediaAsset[]> {
  const folder = `raw-reuse/${projectId}`;
  const res = await cldFetch(
    `${API}/v1_1/${CLOUD()}/resources/image?prefix=${encodeURIComponent(folder + '/')}&type=upload&context=true&tags=true&max_results=100`,
    { headers: { Authorization: basicAuth() } },
    'list media',
  );
  const data = await mustOk<{ resources?: CldRawResource[] }>(res, 'list media');
  return (data.resources ?? [])
    .filter(r => !r.public_id.includes('/_projects/'))
    .map(r => resourceToMediaAsset(r, projectId))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function cldGetMediaAsset(publicId: string): Promise<CldMediaAsset | null> {
  try {
    const r = await fetchResource(publicId);
    return resourceToMediaAsset(r, r.context?.custom?.rr_project_id ?? '');
  } catch (e) { if (e instanceof AppError && e.status === 404) return null; throw e; }
}

export async function cldRegisterMediaAsset(input: {
  project_id: string; cloudinary_public_id: string; cloudinary_asset_id?: string | null;
  secure_url: string; original_filename?: string | null; mime_type?: string | null;
}): Promise<CldMediaAsset> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await updateContext(input.cloudinary_public_id, {
    rr_media_id: id, rr_project_id: input.project_id,
    rr_analysis_status: 'pending', rr_created_at: now, rr_updated_at: now,
  });
  return {
    id, project_id: input.project_id, cloudinary_public_id: input.cloudinary_public_id,
    cloudinary_asset_id: input.cloudinary_asset_id ?? null, resource_type: 'image',
    secure_url: input.secure_url, original_filename: input.original_filename ?? null,
    mime_type: input.mime_type ?? null, status: 'uploaded', analysis_status: 'pending',
    created_at: now, updated_at: now,
  };
}

// ─── MATERIALS ────────────────────────────────────────────────────────────────

export async function cldSaveMaterials(publicId: string, materials: unknown[], analysisStatus = 'complete'): Promise<void> {
  await updateContext(publicId, {
    rr_materials: JSON.stringify(materials),
    rr_analysis_status: analysisStatus,
    rr_updated_at: new Date().toISOString(),
  });
}

export async function cldGetMaterials(publicId: string): Promise<unknown[]> {
  try {
    const r = await fetchResource(publicId);
    const raw = r.context?.custom?.rr_materials;
    if (!raw) return [];
    return JSON.parse(raw) as unknown[];
  } catch { return []; }
}

// ─── CONCEPTS ─────────────────────────────────────────────────────────────────

export async function cldSaveConcepts(publicId: string, concepts: unknown[]): Promise<void> {
  await updateContext(publicId, {
    rr_concepts: JSON.stringify(concepts),
    rr_updated_at: new Date().toISOString(),
  });
}

export async function cldGetConcepts(publicId: string): Promise<unknown[]> {
  try {
    const r = await fetchResource(publicId);
    const raw = r.context?.custom?.rr_concepts;
    if (!raw) return [];
    return JSON.parse(raw) as unknown[];
  } catch { return []; }
}
