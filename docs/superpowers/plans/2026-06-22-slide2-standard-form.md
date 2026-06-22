# Slide 2 Standard Form Enrichment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic bullet-list layout on Slide 2 with a rich two-panel coefficient-cards layout that syncs graph highlights to `sceneState.focus`.

**Architecture:** New `StandardFormSlide` component (parallel to `QuadraticIntroSlide`) renders a formula row + three coefficient cards (a/b/c) + SAT tip on the left, and `AnnotatedParabola` on the right. A focus-mapping shim converts `StdFocus ('a'|'b'|'c'|null)` to the existing `IntroFocus` enum so the graph reuses the existing component without changes. `SlidePanel` gets a one-line variant guard; the lesson JSON gets `"variant": "standard-form"` and two scene arrays.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Jest + @testing-library/react, existing `AnnotatedParabola` / `IntroFocus` from `components/LessonPlayer/AnnotatedParabola.tsx`.

---

## File map

| Action | Path |
|--------|------|
| Create | `components/LessonPlayer/StandardFormSlide.tsx` |
| Create | `tests/components/StandardFormSlide.test.tsx` |
| Modify | `components/LessonPlayer/SlidePanel.tsx` (3 lines) |
| Modify | `data/lessons/sat-math-quadratic-01.json` (slide 2 variant + scene arrays) |

---

## Task 1: `StandardFormSlide` component

**Files:**
- Create: `components/LessonPlayer/StandardFormSlide.tsx`
- Test: `tests/components/StandardFormSlide.test.tsx`

### Step 1.1: Write the failing tests

- [ ] Create `tests/components/StandardFormSlide.test.tsx` with this content:

```tsx
import { render, screen } from '@testing-library/react'
import { StandardFormSlide } from '@/components/LessonPlayer/StandardFormSlide'
import type { Slide } from '@/lib/types'

const slide: Slide = {
  index: 2,
  title: 'Standard Form',
  content: { variant: 'standard-form', bullets: [] },
}

describe('StandardFormSlide', () => {
  it('renders the slide title', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByText('Standard Form')).toBeInTheDocument()
  })

  it('renders all three coefficient cards', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByTestId('card-a')).toBeInTheDocument()
    expect(screen.getByTestId('card-b')).toBeInTheDocument()
    expect(screen.getByTestId('card-c')).toBeInTheDocument()
  })

  it('renders the SAT tip', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByTestId('sat-tip')).toBeInTheDocument()
  })

  it('renders the annotated parabola', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByTestId('annotated-parabola')).toBeInTheDocument()
  })

  it('dims nothing when sceneState is empty', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByTestId('card-a').className).not.toMatch(/opacity-40/)
    expect(screen.getByTestId('card-b').className).not.toMatch(/opacity-40/)
    expect(screen.getByTestId('card-c').className).not.toMatch(/opacity-40/)
    expect(screen.getByTestId('sat-tip').className).not.toMatch(/opacity-40/)
  })

  it('lights a-card and dims b, c, SAT when focus is a', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{ focus: 'a' }} />)
    expect(screen.getByTestId('card-a').className).toMatch(/border-indigo-400/)
    expect(screen.getByTestId('card-b').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('card-c').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('sat-tip').className).toMatch(/opacity-40/)
  })

  it('lights b-card and dims a, c, SAT when focus is b', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{ focus: 'b' }} />)
    expect(screen.getByTestId('card-b').className).toMatch(/border-amber-400/)
    expect(screen.getByTestId('card-a').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('card-c').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('sat-tip').className).toMatch(/opacity-40/)
  })

  it('lights c-card and dims a, b, SAT when focus is c', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{ focus: 'c' }} />)
    expect(screen.getByTestId('card-c').className).toMatch(/border-emerald-400/)
    expect(screen.getByTestId('card-a').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('card-b').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('sat-tip').className).toMatch(/opacity-40/)
  })

  it('lit card does not have opacity-40', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{ focus: 'a' }} />)
    expect(screen.getByTestId('card-a').className).not.toMatch(/opacity-40/)
  })

  it('SAT tip text mentions memorize', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByText(/memorize this formula/i)).toBeInTheDocument()
  })
})
```

### Step 1.2: Run tests to confirm they fail

