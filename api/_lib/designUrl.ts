const BLOB_HOST_SUFFIX = '.public.blob.vercel-storage.com';
const DESIGN_PREFIX = '/print-designs/';

export function isOwnDesignUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith(BLOB_HOST_SUFFIX) && url.pathname.startsWith(DESIGN_PREFIX);
  } catch {
    return false;
  }
}
