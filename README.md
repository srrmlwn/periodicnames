# Periodic Names

Spell your name using elements from the periodic table.

Enter any name and watch it transform into a sequence of element tiles — real elements where possible, invented ones where not. The result can be shared to social media or printed on a mug, t-shirt, or coaster.

**Live**: periodicnames.com

---

## What it does

1. You type a name (e.g. `Sriram`)
2. The app finds the best combination of real periodic table elements (`Sr + Ir + Am`)
3. If a letter sequence can't be covered by real elements, a fun made-up element fills the gap
4. Results animate onto the screen as bold, cartoonish element tiles
5. You can share the result or order it printed on merchandise

## Features

- **Name spelling** — greedy matching algorithm prioritizes real elements, minimizes fake ones
- **Fake elements** — a curated database of fun invented elements (e.g. `Lx` → "Luxium") for letters with no real match
- **Cartoonish UI** — bright category colors, bold black borders, playful typography
- **Slick animations** — letters dissolve into element tiles with staggered timing
- **Interactive periodic table** — highlights the elements used in your result
- **Social sharing** — download a shareable image or video for Twitter / Instagram _(Phase 2)_
- **Print on demand** — order your name on a t-shirt, mug, or coaster via Printful _(Phase 3)_

## Stack

- React 18 + TypeScript
- Tailwind CSS
- Vite
- Deployed on Vercel

## Development

```bash
npm install
npm run dev      # dev server at localhost:5173
npm run build    # production build
```

## Docs

- [`docs/roadmap.md`](docs/roadmap.md) — 3-phase feature roadmap
- [`docs/tech-architecture.md`](docs/tech-architecture.md) — technical design
- [`docs/idea.md`](docs/idea.md) — original vision and design decisions
