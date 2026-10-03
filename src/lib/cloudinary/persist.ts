import 'server-only';
import { serverEnv } from '@/lib/env';
import { AppError } from '@/lib/errors';
import { signParams } from './signing';

const API = 'https://api.cloudinary.com';

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
    if (err instanceof AppError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new AppError(504, 'cloudinary_timeout', `Cloudinary ${label} timed out.`);
    }
    throw new AppError(502, 'cloudinary_unreachable', `Cannot reach Cloudinary (${label}): ${err instanceof Error ? err.message : 'Network error'}`);
  } finally {
    clearTimeout(timer);
  }
}

/** Upload typed JSON record to Cloudinary raw storage */
export async function uploadJson(publicId: string, data: unknown): Promise<void> {
  const env = serverEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = {
    overwrite: 'true',
    public_id: publicId,
    timestamp,
  };
  const signature = signParams(params, env.CLOUDINARY_API_SECRET);

  const form = new FormData();
  form.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }));
  form.append('public_id', publicId);
  form.append('api_key', env.CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);
  form.append('overwrite', 'true');

  const res = await cldFetch(
    `${API}/v1_1/${env.CLOUDINARY_CLOUD_NAME}/raw/upload`,
    { method: 'POST', body: form },
    `upload ${publicId}`,
  );

  if (!res.ok) {
    let msg = '';
    try {
      const b = (await res.json()) as { error?: { message?: string } };
      msg = b.error?.message ?? '';
    } catch {
      /* non-json */
    }
    throw new AppError(
      502,
      'cloudinary_upload_failed',
      `Cloudinary raw JSON upload failed for ${publicId} (${res.status}): ${msg}`,
    );
  }
}

/** Download typed JSON record from Cloudinary raw storage. Returns null ONLY if genuine 404 (does not exist). */
export async function downloadJson<T>(publicId: string): Promise<T | null> {
  const env = serverEnv();
  const cdnUrl = `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/raw/upload/${publicId}?_ts=${Date.now()}`;

  try {
    const res = await fetch(cdnUrl, { cache: 'no-store' });
    if (res.status === 404) {
      return null;
    }
    if (res.ok) {
      try {
        return (await res.json()) as T;
      } catch {
        throw new AppError(500, 'persistence_data_corrupt', `JSON record at ${publicId} is malformed.`);
      }
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    /* fallback to Admin API below if CDN fetch encounters network issue */
  }

  // Fallback to authenticated Admin API download
  try {
    const path = publicId.split('/').map(encodeURIComponent).join('/');
    const res = await cldFetch(
      `${API}/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/raw/upload/${path}`,
      { headers: { Authorization: basicAuth() } },
      `download ${publicId}`,
    );

    if (res.status === 404) {
      return null;
    }

    if (res.ok) {
      const meta = (await res.json()) as { secure_url?: string };
      if (meta.secure_url) {
        const fileRes = await fetch(meta.secure_url, { cache: 'no-store' });
        if (fileRes.status === 404) return null;
        if (fileRes.ok) {
          try {
            return (await fileRes.json()) as T;
          } catch {
            throw new AppError(500, 'persistence_data_corrupt', `JSON record at ${publicId} is malformed.`);
          }
        }
      }
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
  }

  throw new AppError(502, 'cloudinary_persistence_failed', `Failed to download Cloudinary record at ${publicId}.`);
}

/** List all raw resource public_ids under a prefix (e.g. 'raw-reuse/db/projects/') */
export async function listRawResources(prefix: string): Promise<string[]> {
  const env = serverEnv();
  const publicIds: string[] = [];
  let nextCursor: string | undefined = undefined;

  do {
    const url = new URL(`${API}/v1_1/${env.CLOUDINARY_CLOUD_NAME}/resources/raw/upload`);
    url.searchParams.set('prefix', prefix);
    url.searchParams.set('max_results', '500');
    if (nextCursor) {
      url.searchParams.set('next_cursor', nextCursor);
    }

    const res = await cldFetch(
      url.toString(),
      { headers: { Authorization: basicAuth() } },
      `list resources prefix=${prefix}`,
    );

    if (!res.ok) {
      let msg = '';
      try {
        const b = (await res.json()) as { error?: { message?: string } };
        msg = b.error?.message ?? '';
      } catch {
        /* non-json */
      }
      throw new AppError(
        502,
        'cloudinary_persistence_failed',
        `Cloudinary list resources failed for prefix ${prefix} (${res.status}): ${msg}`,
      );
    }

    const data = (await res.json()) as {
      resources?: Array<{ public_id: string }>;
      next_cursor?: string;
    };

    if (data.resources) {
      for (const r of data.resources) {
        if (r.public_id) {
          publicIds.push(r.public_id);
        }
      }
    }

    nextCursor = data.next_cursor;
  } while (nextCursor);

  return publicIds;
}

/** Delete a raw JSON resource from Cloudinary */
export async function deleteJson(publicId: string): Promise<void> {
  const env = serverEnv();
  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = {
    public_id: publicId,
    timestamp,
  };
  const signature = signParams(params, env.CLOUDINARY_API_SECRET);

  const form = new FormData();
  form.append('public_id', publicId);
  form.append('api_key', env.CLOUDINARY_API_KEY);
  form.append('timestamp', String(timestamp));
  form.append('signature', signature);

  const res = await cldFetch(
    `${API}/v1_1/${env.CLOUDINARY_CLOUD_NAME}/raw/destroy`,
    { method: 'POST', body: form },
    `delete ${publicId}`,
  );

  if (!res.ok && res.status !== 404) {
    console.warn(`[persist] Failed to delete Cloudinary raw resource ${publicId}: status ${res.status}`);
  }
}

/** Health check for Cloudinary persistence (reports variable names / status ONLY, never credential values) */
export async function checkPersistenceHealth(): Promise<{
  ok: boolean;
  details?: Record<string, unknown>;
  error?: { code: string; message: string };
}> {
  try {
    const env = serverEnv();
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return {
        ok: false,
        error: {
          code: 'missing_cloudinary_credentials',
          message: 'Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing or incomplete.',
        },
      };
    }
    const publicIds = await listRawResources('raw-reuse/db/projects/');
    return {
      ok: true,
      details: {
        prefix: 'raw-reuse/db/projects/',
        projectCount: publicIds.length,
      },
    };
  } catch (err) {
    if (err instanceof AppError) {
      return {
        ok: false,
        error: { code: err.code, message: err.message },
      };
    }
    return {
      ok: false,
      error: {
        code: 'cloudinary_unreachable',
        message: err instanceof Error ? err.message : 'Could not reach Cloudinary raw persistence.',
      },
    };
  }
}