- [ ] Run: `npm test -- --testPathPattern=StandardFormSlide --no-coverage 2>&1 | tail -20`
- [ ] Expected: FAIL — "Cannot find module '@/components/LessonPlayer/StandardFormSlide'"

### Step 1.3: Create the component

- [ ] Create `components/LessonPlayer/StandardFormSlide.tsx` with this content:

```tsx
'use client'
import type { Slide } from '@/lib/types'
import { AnnotatedParabola, type IntroFocus } from './AnnotatedParabola'

export type StdFocus = 'a' | 'b' | 'c' | null

const FOCUS_MAP: Record<NonNullable<StdFocus>, IntroFocus> = { a: 'dir', b: 'axis', c: 'std' }

type Props = {
  slide: Slide
  slideCount: number
  sceneState: Record<string, unknown>
}

export function StandardFormSlide({ slide, slideCount, sceneState }: Props) {
  const focus = (sceneState.focus as StdFocus) ?? null
  const introFocus: IntroFocus = focus ? FOCUS_MAP[focus] : null

  function cardCls(match: NonNullable<StdFocus>, activeExtra: string, baseExtra: string): string {
    if (focus === null) return baseExtra
    if (focus === match) return `${baseExtra} ${activeExtra}`
    return `${baseExtra} opacity-40`
  }

  const satCls = focus !== null
    ? 'mt-auto bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 rounded-xl p-3 transition-all duration-200 opacity-40'
    : 'mt-auto bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 rounded-xl p-3 transition-all duration-200'

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-white/60 text-[11px] font-extrabold tracking-widest uppercase shrink-0">CONCEPT</span>
          <h2 className="text-base font-bold text-white truncate">{slide.title}</h2>
        </div>
        <span className="text-white/50 text-xs shrink-0 ml-3">{slide.index} / {slideCount}</span>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left panel */}
        <div className="w-[42%] flex flex-col gap-2 p-3 border-r border-slate-100 bg-white overflow-y-auto">

          {/* Formula row */}
          <div className="font-serif text-[15px] font-bold text-center py-2 border-b border-slate-100 text-slate-800">
            f(x) = <span className="text-indigo-500">a</span>x²{' '}
            + <span className="text-amber-500">b</span>x{' '}
            + <span className="text-emerald-500">c</span>
          </div>

          {/* a card */}
          <div
            data-testid="card-a"
            className={cardCls(
              'a',
              'border-indigo-400 ring-2 ring-indigo-300',
              'rounded-xl p-3 border-2 transition-all duration-200 bg-indigo-50 border-indigo-200'
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-extrabold text-indigo-600 tracking-widest uppercase">Leading Coefficient  a</span>
              <span className="text-[9.5px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">direction &amp; shape</span>
            </div>
            <div className="font-serif text-[13px] font-bold text-indigo-800 mb-2">sign of a → min or max</div>
            <div className="flex flex-col gap-1">
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                <span><strong>a &gt; 0</strong> — opens ↑, vertex is minimum</span>
              </div>
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                <span><strong>a &lt; 0</strong> — opens ↓, vertex is maximum</span>
              </div>
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                <span>|a| larger → narrower; |a| smaller → wider</span>
              </div>
            </div>
          </div>

          {/* b card */}
          <div
            data-testid="card-b"
            className={cardCls(
              'b',
              'border-amber-400 ring-2 ring-amber-300',
              'rounded-xl p-3 border-2 transition-all duration-200 bg-amber-50 border-amber-200'
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-extrabold text-amber-700 tracking-widest uppercase">Middle Coefficient  b</span>
              <span className="text-[9.5px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">axis of symmetry</span>
            </div>
            <div className="font-serif text-[13px] font-bold text-amber-800 mb-2">x = −b / 2a</div>
            <div className="flex flex-col gap-1">
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                <span>axis of symmetry: <strong>x = −b/2a</strong></span>
              </div>
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                <span>vertex x-coord = −b/2a, then plug in for y</span>
              </div>
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                <span>no direct value you can read off</span>
              </div>
            </div>
          </div>

          {/* c card */}
          <div
            data-testid="card-c"
            className={cardCls(
              'c',
              'border-emerald-400 ring-2 ring-emerald-300',
              'rounded-xl p-3 border-2 transition-all duration-200 bg-emerald-50 border-emerald-200'
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-extrabold text-emerald-700 tracking-widest uppercase">Constant  c</span>
              <span className="text-[9.5px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">y-intercept = c</span>
            </div>
            <div className="font-serif text-[13px] font-bold text-emerald-800 mb-2">f(0) = c</div>
            <div className="flex flex-col gap-1">
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span><strong>c</strong> is the y-intercept — free to read</span>
              </div>
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>set x = 0, all other terms vanish</span>
              </div>
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>parabola crosses y-axis at (0, c)</span>
              </div>
            </div>
          </div>

          {/* SAT tip */}
          <div data-testid="sat-tip" className={satCls}>
            <div className="text-[9px] font-extrabold text-amber-800 tracking-widest uppercase mb-1">⭐ SAT Strategy</div>
            <p className="text-[11.5px] text-amber-900 leading-snug">
              Standard form reveals c instantly. For the vertex or axis, compute x = −b/2a — memorize this formula.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-50/40">
          <AnnotatedParabola focus={introFocus} />
        </div>
      </div>
    </>
  )
}
```

