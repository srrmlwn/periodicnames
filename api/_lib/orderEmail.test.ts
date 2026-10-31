import { describe, expect, it } from 'vitest';
import { orderEmailSubject, renderOrderHtml, renderOrderText } from './orderEmail';
import type { OrderDetails } from './orderEmail';
import { shirtVariant } from './catalog';

const order: OrderDetails = {
  name: 'Sasha',
  caption: '',
  shirt: shirtVariant(4017),
  amountCents: 2999,
  designUrl: 'https://abc.public.blob.vercel-storage.com/print-designs/x.png',
};

describe('order confirmation email', () => {
  it('names the order in the subject', () => {
    expect(orderEmailSubject(order)).toBe('Your Sasha tee is headed to the printer');
  });

  it('lists shirt, total and design in both versions', () => {
    const text = renderOrderText(order);
    const html = renderOrderHtml(order);
    for (const body of [text, html]) {
      expect(body).toContain('Black · M');
      expect(body).toContain('$29.99');
    }
    expect(html).toContain(order.designUrl);
    expect(html).toContain('background:#1a1a1a');
  });

  it('omits the caption row when there is no caption', () => {
    expect(renderOrderText(order)).not.toContain('Caption');
    expect(renderOrderText({ ...order, caption: 'Class of 2026' })).toContain('Caption: Class of 2026');
  });

  it('escapes customer text in HTML', () => {
    const html = renderOrderHtml({ ...order, name: '<b>Al</b>', caption: '"&"' });
    expect(html).not.toContain('<b>Al</b>');
    expect(html).toContain('&lt;b&gt;Al&lt;/b&gt;');
    expect(html).toContain('&quot;&amp;&quot;');
  });
});
