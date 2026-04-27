# Phase 3 Task Breakdown

Print on Demand — unisex t-shirt, 11oz mug, poster via Printful API.

## Status Summary

**Phase 3 is planned.** Work has not started.

Full flow: user hits "Print on merch" → `PrintPanel` modal → picks product/variant → design is generated client-side → uploaded to Vercel Blob → Printful fetches the file for mockup generation → user previews → Printful hosted checkout.

---

## Implementation Order

### Phase 3a — Print Design Generation

- [ ] **Create `src/utils/PrintDesignGenerator.ts`**
  - Square canvas at **4500×4500px** (print-quality, same aesthetic as app)
  - Faded periodic table background — same tile grid layout, ~0.1 opacity
  - Element tiles centered and scaled up for print (real: saturated category colors; fake: dark stone-900 + amber border)
  - No UI chrome: no URL footer, no browser artifacts, no header text
  - Print-safe color pass: avoid pure `#000000` and neon values — remap category colors to slightly softened variants
  - Exports as `Promise<Blob>` (PNG)
  - Reuse `createElementLayout()` from `elementRenderer.ts` for word grouping

---

### Phase 3b — Backend (Vercel Functions)

- [ ] **Add environment variables** to Vercel project
  - `PRINTFUL_API_KEY` — Printful OAuth token (store-specific)

- [ ] **Create `api/print/upload.ts`** — `POST /api/print/upload`
  - Accepts `multipart/form-data` with PNG blob from client
  - Uploads to **Vercel Blob** (public, so Printful can fetch it via URL)
  - Returns `{ url: string }` — the public blob URL
  - Validates file size (< 50MB) and MIME type before upload

- [ ] **Create `api/print/mockup.ts`** — `POST /api/print/mockup`
  - Accepts `{ productId: number, variantIds: number[], designUrl: string }`
  - Calls Printful `POST /v2/mockup-tasks` (creates async task)
  - Polls `GET /v2/mockup-tasks/{taskId}` until status is `completed` (max ~30s)
  - Returns `{ mockups: { variantId, mockupUrl }[] }`
  - Returns 504 if Printful takes > 25s (client should retry)

- [ ] **Create `api/print/order.ts`** — `POST /api/print/order`
  - Accepts `{ productId: number, variantId: number, designUrl: string }`
  - Creates a Printful draft order with the design applied to the chosen product/variant
  - Returns `{ checkoutUrl: string }` — Printful hosted checkout URL
  - The checkout URL handles shipping address, payment, and fulfillment — no PII touches our backend

---

### Phase 3c — Product Catalog

- [ ] **Create `src/data/printProducts.ts`**
  - Static product definitions: Printful product ID, available variant IDs, display name, price
  - Products to launch:
    - **Unisex t-shirt** (Bella+Canvas 3001, Printful product ID 71) — sizes S–2XL, colors: white, black, navy, heather grey
    - **11oz mug** (Printful product ID 19) — white only, one size
    - **Poster** (Printful product ID 1, 18×24in) — matte finish, one size
  - Export `PRINT_PRODUCTS: PrintProduct[]` and `getPrintProduct(id)` helper

```typescript
interface PrintProduct {
  id: number;               // Printful product ID
  name: string;             // display name
  variants: PrintVariant[];
  designPlacement: 'front' | 'print_area';
}

interface PrintVariant {
  id: number;               // Printful variant ID
  label: string;            // "White / S", "Black / M", etc.
  color?: string;           // hex for UI swatch
  size?: string;
}
```

---

### Phase 3d — UI Components

- [ ] **Add "Print on merch" button** (`src/components/ResultDisplay.tsx` or `App.tsx`)
  - Appears in the `done` animation phase, alongside the Share button
  - Opens `PrintPanel` modal on click

- [ ] **Create `src/components/PrintPanel.tsx`** — product picker modal
  - Full-screen overlay (same modal pattern as `SharePreviewModal`)
  - Product grid: t-shirt, mug, poster — each as a card with icon/illustration
  - On product select: show variant pickers (color swatches, size dropdown for shirt)
  - "Preview" CTA triggers design generation → upload → mockup fetch sequence
  - Loading skeleton while mockup generates (Printful typically 5–15s)
  - Error state with retry if API fails

- [ ] **Create `src/components/ProductMockup.tsx`** — mockup preview
  - Displays the mockup image URL returned by `/api/print/mockup`
  - Shows product name, selected variant, and estimated price
  - "Order" button → calls `/api/print/order` → redirects to Printful checkout URL
  - Back button to return to product/variant picker

---

### Phase 3e — Wiring & Integration

- [ ] **Connect full flow in `App.tsx` or `PrintPanel.tsx`**
  1. User picks product + variant → clicks "Preview"
  2. `PrintDesignGenerator.generate(result)` → PNG `Blob`
  3. `POST /api/print/upload` → `designUrl`
  4. `POST /api/print/mockup` with `designUrl` → `mockupUrl`
  5. Show `ProductMockup` with `mockupUrl`
  6. User clicks "Order" → `POST /api/print/order` → `checkoutUrl`
  7. `window.open(checkoutUrl)` → Printful hosted checkout

- [ ] **Mobile responsiveness** of `PrintPanel` and `ProductMockup`
  - Modal should be full-screen on mobile
  - Product grid stacks vertically on small screens
  - Mockup image fills available width

- [ ] **End-to-end smoke test**
  - Design generation < 3s on mid-range mobile
  - Blob upload < 5s
  - Mockup generation < 20s (Printful SLA)
  - Checkout redirect opens correctly

---

### Optional / Polish

- [ ] **Printful webhook** `api/print/webhook.ts` — order status notifications (if needed for post-purchase UX)
- [ ] **Price display** — fetch live variant pricing from `GET /v2/store/products/{id}` and surface in `PrintPanel`
- [ ] **Design caching** — cache the blob URL in component state so repeat previews skip re-upload
- [ ] **Color accuracy** — verify print-safe color mapping looks correct against real Printful samples
