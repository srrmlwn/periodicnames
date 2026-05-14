import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';

const MAX_BYTES = 50 * 1024 * 1024;

function log(label: string, data?: unknown) {
  console.log(`[upload] ${label}`, data !== undefined ? JSON.stringify(data) : '');
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  log('request received', { method: req.method });

  if (req.method !== 'POST') {
    log('rejected: wrong method', req.method);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  log('env check', { has_blob_token: !!process.env.BLOB_READ_WRITE_TOKEN });

  const { dataUrl } = req.body as { dataUrl?: unknown };

  if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/png;base64,')) {
    log('rejected: invalid dataUrl', { type: typeof dataUrl, prefix: typeof dataUrl === 'string' ? dataUrl.slice(0, 30) : null });
    res.status(400).json({ error: 'Invalid file type' });
    return;
  }

  const base64 = dataUrl.slice('data:image/png;base64,'.length);
  const buffer = Buffer.from(base64, 'base64');

  log('buffer size (bytes)', buffer.byteLength);

  if (buffer.byteLength > MAX_BYTES) {
    log('rejected: file too large', { bytes: buffer.byteLength, maxBytes: MAX_BYTES });
    res.status(400).json({ error: 'File too large' });
    return;
  }

  const filename = `print-designs/${Date.now()}.png`;
  log('uploading to blob', { filename, bytes: buffer.byteLength });

  let url: string;
  try {
    ({ url } = await put(filename, buffer, {
      access: 'public',
      contentType: 'image/png',
    }));
  } catch (err) {
    log('blob upload failed', String(err));
    res.status(500).json({ error: 'Upload failed' });
    return;
  }

  log('upload complete', { url, bytes: buffer.byteLength });
  res.status(200).json({ url });
}
