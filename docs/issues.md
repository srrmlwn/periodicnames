# Known Issues

Status: `open` · `in-progress` · `fixed`

---

## Layout & Responsive

### [open] #1 — Large blank white dead zone below content (all screens)
The background periodic table (contain-scaled) never fills tall viewports at a readable tile size. On desktop-lg at TABLE_MAX_SCALE 1.5, the table occupies ~56% of the 1080px viewport height, leaving ~27% blank below. Partial mitigations applied: `bg-slate-50` background, increased max scale to 1.5. A full fix requires a different background strategy (repeating tile pattern, or cover mode with edge clipping).

### [open] #2 — Empty gap between header and background table (tall mobile)
On mobile-md/lg (390–430×844–932), there is visible white space between the subheader and the top of the background table. Root cause same as #1: contain-scaled table does not reach the top of the content area. Reduced in severity by the 1.5 scale increase.

### [fixed] #3 — Mobile landscape: results overflow below viewport
At 844×390 with results visible, output tiles + buttons pushed below the 390px viewport. Fixed by adding a `.content-wrap` CSS class with `@media (max-height: 500px)` override that reduces `padding-top` from `calc(45vh - 80px)` to `calc(28vh - 30px)` on short landscape viewports.

### [fixed] #4 — Element names still truncating in mobile output tiles
At the 48px tile size on mobile, 12+ character names like "Ridicularium" truncated to "Ridiculo...". Fixed by making `nameClass` responsive: `text-[6px] sm:text-[8px]` for `size="lg"` tiles, giving ~13 chars capacity at 48px and ~13 chars at 64px.

### [open] #5 — Desktop-lg: composition feels small on 1920px canvas
At 1920×1080 the header tiles (32px) and content feel undersized for the viewport. TABLE_MAX_SCALE increase to 1.5 partially addresses this for the background table. Header tile sizing and content max-width are unaddressed.

---

## Element Tile Bugs

### [fixed] #6 — Atomic mass overlaps atomic number on hover
`atomicMass` (e.g. `132.905`, 7 chars) was positioned `top-0 right-0.5` while atomic number sat `top-0 left-0.5`. Fixed by stacking atomic mass below atomic number in a flex column at the top-left corner.

### [fixed] #7 — Fake elements missing hover effect
Fake elements (stone-900 background, amber border) showed no visible hover response. Two fixes applied:
1. Replaced `.hover-lift` (a custom CSS class that was silently overriding Tailwind's `hover:scale-125` transform) with `hover:-translate-y-0.5` so scale and lift now compose correctly for all tiles.
2. Added `hover:brightness-110` to fake element tiles so the dark background brightens visibly on hover.

---

## Sharing (Phase 2)

*(No issues logged yet)*
