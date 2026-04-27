# Technical Architecture

## Current Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript (strict mode) |
| Styling | Tailwind CSS + custom keyframes in `index.css` |
| Build | Vite |
| Deployment | Vercel (periodicnames.com) |
| Routing | SPA via `history.pushState` + `vercel.json` catch-all rewrite |

No backend. Everything runs client-side.

---

## File Structure

```
src/
├── components/
│   ├── Header.tsx              — site title + subtitle (Nunito, extrabold)
│   ├── NameInput.tsx           — input with inline submit (→) / refresh (↺) toggle
│   ├── PeriodicTable.tsx       — full 118-element grid, background-only mode
│   ├── ElementTile.tsx         — individual element square (size sm | lg)
│   ├── ResultDisplay.tsx       — animated result strip, exit/enter transitions
│   └── SharePreviewModal.tsx   — share image/video preview + download
├── data/
│   ├── elements.ts             — all 118 real elements, getAllElements()
│   ├── fakeElements.ts         — invented elements for unmatched letters, getFakeElementBySymbol()
│   └── elementCategories.ts   — category → display name mapping
├── utils/
│   ├── elementMatcher.ts       — DP-based name → element array (maximizes real elements)
│   ├── colorSchemes.ts         — getCategoryColor(), getCategoryBorderColor(), etc.
│   ├── elementRenderer.ts      — createElementLayout() for ResultDisplay word grouping
│   ├── ShareImageGenerator.ts  — Canvas API PNG generation (1200×630)
│   └── ShareVideoGenerator.ts  — MediaRecorder API reel video generation
├── types/index.ts              — Element, FakeElement, NameResult interfaces
└── App.tsx                     — animation state machine + layout orchestrator
```

---

## Key Data Types

```typescript
interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  atomicMass: number;
  category: ElementCategory;
}

interface FakeElement {
  symbol: string;
  name: string;
  // no atomicNumber — used as discriminant: 'atomicNumber' in e
}

interface NameResult {
  originalName: string;
  orderedElements: (Element | FakeElement)[];  // in name order, source of truth for display
  elements: Element[];
  fakeElements: FakeElement[];
  totalElements: number;
  realElementsCount: number;
}
```

---

## Animation State Machine (`App.tsx`)

```
'input'  →  'revealing'  →  'done'
```

- **`input`**: Initial state. Background table at base opacity (0.12). Input centered.
- **`revealing`**: After submit. Single `setInterval` (500ms) increments `revealedCount`. Both `PeriodicTable` and `ResultDisplay` read from `revealedCount` — no independent timers. 1s initial delay before first element (allows any layout settling).
- **`done`**: All elements revealed. Background table brightens matched tiles to 0.45 opacity (1s CSS transition). Share button appears.

Transitions:
- `handleNameSubmit` → pushes URL, runs DP matcher, starts reveal sequence
- `handleRefresh` → resets all state, pops URL to `/`

### Key implementation details

**Centralized reveal**: `revealedCount` (App.tsx state) is the single source of truth. `PeriodicTable` uses it to know which tiles to brighten; `ResultDisplay` uses it to know which tiles to show. This eliminated all sync issues from having independent stagger timers.

**Duplicate element re-pulse**: When the same real element appears twice in a name (e.g., "Harinii" → two iodine tiles), the active tile in `PeriodicTable` uses key `${colIndex}-${revealCount}` to force remount and retrigger the CSS animation.

**Fake elements**: No table animation (they have no position in the real periodic table). Silence signals they aren't real.

**React Strict Mode guard**: `initialized` ref prevents the URL auto-submit `useEffect` from firing twice in development.

---

## Layout Architecture

```
<div class="min-h-screen bg-white">

  <!-- Fixed background layer (z-0, pointer-events: none) -->
  <div class="fixed inset-0 flex items-center justify-center overflow-hidden">
    <PeriodicTable />  <!-- scaled to cover viewport -->
  </div>

  <!-- Content layer (z-10) -->
  <div class="relative z-10 min-h-screen flex flex-col">
    <Header />
    <div class="flex-1 flex flex-col items-center justify-center">
      <NameInput />
      <ResultDisplay />
    </div>
  </div>

</div>
```

**Background table scaling**: `Math.max(vw / 754, vh / 376)` applied via `transform: scale()`. Covers the viewport (cover behavior), centered. Recalculated on resize.

Natural table dimensions: `754px × 376px` (18 cols × 9 rows, 40px tiles, 2px gaps).

---

## Element Matching Algorithm (`elementMatcher.ts`)

Dynamic programming over the name string, per word:

