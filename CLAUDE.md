# Periodic Names — Claude Development Guide

## Project

Single-page React app where users type a name and see it spelled with periodic table element symbols. Real elements are maximized; a curated fake-element database fills gaps. Three phases: (1) cartoonish UI + animations, (2) social sharing, (3) print on demand.

Docs: `docs/roadmap.md` · `docs/tech-architecture.md` · `docs/phase1-tasks.md`

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
# Examples:
# feat/cartoonish-element-tiles
# fix/periodic-table-visibility
# feat/share-image-generator
```

Branch types: `feat/` `fix/` `refactor/` `style/`

### 2. Implement

Make the change. Follow the code conventions below.

### 3. Verify

```bash
npm run lint     # must pass with zero errors
npm run build    # must pass — this also type-checks
```

If the dev server is running, visually verify the change in the browser at `http://localhost:5173` before committing. For animation work, test the full input → processing → results flow.

### 4. Commit

```bash
git add <specific files>   # never `git add .` — avoids accidentally staging env files
git commit -m "<type>(<scope>): <what changed and why>"
```

Commit message examples:
- `feat(ui): add bold black borders to ElementTile`
- `fix(app): show periodic table during results phase, not just input`
- `style(animations): replace Tailwind transition with tilePop keyframe`
- `fix(matcher): use getFakeElementBySymbol for random variant selection`

### 5. Push and open PR

```bash
git push -u origin <branch>
gh pr create --title "<same as commit message>" --body "..."
```

### 6. Move to next task

Pick the next item from `docs/phase1-tasks.md`, update its checkbox, and repeat.

---

## Multi-Agent Parallel Work

Multiple agents can work simultaneously using **git worktrees** — each agent gets an isolated copy of the repo on its own branch.

### Setup a worktree for an agent

```bash
git worktree add ../periodicnames-<task> -b <branch-name>
cd ../periodicnames-<task>
npm install
```

### Rules for parallel agents

1. **Each agent owns a disjoint set of files.** Before starting, confirm no other active branch touches the same files. Check with: `git log --oneline --all -- <file>`.

2. **Safe to parallelize** (non-overlapping):
   - UI styling changes in `ElementTile.tsx` and `index.css`
   - Algorithm changes in `elementMatcher.ts` and `fakeElements.ts`
   - New utility files in `src/utils/`
   - New components in `src/components/`

3. **Must not parallelize** (shared files):
   - `App.tsx` — only one agent at a time
   - `src/types/index.ts` — coordinate type changes via PR before others depend on them
   - `tailwind.config.js` — merge-sensitive

4. **Merge order**: Algorithm/data changes before UI changes that depend on them. UI changes before App.tsx wiring.

5. Each agent runs its own `npm run build` in its worktree before pushing.

### Clean up worktree

```bash
git worktree remove ../periodicnames-<task>
```

---

## Code Conventions

### TypeScript

- **Strict mode is on.** No `any`, no `@ts-ignore`, no suppressed errors.
- Use `import type` for type-only imports: `import type { Element } from '../data/elements'`
- Define prop types as `interface`, not inline or `type` alias.
- Prefer explicit return types on exported functions; infer on local helpers.

```typescript
// Good
interface ElementTileProps {
  element?: Element;
  isHighlighted?: boolean;
}
const ElementTile: React.FC<ElementTileProps> = ({ element, isHighlighted = false }) => { ... }

// Avoid
const ElementTile = ({ element, isHighlighted }: { element?: Element; isHighlighted?: boolean }) => { ... }
```

### React

- Functional components only — `React.FC<Props>`.
- One component per file. File name matches component name.
- Keep components small. If JSX exceeds ~80 lines, split into sub-components.
- No prop drilling more than 2 levels. Pass data down, callbacks up.
- No global state (no Zustand, no Context) through Phase 2. Local `useState` is sufficient.

### Styling

- **Tailwind utility classes for all layout, spacing, and typography.** No inline `style` for anything Tailwind can handle.
- **Inline `style` only for dynamic values** that can't be expressed as Tailwind classes: colors from `colorSchemes.ts`, computed `animationDelay` in milliseconds.
- **Custom CSS keyframes and animation classes go in `src/index.css` only** — never inside component files.
- Use descriptive Tailwind class groupings (layout first, then visual, then interactive):
  ```tsx
  className="w-full h-full flex items-center justify-center  rounded-lg border-2 border-black  transition-transform hover:scale-105"
  ```

