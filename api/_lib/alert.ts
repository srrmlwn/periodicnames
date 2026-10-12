export async function alertOwner(subject: string, details: Record<string, unknown>): Promise<void> {
  const body = JSON.stringify(details, null, 2);
  console.error(`[ALERT] ${subject}`, body);

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ALERT_EMAIL;
  if (!apiKey || !to) {
    console.error('[ALERT] RESEND_API_KEY / ALERT_EMAIL not set — alert only in logs');
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.ALERT_FROM ?? 'Periodic Names <onboarding@resend.dev>',
        to: [to],
        subject: `[periodicnames] ${subject}`,
        text: `${subject}\n\n${body}\n\nStripe: https://dashboard.stripe.com/payments\nPrintful: https://www.printful.com/dashboard/default/orders`,
      }),
    });
    if (!res.ok) console.error('[ALERT] email send failed', res.status, await res.text());
  } catch (err) {
    console.error('[ALERT] email send error', String(err));
  }
}
