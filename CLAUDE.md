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
```

There is no test runner. The build command is the correctness gate.

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
  printProducts.ts     — PRINT_PRODUCTS catalog (t-shirt only), SHIRT_COLORS (name/hex/dark), SHIRT_SIZES, findShirtVariant(color, size)

src/utils/
  elementMatcher.ts      — matchNameToElements(name): NameResult  [DP, maximizes real elements]
  colorSchemes.ts        — getTileColors(result), NAME_PALETTE, getCategoryColor(category), etc.; BRAND, LOGO_PALETTE, FONT_FAMILY
  canvasTile.ts          — shared canvas drawing: ELEMENT_POSITIONS, drawElementTile, drawTableBackground, canvasFont, ensureCanvasFonts, fakeAtomicNumber
  elementRenderer.ts     — createElementLayout(result) for ResultDisplay word grouping
  ShareImageGenerator.ts — Canvas API PNG (1200×630)
  ShareVideoGenerator.ts — MediaRecorder API reel video
  printLayout.ts         — computePrintLayout(result, caption, placement, measure, captionPosition) → tile size, rows, size in inches and the Printful `position`; drawPrintDesign() draws it (shared by preview and print file); PLACEMENTS (chest/big, defined by inches below the collar), PRINT_FRAME (12×16in @150ppi = 1800×2400), PRINT_AREA_BELOW_COLLAR_IN (1.9, measured from a real shirt)
  PrintDesignGenerator.ts — generatePrintFile(): 300ppi PNG cropped tight to the design + its position

src/components/
  ...
  Modal.tsx             — shared neubrutalist dialog shell (Escape to close, aria-modal, scroll lock)
  PrintPanel.tsx        — one-screen t-shirt designer: drawn shirt preview, colour/size/placement/caption, Buy; "See it on a model" link swaps in a Printful photo mockup on demand
  ShirtPreview.tsx      — canvas drawing of the shirt in the chosen colour with the design at its real position (13 units/in; print frame top drawn PRINT_AREA_BELOW_COLLAR_IN below the neckline). Silhouette uses real BC3001 proportions in inches from the front-collar bottom: neck 7.2in wide / 3.5in drop, armpit 5in below the collar, body 20in wide, hem 25.5in below — the earlier drawing put armpits ~9in down, which made correct prints look like they sat at the collar
  ShirtOptions.tsx      — colour swatches, size chips, Chest/Big placement, optional caption (collapsed button + input both rotate CAPTION_EXAMPLES every 2.5s while the caption is empty); 'Above name' / 'Below name' switch appears once text is entered (default above)

api/_lib/printPosition.ts — parsePrintPosition(): validates {width,height,top,left} inside the 1800×2400 frame; used by mockup, checkout, webhook, draft-order (underscore dir = not a route)
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

Phase 2 — what's done:
- Share image generator (`ShareImageGenerator.ts`) — Canvas PNG, 1200×630
- Share video/reel generator (`ShareVideoGenerator.ts`) — MediaRecorder, 500ms stagger
- Share preview modal (`SharePreviewModal.tsx`)

Phase 2 — remaining:
- Twitter/X intent URL share
- Instagram Reel upload instructions modal
- `navigator.share({ files })` Web Share API for mobile native share
- OG meta tags for URL link previews

Phase 3 — Print on Demand (**t-shirt flow code complete, pending external setup**):
- Flow (Oct 2026 redesign): one screen — pick colour / size / placement (Chest or Big) / optional caption on a live drawn shirt → Buy → Stripe checkout → confirmed Printful order. "See it on a model" fetches a Printful photo only when asked.
- Placement: the print PNG is cropped to the design and sent with an explicit `position` (centred; design top 3.25in below the collar for Chest, 3.5in for Big, per Printful/Printify placement guides). Printful's front print area starts ≈1.9in below the bottom of the front collar — calibrated from tape-measure photos of a real test shirt (old square file printed 12in wide and top-aligned: tiles 6.0in wide, caption top ≈6.15in and tiles top ≈6.9in below the collar, both implying ≈1.9in) to BOTH the mockup generator and the order (via Stripe metadata `print_position`). Previously a 4500² square with the name in the middle was sent with no position, which printed below the chest.
- Removed: drag-to-reposition, background-table toggle on shirts, 3-step progress UI, DesignCanvas/ProductMockup components.
- Calibration confirmed 12×16in area (tile width matched) and top alignment (centring would put the area above the collar). Next real order is the final check; if off, change only PRINT_AREA_BELOW_COLLAR_IN.
- Product catalog: t-shirt only (BC3001, product 71, 16 variant IDs verified). Mug and poster removed — square 4500×4500 canvas doesn't suit their print areas; needs product-specific canvas sizing.
- ProductMockup: click-to-enlarge lightbox, reassurance copy under Buy button
- Payment: Stripe Checkout session → webhook places Printful order after payment; customer email forwarded for shipping notifications
- Success: `?order=success` param shows dismissable banner in App.tsx
- **Pending external setup only** (no code changes needed):
  - Set `PRINTFUL_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` in Vercel env vars
  - Register `checkout.session.completed` webhook in Stripe dashboard → `https://periodicnames.com/api/stripe/webhook`

See `docs/phase1-tasks.md` for Phase 1–2 task checklist.
See `docs/phase3-tasks.md` for full Phase 3 breakdown and pending setup steps.
