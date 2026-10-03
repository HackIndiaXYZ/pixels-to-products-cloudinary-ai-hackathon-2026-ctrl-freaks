/**
 * Insert a transformation string after `/upload/` in a Cloudinary delivery URL.
 * Returns the original URL untouched if it is not a standard upload URL.
 */
export function deliveryUrl(secureUrl: string, transformation: string): string {
  const marker = '/upload/';
  const index = secureUrl.indexOf(marker);
  if (index === -1) return secureUrl;
  const head = secureUrl.slice(0, index + marker.length);
  const tail = secureUrl.slice(index + marker.length);
  return `${head}${transformation}/${tail}`;
}

export const thumb = (url: string) => deliveryUrl(url, 'c_fill,g_auto,w_900,h_675,f_auto,q_auto');
export const detail = (url: string) => deliveryUrl(url, 'c_limit,w_1800,f_auto,q_auto');
/** Used as the AI Vision source: bounded size, original format kept. */
export const analysisSource = (url: string) => deliveryUrl(url, 'c_limit,w_1600,q_auto');
