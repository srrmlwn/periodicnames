# Roadmap

Three phases, shipping in order. Each phase is independently shippable.

---

## Phase 1 — Core Experience (Active)

**Goal**: A polished, delightful name-spelling experience with a cartoonish visual identity.

### UI: Cartoonish Element Tiles
- Bold black borders (2–3px) on all element tiles
- Bright, saturated category colors (not pastel — vivid)
- Playful, rounded typography for element symbols
- Fake elements: dashed black border + distinct color (e.g. iridescent/shimmer)
- Periodic table uses the same bold tile style with muted versions of highlighted colors

### Animation: Slick Name Reveal
- Input letters visually "split" into element symbol groups
- Each element tile flips or pops in with staggered delay (50–80ms per tile)
- Fake element tiles animate differently (e.g. sparkle or wobble on entry)
- Periodic table: matched elements pulse/glow when result appears
- On new name: previous result tiles exit with a quick fade/slide-out

### Algorithm
- Case-insensitive matching
- Maximizes real elements (dynamic programming, not greedy)
- Fake element database: ~30 curated fun names for common unmatchable sequences
- Result: single best decomposition (no ambiguity shown to user)

### Responsive / Polish
- Mobile-first layout (periodic table scrolls horizontally on small screens)
- Input + submit button inline, with refresh button post-result
- Accessible: keyboard-navigable, ARIA labels on tiles

**Done when**: Any name looks great, animates smoothly, and fake elements feel intentional not broken.

---

## Phase 2 — Social Sharing

**Goal**: Make results easy to share on Twitter and Instagram, including as a short video Reel.

### Static Image Sharing (Twitter + Instagram post)
- Canvas API renders the result as a high-quality PNG
  - Twitter card: 1200×675px
  - Instagram square: 1080×1080px
- Cartoonish tile style matches the app exactly
- Branding: "periodicnames.com" watermark
- One-click: generates image + opens Twitter web intent pre-filled with text and hashtags
- Instagram: generates image + shows download instructions + copyable caption

### Video / Reel (Instagram Reel + Twitter)
- `MediaRecorder` API records the canvas animation (the name-reveal sequence) as a short video clip (3–5 seconds)
- Output: MP4/WebM downloaded to device
- User uploads to Instagram as a Reel or to Twitter
- Show instructions modal with copyable caption + hashtags

### Web Share API (mobile)
- On mobile, use native `navigator.share()` to share image directly to any app
- Falls back to download + instructions on desktop

### Share UX
- "Share" button appears after result is shown
- Dropdown: Twitter · Instagram Post · Instagram Reel
- Each option: generates asset + opens appropriate flow
- Loading spinner during generation (target: < 2 seconds)

**Done when**: From result → shared tweet (with image) in under 10 seconds on desktop. Reel downloads and looks great.

---

## Phase 3 — Print on Demand

**Goal**: Let users order their name result printed on physical products.

### Products
- T-shirts (front: name elements; back optional: full periodic table)
- Mugs (name wraps around)
- Coasters (individual element tile set)
- Posters (name + full periodic table with highlights)

### Integration
- **Printful** as the print partner (best API + product quality)
- Lightweight Node.js backend (or Vercel edge function) to hold Printful API key securely
- Frontend generates high-res PNG design (2400×2400+ for print quality)
- Printful API: create mockup → product → redirect to checkout

### User Flow
1. Result shown → "Order This" button appears
2. Product picker (t-shirt / mug / coaster / poster)
3. Live mockup preview (Printful mockup generator)
4. Size/color picker
5. Add to cart → checkout (Printful handles payment + fulfillment)

### Design
- Same cartoonish style, optimized for print (high-res canvas, CMYK-safe colors)
- Option to pick from 2–3 layout variants

**Done when**: A user can go from name → ordered t-shirt in under 2 minutes.

---

## What's Not in Scope (for now)

- User accounts / saved results
- Analytics dashboard
- Multiple color themes
- SEO / blog content
- Mobile app
