import type { VercelRequest, VercelResponse } from '@vercel/node';
import { nameFromSlug, renderNamePreviewPng } from './_lib/namePreview';

export default function handler(req: VercelRequest, res: VercelResponse): void {
  const slug = typeof req.query.name === 'string' ? req.query.name : '';
  const name = nameFromSlug(slug);
  if (!name) {
    res.redirect(302, '/og-image.png');
    return;
  }
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=31536000, immutable');
  res.status(200).send(renderNamePreviewPng(name));
}
