const POSTHOG_KEY = 'phc_ppDmHiPF3vqF9ZYNjWmfE9EKr6V8dhAaZYyt4mNcQLaT';
const POSTHOG_CAPTURE_URL = 'https://us.i.posthog.com/capture/';

export async function captureServerEvent(
  event: string,
  distinctId: string,
  properties: Record<string, string | number | boolean | null>,
): Promise<void> {
  if (process.env.VERCEL_ENV !== 'production') return;
  try {
    const res = await fetch(POSTHOG_CAPTURE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event,
        distinct_id: distinctId,
        properties: { ...properties, $process_person_profile: false, source: 'server' },
      }),
    });
    if (!res.ok) console.error('[analytics] capture failed', res.status, await res.text());
  } catch (err) {
    console.error('[analytics] capture error', String(err));
  }
}
