# Slide 1 — Quadratic Intro: Enriched Layout Design

**Date:** 2026-06-22  
**Status:** Approved

---

## Problem

Slide 1 ("What is a Quadratic Function?") covers ~3 minutes of teacher content across two segments (seg-01a, seg-01b), but the current slide has only 3 plain-text bullets, no formula, and no graph. The teacher covers: definition, standard form, vertex form, what each form reveals, direction/min-max, axis of symmetry, and roots. Nothing visual supports any of this.

---

## Approved Design

**Two-panel layout** (left 40% / right 60%):

### Left panel
1. **Standard Form card** — `f(x) = ax² + bx + c` with chip: "y-intercept = c"
2. **Vertex Form card** — `f(x) = a(x − h)² + k` with chip: "vertex = (h, k)"
3. **Three fact rows:**
   - Direction: `a > 0` opens ↑ (min), `a < 0` opens ↓ (max)
   - Axis of symmetry: `x = h` or `x = −b/2a`
   - Roots: where `f(x) = 0` — can be 2, 1, or 0 real solutions
4. **SAT tip strip** (bottom): "SAT gives you one form, asks about the other — identify the form first"

### Right panel
Annotated SVG parabola with four floating callout labels:
- **Vertex** (amber dot, top): "vertex (h, k) — min or max"
- **Axis of symmetry** (dashed amber line): "x = h"
- **y-intercept** (green dot, on y-axis): "y-intercept = c"
- **Roots** (indigo dots, on x-axis): "roots / zeros"

### Scene-driven highlighting
A `focus` key in `sceneState` lights up the relevant region; everything else dims to 30% opacity. Values: `null` (all visible), `"std"`, `"vtx"`, `"dir"`, `"axis"`, `"roots"`.

Highlight rules per focus value:

| `focus` | Left lit | Right callouts lit |
|---------|----------|--------------------|
| `"std"` | Standard Form card | y-intercept label |
| `"vtx"` | Vertex Form card | vertex + axis labels |
| `"dir"` | Direction fact row | vertex label |
| `"axis"` | Axis fact row | axis label |
| `"roots"` | Roots fact row | roots label |

---

## Implementation Plan

### 1. New slide variant: `"quadratic-intro"`

Add to `sat-math-quadratic-01.json`, slide index 1:
```json
"content": {
  "variant": "quadratic-intro",
  "bullets": [
    "A function of degree 2: f(x) = ax² + bx + c",
    "The coefficient a must be non-zero (a ≠ 0)",
    "Its graph is always a parabola"
  ]
}
```
The `bullets` array is kept for type compatibility but the `QuadraticIntroSlide` component does not render it — all content is hardcoded in the component.

### 2. New component: `QuadraticIntroSlide`

File: `components/LessonPlayer/QuadraticIntroSlide.tsx`

- Left panel: two `FormCard` sub-components + three `FactRow` sub-components + SAT tip
- Right panel: `AnnotatedParabola` SVG component
- Reads `sceneState.focus` to apply highlight/dim CSS classes

### 3. New component: `AnnotatedParabola`

File: `components/LessonPlayer/AnnotatedParabola.tsx`

- Static SVG of an upward-opening parabola with axes
- Four absolutely-positioned callout `<div>`s overlaid
- Props: `focus: string | null` — controls `.lit` / `.dim` class on each callout

### 4. Wire into `SlidePanel.tsx`

In `SlideCard`, add case alongside existing variants:
```tsx
{variant === 'quadratic-intro' && (
  <QuadraticIntroSlide slide={slide} slideCount={slideCount} sceneState={sceneState} />
)}
```

### 5. Add scene states to lesson JSON

**seg-01a** (0–87s) — teacher script timing (timestamps are estimates from the transcript; adjust after listening to the audio):
```json
"scene": [
  { "at": 0,  "state": { "focus": null } },
  { "at": 5,  "state": { "focus": "std" } },
  { "at": 22, "state": { "focus": "vtx" } },
  { "at": 38, "state": { "focus": null } }
]
```

**seg-01b** (87–171s):
```json
"scene": [
  { "at": 88,  "state": { "focus": "dir" } },
  { "at": 100, "state": { "focus": "axis" } },
  { "at": 112, "state": { "focus": "roots" } },
  { "at": 125, "state": { "focus": null } }
]
```

---

## Out of Scope

- No changes to any other slide
- No changes to timeline/audio
- No new interactive elements (click/hover on graph is cosmetic only in the demo; the real slide is teacher-driven via scene state)
