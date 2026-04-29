# Phase 3 — Print on Demand

T-shirt, 11oz mug, 18×24in poster via Printful + Stripe.

## Status

**Code is complete and on main.** Two external setup steps remain before orders work in production.

---

## What's done

### Design generation
- `src/utils/PrintDesignGenerator.ts` — 4500×4500px canvas, transparent background, faded table watermark, element tiles, optional caption; exports `Promise<Blob>`
- `PrintLayout` type (`'caption-above' | 'caption-below' | 'tiles-only'`) — controls caption placement; default is `caption-above`

### Backend (Vercel Functions)
- `api/print/upload.ts` — accepts base64 PNG, uploads to Vercel Blob (public), returns `{ url }`
- `api/print/mockup.ts` — calls Printful mockup-tasks, polls until complete, returns `{ mockups }`
- `api/print/order.ts` — returns 410; superseded by Stripe flow
- `api/stripe/checkout.ts` — creates Stripe Checkout session with product/variant/design/recipient in metadata
- `api/stripe/webhook.ts` — verifies Stripe signature (raw body, no body-parser), creates confirmed Printful order on `checkout.session.completed`; forwards customer email to Printful for shipping notifications

### Product catalog
- `src/data/printProducts.ts` — 3 products with verified real Printful variant IDs:
  - T-shirt (BC3001, product 71): White/Black/Navy/Athletic Heather × S/M/L/XL (16 variants, IDs confirmed via API)
  - Mug (product 19): 11oz white, variant ID 1320
  - Poster (product 1): 18×24in matte, variant ID 1

### UI
- `src/components/PrintPanel.tsx` — product picker → variant picker → layout presets → design gen → upload → mockup → address → Stripe checkout
- `src/components/ProductMockup.tsx` — mockup image + Buy CTA
- `src/components/ResultDisplay.tsx` — "Print on merch" button wired, opens PrintPanel in `done` phase
- `src/App.tsx` — detects `?order=success` on load, shows dismissable green success banner, clears param from URL

### Order flow (end-to-end)
1. User picks product + variant → "Preview"
2. `PrintDesignGenerator` renders 4500×4500px canvas client-side
3. `POST /api/print/upload` → Vercel Blob → `designUrl`
4. `POST /api/print/mockup` → Printful mockup task (polls ~5–15s) → `mockupUrl`
5. User sees mockup, enters shipping address → "Pay"
6. `POST /api/stripe/checkout` → Stripe session → redirect to Stripe hosted checkout
7. User pays on Stripe → redirected back to `/?order=success`
8. Stripe fires `checkout.session.completed` webhook → `api/stripe/webhook` → confirmed Printful order with `type:'front'` file placement and customer email

---

## Pending (external setup only)

- [ ] **Set Vercel env vars** — confirm in Vercel dashboard → Settings → Environment Variables:
  - `PRINTFUL_API_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`

- [ ] **Register Stripe webhook** — Stripe dashboard → Developers → Webhooks → Add endpoint:
  - URL: `https://periodicnames.com/api/stripe/webhook`
  - Event: `checkout.session.completed`
  - Copy signing secret → use as `STRIPE_WEBHOOK_SECRET` above

---

## Optional / Polish (post-launch)

- [ ] Design caching — skip re-upload if user previews same product twice
- [ ] Live price fetch from Printful catalog
- [ ] Color accuracy pass against real printed samples

---

## Future Work — Drag-and-Drop Design Canvas

**Goal:** Replace the fixed layout presets with a fully interactive WYSIWYG canvas inside the print modal, so users can freely reposition the element tiles, caption text, and background toggle before generating the print image.

**Why it's non-trivial:**
- The modal preview is ~380px wide; the generated image is 4500×4500px. Accurately mapping drag-and-drop screen coordinates to print canvas coordinates requires a stable scale transform and anchor model.
- Dragging the _tile group_ as a unit (not individual tiles) is straightforward. Dragging individual tiles would require breaking the layout abstraction in `createElementLayout`.
- A plain React drag implementation works, but a canvas-native approach (Konva.js or Fabric.js) feels far more responsive and handles multi-touch naturally — at the cost of a real dependency.

**Recommended scope when we get here:**
1. Draggable tile group (all tiles move together) and draggable caption text — two independent handles.
2. Toggle to show/hide the periodic table watermark background.
3. Optionally: font size slider for caption.
4. Keep the preset buttons as starting points; dragging overrides them.

**Implementation sketch:**
- Add a `<DesignCanvas>` component (React + pointer events, no library) that renders a scaled-down preview of the 4500px canvas.
- Store `{ tilesOffset: {x, y}, captionOffset: {x, y} }` in `PrintPanel` state.
- Pass offsets into `PrintDesignGenerator.generatePrintDesign` and apply them at the print scale.
- The WYSIWYG preview can be a `<canvas>` element re-rendered on every drag event (or an HTML layer with `transform` for responsiveness, then re-render on pointer-up).
