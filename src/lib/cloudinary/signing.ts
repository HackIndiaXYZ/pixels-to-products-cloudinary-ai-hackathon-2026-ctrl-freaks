import { createHash } from 'node:crypto';

type Param = string | number | undefined;

/**
 * Cloudinary API signature: sort params alphabetically, join as k=v with '&',
 * append the API secret and SHA-1 the result. `file`, `cloud_name`,
 * `resource_type` and `api_key` must NOT be included.
 */
export function signParams(params: Record<string, Param>, apiSecret: string): string {
  const toSign = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');
  return createHash('sha1').update(toSign + apiSecret).digest('hex');
}
