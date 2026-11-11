import { createHmac, timingSafeEqual } from 'crypto';

const SITE = 'https://periodicnames.com';

function secret(): string | null {
  return process.env.ORDER_LINK_SECRET || null;
}

export function orderLinkKey(externalId: string): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac('sha256', key).update(`order:${externalId}`).digest('base64url').slice(0, 22);
}

export function isValidOrderLinkKey(externalId: string, candidate: string): boolean {
  const expected = orderLinkKey(externalId);
  if (!expected || candidate.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(candidate));
}

export function orderStatusUrl(externalId: string): string | null {
  const key = orderLinkKey(externalId);
  if (!key) return null;
  return `${SITE}/order?id=${encodeURIComponent(externalId)}&key=${key}`;
}
