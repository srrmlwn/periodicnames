export const SUPPORT_EMAIL = 'hello.afterhoursapps@gmail.com';

const DEFAULT_FROM = 'Periodic Names <hello@periodicnames.com>';

export interface OutgoingEmail {
  to: string;
  subject: string;
  text: string;
  html?: string;
  idempotencyKey?: string;
}

export async function sendEmail(email: OutgoingEmail): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? DEFAULT_FROM;
  const replyTo = process.env.EMAIL_REPLY_TO ?? SUPPORT_EMAIL;
  console.log('[email] sending', JSON.stringify({ to: email.to, from, replyTo, subject: email.subject, idempotencyKey: email.idempotencyKey ?? null }));
  if (!apiKey) {
    console.error('[email] RESEND_API_KEY not set — not sent:', email.subject);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(email.idempotencyKey ? { 'Idempotency-Key': email.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        reply_to: replyTo,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        ...(email.html ? { html: email.html } : {}),
      }),
    });
    const raw = await res.text();
    if (!res.ok) {
      console.error('[email] send failed', res.status, raw);
      return false;
    }
    console.log('[email] sent', JSON.stringify({ status: res.status, response: raw, to: email.to, subject: email.subject }));
    return true;
  } catch (err) {
    console.error('[email] send error', String(err));
    return false;
  }
}