1. Normalize input: lowercase, split on spaces
2. For each word, build `dp[i]` = max real elements achievable from position `i` to end
3. Process right-to-left: at each `i`, try length 1 and length 2 substrings
   - If a real element symbol matches → score = `dp[i+len] + 1`
   - If only a fake element → score = `dp[i+1] + 0`
   - Take the max; record choice in `choice[i]`
4. Reconstruct forward via `choice` array
5. Interleave word results with space separators in `orderedElements`

This guarantees maximum real element count (e.g., "Sc" beats "S" + "c" when Sc exists as a real element).

---

## CSS Animation Conventions

All `@keyframes` live in `src/index.css`. No animation libraries.

Key classes:
- `.table-bg-tile` — `opacity: 0.12; transition: opacity 1s ease` (base background tile)
- `.table-bg-tile-lit` — `opacity: 0.45` (matched tile after animation completes)
- `.fake-shimmer` — gold shimmer sweep on fake element tiles
- `.fake-wobble` — wobble keyframe on fake tile first appearance
- `.result-exit` — fade-out + slight upward translate when result is dismissed
- `.results-fade-in` — fade-in + slight upward translate when result enters

Standard easing for spring-like effects: `cubic-bezier(0.34, 1.56, 0.64, 1)`.
No global `* { transition: all }` — only targeted transitions.

---

## URL Routing

SPA routing via `history.pushState`:

- Submit `"Harinii"` → URL becomes `/harinii`
- Refresh → URL becomes `/`
- On page load, `window.location.pathname` is parsed and auto-submitted

`vercel.json` rewrites all paths to `/` so Vercel serves `index.html` for deep links.

---

## Phase 2 — Social Sharing

**Image Generation** (`ShareImageGenerator.ts`):
- Off-screen `<canvas>` at 1200×630px
- Faded periodic table background (same tile layout, low opacity)
- Element tiles centered, name spelled out
- `periodicnames.com/<name>` URL footer
- `canvas.toBlob()` → PNG download

**Video Generation** (`ShareVideoGenerator.ts`):
- Off-screen canvas + `requestAnimationFrame`
- 500ms stagger per tile (matches app animation)
- Plain opacity fade (no spring bounce)
- `canvas.captureStream(30)` → `MediaRecorder` → WebM/MP4 download

**Remaining Phase 2 work:**
- Twitter/X intent URL share
- Instagram Reel upload instructions modal
- `navigator.share({ files })` Web Share API for mobile

---

## Phase 3 — Print on Demand

Requires a minimal backend to keep the Printful API key secure. Full task breakdown: `docs/phase3-tasks.md`.

**Flow**: user clicks "Print on merch" → picks product/variant → design generated client-side → uploaded to Vercel Blob → Printful fetches design URL for mockup → user previews → Printful hosted checkout.

**Backend**: Vercel Functions (`/api/print/*`)
- `POST /api/print/upload` — receives PNG blob, stores in Vercel Blob (public), returns URL
- `POST /api/print/mockup` — calls Printful mockup task API, polls for result, returns mockup image URL
- `POST /api/print/order` — creates Printful draft order, returns hosted checkout URL
- `PRINTFUL_API_KEY` stored in Vercel environment variables; no PII touches the backend

**Design generation** (`src/utils/PrintDesignGenerator.ts`):
- 4500×4500px square canvas (print-quality)
- Same aesthetic as app: faded periodic table background + centered element tiles
- No UI chrome (no URL footer, no header)
- Print-safe colors: category colors softened away from pure black/neon
- Exports `Promise<Blob>` (PNG)

**Product catalog** (`src/data/printProducts.ts`):
- Unisex t-shirt (Bella+Canvas 3001) — S–2XL, white/black/navy/heather
- 11oz mug — white, one size
- 18×24in poster — matte, one size

**New files**:
```
src/utils/PrintDesignGenerator.ts  — 4500×4500 print canvas
src/data/printProducts.ts          — Printful product + variant definitions
src/components/PrintPanel.tsx      — product picker modal (full-screen overlay)
src/components/ProductMockup.tsx   — mockup preview + order CTA
api/print/upload.ts                — Vercel Function: blob upload
api/print/mockup.ts                — Vercel Function: Printful mockup task
api/print/order.ts                 — Vercel Function: Printful draft order
```

---

## Performance Notes

- Element data (118 real + ~30 fake) is static — negligible bundle impact
- No global transition rules — targeted CSS transitions only
- Background table uses `transform: scale()` (GPU composited, no layout recalculation)
- Canvas image generation target: < 2s on mid-range mobile
- Video recording target: 3–5s clip, < 10s total generation
- No SSR needed (pure SPA)
