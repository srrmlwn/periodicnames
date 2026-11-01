import type { ShirtVariant } from './catalog';
import { sendEmail } from './email';

export interface OrderDetails {
  name: string;
  caption: string;
  shirt: ShirtVariant | null;
  amountCents: number | null;
  designUrl: string;
  previewUrl: string | null;
}

const INK = '#111111';
const MIST = '#EEF3FA';
const YELLOW = '#FFD23F';
const MUTED = '#4A5468';
const FONT = "'Space Grotesk', 'Helvetica Neue', Arial, sans-serif";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatAmount(cents: number | null): string | null {
  return cents === null ? null : `$${(cents / 100).toFixed(2)}`;
}

function shirtLabel(shirt: ShirtVariant | null): string | null {
  return shirt ? `${shirt.color} · ${shirt.size}` : null;
}

const NEXT_STEPS = [
  'We print and pack your tee, usually within 2–5 business days. No news in between just means it\'s being made.',
  'Once it ships, you\'ll get an email from Printful, our print partner, with a tracking link.',
  'US delivery usually takes 3–7 business days after that. You can follow it on the tracking page.',
];

export function orderEmailSubject(order: OrderDetails): string {
  return `Your ${order.name} tee is headed to the printer`;
}

export function renderOrderText(order: OrderDetails): string {
  const lines = [
    'Thanks for your order!',
    '',
    `We've sent your ${order.name} design to the printer.`,
    '',
    `Name: ${order.name}`,
    ...(order.caption ? [`Caption: ${order.caption}`] : []),
    ...(shirtLabel(order.shirt) ? [`Shirt: ${shirtLabel(order.shirt)}`] : []),
    ...(formatAmount(order.amountCents) ? [`Total: ${formatAmount(order.amountCents)}`] : []),
    '',
    'What happens next',
    ...NEXT_STEPS.map(step => `- ${step}`),
    '',
    'Questions or a problem with your order? Just reply to this email.',
    '',
    'Periodic Names · periodicnames.com',
  ];
  return lines.join('\n');
}

function detailRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:6px 0;color:${MUTED};font-size:14px;width:90px;vertical-align:top;">${label}</td>
    <td style="padding:6px 0;color:${INK};font-size:15px;font-weight:700;">${escapeHtml(value)}</td>
  </tr>`;
}

function productImage(order: OrderDetails, panel: string): string {
  if (order.previewUrl) {
    return `<img src="${escapeHtml(order.previewUrl)}" alt="Your ${escapeHtml(order.name)} t-shirt" width="472" style="display:block;width:100%;max-width:472px;height:auto;border:3px solid ${INK};border-radius:10px;">`;
  }
  return `<div style="background:${panel};border:3px solid ${INK};border-radius:10px;padding:20px;text-align:center;">
            <img src="${escapeHtml(order.designUrl)}" alt="Your ${escapeHtml(order.name)} design" width="280" style="display:inline-block;max-width:100%;height:auto;border:0;">
          </div>`;
}

export function renderOrderHtml(order: OrderDetails): string {
  const shirt = shirtLabel(order.shirt);
  const amount = formatAmount(order.amountCents);
  const panel = order.shirt?.colorHex ?? MIST;
  const rows = [
    detailRow('Name', order.name),
    order.caption ? detailRow('Caption', order.caption) : '',
    shirt ? detailRow('Shirt', shirt) : '',
    amount ? detailRow('Total', amount) : '',
  ].join('');
  const steps = NEXT_STEPS.map((step, i) => `<tr>
    <td style="padding:6px 10px 6px 0;vertical-align:top;">
      <div style="width:24px;height:24px;line-height:24px;text-align:center;border:2px solid ${INK};border-radius:6px;background:${YELLOW};font-weight:700;font-size:13px;color:${INK};">${i + 1}</div>
    </td>
    <td style="padding:6px 0;color:${INK};font-size:15px;line-height:1.45;">${step}</td>
  </tr>`).join('');

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(orderEmailSubject(order))}</title></head>
<body style="margin:0;padding:0;background:${MIST};font-family:${FONT};color:${INK};">
  <div style="display:none;max-height:0;overflow:hidden;">Your ${escapeHtml(order.name)} design is on its way to the printer.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${MIST};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#FFFFFF;border:3px solid ${INK};border-radius:12px;box-shadow:6px 6px 0 ${INK};">
        <tr><td style="padding:24px 24px 8px;">
          <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">Periodic Names</div>
          <h1 style="margin:8px 0 4px;font-size:26px;line-height:1.2;color:${INK};">Thanks for your order!</h1>
          <p style="margin:0;font-size:15px;line-height:1.5;color:${INK};">We've sent your <strong>${escapeHtml(order.name)}</strong> design to the printer.</p>
        </td></tr>
        <tr><td style="padding:16px 24px;">
          ${productImage(order, panel)}
        </td></tr>
        <tr><td style="padding:0 24px 8px;">
          <table role="presentation" cellspacing="0" cellpadding="0" width="100%">${rows}</table>
        </td></tr>
        <tr><td style="padding:16px 24px 8px;">
          <h2 style="margin:0 0 6px;font-size:17px;color:${INK};">What happens next</h2>
          <table role="presentation" cellspacing="0" cellpadding="0" width="100%">${steps}</table>
        </td></tr>
        <tr><td style="padding:16px 24px 24px;">
          <p style="margin:0;font-size:15px;line-height:1.5;color:${INK};">Questions or a problem with your order? Just reply to this email.</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:${MUTED};"><a href="https://periodicnames.com" style="color:${MUTED};">periodicnames.com</a></p>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOrderConfirmation(to: string, order: OrderDetails, orderKey: string): Promise<boolean> {
  return sendEmail({
    to,
    subject: orderEmailSubject(order),
    text: renderOrderText(order),
    html: renderOrderHtml(order),
    idempotencyKey: `order-confirmation/${orderKey}`,
  });
}