### Step 1.4: Run tests and verify they pass

- [ ] Run: `npm test -- --testPathPattern=StandardFormSlide --no-coverage 2>&1 | tail -20`
- [ ] Expected: PASS — 10 tests pass

### Step 1.5: Commit

- [ ] Run:
```bash
git add components/LessonPlayer/StandardFormSlide.tsx tests/components/StandardFormSlide.test.tsx
git commit -m "feat: add StandardFormSlide component with a/b/c focus highlighting"
```

---

## Task 2: Wire `StandardFormSlide` into `SlidePanel`

**Files:**
- Modify: `components/LessonPlayer/SlidePanel.tsx` (lines 10, 705–711)

### Step 2.1: Write the failing test

There is no dedicated test for SlidePanel variant routing — verify by running the full test suite and checking nothing is broken, then add one targeted test.

- [ ] Add the following test to `tests/components/SlidePanel.test.tsx` (append inside the existing `describe` block):

First, check how existing SlidePanel tests are structured:
```bash
grep -n "describe\|it(\|test(" tests/components/SlidePanel.test.tsx | head -20
```

Then append this test — look for the last `it(` block and add after it:

```tsx
it('renders StandardFormSlide for standard-form variant', () => {
  const sfSlide: Slide = {
    index: 2,
    title: 'Standard Form',
    content: { variant: 'standard-form', bullets: [] },
  }
  render(
    <SlidePanel
      slide={sfSlide}
      slideCount={12}
      highlights={[]}
      sceneState={{}}
      annotations={[]}
    />
  )
  expect(screen.getByTestId('annotated-parabola')).toBeInTheDocument()
})
```

### Step 2.2: Run test to confirm it fails

- [ ] Run: `npm test -- --testPathPattern=SlidePanel --no-coverage 2>&1 | tail -20`
- [ ] Expected: FAIL — `standard-form` variant falls through to `ConceptSlide`, no `annotated-parabola` found

### Step 2.3: Add import and variant guard in `SlidePanel.tsx`

- [ ] In `components/LessonPlayer/SlidePanel.tsx`, add the import after line 10 (after the `QuadraticIntroSlide` import):

```tsx
import { StandardFormSlide } from './StandardFormSlide'
```

- [ ] Replace lines 705–711 (the `SlideCard` variant block):

**Before:**
```tsx
  const isCover = slide.content.variant === 'cover'
  const isQuadraticIntro = slide.content.variant === 'quadratic-intro'
  const type = (isCover || isQuadraticIntro) ? null : detectSlideType(slide.title)
  return (
    <div className={className} style={style}>
      {isCover           && <CoverSlide          slide={slide} slideCount={slideCount} highlights={highlights} />}
      {isQuadraticIntro  && <QuadraticIntroSlide  slide={slide} slideCount={slideCount} sceneState={sceneState} />}
```

