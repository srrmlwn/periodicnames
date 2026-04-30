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
- `src/components/PrintPanel.tsx` — product picker → variant picker → layout presets → design gen → upload → mockup → Stripe checkout (no address form; Stripe collects it)
- `src/components/ProductMockup.tsx` — mockup image + Buy CTA
- `src/components/ResultDisplay.tsx` — "Print on merch" button wired, opens PrintPanel in `done` phase
- `src/App.tsx` — detects `?order=success` on load, shows dismissable green success banner, clears param from URL

### Order flow (end-to-end)
1. User picks product + variant → "Preview"
2. `PrintDesignGenerator` renders 4500×4500px canvas client-side
3. `POST /api/print/upload` → Vercel Blob → `designUrl`
4. `POST /api/print/mockup` → Printful mockup task (polls ~5–15s) → `mockupUrl`
5. User sees mockup → clicks "Buy" → `POST /api/stripe/checkout` → redirect to Stripe hosted checkout
6. Stripe collects shipping address (US only) + payment
7. User redirected back to `/?order=success`; success banner shown
8. Stripe fires `checkout.session.completed` → `api/stripe/webhook` → reads address from `session.shipping_details` → confirmed Printful order with `type:'front'` file + customer email forwarded

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

## Design Canvas — Shipped

**Status: complete on `feat/design-canvas` branch**

Replaced the fixed layout preset buttons with a live 340×340px WYSIWYG HTML preview inside the print modal. Users drag the tile group and caption text independently before generating the print image.

**Design choices:**

- **HTML-based preview, not canvas.** Tiles rendered as styled `<div>` elements at a computed small size (18–44px). Avoids duplicating the Canvas API drawing logic in `PrintDesignGenerator`; a minor visual discrepancy vs. the final print is acceptable because the Printful mockup always shows the real result.

- **Coordinate model.** The preview is 340px; the print canvas is 4500px. Screen offsets (from drag) are stored in preview-pixels; they're multiplied by `4500/340 ≈ 13.2` to produce the print-space offsets passed to `PrintDesignGenerator`. Default position (zero offset) centers the tile group on the canvas with the caption directly below.

- **Pointer capture.** Each drag handle calls `setPointerCapture` on `pointerdown`, so drag continues smoothly outside the element. `onPointerMove` lives on the container to handle pointer-cancel gracefully.

- **Watermark preview.** `ELEMENT_POSITIONS` exported from `PrintDesignGenerator`; `DesignCanvas` draws a sync faint canvas layer using the same data. Opacity fades via CSS `transition` when the toggle is flipped.

- **Tiles default: centered; caption: below tiles.** When no caption is typed, the caption drag handle disappears. Going back from Product → Design restores canvas state via `initialTilesOff`/`initialCaptionOff` props.

- **`PrintLayout` type removed.** The three preset modes obsoleted by free drag. Layout is now purely positional.

- **Flow order: Design → Product → Customize.** 3-dot progress bar at top of modal. Design step (canvas + caption + watermark toggle) comes first so users customize before committing to a product. Caption input is above the canvas preview so text appears live as typed.

- **Brand watermark.** `periodicnames.com` drawn bottom-right in print canvas (90px, rgba gray, always present). Same text shown in the HTML preview at 7px. Not user-togglable.

**Optional follow-ups:**
- [ ] Caption font-size slider
- [ ] Drag individual tiles (would require refactoring `createElementLayout`)