### Colors

- **Never hardcode hex colors in components.** All element category colors come from `src/utils/colorSchemes.ts`.
- Import color helpers: `getCategoryColor`, `getCategoryBorderColor`, `getFakeElementColor`, `getFakeElementBorderColor`.
- Adding a new color: add it to `colorSchemes.ts` first, then import.

### Animations

- All `@keyframes` definitions live in `src/index.css`.
- Apply animation classes via `className` or by toggling a CSS class string in component state.
- Use `animation-delay` via inline `style={{ animationDelay: '${n}ms' }}`.
- No animation libraries (no Framer Motion). CSS keyframes + Tailwind transitions only.
- Standard easing for spring-like effects: `cubic-bezier(0.34, 1.56, 0.64, 1)`.

### Data and Utils

```
src/data/
  elements.ts       — 118 real elements, getAllElements()
  fakeElements.ts   — invented elements, getAllFakeElements(), getFakeElementBySymbol(symbol)
  elementCategories.ts — category label → display name mapping

src/utils/
  elementMatcher.ts — matchNameToElements(name: string): NameResult
  colorSchemes.ts   — getCategoryColor(category), etc.
```

- `getAllElements()` and `getAllFakeElements()` return fresh arrays each call — memoize at the call site if calling in a render loop.
- `getFakeElementBySymbol(symbol)` returns a random variant for the given letter. Use this, not `find()` directly.
- The element matching algorithm in `elementMatcher.ts` must **maximize real elements** (DP, not greedy). See `docs/phase1-tasks.md` Task 3.1.

### Key Types

```typescript
// src/types/index.ts
interface NameResult {
  originalName: string;
  elements: Element[];          // real elements only
  fakeElements: FakeElement[];  // invented elements only
  orderedElements: (Element | FakeElement)[];  // in name order, used for display
  totalElements: number;
  realElementsCount: number;
}
```

- `orderedElements` is the source of truth for rendering result tiles.
- A `FakeElement` can be identified by checking `'atomicNumber' in element` — real elements have it, fake ones don't.

### Animation Phase State (App.tsx)

The app uses an `AnimationPhase` state machine:
- `'input'` — initial state, periodic table visible, no results
- `'processing'` — spinner shown, periodic table fades out
- `'results'` — result tiles visible, periodic table returns with highlighted elements, refresh button shown

Transitions are driven by `handleNameSubmit` and `handleRefresh` in `App.tsx`. Do not bypass this state machine by reading `result !== null` directly — use `animationPhase` to drive visibility.

### File Naming

- Components: `PascalCase.tsx`
- Utilities, data, hooks: `camelCase.ts`
- CSS: `index.css` (single file, not modules)

---

## What Not to Do

- Do not add npm dependencies without a clear reason. The dependency list is intentionally minimal.
- Do not add comments explaining what code does. Names should be self-evident. Only comment non-obvious *why*.
- Do not add error boundaries, fallbacks, or retry logic for things that can't fail (pure client-side data transforms, static element data).
- Do not use `setTimeout` for anything other than UX delay in animation sequences. Use CSS transitions for visual timing.
- Do not create new CSS files. All custom CSS goes in `src/index.css`.
- Do not store animation delay in component state. Pass it as a prop and apply via `style={{ animationDelay }}`.

---

## Current Work

Active phase: **Phase 1 — Cartoonish UI + Slick Animations**

Task checklist: `docs/phase1-tasks.md`

Recommended start order:
1. Fix duplicate CSS keyframes in `index.css` (Task 2.1)
2. Fix `ElementTile` sizing — `w-full h-full` + `size` prop (Task 1.7)
3. Add Nunito font (Task 1.4)
4. Bold black borders + saturated colors (Tasks 1.1, 1.2)
5. Fix periodic table visibility in results phase (Task 2.4)
6. Replace pop-in with `tilePop` keyframe (Task 2.2)
7. Exit animation for old result (Task 2.5)
8. DP-based element matcher (Task 3.1)
