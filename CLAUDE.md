# Periodic Names — Claude Development Guide

## Project

Single-page React app where users type a name and see it spelled with periodic table element symbols. Real elements are maximized; a curated fake-element database fills gaps. Three phases: (1) neubrutalist UI + animations ✅, (2) social sharing (in progress), (3) print on demand.

Deployed at **periodicnames.com** (Vercel). Deep-link URLs: `periodicnames.com/<name>`.

Docs: `docs/tech-architecture.md` · `docs/phase1-tasks.md`

---

## Commands

```bash
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # TypeScript type-check + production build (must pass before commit)
npm run lint     # ESLint
npm test         # Vitest (share state machine + share/download fallbacks)
```

The build command is the main correctness gate; `npm test` covers the pure share logic (`src/utils/*.test.ts`).

---

## Development Workflow

Work happens directly on `main` — no feature branches, no PRs. Every task follows this sequence:

### 1. Sync
```bash
git checkout main && git pull --rebase origin main
```

### 2. Implement

Make the change. Follow the code conventions below.

### 3. Verify

```bash
npm run lint     # must pass with zero errors
npm run build    # must pass — this also type-checks
```

If the dev server is running, visually verify the change in the browser at `http://localhost:5173`. For animation work, test the full input → reveal → done flow.

### 4. Update docs

Before committing, update `CLAUDE.md` and any relevant file in `docs/` to reflect the change:
- New components or utilities → add to the file structure and Data/Utils sections
- Behaviour or visual changes → update the relevant convention section or Current Work
- Completed tasks → check them off in `docs/phase1-tasks.md`

### 5. Commit

```bash
git add <specific files>   # never `git add .` — avoids accidentally staging env files
git commit -m "<type>(<scope>): <what changed and why>"
```

Commit types: `feat` `fix` `refactor` `style` `docs` `chore`

### 6. Push to main

```bash
git pull --rebase origin main   # pick up any other agent's commits first
git push origin main
```

Pushing to `main` deploys to production on Vercel, so lint + build must pass before every push.

---

## Multi-Agent Parallel Work

Multiple agents can work simultaneously using **git worktrees** — each agent gets an isolated copy of the repo on a short-lived local branch, then rebases onto `main` and pushes straight to `main` when done (no PR).

```bash
git worktree add ../periodicnames-<task> -b <branch-name>
cd ../periodicnames-<task>
npm install
# ... work, commit ...
git fetch origin && git rebase origin/main
git push origin HEAD:main
git worktree remove ../periodicnames-<task>
```

**Safe to parallelize** (non-overlapping): `ElementTile.tsx`, `index.css`, `elementMatcher.ts`, `fakeElements.ts`, new files in `src/utils/` or `src/components/`

**Must not parallelize**: `App.tsx`, `src/types/index.ts`, `tailwind.config.js`

---

## Code Conventions

### TypeScript

- **Strict mode is on.** No `any`, no `@ts-ignore`, no suppressed errors.
- Use `import type` for type-only imports.
- Define prop types as `interface`, not inline or `type` alias.
- Prefer explicit return types on exported functions; infer on local helpers.

### React

- Functional components only — `React.FC<Props>`.
- One component per file. File name matches component name.
- Keep components small. If JSX exceeds ~80 lines, split into sub-components.
- No global state (no Zustand, no Context) through Phase 2. Local `useState` is sufficient.

### Styling

- **Tailwind utility classes for all layout, spacing, and typography.**
- **Inline `style` only for dynamic values**: colors from `colorSchemes.ts`, computed pixel values.
- **Custom CSS keyframes go in `src/index.css` only** — never inside component files.
- No global `* { transition: all }` — only targeted transitions where needed.

### Colors

