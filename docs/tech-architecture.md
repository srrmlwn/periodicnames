# Technical Architecture

## Current Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Styling | Tailwind CSS |
| Build | Vite |
| Deployment | Vercel |
| Domain | periodicnames.com |

No backend today. Everything runs client-side.

---

## What's Built (Phase 1 baseline)

```
src/
├── components/
│   ├── Header.tsx           — site title + subtitle
│   ├── NameInput.tsx        — text input + inline submit
│   ├── PeriodicTable.tsx    — full table grid, highlights matched elements
│   ├── ElementTile.tsx      — individual element square (symbol, number, name, mass)
│   ├── ResultDisplay.tsx    — animated result strip
│   └── ShareButton.tsx      — share button scaffold (Phase 2)
├── data/
│   ├── elements.ts          — all 118 real elements
│   ├── fakeElements.ts      — ~30 invented elements for unmatched letters
│   └── elementCategories.ts — category → color mapping
├── utils/
│   ├── elementMatcher.ts    — name → element array algorithm
│   └── (ShareImageGenerator, TwitterSharer, InstagramSharer — Phase 2 scaffolding)
├── templates/               — image design templates (Phase 2 scaffolding)
├── types/index.ts           — Element, NameResult, FakeElement interfaces
└── App.tsx                  — animation phase state machine (input → processing → results)
```

### Key Data Types

```typescript
interface Element {
  symbol: string;
  name: string;
  atomicNumber: number;
  atomicMass: number;
  category: ElementCategory;
  isReal: boolean;
}

interface NameResult {
  originalName: string;
  orderedElements: Element[];
  fakeElements: FakeElement[];
}
```

### Algorithm

Dynamic-programming approach over the name string:
1. Normalize input (uppercase, strip non-alpha)
2. For each position, try all possible real element symbol matches (length 1–2)
3. Find the decomposition that maximizes real elements and minimizes fake ones
4. Fill uncovered positions with fake elements from the curated database

---

## Phase 1 — UI Changes (Cartoonish Style)

Pure CSS/Tailwind changes, no new dependencies.

**ElementTile:**
- `border-2 border-black` (or `border-3`) — bold outline
- Saturated background colors per category (e.g. `bg-red-500` not `bg-red-100`)
- `rounded-lg` corners
- Symbol font: `font-black` + slightly oversized
- Fake element: `border-dashed border-black` + shimmer/gradient background

**Animations (CSS + Tailwind):**
- Tile reveal: `@keyframes popIn` — scale from 0.6 + fade in, with JS-driven `animation-delay`
- Periodic table highlight: `@keyframes pulse-glow` — box-shadow pulse
- Exit animation: `opacity-0 scale-95` transition before clearing result

---

## Phase 2 — Social Sharing Architecture

Still client-side only. No new backend needed.

### Image Generation (Canvas API)

```
src/utils/ShareImageGenerator.ts
  generateImage(result: NameResult, platform: 'twitter' | 'instagram'): Promise<Blob>
  
src/templates/imageTemplates.ts
  twitterTemplate   — 1200×675, horizontal element strip
  instagramTemplate — 1080×1080, centered grid layout
```

Rendering pipeline:
1. Create off-screen `<canvas>` at target dimensions
2. Draw background (solid or gradient matching app color scheme)
3. Re-render each element tile using canvas `fillRect` + `fillText`
4. Draw "periodicnames.com" branding
5. `canvas.toBlob()` → PNG

### Video Generation (MediaRecorder API)

```
src/utils/ReelGenerator.ts
  recordAnimation(result: NameResult): Promise<Blob>  // returns MP4/WebM
```

Flow:
1. Create off-screen canvas
2. Use `requestAnimationFrame` to drive the tile-reveal animation on canvas
3. `canvas.captureStream(30)` → `MediaRecorder` records to chunks
4. Stop after animation completes → `Blob` of video
5. Trigger download → user uploads to Instagram Reel / Twitter

### Sharing Flows

| Platform | Format | Mechanism |
|---|---|---|
| Twitter | PNG image + text | Download image + `twitter.com/intent/tweet?text=...` |
| Instagram post | PNG image | Download + copyable caption instructions |
| Instagram Reel | MP4 video | Download + instructions |
| Mobile (any) | PNG or video | `navigator.share({ files: [...] })` Web Share API |

### New Components (Phase 2)

```
src/components/SharePanel.tsx    — dropdown: Twitter · Instagram Post · Reel
src/components/ShareModal.tsx    — instructions + copyable caption after download
```

---

## Phase 3 — Print on Demand Architecture

This phase requires a minimal backend to keep the Printful API key secure.

### Backend

- **Vercel Edge Function** (`/api/print/*`)
  - `POST /api/print/mockup` — generates product mockup via Printful API
  - `POST /api/print/order` — creates draft order, returns Printful checkout URL
- API key stored in Vercel environment variables
- No database needed (Printful handles order state)

### Design Generation

High-res PNG for print (minimum 2400×2400px):
- Same Canvas API approach as Phase 2, scaled up
- Print-safe colors (avoid pure #000000 → use #1a1a1a for black; avoid neon)
- Exported as PNG blob → sent to Printful mockup API as base64 or direct upload

### Printful Integration

```typescript
// Simplified flow
async function createMockup(designBlob: Blob, productId: string): Promise<MockupUrl>
async function createOrder(designBlob: Blob, product: PrintProduct, shippingInfo: ShippingInfo): Promise<string> // returns checkout URL
```

Products mapped to Printful catalog IDs at build time.

### New Components (Phase 3)

```
src/components/PrintPanel.tsx     — product picker (t-shirt / mug / coaster / poster)
src/components/ProductMockup.tsx  — live mockup preview image
src/pages/Checkout.tsx            — size/color/quantity → redirect to Printful checkout
```

---

## State Management

No global state manager (Zustand, Redux) needed through Phase 2. Local `useState` + prop drilling is sufficient.

Phase 3 may warrant a lightweight context for cart state if multi-product ordering is added.

---

## Performance Notes

- Element data (~118 real + ~30 fake) is a static JSON import — negligible bundle impact
- Canvas image generation: target < 2s on mid-range mobile
- Video recording: 3–5s clip, target < 10s total generation time
- No server-side rendering needed (pure SPA is fine for this use case)
