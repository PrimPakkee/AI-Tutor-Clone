# Slide 2 "Standard Form" Enrichment — Design Spec

## Goal

Replace the generic bullet-list layout on Slide 2 ("Standard Form") with a rich two-panel layout:
left panel shows a color-coded formula + three coefficient cards (a / b / c) + a SAT strategy tip;
right panel shows an annotated parabola that syncs highlights to whichever coefficient the teacher is explaining.

## Architecture

A new `StandardFormSlide` component — structurally parallel to `QuadraticIntroSlide` — renders the two-panel layout. It consumes `sceneState.focus` (`'a' | 'b' | 'c' | null`) to drive card and graph highlights. The existing `AnnotatedParabola` is reused via a focus-mapping shim (`'a' → 'dir'`, `'b' → 'axis'`, `'c' → 'std'`), avoiding a duplicate SVG. `SlidePanel` routes to `StandardFormSlide` when `slide.content.variant === 'standard-form'`. Lesson JSON gets `"variant": "standard-form"` on slide 2 and `scene` arrays added to `seg-02a` / `seg-02b`.

## Tech Stack

React 18, TypeScript, Tailwind CSS, existing `AnnotatedParabola` / `IntroFocus` types from `AnnotatedParabola.tsx`.

---

## Components

### `StdFocus` type (exported from `StandardFormSlide.tsx`)

```ts
export type StdFocus = 'a' | 'b' | 'c' | null
```

### `StandardFormSlide` component

**File:** `components/LessonPlayer/StandardFormSlide.tsx`

**Props:**
```ts
type Props = {
  slide: Slide          // for slide.title / slideCount display
  slideCount: number
  sceneState: Record<string, unknown>
}
```

**Focus extraction:** `const focus = (sceneState.focus as StdFocus) ?? null`

**Focus → IntroFocus mapping** (for AnnotatedParabola):
```ts
const FOCUS_MAP: Record<NonNullable<StdFocus>, IntroFocus> = { a: 'dir', b: 'axis', c: 'std' }
const introFocus: IntroFocus = focus ? FOCUS_MAP[focus] : null
```

**Layout:** Two-panel, same proportions as `QuadraticIntroSlide` (left 42%, right flex-1).

#### Left panel content

1. **Formula row** — `f(x) = ax² + bx + c`, each letter in its color  
   (a = indigo-500, b = amber-500, c = emerald-500), full opacity always.

2. **Three coefficient cards** — a-card (indigo tones), b-card (amber tones), c-card (emerald tones):

   | Card | Label | Formula shown | Key facts |
   |------|-------|---------------|-----------|
   | a | Leading Coefficient a | `sign of a → min or max` | a > 0 opens ↑ vertex=min; a < 0 opens ↓ vertex=max; \|a\| large=narrow wide=wide |
   | b | Middle Coefficient b | `x = −b / 2a` | axis of symmetry; vertex x-coord = −b/2a; no direct read |
   | c | Constant c | `f(0) = c` | c = y-intercept, free to read; x=0 all other terms vanish |

3. **SAT strategy tip** (amber/gold block at bottom): "Standard form reveals c instantly. For the vertex or axis, compute x = −b/2a — memorize this formula."

#### Highlight rules

When `focus !== null`, one card is "lit" and the other two are dimmed.

| focus | Lit card | Lit graph elements | Dimmed |
|-------|----------|--------------------|--------|
| `'a'` | a-card (`ring-2 ring-indigo-300 border-indigo-400`) | vertex dot + direction label (via `introFocus='dir'`) | b-card, c-card `opacity-40`; SAT tip `opacity-40` |
| `'b'` | b-card (`ring-2 ring-amber-300 border-amber-400`) | axis dashed line + axis callout (via `introFocus='axis'`) | a-card, c-card `opacity-40`; SAT tip `opacity-40` |
| `'c'` | c-card (`ring-2 ring-emerald-300 border-emerald-400`) | y-intercept dot + callout (via `introFocus='std'`) | a-card, b-card `opacity-40`; SAT tip `opacity-40` |
| `null` | all full opacity | all full opacity | — |

Helper function signatures (same pattern as `QuadraticIntroSlide`):
```ts
function cardCls(match: NonNullable<StdFocus>, activeExtra: string, baseExtra: string): string
function sideCls(match: NonNullable<StdFocus>): string   // for non-card elements (SAT tip)
```

#### Right panel

`<AnnotatedParabola focus={introFocus} />` — no changes to the existing component.

---

## SlidePanel wiring

**File:** `components/LessonPlayer/SlidePanel.tsx`

- Import `StandardFormSlide` from `./StandardFormSlide`
- Add `isStandardForm` detection: `const isStandardForm = slide.content.variant === 'standard-form'`
- In `type` computation: add `isStandardForm` to the `null` guard (same pattern as `isQuadraticIntro`)
- Render `<StandardFormSlide .../>` when `isStandardForm`, passing `slide`, `slideCount`, `sceneState`

---

## Lesson JSON changes

**File:** `data/lessons/sat-math-quadratic-01.json`

### Slide 2 — add variant

```json
"content": {
  "variant": "standard-form",
  ...existing fields preserved...
}
```

### seg-02a — add scene array

`seg-02a` runs 171–245 s. Teacher explains `a` (direction, min/max, width).

```json
"scene": [
  { "at": 171, "state": { "focus": null } },
  { "at": 174, "state": { "focus": "a" } },
  { "at": 244, "state": { "focus": null } }
]
```

### seg-02b — add scene array

`seg-02b` runs 245–605 s. Teacher covers `a < 0`, then `b` (axis formula), then `c` (y-intercept), then transitions to completing the square (which will be on Slide 3).

```json
"scene": [
  { "at": 245, "state": { "focus": null } },
  { "at": 248, "state": { "focus": "a" } },
  { "at": 258, "state": { "focus": "b" } },
  { "at": 268, "state": { "focus": "c" } },
  { "at": 278, "state": { "focus": null } }
]
```

*(Timestamps are estimates matching existing highlight markers; can be adjusted once actual video timing is known.)*

---

## Tests

**File:** `tests/components/StandardFormSlide.test.tsx`

Minimum 10 tests:

1. Renders formula `f(x) = ax² + bx + c`
2. Renders all three coefficient card headings (a, b, c)
3. Renders SAT tip text
4. `focus=null` — no card has `opacity-40`
5. `focus='a'` — a-card has `ring-2`, b-card and c-card have `opacity-40`
6. `focus='a'` — SAT tip has `opacity-40`
7. `focus='b'` — b-card has `ring-2`, a-card and c-card have `opacity-40`
8. `focus='c'` — c-card has `ring-2`, a-card and b-card have `opacity-40`
9. `focus='c'` — SAT tip has `opacity-40`
10. Renders `AnnotatedParabola` (data-testid="annotated-parabola" present)

---

## Out of scope

- Slide 3 ("Completing the Square") wiring — separate task
- Changes to `AnnotatedParabola` internals
- New scene timestamps beyond the estimates above