- **Never hardcode hex colors in components.** All tile colors come from `src/utils/colorSchemes.ts`.
- **Result tiles are colored by position in the name, not by chemistry category.** `getTileColors(result)` returns one color per `orderedElements` index, rotating through `NAME_PALETTE` (7 hues) from a per-name offset; fake elements take the next colour too (see Fake Element Appearance). `createElementLayout` stores it as `item.color`, and every surface (result card, lit table, share image/reel, print canvas, `DesignCanvas`) uses it so screen and shirt match. Category colors remain only for the faint `drawTableBackground` watermark.
- Import helpers: `getCategoryColor`, `getCategoryBorderColor`, `getFakeElementColor`, `getFakeElementBorderColor`. Non-category brand colors (ink, mist, yellow, pink, mint, muted) come from `BRAND`; the logo rainbow is `LOGO_PALETTE`; canvas/inline font is `FONT_FAMILY`.
- In Tailwind, use the matching tokens from `tailwind.config.js`: `ink`, `mist`, `muted`, `pop-yellow`, `pop-pink`, `pop-mint`, `pop-coral`, `pop-sky`. Keep the two in sync.

### Visual Style — Neubrutalism

- Cool blue-tinted white (`mist`, #EEF3FA) page with a faint dot grid (set on `body` in `index.css`), **Space Grotesk** everywhere (UI and canvas).
- Every surface/control: `border-[3px] border-ink`, hard offset shadow (`shadow-brutal-sm|brutal|brutal-lg|brutal-xl` — no blur), ink text on saturated fills.
- Reusable component classes in `index.css`: `.nb-btn` (lift on hover, press-in on active), `.nb-card`, `.nb-input`, `.nb-label`, `.nb-focus` (keyboard focus ring).
- Primary CTA = `nb-btn bg-pop-yellow`; secondary = `nb-btn bg-white`. One yellow CTA per view.
- Modals use `Modal.tsx` (backdrop, close button, Escape, `role="dialog"`, scroll lock, focus restore) — don't hand-roll overlays.
- Canvas output (share image, reel, print) draws tiles via `drawElementTile` in `canvasTile.ts` so it always matches the on-screen tile.

### Animations

- All `@keyframes` in `src/index.css`. No animation libraries (no Framer Motion).
- Standard easing for spring-like effects: `cubic-bezier(0.34, 1.56, 0.64, 1)`.
- `animation-delay` via inline `style={{ animationDelay: '${n}ms' }}`.

### Data and Utils

```
src/data/
  elements.ts          — 118 real elements, getAllElements()
  fakeElements.ts      — invented elements, getFakeElementBySymbol(symbol)
  elementCategories.ts — category label → display name
  printProducts.ts     — PRINT_PRODUCTS catalog (t-shirt only), SHIRT_COLORS (name/hex/dark), SHIRT_SIZES, findShirtVariant(color, size); TEES_ENABLED (true in dev, Preview deploys, or when VITE_TEES_ENABLED=true — production shows "Tees coming soon" otherwise)
  captionExamples.ts   — CAPTION_EXAMPLES rotating placeholders for the tee caption field

src/utils/
  elementMatcher.ts      — matchNameToElements(name): NameResult  [DP, maximizes real elements]
  colorSchemes.ts        — getTileColors(result), NAME_PALETTE, getCategoryColor(category), etc.; BRAND, LOGO_PALETTE, FONT_FAMILY
  canvasTile.ts          — shared canvas drawing: ELEMENT_POSITIONS, drawElementTile, drawTableBackground, canvasFont, ensureCanvasFonts, fakeAtomicNumber
  elementRenderer.ts     — createElementLayout(result) for ResultDisplay word grouping
  shareScene.ts          — ShareFormat ('reel'|'story'|'post'|'wide'), SHARE_SIZES, buildShareScene(result, format, measure, headline?), sceneTimeline(scene), drawShareScene(ctx, scene, t?, timeline?) — one renderer for share images and every reel frame. Final/hero layout: logo → headline → big name card + stats sticker → small lit table → "Spell your name at periodicnames.com". The reel's intro is site-like (hook "What's your name in elements?", input + Go, big table, small card) and tweens into the hero layout
  shareMedia.ts          — renderShareImage(result, format, headline?) → PNG; recordShareReel(result, { signal, onStart(canvas, totalMs), onProgress({elapsedMs,totalMs}) }) → MP4 (or WebM) via MediaRecorder on its own offscreen canvas (keeps recording when the user switches formats); estimateReelMs(); reelMimeType(), shareFileName(), shareSlug()
  shareMachine.ts        — share generation state machine (pure reducer): per-format MediaState idle → generating → ready | error; start ignored unless idle/error (dedupe + cache), stale results ignored. Tested in shareMachine.test.ts
  shareFile.ts           — canShareFile(file) (navigator.canShare({files})), canShareLink(url)/shareLink(url, text) (dismissed vs failed; failure falls back to copy), shareOrDownload(file, download) → shared | dismissed (AbortError) | downloaded (unsupported or share-failed), downloadFile(), copyText() with execCommand fallback. Tested in shareFile.test.ts
  analytics.ts           — track(event, props): sends share events to window.gtag if a GA4 tag is installed (none is yet); never sends names
  shareAudio.ts          — primeShareAudio() (call in a click handler), scheduleReelSounds() synthesised clicks/pops/chord for the reel
  funStats.ts            — getFunStatsLine(real, total): the stats sticker text (result card + share scene)
  printLayout.ts         — computePrintLayout(result, caption, placement, measure, captionPosition) → tile size, rows, size in inches and the Printful `position`; drawPrintDesign() draws it (shared by preview and print file); PLACEMENTS (chest/big, defined by inches below the collar), PRINT_FRAME (12×16in @150ppi = 1800×2400), PRINT_AREA_BELOW_COLLAR_IN (1.9, measured from a real shirt)
  PrintDesignGenerator.ts — generatePrintFile(): 300ppi PNG cropped tight to the design + its position
  textFilter.ts          — re-exports api/_lib/textFilter (isOffensiveName() (lenient: whole-word matches only, allows real names like Dick/Cummings/Fukuda) and isOffensiveCaption() (strict; allows 'cum laude'), built on the `obscenity` package; slur fragments always blocked. Used by PrintPanel and re-checked server-side in checkout)

src/components/
  ...
  Modal.tsx             — shared neubrutalist dialog shell (Escape to close, aria-modal, scroll lock)
  SharePreviewModal.tsx — share dialog (mounted only while open). useReducer(shareReducer); caches every generated file for the dialog's lifetime and revokes object URLs on close; aborts a recording on close. Video is created only on "Create video"; images generate automatically (the Story image doubles as the video's poster = its final frame). No line-of-text field (removed: re-recorded the reel on every edit, shrank the name, duplicated the platform's own caption box, and wasn't content-filtered next to our branding)
  ShareFormatPicker.tsx — two primary choices, Video / Image; Image shows Story 9:16 · Post 4:5 · Wide size chips; Video shows its spec line
  ShareMediaPreview.tsx — preview pane: video idle → poster ("The video ends on this frame"), generating → live recording canvas + "Recording Ns of Ms", ready → muted looping <video>; images as <img>. Tapping ready media or "Full size" opens ShareLightbox
  ShareLightbox.tsx     — full-screen viewer over the share dialog (video with sound + controls, or image); its Escape handler runs in the capture phase and stops propagation so only the lightbox closes, not the dialog
  ShareActions.tsx      — state-driven primary button: Create video → Creating video… → Share video (or Save video when the browser can't share files) · Try again on error; Copy link (with fallback), Share link (native share sheet with just the URL, shown only when navigator.share exists; no platform-specific buttons), Save
  PrintPanel.tsx        — one-screen t-shirt designer: drawn shirt preview, colour/size/placement/caption, Buy; "See it on a model" link swaps in a Printful photo mockup on demand
  ShirtPreview.tsx      — canvas drawing of the shirt in the chosen colour with the design at its real position (13 units/in; print frame top drawn PRINT_AREA_BELOW_COLLAR_IN below the neckline). Silhouette uses real BC3001 proportions in inches from the front-collar bottom: neck 7.2in wide / 3.5in drop, armpit 5in below the collar, body 20in wide, hem 25.5in below — the earlier drawing put armpits ~9in down, which made correct prints look like they sat at the collar
  ShirtOptions.tsx      — colour swatches, size chips, Chest/Big placement, optional caption (always-visible labelled input; placeholder rotates CAPTION_EXAMPLES every 2.5s while empty; no autofocus so phones don't open the keyboard); 'Above name' / 'Below name' switch appears once text is entered (default above)

api/_lib/                 — shared server helpers (underscore dir = not a route)
  printPosition.ts      — parsePrintPosition(): validates {width,height,top,left} inside the 1800×2400 frame; used by mockup, checkout, webhook, draft-order
  catalog.ts            — TSHIRT_PRODUCT_ID, TSHIRT_VARIANT_IDS, chargePriceUsd() — the ONLY source of the charged price ($29.99; VITE_PRICE_OVERRIDE_USD honoured only when VERCEL_ENV !== 'production')
  designUrl.ts          — isOwnDesignUrl(): only https *.public.blob.vercel-storage.com/print-designs/* accepted by checkout and mockup
  textFilter.ts         — the content filter itself (lives here so the server can import it as CommonJS; src/utils/textFilter.ts re-exports it for the browser)
  alert.ts              — alertOwner(): logs + emails the owner via Resend (RESEND_API_KEY, ALERT_EMAIL, optional ALERT_FROM) when a paid order can't be placed
api/print/              — Vercel Serverless Functions (CommonJS, @vercel/node)
  upload.ts             — POST /api/print/upload: base64 PNG → Vercel Blob, returns { url }
  mockup.ts             — POST /api/print/mockup: Printful mockup generator task + polling
  order.ts              — POST /api/print/order: creates draft Printful order, returns { orderId, checkoutUrl }
  tsconfig.json         — separate tsconfig for api/ (commonjs target)
```

- `getFakeElementBySymbol(symbol, exclude?)` returns a random variant per letter, avoiding names in the optional `exclude` set — always use this, never `.find()`. Pass a shared `Set<string>` across the full name match to prevent duplicate variants for repeated letters.
- `orderedElements` is the source of truth for rendering result tiles.
- A `FakeElement` is identified by `!('atomicNumber' in element)`.

### Key Types

```typescript
interface NameResult {
  originalName: string;
  elements: Element[];
  fakeElements: FakeElement[];
  orderedElements: (Element | FakeElement)[];  // in name order
  totalElements: number;
  realElementsCount: number;
}
```

### Animation Phase State (`App.tsx`)

```
'input'  →  'revealing'  →  'done'
```

- **`input`**: Initial state. Faint table below the input.
- **`revealing`**: Single `setInterval` (500ms) increments `revealedCount`. Both `PeriodicTable` (matched tile lights up in its name-palette color with `.table-light`) and `ResultDisplay` (tile mounts with `.tile-pop` / `.fake-wobble`) read from `revealedCount`. 1s initial delay before first element. Do not add independent timers in child components.
- **`done`**: All elements revealed. Results card shows the stats sticker plus Share / "Put it on a tee" buttons.

Use `animationPhase` to drive visibility — do not read `result !== null` directly.

### Periodic Table Layout

The periodic table sits **in the page flow between the input and the results card** (it used to be a fixed full-screen background, but the input and card hid the middle of the table, so lit transition metals/actinides were invisible). It is scaled with `transform: scale(tableScale)` inside a wrapper sized to `TABLE_W × scale` by `TABLE_H × scale`; the inner div has explicit `TABLE_W`/`TABLE_H` so flex rows never shrink. `getTableScale(tableTop)` fits the viewport width (minus 32px) and the height left after the table's measured top offset and `RESULT_CARD_RESERVE` (310px), capped at 1.15 and floored at 0.45, so the whole results card lands above the fold on laptop-height windows. When the reveal finishes, if the card bottom is still below the fold (short phones, long multi-row names) App scrolls it into view (`block: 'end'`, instant under reduced motion). Unlit tiles are faint ink outlines (`border-ink/15`, `text-ink/30`); lit tiles take the color from `litColors` (symbol → first-occurrence name color). The grid is built from `ELEMENT_POSITIONS` in `canvasTile.ts`. Legal pages still render an unlit table as a fixed backdrop.

### Icons

`public/favicon.svg` (tab icon: yellow P tile, ink border + hard shadow, glyphs as paths so no font dependency), `favicon.ico` (16/32/48), `apple-touch-icon.png` (180), `icon-192.png` / `icon-512.png` + `site.webmanifest`. Linked from `index.html`. The 48px+ icons include the atomic number 15; tab sizes omit it because it turns to mush.

### File Naming

- Components: `PascalCase.tsx`
- Utilities, data, hooks: `camelCase.ts`
- CSS: `index.css` (single file, not modules)

---

## What Not to Do

- Do not add npm dependencies without a clear reason.
- Do not add comments explaining what code does — names should be self-evident.
- Do not add error boundaries or fallbacks for things that can't fail (pure client-side data transforms, static element data).
- Do not use `setTimeout` for anything other than UX delay in animation sequences.
- Do not create new CSS files. All custom CSS in `src/index.css`.
- Do not add independent animation timers in child components — `revealedCount` from App.tsx is the single source of truth.

---

## Fake Element Appearance

Fake elements are framed as **newly discovered**, never "fake" or "fictional" (the name ends up on someone's shirt, so it must not read as "this person is fake"):
- **Fill:** the next `NAME_PALETTE` colour in sequence — `getTileColors` counts fakes like any other tile, so the name keeps an even colour rhythm
- **Border / text / shadow:** ink, same as real tiles
- **Marker:** a black diagonal ribbon across the top-right corner reading `NEW_RIBBON_LABEL` ("NEW"). `lg` (result) and `sm` (logo) tiles show the labelled ribbon at every breakpoint (scaled down on phones); `xs` tiles and the small `DesignCanvas` preview (<64px) get a plain black corner. Canvas outputs draw it with `drawNewRibbon` in `canvasTile.ts` (clipped band, 20% of tile size from the corner)
- **No asterisk** on the tile
- **Atomic number:** always 119–199 — the next undiscovered elements after oganesson (118). `fakeAtomicNumber(name)` = 119 + (char-code sum % 81), stable per variant, never more than 3 digits so it clears the ribbon
- **Entry animation:** `fake-wobble` keyframe
- **Legend:** `NEW = newly discovered element` under the result tiles when any fake elements are present
- **Logo:** the fake "D" in PERIODIC uses its `LOGO_PALETTE` colour plus the NEW ribbon

---

## Current Work

Active phase: **Phase 3 — Print on Demand** (Phase 1 complete, Phase 2 partially complete)

Design refresh (Oct 2026): **neubrutalist revamp shipped to main**; follow-up: cool `mist` background, name-order tile palette, table moved into page flow so every lit element is visible, fake elements restyled as palette tiles with a NEW ribbon.

Earlier revamp notes: — palette, Space Grotesk, cards/buttons/inputs, shared `Modal`, background table lights up during reveal, canvas outputs restyled via `canvasTile.ts`, legal pages restyled, footer overlap fixed.

Launch plan (Oct 2026): **launch with sharing; tees show "coming soon" in production** (`TEES_ENABLED`) until the test shirt confirms placement and Stripe/Printful env setup is done. Preview deploys and local dev keep the full tee flow. To turn tees on: set `VITE_TEES_ENABLED=true` in Vercel Production and redeploy.

Phase 2 — sharing (rebuilt Oct 2026, see docs/phase1-tasks.md):
- One canvas scene (`shareScene.ts`) laid out like the site — logo, name input, periodic table, result card + sticker, yellow CTA — for Reel (video), Story, Post (4:5) and Wide (X/link)
- Dialog: Video (default where MediaRecorder works) or Image (Story / Post / Wide). States: idle → generating → ready | error with Try again; files cached per format, never regenerated for Share-after-Save
- Reel (~8–11s): hook + typing in the site-like layout → tiles slam into the card while table cells light → card zooms up to the hero layout → sticker → CTA → 3s still hold; synthesised sound but readable muted; MP4 where MediaRecorder supports it
- Analytics: share_modal_opened, share_format_selected, media_generation_started/completed/failed, native_share_invoked/completed/dismissed, media_downloaded, share_link_copied via track() — inert until a GA4 tag is added
- Tall formats stay inside x 140–940, y 220–1420 (Instagram + TikTok UI safe zones)
- Dialog: native share sheet with the file on phones (→ Instagram Reels/Stories), download on desktop, Copy link, generic Share link (no X-specific button — X's intent only posted text + link, so it was a link share in disguise)

SEO: static OG/Twitter tags + `public/og-image.png`, JSON-LD, `robots.txt`, `sitemap.xml`, canonical → home (name pages are not meant to be indexed separately yet), tagline `<h1>`, per-name `document.title`. Search Console: verify via a DNS TXT record (domain property), then submit the sitemap. Not done: per-name link previews (needs server-rendered meta + OG images), analytics.

Phase 3 — Print on Demand (**t-shirt flow code complete, pending external setup**):
- Flow (Oct 2026 redesign): one screen — pick colour / size / placement (Chest or Big) / optional caption on a live drawn shirt → Buy → Stripe checkout → confirmed Printful order. "See it on a model" fetches a Printful photo only when asked.
- Placement: the print PNG is cropped to the design and sent with an explicit `position` (centred; design top 3.25in below the collar for Chest, 3.5in for Big, per Printful/Printify placement guides). Printful's front print area starts ≈1.9in below the bottom of the front collar — calibrated from tape-measure photos of a real test shirt (old square file printed 12in wide and top-aligned: tiles 6.0in wide, caption top ≈6.15in and tiles top ≈6.9in below the collar, both implying ≈1.9in) to BOTH the mockup generator and the order (via Stripe metadata `print_position`). Previously a 4500² square with the name in the middle was sent with no position, which printed below the chest.
- Removed: drag-to-reposition, background-table toggle on shirts, 3-step progress UI, DesignCanvas/ProductMockup components.
- Calibration confirmed 12×16in area (tile width matched) and top alignment (centring would put the area above the collar). Next real order is the final check; if off, change only PRINT_AREA_BELOW_COLLAR_IN.
- Product catalog: t-shirt only (BC3001, product 71, 16 variant IDs verified). Mug and poster removed — square 4500×4500 canvas doesn't suit their print areas; needs product-specific canvas sizing.
- ProductMockup: click-to-enlarge lightbox, reassurance copy under Buy button
- Payment: Stripe Checkout session → webhook places Printful order after payment; customer email forwarded for shipping notifications
- Checkout hardening (Oct 2026): price set server-side (client never sends it); productId/variantId validated against the catalog; designUrl must be our own Blob upload; name + caption re-checked by textFilter (422 if blocked) and stored in Stripe metadata
- Webhook hardening: Printful `external_id` = Stripe payment intent, looked up first (`GET /orders/@{id}`) so Stripe retries never duplicate an order — an existing draft is just confirmed. Any paid order that can't be placed (Printful error, missing metadata or shipping) calls alertOwner()
- Success: `?order=success` param shows dismissable banner in App.tsx (centred via a flex wrapper — the `sticker-in` animation's transform would override a translate-based centre)
- Testing without paying: Preview deployment + Stripe test keys + `PRINTFUL_DRAFT_ONLY=true` (webhook skips the Printful confirm). See docs/phase3-tasks.md → "Testing checkout without paying".
- **Pending external setup only** (no code changes needed):
  - Set `PRINTFUL_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in Vercel env vars
  - Set `RESEND_API_KEY` + `ALERT_EMAIL` (Production) so failed paid orders email the owner
  - Remove `VITE_PRICE_OVERRIDE_USD` from Production (it is ignored there now, but should not exist)
  - Register `checkout.session.completed` webhook in Stripe dashboard → `https://periodicnames.com/api/stripe/webhook`

See `docs/phase1-tasks.md` for Phase 1–2 task checklist.
See `docs/phase3-tasks.md` for full Phase 3 breakdown and pending setup steps.
