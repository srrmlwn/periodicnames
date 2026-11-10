import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { Plugin } from 'vite';
import { POPULAR_BOY_NAMES, POPULAR_GIRL_NAMES, POPULAR_NAMES, POPULAR_NAMES_YEAR, popularNameSlug } from '../src/data/popularNames';
import { buildNameFacts, missingLetterNote, nameFactsSummaryLines } from '../src/utils/nameFacts';

const SITE = 'https://periodicnames.com';

interface PageMeta {
  path: string;
  title: string;
  description: string;
  ogTitle: string;
  image: string;
  imageAlt: string;
  body: string;
}

function esc(text: string): string {
  return text.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

function setMeta(html: string, attr: 'name' | 'property', key: string, value: string): string {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`prerenderNames: missing <meta ${attr}="${key}"> in index.html`);
  return html.replace(re, `$1${esc(value)}$2`);
}

function renderPage(template: string, page: PageMeta): string {
  const url = SITE + page.path;
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
    .replace('<div id="root"></div>', `<div id="root">${page.body}</div>`);
  html = setMeta(html, 'name', 'description', page.description);
  html = setMeta(html, 'property', 'og:url', url);
  html = setMeta(html, 'property', 'og:title', page.ogTitle);
  html = setMeta(html, 'property', 'og:description', page.description);
  html = setMeta(html, 'property', 'og:image', page.image);
  html = setMeta(html, 'property', 'og:image:alt', page.imageAlt);
  html = setMeta(html, 'name', 'twitter:title', page.ogTitle);
  html = setMeta(html, 'name', 'twitter:description', page.description);
  html = setMeta(html, 'name', 'twitter:image', page.image);
  return html;
}

function link(name: string): string {
  return `<a href="/${popularNameSlug(name)}">${esc(name)}</a>`;
}

function namePage(name: string): PageMeta {
  const facts = buildNameFacts(name);
  const slug = popularNameSlug(name);
  const items = facts.lines
    .map(l => `<li><strong>${esc(l.symbol)}</strong> — ${l.elementName ? `${esc(l.elementName)}: ${esc(l.fact ?? '')}` : esc(missingLetterNote(l.symbol))}</li>`)
    .join('');
  const body =
    `<main class="mx-auto max-w-xl px-6 py-10 text-ink">` +
    `<h1 class="text-2xl font-bold mb-2">${esc(name)} in periodic table elements</h1>` +
    `<div class="mb-3">${nameFactsSummaryLines(facts).map(l => `<p>${esc(l)}</p>`).join('')}</div>` +
    `<h2 class="text-lg font-bold mb-2">The elements in ${esc(name)}</h2>` +
    `<ul class="mb-4">${items}</ul>` +
    `<p>More names: ${facts.related.map(link).join(', ')} · <a href="/names">All popular names</a> · <a href="/">Spell any name</a></p>` +
    `</main>`;
  return {
    path: `/${slug}`,
    title: `${name} in the Periodic Table – ${name} Spelled in Elements`,
    description: `See ${name} spelled with periodic table element symbols (${facts.symbols.join(' ')}), with a fact about each element. Share it or put it on a t-shirt.`,
    ogTitle: `${name} in periodic table elements`,
    image: `${SITE}/api/og?name=${slug}`,
    imageAlt: `${name} spelled with colourful periodic table element tiles`,
    body,
  };
}

function indexPage(): PageMeta {
  const list = (names: string[]) => [...names].sort((a, b) => a.localeCompare(b)).map(link).join(', ');
  const body =
    `<main class="mx-auto max-w-2xl px-6 py-10 text-ink">` +
    `<h1 class="text-2xl font-bold mb-2">Popular names in the periodic table</h1>` +
    `<p class="mb-4">The 100 most popular girl and boy names in the US (${POPULAR_NAMES_YEAR}, Social Security Administration), each spelled with periodic table elements.</p>` +
    `<h2 class="text-lg font-bold">Girl names</h2><p class="mb-4">${list(POPULAR_GIRL_NAMES)}</p>` +
    `<h2 class="text-lg font-bold">Boy names</h2><p>${list(POPULAR_BOY_NAMES)}</p>` +
    `</main>`;
  return {
    path: '/names',
    title: 'Popular Names in the Periodic Table – Top 200 Names Spelled in Elements',
    description: 'The 100 most popular girl and boy names, each spelled with periodic table element symbols. Find yours, or type any name.',
    ogTitle: 'Popular names in the periodic table',
    image: `${SITE}/og-image.png`,
    imageAlt: 'The word YOUR NAME spelled with colourful periodic table element tiles',
    body,
  };
}

function sitemap(lastmod: string): string {
  const entry = (path: string, freq: string, priority: string) =>
    `  <url>\n    <loc>${SITE}${path}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${freq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  const urls = [
    entry('/', 'weekly', '1.0'),
    entry('/names', 'monthly', '0.6'),
    ...POPULAR_NAMES.map(n => entry(`/${popularNameSlug(n)}`, 'monthly', '0.5')),
    entry('/privacy.html', 'yearly', '0.2'),
    entry('/tos.html', 'yearly', '0.2'),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

function writePage(outDir: string, template: string, page: PageMeta): void {
  const dir = join(outDir, page.path.slice(1));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), renderPage(template, page));
}

export function prerenderNames(): Plugin {
  let outDir = 'dist';
  return {
    name: 'prerender-popular-names',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const template = readFileSync(join(outDir, 'index.html'), 'utf8');
      for (const name of POPULAR_NAMES) writePage(outDir, template, namePage(name));
      writePage(outDir, template, indexPage());
      writeFileSync(join(outDir, 'sitemap.xml'), sitemap(new Date().toISOString().slice(0, 10)));
    },
  };
}
