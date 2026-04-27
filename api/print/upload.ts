import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

const MAX_BYTES = 50 * 1024 * 1024;

function log(label: string, data?: unknown) {
  console.log(`[upload] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { dataUrl } = req.body as { dataUrl?: unknown };

  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
    log('invalid dataUrl prefix');
    res.status(400).json({ error: 'Invalid file type' });
    return;
  }

  const base64 = dataUrl.slice('data:image/png;base64,'.length);
  const buffer = Buffer.from(base64, 'base64');

  log('buffer size (bytes)', buffer.byteLength);

  if (buffer.byteLength > MAX_BYTES) {
    log('file too large');
    res.status(400).json({ error: 'File too large' });
    return;
  }

  const filename = `print-designs/${Date.now()}.png`;
  log('uploading to blob', filename);

  const { url } = await put(filename, buffer, {
    access: 'public',
    contentType: 'image/png',
  });

  log('upload complete', url);
  res.status(200).json({ url });
}
