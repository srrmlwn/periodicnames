import { sendEmail } from './email';

export async function alertOwner(subject: string, details: Record<string, unknown>): Promise<void> {
  const body = JSON.stringify(details, null, 2);
  console.error(`[ALERT] ${subject}`, body);

  const to = process.env.ALERT_EMAIL;
  if (!to) {
    console.error('[ALERT] ALERT_EMAIL not set — alert only in logs');
    return;
  }

  await sendEmail({
    to,
    subject: `[periodicnames] ${subject}`,
    text: `${subject}\n\n${body}\n\nStripe: https://dashboard.stripe.com/payments\nPrintful: https://www.printful.com/dashboard/default/orders`,
  });
}
