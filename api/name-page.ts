import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OG_HEIGHT, OG_WIDTH, nameFromSlug } from './_lib/namePreview';

const SITE = 'https://periodicnames.com';
const DEFAULT_TITLE = 'Your Name in Periodic Table Elements – Free Name Generator';
const DEFAULT_DESCRIPTION = "Type any name and see it spelled with element symbols. What's yours?";

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

export default function handler(req: VercelRequest, res: VercelResponse): void {
  const slug = typeof req.query.name === 'string' ? req.query.name : '';
  const name = nameFromSlug(slug);
  const slugPath = name ? '/' + encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-')) : '/';
  const url = SITE + slugPath;
  const title = name ? `${name} in periodic table elements` : DEFAULT_TITLE;
  const description = name ? `${name}, spelled with periodic table element symbols. ${DEFAULT_DESCRIPTION}` : DEFAULT_DESCRIPTION;
  const image = name ? `${SITE}/api/og?name=${encodeURIComponent(slugPath.slice(1))}` : `${SITE}/og-image.png`;
  const alt = name ? `${name} spelled with colourful periodic table element tiles` : 'The word YOUR NAME spelled with colourful periodic table element tiles';

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${escapeHtml(title)} | Periodic Names</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta name="robots" content="noindex" />
<link rel="canonical" href="${SITE}/" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Periodic Names" />
<meta property="og:url" content="${escapeHtml(url)}" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:image:width" content="${OG_WIDTH}" />
<meta property="og:image:height" content="${OG_HEIGHT}" />
<meta property="og:image:alt" content="${escapeHtml(alt)}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
</head>
<body><a href="${escapeHtml(url)}">${escapeHtml(title)}</a></body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  res.status(200).send(html);
}
