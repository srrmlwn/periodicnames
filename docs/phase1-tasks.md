# Phase 1 Task Breakdown

Cartoonish UI + Slick Animations.

## Status Summary

**Phase 1 is complete.** All foundation, cartoonish UI, animation, and algorithm tasks are done. The app is deployed to Vercel at periodicnames.com with deep-link URL routing.

Remaining optional polish items are in Phase 1d below.

---

## Implementation Order

### Phase 1a — Foundation ✅

- [x] **Fix duplicate CSS keyframe definitions** (`src/index.css`)
  Removed duplicate `.element-glow` and `.element-pulse` definitions. Consolidated animation keyframes.

- [x] **Fix ElementTile sizing: `w-full h-full` + size prop** (`src/components/ElementTile.tsx`)
  Replaced hardcoded `w-6 h-6` with `w-full h-full`. Added `size: 'sm' | 'lg'` prop. `'lg'` used in ResultDisplay, `'sm'` used in PeriodicTable background.

- [x] **Add Nunito font** (`index.html` + `tailwind.config.js`)
  Google Fonts link for Nunito (weights 400/700/800/900). Extended Tailwind `theme.fontFamily.sans`.

- [x] **Fix page title** (`index.html`)
  Changed `<title>` and added `<meta name="description">`.

---

### Phase 1b — Cartoonish UI ✅

- [x] **Bold black borders on real element tiles** (`src/components/ElementTile.tsx`)

- [x] **Saturated category fill colors** (`src/utils/colorSchemes.ts`)
  All category background colors bumped to vivid saturated values.

- [x] **Fake element: dashed black border + CSS shimmer** (`ElementTile.tsx` + `index.css`)
  `.fake-shimmer` animates `background-position` for a gold sweep effect.

- [x] **Header font weight** (`src/components/Header.tsx`)

- [x] **App background color** — set to `bg-white` (works with faded background table).

---

### Phase 1c — Animations ✅

- [x] **Centralized animation via single `setInterval`** (`App.tsx`)
  Single `revealedCount` state drives both PeriodicTable highlights and ResultDisplay tile reveals simultaneously, eliminating all sync issues. 500ms between elements, 1s initial delay (allows table to settle).

- [x] **Simple opacity fade for result tiles** (`ResultDisplay.tsx` + `index.css`)
  `transition-opacity duration-200` — plain fade-in keyed off `index < revealedCount`. tilePop keyframe removed in favor of this cleaner approach.

- [x] **Fake element wobble on entry** (`index.css` + `ElementTile.tsx`)
  `.fake-wobble` keyframe applied once when tile becomes visible.

- [x] **Exit animation for old result before new one enters** (`ResultDisplay.tsx` + `index.css`)
  `result-exit` keyframe. `isExiting`/`shouldRender` state with ref-guarded timer prevents race conditions on rapid re-submit.

- [x] **Removed global `* { transition: all }`** (`index.css`)
  Was causing full-layout recalculation on every state change across all 118+ tiles. Replaced with targeted transitions only where needed.

- [x] **Duplicate element re-pulse** (`PeriodicTable.tsx`)
  React key trick: `key={colIndex}-${revealCount}` for the active tile forces component remount, retriggering the CSS animation when the same element appears twice (e.g. "Harinii" → two iodine tiles).

- [x] **Background periodic table UX** (`App.tsx` + `PeriodicTable.tsx` + `index.css`)
  Periodic table moved to fixed full-screen background. Scaled to cover the viewport (`Math.max(vw/754, vh/376)`). All tiles at 0.12 opacity. After animation completes, matched element tiles brighten to 0.45 opacity with a 1s ease transition. Table has `pointer-events: none`. No more compact/zoom modes.

- [x] **Refresh button in input box** (`NameInput.tsx`)
  Button inside the input toggles between → (submit) and ↺ (refresh). Removed old separate refresh button position.

- [x] **Removed "Name successfully spelled..." banner** (`ResultDisplay.tsx`)
  No longer needed — the animated tile reveal itself is the confirmation.

---

### Phase 1d — Algorithm ✅

- [x] **Fix fake element random selection** (`src/utils/elementMatcher.ts`)
  Uses `getFakeElementBySymbol(symbol)` instead of `.find()` — random variant per letter now works.

- [x] **DP-based element matcher** (`src/utils/elementMatcher.ts`)
  `dp[i]` = max real elements from position `i`. Processes right-to-left, tries lengths 1 and 2. Reconstruction via `choice[i]` array. Words are split and processed independently.

---

### Phase 1e — URL Routing + Deployment ✅

- [x] **Deep-link URL routing** (`App.tsx` + `vercel.json`)
  `history.pushState` updates the URL to `periodicnames.com/<name>` on submit. On load, the URL path is parsed and auto-submitted. `vercel.json` rewrites all routes to `/` for SPA behavior.

- [x] **Deployed to Vercel** at periodicnames.com.

---

### Phase 2 — Social Sharing (Partially Complete)

- [x] **Share image generator** (`src/utils/ShareImageGenerator.ts`)
  Canvas-based PNG generation (1200×630). Faded periodic table background, element tiles centered, `periodicnames.com/<name>` URL footer.

- [x] **Share reel video generator** (`src/utils/ShareVideoGenerator.ts`)
  MediaRecorder API. 500ms stagger + plain opacity fade matching app animation. Name-to-elements transform animation.

- [x] **Share preview modal** (`src/components/SharePreviewModal.tsx`)
  Shows generated image/video previews with download buttons.

- [ ] **Twitter/X direct share** — intent URL with pre-filled text.
- [ ] **Instagram Reel upload guidance** — instructions modal after download.
- [ ] **Web Share API** (`navigator.share({ files })`) for mobile native share.

---

### Optional Polish (Low Priority)

- [ ] **Keyboard accessibility** — `tabIndex`, `role="img"`, `aria-label` on ElementTile; `onKeyDown` for Enter/Space.
- [ ] **Favicon** — element tile–style icon.
- [ ] **OG meta tags** — `og:image`, `og:title`, `og:description` for link previews when sharing the URL.