**After:**
```tsx
  const isCover = slide.content.variant === 'cover'
  const isQuadraticIntro = slide.content.variant === 'quadratic-intro'
  const isStandardForm = slide.content.variant === 'standard-form'
  const type = (isCover || isQuadraticIntro || isStandardForm) ? null : detectSlideType(slide.title)
  return (
    <div className={className} style={style}>
      {isCover           && <CoverSlide          slide={slide} slideCount={slideCount} highlights={highlights} />}
      {isQuadraticIntro  && <QuadraticIntroSlide  slide={slide} slideCount={slideCount} sceneState={sceneState} />}
      {isStandardForm    && <StandardFormSlide    slide={slide} slideCount={slideCount} sceneState={sceneState} />}
```

### Step 2.4: Run all tests and verify they pass

- [ ] Run: `npm test --no-coverage 2>&1 | tail -25`
- [ ] Expected: All tests pass (count increases by 1 from previous run)

### Step 2.5: Commit

- [ ] Run:
```bash
git add components/LessonPlayer/SlidePanel.tsx tests/components/SlidePanel.test.tsx
git commit -m "feat: route standard-form variant to StandardFormSlide in SlidePanel"
```

---

## Task 3: Update lesson JSON — add variant and scene events

**Files:**
- Modify: `data/lessons/sat-math-quadratic-01.json`

No tests for JSON data — verify visually in the running app.

### Step 3.1: Add `"variant": "standard-form"` to slide 2

- [ ] In `data/lessons/sat-math-quadratic-01.json`, find the slide with `"index": 2` and add the variant inside `"content"`:

**Before:**
```json
{
  "index": 2,
  "title": "Standard Form",
  "content": {
    "formula": "f(x) = ...",
```

**After:**
```json
{
  "index": 2,
  "title": "Standard Form",
  "content": {
    "variant": "standard-form",
    "formula": "f(x) = ...",
```

### Step 3.2: Add scene array to `seg-02a`

`seg-02a` runs 171–245 s. The teacher explains the `a` coefficient (direction, min/max, width).

- [ ] Find `"id": "seg-02a"` in the JSON and add a `"scene"` array inside `"slide"`:

**Before:**
```json
"slide": {
  "index": 2,
  "highlights": [
    { "text": "a > 0: parabola opens upward (minimum)", "at": 174 }
  ],
  "annotations": [...]
}
```

**After:**
```json
"slide": {
  "index": 2,
  "highlights": [
    { "text": "a > 0: parabola opens upward (minimum)", "at": 174 }
  ],
  "scene": [
    { "at": 171, "state": { "focus": null } },
    { "at": 174, "state": { "focus": "a" } },
    { "at": 244, "state": { "focus": null } }
  ],
  "annotations": [...]
}
```

### Step 3.3: Add scene array to `seg-02b`

`seg-02b` runs 245–605 s. The teacher covers `a < 0`, then `b` (axis formula), then `c` (y-intercept), then transitions to completing-the-square content (Slide 3).

- [ ] Find `"id": "seg-02b"` in the JSON and add a `"scene"` array inside `"slide"`:

**Before:**
```json
"slide": {
  "index": 2,
  "highlights": [
    { "text": "a < 0: parabola opens downward (maximum)", "at": 248 },
    { "text": "c is the y-intercept (where x = 0)", "at": 254 }
  ],
  "annotations": [...]
}
```

**After:**
```json
"slide": {
  "index": 2,
  "highlights": [
    { "text": "a < 0: parabola opens downward (maximum)", "at": 248 },
    { "text": "c is the y-intercept (where x = 0)", "at": 254 }
  ],
  "scene": [
    { "at": 245, "state": { "focus": null } },
    { "at": 248, "state": { "focus": "a" } },
    { "at": 258, "state": { "focus": "b" } },
    { "at": 268, "state": { "focus": "c" } },
    { "at": 278, "state": { "focus": null } }
  ],
  "annotations": [...]
}
```

### Step 3.4: Run TypeScript check

- [ ] Run: `npx tsc --noEmit 2>&1 | tail -20`
- [ ] Expected: No errors

### Step 3.5: Run full test suite

- [ ] Run: `npm test --no-coverage 2>&1 | tail -10`
- [ ] Expected: All tests pass

### Step 3.6: Commit

- [ ] Run:
```bash
git add data/lessons/sat-math-quadratic-01.json
git commit -m "feat: wire standard-form variant and scene events in lesson JSON"
```
