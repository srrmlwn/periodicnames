import type { ShirtVariant } from './catalog';
import { sendEmail } from './email';
import { FONT, INK, MIST, MUTED, ctaButton, detailRow, escapeHtml, shirtLabel } from './orderEmail';

export interface ShippedDetails {
  name: string | null;
  shirt: ShirtVariant | null;
  previewUrl: string | null;
  carrier: string;
  trackingNumber: string;
  trackingUrl: string;
  statusUrl: string | null;
  reshipment: boolean;
}

function teeLabel(details: ShippedDetails): string {
  return details.name ? `${details.name} tee` : 'Periodic Names tee';
}

export function shippedEmailSubject(details: ShippedDetails): string {
  return details.reshipment
    ? `A replacement for your ${teeLabel(details)} has shipped`
    : `Your ${teeLabel(details)} has shipped`;
}

export function renderShippedText(details: ShippedDetails): string {
  const shirt = shirtLabel(details.shirt);
  return [
    'Good news: it\'s on its way!',
    '',
    `Your ${teeLabel(details)} has left the printer.`,
    '',
    ...(shirt ? [`Shirt: ${shirt}`] : []),
    `Carrier: ${details.carrier}`,
    `Tracking number: ${details.trackingNumber}`,
    `Track it: ${details.trackingUrl}`,
    '',
    'US delivery usually takes 3–7 business days. Tracking can take a day to show the first scan.',
    ...(details.statusUrl ? ['', `Your order page: ${details.statusUrl}`] : []),
    '',
    'Questions or a problem with your order? Just reply to this email.',
    '',
    'Periodic Names · periodicnames.com',
  ].join('\n');
}

export function renderShippedHtml(details: ShippedDetails): string {
  const shirt = shirtLabel(details.shirt);
  const rows = [
    shirt ? detailRow('Shirt', shirt) : '',
    detailRow('Carrier', details.carrier),
    detailRow('Tracking', details.trackingNumber),
  ].join('');
  const image = details.previewUrl
    ? `<tr><td style="padding:16px 24px 0;"><img src="${escapeHtml(details.previewUrl)}" alt="Your t-shirt" width="472" style="display:block;width:100%;max-width:472px;height:auto;border:3px solid ${INK};border-radius:10px;"></td></tr>`
    : '';
  const orderLink = details.statusUrl
    ? `<p style="margin:12px 0 0;font-size:14px;"><a href="${escapeHtml(details.statusUrl)}" style="color:${MUTED};">See your order page</a></p>`
    : '';

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(shippedEmailSubject(details))}</title></head>
<body style="margin:0;padding:0;background:${MIST};font-family:${FONT};color:${INK};">
  <div style="display:none;max-height:0;overflow:hidden;">Your tee is on its way. Here's your tracking link.</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${MIST};">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#FFFFFF;border:3px solid ${INK};border-radius:12px;box-shadow:6px 6px 0 ${INK};">
        <tr><td style="padding:24px 24px 8px;">
          <div style="font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};">Periodic Names</div>
          <h1 style="margin:8px 0 4px;font-size:26px;line-height:1.2;color:${INK};">It's on its way!</h1>
          <p style="margin:0;font-size:15px;line-height:1.5;color:${INK};">Your <strong>${escapeHtml(teeLabel(details))}</strong> has left the printer.</p>
        </td></tr>
        ${image}
        <tr><td style="padding:16px 24px 8px;">
          <table role="presentation" cellspacing="0" cellpadding="0" width="100%">${rows}</table>
        </td></tr>
        <tr><td style="padding:8px 24px 0;">
          ${ctaButton(details.trackingUrl, 'Track your package')}
          ${orderLink}
        </td></tr>
        <tr><td style="padding:16px 24px 24px;">
          <p style="margin:0 0 8px;font-size:15px;line-height:1.5;color:${INK};">US delivery usually takes 3–7 business days. Tracking can take a day to show the first scan.</p>
          <p style="margin:0;font-size:15px;line-height:1.5;color:${INK};">Questions or a problem with your order? Just reply to this email.</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:${MUTED};"><a href="https://periodicnames.com" style="color:${MUTED};">periodicnames.com</a></p>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendShippedEmail(to: string, details: ShippedDetails, shipmentId: number): Promise<boolean> {
  return sendEmail({
    to,
    subject: shippedEmailSubject(details),
    text: renderShippedText(details),
    html: renderShippedHtml(details),
    idempotencyKey: `order-shipped/${shipmentId}`,
  });
}
