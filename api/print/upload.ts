import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

const MAX_BYTES = 50 * 1024 * 1024;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { dataUrl } = req.body as { dataUrl?: unknown };

  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
    res.status(400).json({ error: 'Invalid file type' });
    return;
  }

  const base64 = dataUrl.slice('data:image/png;base64,'.length);
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.byteLength > MAX_BYTES) {
    res.status(400).json({ error: 'File too large' });
    return;
  }

  const { url } = await put(`print-designs/${Date.now()}.png`, buffer, {
    access: 'public',
    contentType: 'image/png',
  });

  res.status(200).json({ url });
}
