import 'server-only';
import { serverEnv } from '@/lib/env';
import { AppError } from '@/lib/errors';
import { signParams } from './signing';

const API = 'https://api.cloudinary.com';

function basicAuth(): string {
  const env = serverEnv();
  return 'Basic ' + Buffer.from(`${env.CLOUDINARY_API_KEY}:${env.CLOUDINARY_API_SECRET}`).toString('base64');
}

async function cldFetch(url: string, init: RequestInit & { timeoutMs?: number }, label: string): Promise<Response> {
  const { timeoutMs = 30_000, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...rest, signal: controller.signal, cache: 'no-store' });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError(504, 'cloudinary_timeout', `Cloudinary ${label} timed out.`);
    }
    throw new AppError(502, 'cloudinary_unreachable', `Could not reach Cloudinary (${label}).`);
  } finally {
    clearTimeout(timer);
  }
}

async function cloudinaryError(res: Response, label: string): Promise<AppError> {
  let detail = '';
  try {
    const body = (await res.json()) as { error?: { message?: string }; message?: string };
    detail = body.error?.message ?? body.message ?? '';
  } catch {
    /* non-JSON error body */
  }
  console.error(`[cloudinary] ${label} failed`, res.status, detail);
  const addon = /add-?on|subscription|not enabled|quota/i.test(detail);
  return new AppError(
    502,
    addon ? 'cloudinary_addon_unavailable' : 'cloudinary_error',
    `Cloudinary ${label} failed (${res.status})${detail ? `: ${detail}` : ''}`,
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Call the Cloudinary Analyze API (AI Vision). Retries once on 429/503. */
export async function analyze<T>(model: 'ai_vision_general' | 'ai_vision_tagging', body: object): Promise<T> {
  const { CLOUDINARY_CLOUD_NAME } = serverEnv();
  const url = `${API}/v2/analysis/${CLOUDINARY_CLOUD_NAME}/analyze/${model}`;
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await cldFetch(
      url,
      {
        method: 'POST',
        headers: { Authorization: basicAuth(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        timeoutMs: 50_000,
      },
      model,
    );
    if ((res.status === 429 || res.status === 503) && attempt === 0) {
      await sleep(1500);
      continue;
    }
    if (!res.ok) throw await cloudinaryError(res, model);
    return (await res.json()) as T;
  }
  throw new AppError(502, 'cloudinary_error', `Cloudinary ${model} failed.`);
}

export interface CloudinaryResource {
  asset_id: string;
  public_id: string;
  secure_url: string;
  resource_type: string;
  format?: string;
  bytes?: number;
  original_filename?: string;
}

/** Fetch an uploaded resource from Cloudinary so the server never trusts client-supplied URLs. */
export async function getImageResource(publicId: string): Promise<CloudinaryResource> {
  const { CLOUDINARY_CLOUD_NAME } = serverEnv();
  const path = publicId.split('/').map(encodeURIComponent).join('/');
  const res = await cldFetch(
    `${API}/v1_1/${CLOUDINARY_CLOUD_NAME}/resources/image/upload/${path}`,
    { headers: { Authorization: basicAuth() } },
    'asset lookup',
  );
  if (res.status === 404) throw new AppError(400, 'asset_not_found', 'That upload was not found in Cloudinary.');
  if (!res.ok) throw await cloudinaryError(res, 'asset lookup');
  return (await res.json()) as CloudinaryResource;
}

/** Add tags to an asset (signed Upload-API call). */
export async function addTags(publicId: string, tags: string[]): Promise<void> {
  const env = serverEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { command: 'add', public_ids: publicId, tag: tags.join(','), timestamp };
  const signature = signParams(params, env.CLOUDINARY_API_SECRET);
  const form = new URLSearchParams({
    command: params.command,
    public_ids: params.public_ids,
    tag: params.tag,
    timestamp: String(timestamp),
    api_key: env.CLOUDINARY_API_KEY,
    signature,
  });
  const res = await cldFetch(
    `${API}/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/tags`,
    { method: 'POST', body: form },
    'tagging',
  );
  if (!res.ok) throw await cloudinaryError(res, 'tagging');
}

/** Parameters for a browser-side signed upload. The API secret never leaves the server. */
export function createUploadSignature(projectId: string) {
  const env = serverEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = `raw-reuse/${projectId}`;
  const tags = `raw-reuse,project-${projectId}`;
  const signature = signParams(
    { folder, tags, timestamp },
    env.CLOUDINARY_API_SECRET,
  );
  return {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
    tags,
    uploadPreset: null,
  };
}
