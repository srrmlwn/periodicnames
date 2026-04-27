# Periodic Names — Claude Development Guide

## Project

Single-page React app where users type a name and see it spelled with periodic table element symbols. Real elements are maximized; a curated fake-element database fills gaps. Three phases: (1) cartoonish UI + animations ✅, (2) social sharing (in progress), (3) print on demand.

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

Every task follows this sequence:

### 1. Branch
```bash
git checkout -b <type>/<short-description>
```
Branch types: `feat/` `fix/` `refactor/` `style/`

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

### 6. Push and open PR

```bash
git push -u origin <branch>
gh pr create --title "<same as commit message>" --body "..."
```

---

## Multi-Agent Parallel Work

Multiple agents can work simultaneously using **git worktrees** — each agent gets an isolated copy of the repo on its own branch.

```bash
git worktree add ../periodicnames-<task> -b <branch-name>
cd ../periodicnames-<task>
npm install
# ... work ...
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

- **Never hardcode hex colors in components.** All element category colors come from `src/utils/colorSchemes.ts`.
- Import helpers: `getCategoryColor`, `getCategoryBorderColor`, `getFakeElementColor`, `getFakeElementBorderColor`.

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
  printProducts.ts     — PrintProduct/PrintVariant types, PRINT_PRODUCTS list, getPrintProduct()

src/utils/
  elementMatcher.ts      — matchNameToElements(name): NameResult  [DP, maximizes real elements]
  colorSchemes.ts        — getCategoryColor(category), etc.
  elementRenderer.ts     — createElementLayout(result) for ResultDisplay word grouping
  ShareImageGenerator.ts — Canvas API PNG (1200×630)
  ShareVideoGenerator.ts — MediaRecorder API reel video
  PrintDesignGenerator.ts — Canvas print design (4500×4500px) — stub, to be implemented
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

- **`input`**: Initial state. Background table at base opacity. Input centered on screen.
- **`revealing`**: Single `setInterval` (500ms) increments `revealedCount`. Both `PeriodicTable` (background brightening) and `ResultDisplay` (tile opacity) read from `revealedCount`. 1s initial delay before first element. Do not add independent timers in child components.
- **`done`**: All elements revealed. Background table brightens matched tiles (CSS transition). Share button appears.

Use `animationPhase` to drive visibility — do not read `result !== null` directly.

### Background Table Layout

The periodic table is a **fixed full-screen background** (`z-0`, `pointer-events: none`). Scaled via `transform: scale(Math.max(vw/754, vh/376))` to cover the viewport. Tiles use `.table-bg-tile` (opacity 0.12) and `.table-bg-tile-lit` (opacity 0.45, applied when `animationPhase === 'done'`).

Content (Header, NameInput, ResultDisplay) is in a `relative z-10` layer on top.

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

Fake elements are visually distinct from real elements:
- **Background:** `#1C1917` (stone-900) — dark, vs. the vivid saturated colors of real elements
- **Border:** `#F59E0B` (amber-400) — solid, 2px
- **Text:** `text-amber-200` for symbol/name; `text-amber-300` for the `*` superscript
- **Atomic number:** derived from the sum of char codes of the element name (e.g. "Awesomium" → 951) — clearly non-real, unique per variant
- **Symbol:** rendered with a small amber `*` superscript (flex + items-start, not absolute positioning)
- **Entry animation:** `fake-wobble` keyframe (wobble/bounce on first appearance)
- **Footer:** `* fictional element` appears below the Share button when any fake elements are in the result

---

## Current Work

Active phase: **Phase 2 — Social Sharing** (Phase 1 complete)

What's done in Phase 2:
- Share image generator (`ShareImageGenerator.ts`) — Canvas PNG, 1200×630
- Share video/reel generator (`ShareVideoGenerator.ts`) — MediaRecorder, 500ms stagger
- Share preview modal (`SharePreviewModal.tsx`)

Remaining Phase 2:
- Twitter/X intent URL share
- Instagram Reel upload instructions modal
- `navigator.share({ files })` Web Share API for mobile native share
- OG meta tags for URL link previews

Phase 3 — Print on Demand (in progress):
- Provider: Printful API (API key secured in Vercel env vars)
- Backend: Vercel Functions at `/api/print/*`
- Design: `PrintDesignGenerator.ts` — square 4500×4500px canvas, same aesthetic as app (faded table bg + element tiles), no UI chrome — stub only
- File handoff: client → `POST /api/print/upload` → Vercel Blob → Printful
- Products to launch: unisex t-shirt, 11oz mug, poster — defined in `src/data/printProducts.ts`
- UX: "Print on merch" button in `done` state → `PrintPanel.tsx` modal → mockup preview → Printful hosted checkout
- `PrintPanel.tsx` — step-machine modal (products → variants → loading → mockup → error) ✅
- `ProductMockup.tsx` — mockup image + Order CTA ✅
- Remaining: wire "Print on merch" button in App.tsx, implement PrintDesignGenerator.ts, add Vercel API routes, populate PRINT_PRODUCTS

See `docs/phase1-tasks.md` for full task checklist.
