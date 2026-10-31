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
        from: process.env.EMAIL_FROM ?? DEFAULT_FROM,
        reply_to: process.env.EMAIL_REPLY_TO ?? SUPPORT_EMAIL,
        to: [email.to],
        subject: email.subject,
        text: email.text,
        ...(email.html ? { html: email.html } : {}),
      }),
    });
    if (!res.ok) {
      console.error('[email] send failed', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] send error', String(err));
    return false;
  }
}
