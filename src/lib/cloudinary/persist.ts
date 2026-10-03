import 'server-only';
import { serverEnv } from '@/lib/env';
import { AppError } from '@/lib/errors';
import { signParams } from './signing';
import type {
  GeneratedConceptRow,
  MaterialRow,
  MediaAssetRow,
  ProjectRow,
  ReuseMatchRow,
  ReuseRequestRow,
} from '@/lib/types';

const API = 'https://api.cloudinary.com';
const STORE_PUBLIC_ID = 'raw-reuse/db/store.json';

export interface PersistentStoreData {
  projects: Record<string, ProjectRow>;
  mediaAssets: Record<string, MediaAssetRow>;
  materials: Record<string, MaterialRow>;
  reuseRequests: Record<string, ReuseRequestRow>;
  reuseMatches: Record<string, ReuseMatchRow>;
  generatedConcepts: Record<string, GeneratedConceptRow>;
}

export function emptyStoreData(): PersistentStoreData {
  return {
    projects: {},
    mediaAssets: {},
    materials: {},
    reuseRequests: {},
    reuseMatches: {},
    generatedConcepts: {},
  };
}

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

/** Upload complete store data to Cloudinary raw storage */
export async function cldUploadStore(data: PersistentStoreData): Promise<void> {
  const env = serverEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = {
    overwrite: 'true',
    public_id: STORE_PUBLIC_ID,
    timestamp,
  };
  const signature = signParams(params, env.CLOUDINARY_API_SECRET);

  const form = new FormData();
  form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  form.append('public_id', STORE_PUBLIC_ID);
  form.append('api_key', env.CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('overwrite', 'true');

  const res = await cldFetch(
    `${API}/v1_1/${env.CLOUDINARY_CLOUD_NAME}/raw/upload`,
    { method: 'POST', body: form },
    'store upload',
  );

  if (!res.ok) {
    let msg = '';
    try {
      const b = (await res.json()) as { error?: { message?: string } };
      msg = b.error?.message ?? '';
    } catch {
      /* non-json */
    }
    throw new AppError(502, 'cloudinary_error', `Cloudinary store upload failed (${res.status}): ${msg}`);
  }
}

/** Fetch complete store data from Cloudinary raw storage */
export async function cldLoadStore(): Promise<PersistentStoreData | null> {
  const env = serverEnv();
  const cdnUrl = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/raw/upload/${STORE_PUBLIC_ID}?_ts=${Date.now()}`;
  try {
    const res = await fetch(cdnUrl, { cache: 'no-store' });
    if (res.ok) {
      const json = (await res.json()) as PersistentStoreData;
      return {
        projects: json.projects ?? {},
        mediaAssets: json.mediaAssets ?? {},
        materials: json.materials ?? {},
        reuseRequests: json.reuseRequests ?? {},
        reuseMatches: json.reuseMatches ?? {},
        generatedConcepts: json.generatedConcepts ?? {},
      };
    }
  } catch {
    /* fallback to admin api below if CDN fails */
  }

  // Fallback to authenticated Admin API download
  try {
    const path = STORE_PUBLIC_ID.split('/').map(encodeURIComponent).join('/');
    const res = await cldFetch(
      `${API}/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/raw/upload/${path}`,
      { headers: { Authorization: basicAuth() } },
      'store download fallback',
    );
    if (res.ok) {
      const meta = (await res.json()) as { secure_url?: string };
      if (meta.secure_url) {
        const fileRes = await fetch(meta.secure_url, { cache: 'no-store' });
        if (fileRes.ok) {
          const json = (await fileRes.json()) as PersistentStoreData;
          return {
            projects: json.projects ?? {},
            mediaAssets: json.mediaAssets ?? {},
            materials: json.materials ?? {},
            reuseRequests: json.reuseRequests ?? {},
            reuseMatches: json.reuseMatches ?? {},
            generatedConcepts: json.generatedConcepts ?? {},
          };
        }
      }
    }
  } catch {
    /* non-fatal */
  }

  return null;
}
