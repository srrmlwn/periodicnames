import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderShippedHtml, renderShippedText, shippedEmailSubject } from './shippedEmail';
import type { ShippedDetails } from './shippedEmail';
import { shirtVariant } from './catalog';
import { orderStage } from './printful';
import { isValidOrderLinkKey, orderLinkKey, orderStatusUrl } from './orderLink';
import { renderOrderHtml, renderOrderText } from './orderEmail';

const details: ShippedDetails = {
  name: 'Sasha',
  shirt: shirtVariant(4017),
  previewUrl: null,
  carrier: 'USPS',
  trackingNumber: '9400111899223',
  trackingUrl: 'https://www.printful.com/track?t=abc',
  statusUrl: 'https://periodicnames.com/order?id=pi_1&key=k',
  reshipment: false,
};

describe('shipped email', () => {
  it('names the tee in the subject, and says replacement for reshipments', () => {
    expect(shippedEmailSubject(details)).toBe('Your Sasha tee has shipped');
    expect(shippedEmailSubject({ ...details, reshipment: true })).toBe('A replacement for your Sasha tee has shipped');
    expect(shippedEmailSubject({ ...details, name: null })).toBe('Your Periodic Names tee has shipped');
  });

  it('includes carrier, tracking number, tracking link and order page in both versions', () => {
    for (const body of [renderShippedText(details), renderShippedHtml(details)]) {
      expect(body).toContain('USPS');
      expect(body).toContain('9400111899223');
      expect(body).toContain('https://www.printful.com/track?t=abc');
      expect(body).toContain('Black · M');
    }
    expect(renderShippedHtml(details)).toContain('https://periodicnames.com/order?id=pi_1&amp;key=k');
  });

  it('escapes the name in html', () => {
    expect(renderShippedHtml({ ...details, name: '<b>x</b>' })).not.toContain('<b>x</b>');
  });
});

describe('order stage', () => {
  const base = { status: 'pending', shipments: [] };
  it('maps Printful statuses to the steps customers see', () => {
    expect(orderStage(base)).toBe('received');
    expect(orderStage({ ...base, status: 'draft' })).toBe('received');
    expect(orderStage({ ...base, status: 'inprocess' })).toBe('printing');
    expect(orderStage({ ...base, status: 'onhold' })).toBe('problem');
    expect(orderStage({ ...base, status: 'failed' })).toBe('problem');
    expect(orderStage({ ...base, status: 'canceled' })).toBe('canceled');
  });

  it('counts as shipped once a shipment has tracking', () => {
    const shipment = { id: 1, carrier: 'USPS', service: '', tracking_number: '1', tracking_url: 'u' };
    expect(orderStage({ status: 'partial', shipments: [shipment] })).toBe('shipped');
    expect(orderStage({ status: 'fulfilled', shipments: [shipment] })).toBe('shipped');
  });
});

describe('order links', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('are disabled without a secret', () => {
    vi.stubEnv('ORDER_LINK_SECRET', '');
    expect(orderStatusUrl('pi_123')).toBeNull();
    expect(isValidOrderLinkKey('pi_123', 'anything')).toBe(false);
  });

  it('only accept the key made for that order', () => {
    vi.stubEnv('ORDER_LINK_SECRET', 'test-secret');
    const key = orderLinkKey('pi_123')!;
    expect(isValidOrderLinkKey('pi_123', key)).toBe(true);
    expect(isValidOrderLinkKey('pi_456', key)).toBe(false);
    expect(isValidOrderLinkKey('pi_123', key.slice(0, -1))).toBe(false);
    expect(orderStatusUrl('pi_123')).toBe(`https://periodicnames.com/order?id=pi_123&key=${key}`);
  });
});

describe('order confirmation links to the order page', () => {
  const order = { name: 'Sasha', caption: '', shirt: null, amountCents: 2999, designUrl: 'https://x/d.png', previewUrl: null };
  it('shows the link only when there is one', () => {
    const statusUrl = 'https://periodicnames.com/order?id=pi_1&key=k';
    expect(renderOrderText({ ...order, statusUrl })).toContain(statusUrl);
    expect(renderOrderHtml({ ...order, statusUrl })).toContain('Check your order');
    expect(renderOrderHtml(order)).not.toContain('Check your order');
    expect(renderOrderText(order)).not.toContain('Printful');
  });
});
