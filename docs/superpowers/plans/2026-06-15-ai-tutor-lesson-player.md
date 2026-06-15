# AI Tutor Lesson Player — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js web app delivering a 45-minute SAT Math demo lesson with a three-panel live-style layout: synchronized lecture slides, a ZEGO digital human instructor, and a student webcam view with two live interaction modes.

**Architecture:** A JSON lesson script drives a client-side state machine (`useReducer`) that orchestrates slide advancement, ZEGO pre-recorded video playback (`stream` mode), and ZEGO Streaming Avatar RTC (`live` mode). API Routes serve the lesson JSON and generate ZEGO tokens server-side to protect the AppSecret.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, KaTeX (math rendering), ZEGO Express Engine Web RTC SDK, Jest + @testing-library/react

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json` (via npx)
- Create: `jest.config.ts`
- Create: `jest.setup.ts`
- Create: `tailwind.config.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Scaffold Next.js project**

```bash
cd "/Users/tal/Work/claudecode/ai tutor"
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*" \
  --yes
```

Expected: project files created, `npm run dev` works.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install katex zego-express-engine-webrtc
npm install --save-dev @types/katex
```

- [ ] **Step 3: Install test dependencies**

```bash
npm install --save-dev jest jest-environment-jsdom \
  @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event ts-jest
```

- [ ] **Step 4: Create `jest.config.ts`**

```typescript
import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react-jsx' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
  },
  testMatch: ['**/tests/**/*.test.{ts,tsx}'],
}

export default config
```

- [ ] **Step 5: Create `jest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Create `__mocks__/styleMock.js`**

```javascript
module.exports = {}
```

- [ ] **Step 7: Create `.env.local.example`**

```
ZEGO_APP_ID=your_app_id_here
ZEGO_APP_SECRET=your_app_secret_here
```

Copy to `.env.local` and fill in values when ZEGO API is provided.

- [ ] **Step 8: Create `tests/` directory structure**

```bash
mkdir -p tests/lib tests/components
```

- [ ] **Step 9: Add test script to `package.json`**

Confirm `package.json` has:
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
}
```

- [ ] **Step 10: Verify setup**

```bash
npm run dev
```

Expected: Next.js dev server starts on http://localhost:3000.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with TypeScript, Tailwind, Jest"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `lib/types.ts`
- Create: `tests/lib/types.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/types.test.ts`:

```typescript
import type { Lesson, Slide, StreamSegment, InstructorLiveSegment, PlayerState } from '@/lib/types'

describe('Lesson type shape', () => {
  it('accepts a valid stream segment', () => {
    const seg: StreamSegment = {
      id: 'seg-01',
      type: 'stream',
      startTime: 0,
      duration: 300,
      avatarVideoUrl: '/content/seg-01.mp4',
      slide: { index: 1, highlights: [] },
      script: 'Welcome to quadratic functions.',
    }
    expect(seg.type).toBe('stream')
  })

  it('accepts a valid instructor-initiated live segment', () => {
    const seg: InstructorLiveSegment = {
      id: 'live-01',
      type: 'live',
      mode: 'instructor-initiated',
      trigger: { at: 1080 },
      timeout: 60,
      prompt: 'Does vertex form make sense?',
      slide: { index: 3 },
    }
    expect(seg.mode).toBe('instructor-initiated')
  })

  it('accepts all four player states', () => {
    const states: PlayerState[] = ['IDLE', 'STREAMING', 'LIVE_INSTRUCTOR', 'LIVE_STUDENT']
    expect(states).toHaveLength(4)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/lib/types.test.ts -v
```

Expected: FAIL — `Cannot find module '@/lib/types'`

- [ ] **Step 3: Create `lib/types.ts`**

```typescript
export type GraphSpec = {
  type: 'parabola'
  vertex: [number, number]
  direction: 'up' | 'down'
}

export type SlideContent = {
  formula?: string | null
  bullets?: string[]
  graph?: GraphSpec | null
}

export type Slide = {
  index: number
  title: string
  content: SlideContent
}

export type SlideRef = {
  index: number
  highlights?: string[]
}

export type StreamSegment = {
  id: string
  type: 'stream'
  startTime: number
  duration: number
  avatarVideoUrl: string
  slide: SlideRef
  script: string
}

export type InstructorLiveSegment = {
  id: string
  type: 'live'
  mode: 'instructor-initiated'
  trigger: { at: number }
  timeout: number
  prompt: string
  slide: SlideRef
}

export type Segment = StreamSegment | InstructorLiveSegment

export type Lesson = {
  lessonId: string
  title: string
  totalDuration: number
  maxLiveSeconds: number
  slides: Slide[]
  segments: Segment[]
}

export type PlayerState = 'IDLE' | 'STREAMING' | 'LIVE_INSTRUCTOR' | 'LIVE_STUDENT'

export type LiveMode = 'instructor-initiated' | 'student-initiated'
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/lib/types.test.ts -v
```

Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/types.ts tests/lib/types.test.ts
git commit -m "feat: add TypeScript types for lesson JSON schema and player state"
```

---

## Task 3: Demo Lesson JSON

**Files:**
- Create: `data/lessons/sat-math-quadratic-01.json`
- Create: `public/content/` directory (placeholder for .mp4 files)

- [ ] **Step 1: Create data directory**

```bash
mkdir -p data/lessons
mkdir -p public/content
```

- [ ] **Step 2: Create `data/lessons/sat-math-quadratic-01.json`**

```json
{
  "lessonId": "sat-math-quadratic-01",
  "title": "Quadratic Functions",
  "totalDuration": 2700,
  "maxLiveSeconds": 900,
  "slides": [
    {
      "index": 1,
      "title": "What is a Quadratic Function?",
      "content": {
        "formula": null,
        "bullets": [
          "A function of degree 2: f(x) = ax² + bx + c",
          "The coefficient a must be non-zero (a ≠ 0)",
          "Its graph is always a parabola"
        ],
        "graph": null
      }
    },
    {
      "index": 2,
      "title": "Standard Form",
      "content": {
        "formula": "f(x) = ax^2 + bx + c",
        "bullets": [
          "a > 0: parabola opens upward (minimum)",
          "a < 0: parabola opens downward (maximum)",
          "c is the y-intercept (where x = 0)"
        ],
        "graph": { "type": "parabola", "vertex": [0, -2], "direction": "up" }
      }
    },
    {
      "index": 3,
      "title": "Vertex Form",
      "content": {
        "formula": "f(x) = a(x - h)^2 + k",
        "bullets": [
          "(h, k) is the vertex — the min or max point",
          "Axis of symmetry passes through x = h",
          "SAT loves this form: vertex is read directly"
        ],
        "graph": { "type": "parabola", "vertex": [2, -1], "direction": "up" }
      }
    },
    {
      "index": 4,
      "title": "Graph Anatomy",
      "content": {
        "formula": null,
        "bullets": [
          "Vertex: the single highest or lowest point",
          "Axis of symmetry: vertical line x = h",
          "Roots: where the parabola crosses the x-axis"
        ],
        "graph": { "type": "parabola", "vertex": [1, -3], "direction": "up" }
      }
    },
    {
      "index": 5,
      "title": "SAT Shortcut: Reading the Vertex",
      "content": {
        "formula": "f(x) = 3(x - 4)^2 + 7 \\Rightarrow \\text{vertex} = (4,\\ 7)",
        "bullets": [
          "Vertex (h, k) is read directly — no calculation needed",
          "Watch the sign: (x - 4) means h = +4",
          "This is the #1 SAT quadratic shortcut"
        ],
        "graph": null
      }
    },
    {
      "index": 6,
      "title": "Discriminant and Roots",
      "content": {
        "formula": "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
        "bullets": [
          "b² − 4ac > 0: two distinct real roots",
          "b² − 4ac = 0: one real root (vertex touches x-axis)",
          "b² − 4ac < 0: no real roots (no x-intercepts)"
        ],
        "graph": null
      }
    },
    {
      "index": 7,
      "title": "SAT Question 1",
      "content": {
        "formula": "f(x) = 2(x + 3)^2 - 8",
        "bullets": [
          "What is the minimum value of f(x)?",
          "A) −8     B) −3     C) 3     D) 8"
        ],
        "graph": null
      }
    },
    {
      "index": 8,
      "title": "SAT Q1 — Solution",
      "content": {
        "formula": "f(x) = 2(x + 3)^2 - 8 \\Rightarrow \\text{vertex} = (-3,\\ -8)",
        "bullets": [
          "Vertex form → vertex = (h, k) = (−3, −8) directly",
          "Since a = 2 > 0, the parabola opens up → vertex is the minimum",
          "Minimum value = k = −8   ✓   Answer: A"
        ],
        "graph": null
      }
    },
    {
      "index": 9,
      "title": "SAT Question 2",
      "content": {
        "formula": "f(x) = x^2 - 6x + 5",
        "bullets": [
          "What is the equation of the axis of symmetry?",
          "A) x = −6     B) x = 3     C) x = 5     D) x = 6"
        ],
        "graph": null
      }
    },
    {
      "index": 10,
      "title": "SAT Q2 — Solution",
      "content": {
        "formula": "x = \\frac{-b}{2a} = \\frac{-(-6)}{2(1)} = 3",
        "bullets": [
          "Use the axis of symmetry formula: x = −b / 2a",
          "a = 1, b = −6 → x = 6/2 = 3",
          "Check: f(x) = (x − 3)² − 4, vertex at x = 3   ✓   Answer: B"
        ],
        "graph": null
      }
    },
    {
      "index": 11,
      "title": "SAT Question 3 — Word Problem",
      "content": {
        "formula": "h(t) = -16t^2 + 80t + 6",
        "bullets": [
          "A ball is thrown up. Height h (ft) at time t (sec).",
          "What is the maximum height reached?",
          "Hint: the vertex gives the maximum"
        ],
        "graph": { "type": "parabola", "vertex": [2.5, 106], "direction": "down" }
      }
    },
    {
      "index": 12,
      "title": "Summary & Practice",
      "content": {
        "formula": null,
        "bullets": [
          "✓ Standard form: f(x) = ax² + bx + c",
          "✓ Vertex form: f(x) = a(x − h)² + k, vertex = (h, k)",
          "✓ Axis of symmetry: x = h  or  x = −b / 2a",
          "Practice: convert y = x² − 4x + 7 to vertex form"
        ],
        "graph": null
      }
    }
  ],
  "segments": [
    {
      "id": "seg-01",
      "type": "stream",
      "startTime": 0,
      "duration": 300,
      "avatarVideoUrl": "/content/seg-01.mp4",
      "slide": { "index": 1, "highlights": [] },
      "script": "Welcome to today's SAT Math lesson on quadratic functions. A quadratic function is any function of the form f of x equals ax squared plus bx plus c, where a is not zero. The graph of any quadratic is always a parabola — that classic U-shape. Let's start by understanding the two main forms you'll see on the SAT."
    },
    {
      "id": "seg-02",
      "type": "stream",
      "startTime": 300,
      "duration": 480,
      "avatarVideoUrl": "/content/seg-02.mp4",
      "slide": { "index": 2, "highlights": [] },
      "script": "First, the standard form: f of x equals ax squared plus bx plus c. The sign of a tells you which way the parabola opens — positive a means it opens upward and has a minimum, negative a means it opens downward and has a maximum. The constant c is simply the y-intercept."
    },
    {
      "id": "seg-03",
      "type": "stream",
      "startTime": 780,
      "duration": 300,
      "avatarVideoUrl": "/content/seg-03.mp4",
      "slide": { "index": 3, "highlights": [] },
      "script": "Now the vertex form — this is the SAT's favorite. f of x equals a times the quantity x minus h, squared, plus k. The point h comma k is the vertex: the minimum if a is positive, the maximum if negative. The axis of symmetry is the vertical line x equals h. The key SAT shortcut: you can read the vertex directly from the equation without any calculation."
    },
    {
      "id": "seg-04",
      "type": "stream",
      "startTime": 1080,
      "duration": 180,
      "avatarVideoUrl": "/content/seg-04.mp4",
      "slide": { "index": 4, "highlights": [] },
      "script": "Let's look at the graph anatomy. The vertex is the single turning point of the parabola. The axis of symmetry is a vertical line through the vertex that divides the parabola into two mirror images. The roots — or zeros — are where the parabola crosses the x-axis."
    },
    {
      "id": "seg-05",
      "type": "stream",
      "startTime": 1260,
      "duration": 180,
      "avatarVideoUrl": "/content/seg-05.mp4",
      "slide": { "index": 5, "highlights": [] },
      "script": "Here's the shortcut in action. If you see f of x equals 3 times x minus 4 squared plus 7, you can immediately say: the vertex is at 4 comma 7. No algebra needed. Watch the sign carefully — x minus 4 means h equals positive 4, not negative 4. This comes up all the time on the SAT."
    },
    {
      "id": "live-01",
      "type": "live",
      "mode": "instructor-initiated",
      "trigger": { "at": 1440 },
      "timeout": 240,
      "prompt": "Does vertex form make sense so far? Any questions about reading the vertex directly from the equation?",
      "slide": { "index": 5 }
    },
    {
      "id": "seg-06",
      "type": "stream",
      "startTime": 1440,
      "duration": 240,
      "avatarVideoUrl": "/content/seg-06.mp4",
      "slide": { "index": 6, "highlights": [] },
      "script": "Before we get to the real SAT questions, let's briefly cover the discriminant. The quadratic formula gives us the roots of ax squared plus bx plus c equals zero. The expression under the square root, b squared minus 4ac, is the discriminant. If it's positive, two real roots. If it's zero, exactly one root — the vertex sits on the x-axis. If it's negative, no real roots — the parabola never crosses the x-axis."
    },
    {
      "id": "seg-07",
      "type": "stream",
      "startTime": 1680,
      "duration": 180,
      "avatarVideoUrl": "/content/seg-07.mp4",
      "slide": { "index": 7, "highlights": [] },
      "script": "Now let's tackle three actual SAT-style questions. Question 1: Given f of x equals 2 times x plus 3 squared minus 8, what is the minimum value of f? Take a moment to think before I walk through the solution."
    },
    {
      "id": "seg-08",
      "type": "stream",
      "startTime": 1860,
      "duration": 240,
      "avatarVideoUrl": "/content/seg-08.mp4",
      "slide": { "index": 8, "highlights": [] },
      "script": "The equation is already in vertex form. The vertex is h comma k — here, h equals negative 3 and k equals negative 8. Since a equals 2 is positive, the parabola opens upward, so the vertex is the minimum. The minimum value is k equals negative 8. Answer A."
    },
    {
      "id": "seg-09",
      "type": "stream",
      "startTime": 2100,
      "duration": 180,
      "avatarVideoUrl": "/content/seg-09.mp4",
      "slide": { "index": 9, "highlights": [] },
      "script": "Question 2: For f of x equals x squared minus 6x plus 5, what is the axis of symmetry? This one is in standard form, so we have a choice — use the axis formula or complete the square."
    },
    {
      "id": "seg-10",
      "type": "stream",
      "startTime": 2280,
      "duration": 240,
      "avatarVideoUrl": "/content/seg-10.mp4",
      "slide": { "index": 10, "highlights": [] },
      "script": "Using the formula: axis of symmetry equals negative b over 2a. Here a equals 1 and b equals negative 6. So x equals negative negative 6 divided by 2 times 1, which is 6 over 2, equals 3. You can verify by completing the square: x squared minus 6x plus 5 equals x minus 3 squared minus 4, confirming the vertex is at x equals 3. Answer B."
    },
    {
      "id": "seg-11",
      "type": "stream",
      "startTime": 2520,
      "duration": 180,
      "avatarVideoUrl": "/content/seg-11.mp4",
      "slide": { "index": 11, "highlights": [] },
      "script": "Question 3, a word problem: h of t equals negative 16t squared plus 80t plus 6 models the height in feet of a ball at time t seconds. What is the maximum height? Remember, for a downward-opening parabola, the vertex gives the maximum."
    },
    {
      "id": "live-02",
      "type": "live",
      "mode": "instructor-initiated",
      "trigger": { "at": 2700 },
      "timeout": 420,
      "prompt": "That's our lesson on quadratic functions. Any final questions? I'll also give you a practice problem to try on your own.",
      "slide": { "index": 12 }
    }
  ]
}
```

- [ ] **Step 3: Add `.gitignore` entry for generated mp4 files**

Append to `.gitignore`:
```
public/content/*.mp4
.env.local
```

- [ ] **Step 4: Commit**

```bash
git add data/lessons/sat-math-quadratic-01.json .gitignore
git commit -m "feat: add demo lesson JSON — Quadratic Functions (12 slides, 5 segments)"
```

---

## Task 4: Live Quota Tracker

**Files:**
- Create: `lib/quota.ts`
- Create: `tests/lib/quota.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/quota.test.ts`:

```typescript
import {
  createQuota,
  consumeQuota,
  isQuotaExhausted,
  getRemainingSeconds,
} from '@/lib/quota'

describe('quota tracker', () => {
  it('creates quota with full budget', () => {
    const q = createQuota(900)
    expect(getRemainingSeconds(q)).toBe(900)
    expect(isQuotaExhausted(q)).toBe(false)
  })

  it('consumes seconds from the budget', () => {
    const q = createQuota(900)
    const q2 = consumeQuota(q, 120)
    expect(getRemainingSeconds(q2)).toBe(780)
  })

  it('is exhausted when remaining is zero', () => {
    const q = createQuota(60)
    const q2 = consumeQuota(q, 60)
    expect(isQuotaExhausted(q2)).toBe(true)
  })

  it('clamps remaining to zero, never negative', () => {
    const q = createQuota(30)
    const q2 = consumeQuota(q, 999)
    expect(getRemainingSeconds(q2)).toBe(0)
    expect(isQuotaExhausted(q2)).toBe(true)
  })

  it('is immutable — original quota unchanged after consume', () => {
    const q = createQuota(900)
    consumeQuota(q, 100)
    expect(getRemainingSeconds(q)).toBe(900)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/lib/quota.test.ts -v
```

Expected: FAIL — `Cannot find module '@/lib/quota'`

- [ ] **Step 3: Create `lib/quota.ts`**

```typescript
export type Quota = { maxSeconds: number; usedSeconds: number }

export function createQuota(maxSeconds: number): Quota {
  return { maxSeconds, usedSeconds: 0 }
}

export function consumeQuota(quota: Quota, seconds: number): Quota {
  return {
    maxSeconds: quota.maxSeconds,
    usedSeconds: Math.min(quota.maxSeconds, quota.usedSeconds + seconds),
  }
}

export function getRemainingSeconds(quota: Quota): number {
  return quota.maxSeconds - quota.usedSeconds
}

export function isQuotaExhausted(quota: Quota): boolean {
  return quota.usedSeconds >= quota.maxSeconds
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/lib/quota.test.ts -v
```

Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/quota.ts tests/lib/quota.test.ts
git commit -m "feat: add live quota tracker (pure functions, immutable)"
```

---

## Task 5: Timeline Engine

**Files:**
- Create: `lib/use-timeline.ts`
- Create: `tests/lib/use-timeline.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/lib/use-timeline.test.ts`:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useTimeline } from '@/lib/use-timeline'
import type { Lesson } from '@/lib/types'

const mockLesson: Lesson = {
  lessonId: 'test-lesson',
  title: 'Test',
  totalDuration: 600,
  maxLiveSeconds: 120,
  slides: [
    { index: 1, title: 'Slide 1', content: { bullets: ['a'] } },
    { index: 2, title: 'Slide 2', content: { bullets: ['b'] } },
  ],
  segments: [
    {
      id: 'seg-01',
      type: 'stream',
      startTime: 0,
      duration: 300,
      avatarVideoUrl: '/seg-01.mp4',
      slide: { index: 1, highlights: [] },
      script: 'Hello',
    },
    {
      id: 'live-01',
      type: 'live',
      mode: 'instructor-initiated',
      trigger: { at: 300 },
      timeout: 60,
      prompt: 'Any questions?',
      slide: { index: 1 },
    },
    {
      id: 'seg-02',
      type: 'stream',
      startTime: 300,
      duration: 300,
      avatarVideoUrl: '/seg-02.mp4',
      slide: { index: 2, highlights: [] },
      script: 'More content',
    },
  ],
}

describe('useTimeline', () => {
  it('starts in IDLE state', () => {
    const { result } = renderHook(() => useTimeline(null))
    expect(result.current.playerState).toBe('IDLE')
  })

  it('transitions to STREAMING when lesson loads', () => {
    const { result } = renderHook(() => useTimeline(mockLesson))
    expect(result.current.playerState).toBe('STREAMING')
  })

  it('returns correct current segment for elapsed time', () => {
    const { result } = renderHook(() => useTimeline(mockLesson))
    act(() => result.current.setElapsed(100))
    expect(result.current.currentSegment?.id).toBe('seg-01')
  })

  it('returns correct current slide index', () => {
    const { result } = renderHook(() => useTimeline(mockLesson))
    act(() => result.current.setElapsed(100))
    expect(result.current.currentSlideIndex).toBe(1)
  })

  it('transitions to LIVE_INSTRUCTOR when trigger time is reached', () => {
    const { result } = renderHook(() => useTimeline(mockLesson))
    act(() => result.current.setElapsed(300))
    expect(result.current.playerState).toBe('LIVE_INSTRUCTOR')
  })

  it('transitions to LIVE_STUDENT when student raises hand', () => {
    const { result } = renderHook(() => useTimeline(mockLesson))
    act(() => result.current.setElapsed(50))
    act(() => result.current.raiseHand())
    expect(result.current.playerState).toBe('LIVE_STUDENT')
  })

  it('returns to STREAMING after endLive', () => {
    const { result } = renderHook(() => useTimeline(mockLesson))
    act(() => result.current.setElapsed(300))
    expect(result.current.playerState).toBe('LIVE_INSTRUCTOR')
    act(() => result.current.endLive(45))
    expect(result.current.playerState).toBe('STREAMING')
  })

  it('tracks live quota after endLive', () => {
    const { result } = renderHook(() => useTimeline(mockLesson))
    act(() => result.current.setElapsed(300))
    act(() => result.current.endLive(45))
    expect(result.current.quotaRemainingSeconds).toBe(75)
  })

  it('disables raise hand when quota is exhausted', () => {
    const { result } = renderHook(() => useTimeline(mockLesson))
    act(() => result.current.setElapsed(300))
    act(() => result.current.endLive(120))
    expect(result.current.canRaiseHand).toBe(false)
  })

  it('skips instructor-initiated live segments when quota exhausted', () => {
    const { result } = renderHook(() => useTimeline(mockLesson))
    act(() => result.current.setElapsed(300))
    act(() => result.current.endLive(120))
    // trigger at 300 should have been consumed; still STREAMING now
    act(() => result.current.setElapsed(300))
    expect(result.current.playerState).toBe('STREAMING')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/lib/use-timeline.test.ts -v
```

Expected: FAIL — `Cannot find module '@/lib/use-timeline'`

- [ ] **Step 3: Create `lib/use-timeline.ts`**

```typescript
import { useReducer, useCallback, useRef, useEffect } from 'react'
import type { Lesson, Segment, StreamSegment, InstructorLiveSegment, PlayerState } from '@/lib/types'
import { createQuota, consumeQuota, getRemainingSeconds, isQuotaExhausted } from '@/lib/quota'
import type { Quota } from '@/lib/quota'

type State = {
  playerState: PlayerState
  elapsed: number
  quota: Quota
  skippedLiveIds: Set<string>
  streamPausePoint: number
  activeLiveSegId: string | null
}

type Action =
  | { type: 'SET_ELAPSED'; elapsed: number }
  | { type: 'TRIGGER_INSTRUCTOR_LIVE'; segId: string }
  | { type: 'RAISE_HAND' }
  | { type: 'END_LIVE'; liveDurationSeconds: number }

function getStreamSegmentAt(segments: Segment[], elapsed: number): StreamSegment | null {
  for (const seg of segments) {
    if (seg.type !== 'stream') continue
    if (elapsed >= seg.startTime && elapsed < seg.startTime + seg.duration) return seg
  }
  return null
}

function getLiveTriggerAt(
  segments: Segment[],
  elapsed: number,
  skipped: Set<string>
): InstructorLiveSegment | null {
  for (const seg of segments) {
    if (seg.type !== 'live' || seg.mode !== 'instructor-initiated') continue
    if (skipped.has(seg.id)) continue
    if (elapsed >= seg.trigger.at) return seg
  }
  return null
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ELAPSED':
      return { ...state, elapsed: action.elapsed }

    case 'TRIGGER_INSTRUCTOR_LIVE':
      // Add segment to skippedLiveIds so it never re-triggers; record as active
      return {
        ...state,
        playerState: 'LIVE_INSTRUCTOR',
        activeLiveSegId: action.segId,
        skippedLiveIds: new Set([...state.skippedLiveIds, action.segId]),
      }

    case 'RAISE_HAND':
      if (state.playerState !== 'STREAMING') return state
      if (isQuotaExhausted(state.quota)) return state
      return { ...state, playerState: 'LIVE_STUDENT', streamPausePoint: state.elapsed }

    case 'END_LIVE':
      if (state.playerState !== 'LIVE_INSTRUCTOR' && state.playerState !== 'LIVE_STUDENT') return state
      return {
        ...state,
        playerState: 'STREAMING',
        activeLiveSegId: null,
        quota: consumeQuota(state.quota, action.liveDurationSeconds),
      }

    default:
      return state
  }
}

export function useTimeline(lesson: Lesson | null) {
  const initialState: State = {
    playerState: lesson ? 'STREAMING' : 'IDLE',
    elapsed: 0,
    quota: createQuota(lesson?.maxLiveSeconds ?? 0),
    skippedLiveIds: new Set(),
    streamPausePoint: 0,
    activeLiveSegId: null,
  }

  const [state, dispatch] = useReducer(reducer, initialState)

  // useRef avoids stale closures in setElapsed without re-creating the callback
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  const setElapsed = useCallback((elapsed: number) => {
    if (!lesson) return
    dispatch({ type: 'SET_ELAPSED', elapsed })
    const s = stateRef.current
    if (s.playerState === 'STREAMING' && !isQuotaExhausted(s.quota)) {
      const liveSeg = getLiveTriggerAt(lesson.segments, elapsed, s.skippedLiveIds)
      if (liveSeg) dispatch({ type: 'TRIGGER_INSTRUCTOR_LIVE', segId: liveSeg.id })
    }
  }, [lesson])

  const raiseHand = useCallback(() => dispatch({ type: 'RAISE_HAND' }), [])
  const endLive = useCallback(
    (secs: number) => dispatch({ type: 'END_LIVE', liveDurationSeconds: secs }),
    []
  )

  const currentSegment = lesson ? getStreamSegmentAt(lesson.segments, state.elapsed) : null

  const activeLiveSeg =
    lesson && state.playerState === 'LIVE_INSTRUCTOR' && state.activeLiveSegId
      ? (lesson.segments.find(
          (s): s is InstructorLiveSegment =>
            s.type === 'live' &&
            s.mode === 'instructor-initiated' &&
            s.id === state.activeLiveSegId
        ) ?? null)
      : null

  const currentSlideIndex: number =
    activeLiveSeg?.slide.index ?? currentSegment?.slide.index ?? 1

  return {
    playerState: state.playerState,
    currentSegment,
    currentSlideIndex,
    activeLiveSeg,
    elapsed: state.elapsed,
    quotaRemainingSeconds: getRemainingSeconds(state.quota),
    canRaiseHand: !isQuotaExhausted(state.quota) && state.playerState === 'STREAMING',
    setElapsed,
    raiseHand,
    endLive,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest tests/lib/use-timeline.test.ts -v
```

Expected: PASS — 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/use-timeline.ts tests/lib/use-timeline.test.ts
git commit -m "feat: add timeline engine state machine (useTimeline hook)"
```

---

## Task 6: Lesson API Route

**Files:**
- Create: `app/api/lesson/[id]/route.ts`

- [ ] **Step 1: Create route file**

```typescript
// app/api/lesson/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'lessons', `${params.id}.json`)
    const raw = await readFile(filePath, 'utf-8')
    const lesson = JSON.parse(raw)
    return NextResponse.json(lesson)
  } catch {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }
}
```

- [ ] **Step 2: Verify manually**

```bash
npm run dev
# In another terminal:
curl http://localhost:3000/api/lesson/sat-math-quadratic-01 | head -c 200
```

Expected: JSON output starting with `{"lessonId":"sat-math-quadratic-01",...`

- [ ] **Step 3: Commit**

```bash
git add app/api/lesson/
git commit -m "feat: add GET /api/lesson/[id] route"
```

---

## Task 7: ZEGO Token API Route

**Files:**
- Create: `app/api/zego/token/route.ts`
- Create: `lib/zego-server.ts`

> **Note:** This task requires `ZEGO_APP_ID` and `ZEGO_APP_SECRET` in `.env.local`. When those are provided, replace the stub in `lib/zego-server.ts` with the real ZEGO server SDK call. The interface and route structure remain unchanged.

- [ ] **Step 1: Create `lib/zego-server.ts` (stub until ZEGO API provided)**

```typescript
// Stub implementation — replace generateZegoToken body with real ZEGO Server SDK call
// when ZEGO_APP_ID and ZEGO_APP_SECRET are available.

export type ZegoTokenParams = {
  appId: number
  userId: string
  roomId: string
  secret: string
  ttl: number
}

export function generateZegoToken(_params: ZegoTokenParams): string {
  // TODO: replace with actual ZEGO token generation
  // e.g. import { generateToken04 } from 'zego-token'
  // return generateToken04(params.appId, params.userId, params.secret, params.ttl, '')
  return `stub-token-${_params.userId}-${_params.roomId}-${Date.now()}`
}
```

- [ ] **Step 2: Create `app/api/zego/token/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateZegoToken } from '@/lib/zego-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  const userId = searchParams.get('userId')

  if (!roomId || !userId) {
    return NextResponse.json({ error: 'roomId and userId are required' }, { status: 400 })
  }

  const appId = parseInt(process.env.ZEGO_APP_ID ?? '0')
  const secret = process.env.ZEGO_APP_SECRET ?? ''

  if (!appId || !secret) {
    return NextResponse.json({ error: 'ZEGO credentials not configured' }, { status: 500 })
  }

  const token = generateZegoToken({ appId, userId, roomId, secret, ttl: 3600 })
  return NextResponse.json({ token, appId })
}
```

- [ ] **Step 3: Verify manually**

```bash
curl "http://localhost:3000/api/zego/token?roomId=lesson-test&userId=student-1"
```

Expected: `{"error":"ZEGO credentials not configured"}` (until `.env.local` is filled)
Once `.env.local` has real values: `{"token":"...","appId":...}`

- [ ] **Step 4: Commit**

```bash
git add app/api/zego/ lib/zego-server.ts
git commit -m "feat: add GET /api/zego/token route with stub token generator"
```

---

## Task 8: ZEGO RTC Client Wrapper

**Files:**
- Create: `lib/zego-rtc.ts`

> **Note:** The interface is final. The `MockZegoRTC` stub lets the UI be built and tested immediately. When ZEGO API credentials are provided, implement `RealZegoRTC` against the `ZegoRTC` interface and swap it in.

- [ ] **Step 1: Create `lib/zego-rtc.ts`**

```typescript
export type ZegoRTCConfig = {
  appId: number
  token: string
  roomId: string
  userId: string
  localVideoEl: HTMLVideoElement
}

export interface ZegoRTC {
  joinRoom(config: ZegoRTCConfig): Promise<void>
  leaveRoom(): Promise<void>
  muteLocalAudio(muted: boolean): void
  muteLocalVideo(muted: boolean): void
}

export class MockZegoRTC implements ZegoRTC {
  async joinRoom(config: ZegoRTCConfig): Promise<void> {
    console.log('[MockZegoRTC] joinRoom', config.roomId, config.userId)
    // Simulate attaching local camera to the video element
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      config.localVideoEl.srcObject = stream
      config.localVideoEl.play().catch(() => {})
    } catch {
      console.warn('[MockZegoRTC] Camera not available')
    }
  }

  async leaveRoom(): Promise<void> {
    console.log('[MockZegoRTC] leaveRoom')
  }

  muteLocalAudio(muted: boolean): void {
    console.log('[MockZegoRTC] muteLocalAudio', muted)
  }

  muteLocalVideo(muted: boolean): void {
    console.log('[MockZegoRTC] muteLocalVideo', muted)
  }
}

// Swap to RealZegoRTC once ZEGO API is provided
export const zegoRTC: ZegoRTC = new MockZegoRTC()
```

- [ ] **Step 2: Commit**

```bash
git add lib/zego-rtc.ts
git commit -m "feat: add ZegoRTC interface and MockZegoRTC stub"
```

---

## Task 9: TopBar Component

**Files:**
- Create: `components/LessonPlayer/TopBar.tsx`

- [ ] **Step 1: Create `components/LessonPlayer/TopBar.tsx`**

```tsx
type TopBarProps = {
  title: string
  isLive: boolean
  watcherCount?: number
}

export function TopBar({ title, isLive, watcherCount }: TopBarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 h-10 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 bg-indigo-500 rounded flex items-center justify-center text-white text-xs font-bold">
          S
        </div>
        <span className="text-sm font-semibold text-slate-800">{title}</span>
      </div>
      {isLive && (
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-500 text-xs font-bold tracking-widest">LIVE</span>
          {watcherCount !== undefined && (
            <span className="text-slate-400 text-xs ml-1">{watcherCount} watching</span>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/LessonPlayer/TopBar.tsx
git commit -m "feat: add TopBar component with LIVE indicator"
```

---

## Task 10: SlidePanel Component

**Files:**
- Create: `components/LessonPlayer/SlidePanel.tsx`
- Create: `components/LessonPlayer/ParabolaGraph.tsx`
- Create: `tests/components/SlidePanel.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `tests/components/SlidePanel.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import { SlidePanel } from '@/components/LessonPlayer/SlidePanel'
import type { Slide } from '@/lib/types'

const slideWithFormula: Slide = {
  index: 3,
  title: 'Vertex Form',
  content: {
    formula: 'f(x) = a(x - h)^2 + k',
    bullets: ['(h, k) is the vertex', 'Axis of symmetry: x = h'],
    graph: null,
  },
}

const slideWithBulletsOnly: Slide = {
  index: 1,
  title: 'What is a Quadratic?',
  content: {
    formula: null,
    bullets: ['Degree 2 polynomial', 'Graph is a parabola'],
    graph: null,
  },
}

describe('SlidePanel', () => {
  it('renders slide title', () => {
    render(<SlidePanel slide={slideWithBulletsOnly} slideCount={12} highlights={[]} />)
    expect(screen.getByText('What is a Quadratic?')).toBeInTheDocument()
  })

  it('renders bullet points', () => {
    render(<SlidePanel slide={slideWithBulletsOnly} slideCount={12} highlights={[]} />)
    expect(screen.getByText('Degree 2 polynomial')).toBeInTheDocument()
    expect(screen.getByText('Graph is a parabola')).toBeInTheDocument()
  })

  it('renders slide counter', () => {
    render(<SlidePanel slide={slideWithFormula} slideCount={12} highlights={[]} />)
    expect(screen.getByText('3 / 12')).toBeInTheDocument()
  })

  it('renders formula container when formula is provided', () => {
    const { container } = render(
      <SlidePanel slide={slideWithFormula} slideCount={12} highlights={[]} />
    )
    expect(container.querySelector('.formula-block')).toBeInTheDocument()
  })

  it('does not render formula block when formula is null', () => {
    const { container } = render(
      <SlidePanel slide={slideWithBulletsOnly} slideCount={12} highlights={[]} />
    )
    expect(container.querySelector('.formula-block')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest tests/components/SlidePanel.test.tsx -v
```

Expected: FAIL — `Cannot find module '@/components/LessonPlayer/SlidePanel'`

- [ ] **Step 3: Create `components/LessonPlayer/ParabolaGraph.tsx`**

```tsx
import type { GraphSpec } from '@/lib/types'

type Props = { spec: GraphSpec; width?: number; height?: number }

export function ParabolaGraph({ spec, width = 280, height = 160 }: Props) {
  const { vertex, direction } = spec
  const [h, k] = vertex
  const a = direction === 'up' ? 1 : -1

  // Map graph coords to SVG coords
  const cx = width / 2
  const cy = height / 2
  const scale = Math.min(width, height) / 8

  function toSVG(x: number, y: number): [number, number] {
    return [cx + (x - h) * scale, cy - (y - k) * scale]
  }

  const points: string[] = []
  for (let i = -5; i <= 5; i += 0.2) {
    const x = h + i
    const y = k + a * i * i
    const [sx, sy] = toSVG(x, y)
    points.push(`${sx},${sy}`)
  }
  const pathD = `M ${points[0]} L ${points.slice(1).join(' L ')}`

  const [vx, vy] = toSVG(h, k)
  const [axisTop] = [toSVG(h, k + 5)]
  const [axisBot] = [toSVG(h, k - 5)]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Axes */}
      <line x1={0} y1={cy} x2={width} y2={cy} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={cx} y1={0} x2={cx} y2={height} stroke="#e2e8f0" strokeWidth={1} />
      {/* Axis of symmetry */}
      <line
        x1={vx} y1={axisTop[1]} x2={axisBot[0]} y2={axisBot[1]}
        stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7}
      />
      {/* Parabola */}
      <path d={pathD} stroke="#6366f1" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      {/* Vertex */}
      <circle cx={vx} cy={vy} r={4} fill="#f59e0b" />
      <text x={vx + 6} y={vy - 4} fill="#b45309" fontSize={9} fontFamily="monospace">
        vertex
      </text>
    </svg>
  )
}
```

- [ ] **Step 4: Create `components/LessonPlayer/SlidePanel.tsx`**

```tsx
'use client'
import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { Slide } from '@/lib/types'
import { ParabolaGraph } from './ParabolaGraph'

type Props = {
  slide: Slide
  slideCount: number
  highlights: string[]
}

function KaTeXSpan({ formula }: { formula: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    katex.render(formula, ref.current, { throwOnError: false, displayMode: true })
  }, [formula])
  return <span ref={ref} />
}

export function SlidePanel({ slide, slideCount, highlights: _highlights }: Props) {
  const { title, content, index } = slide

  return (
    <div className="flex-1 flex flex-col min-h-0 p-3">
      {/* 4:3 container */}
      <div
        className="w-full bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden"
        style={{ aspectRatio: '4/3' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <span className="text-xs text-slate-300">{index} / {slideCount}</span>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-col gap-3 p-5 overflow-hidden">
          {/* Formula */}
          {content.formula && (
            <div className="formula-block bg-indigo-50 border-l-4 border-indigo-500 px-4 py-3 rounded-r-md">
              <KaTeXSpan formula={content.formula} />
            </div>
          )}

          {/* Graph */}
          {content.graph && (
            <div className="flex justify-center bg-gray-50 border border-gray-100 rounded-md py-2">
              <ParabolaGraph spec={content.graph} />
            </div>
          )}

          {/* Bullets */}
          {content.bullets && content.bullets.length > 0 && (
            <ul className="space-y-2 flex-1">
              {content.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700 leading-snug">
                  <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest tests/components/SlidePanel.test.tsx -v
```

Expected: PASS — 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/LessonPlayer/SlidePanel.tsx \
        components/LessonPlayer/ParabolaGraph.tsx \
        tests/components/SlidePanel.test.tsx
git commit -m "feat: add SlidePanel (4:3, KaTeX formulas, parabola SVG graphs)"
```

---

## Task 11: AvatarPanel Component

**Files:**
- Create: `components/LessonPlayer/AvatarPanel.tsx`

- [ ] **Step 1: Create `components/LessonPlayer/AvatarPanel.tsx`**

```tsx
'use client'
import { useRef, useEffect } from 'react'
import type { PlayerState } from '@/lib/types'

type Props = {
  avatarVideoUrl: string | null
  playerState: PlayerState
  instructorName: string
  elapsed: number
  onVideoTimeUpdate?: (currentTime: number) => void
}

export function AvatarPanel({
  avatarVideoUrl,
  playerState,
  instructorName,
  elapsed,
  onVideoTimeUpdate,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (playerState === 'STREAMING' && avatarVideoUrl) {
      if (video.paused) video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [playerState, avatarVideoUrl])

  const isSpeaking = playerState === 'STREAMING' || playerState === 'LIVE_INSTRUCTOR'

  return (
    <div className="flex-1 relative overflow-hidden bg-[#e8dfd4]">
      {/* Avatar video (stream mode) */}
      {avatarVideoUrl && (
        <video
          ref={videoRef}
          src={avatarVideoUrl}
          className="w-full h-full object-cover object-top"
          playsInline
          onTimeUpdate={() => onVideoTimeUpdate?.(videoRef.current?.currentTime ?? 0)}
        />
      )}

      {/* Live mode overlay */}
      {(playerState === 'LIVE_INSTRUCTOR' || playerState === 'LIVE_STUDENT') && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
            LIVE
          </div>
        </div>
      )}

      {/* Name strip */}
      <div className="absolute bottom-0 left-0 right-0 bg-white/88 backdrop-blur-sm px-2 py-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-800">{instructorName}</span>
        {isSpeaking && (
          <div className="flex gap-0.5 items-end h-3">
            {[4, 9, 6, 10, 5].map((h, i) => (
              <div
                key={i}
                className="w-0.5 bg-indigo-500 rounded-sm"
                style={{ height: `${h}px`, opacity: 0.5 + i * 0.1 }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/LessonPlayer/AvatarPanel.tsx
git commit -m "feat: add AvatarPanel component (stream video + live overlay)"
```

---

## Task 12: StudentPanel Component

**Files:**
- Create: `components/LessonPlayer/StudentPanel.tsx`

- [ ] **Step 1: Create `components/LessonPlayer/StudentPanel.tsx`**

```tsx
'use client'
import { useRef, useEffect, useState } from 'react'
import type { PlayerState } from '@/lib/types'

type Props = {
  playerState: PlayerState
  studentName: string
  canRaiseHand: boolean
  quotaExhausted: boolean
  onRaiseHand: () => void
  onMicToggle: (muted: boolean) => void
  onCameraToggle: (off: boolean) => void
}

export function StudentPanel({
  playerState,
  studentName,
  canRaiseHand,
  quotaExhausted,
  onRaiseHand,
  onMicToggle,
  onCameraToggle,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [micMuted, setMicMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [volume] = useState(80)

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
      .catch(() => {})
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((t) => t.stop())
      }
    }
  }, [])

  const isLive = playerState === 'LIVE_INSTRUCTOR' || playerState === 'LIVE_STUDENT'

  return (
    <div className="flex-1 relative overflow-hidden bg-slate-700">
      <video
        ref={videoRef}
        className="w-full h-full object-cover object-top"
        playsInline
        muted
      />

      {/* Quota exhausted notice */}
      {quotaExhausted && (
        <div className="absolute top-2 left-0 right-0 flex justify-center">
          <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
            本节课互动时间已用完
          </span>
        </div>
      )}

      {/* Name strip */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-2 py-0.5">
        <span className="text-white text-xs font-medium">{studentName}</span>
      </div>

      {/* Overlaid vertical buttons */}
      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
        <button
          onClick={onRaiseHand}
          disabled={!canRaiseHand || isLive}
          title="提问"
          className="w-7 h-7 bg-white/90 rounded-md flex items-center justify-center text-sm shadow disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
        >
          ✋
        </button>
        <button
          onClick={() => { setMicMuted((v) => { onMicToggle(!v); return !v }) }}
          title={micMuted ? '取消静音' : '静音'}
          className={`w-7 h-7 rounded-md flex items-center justify-center text-sm shadow transition-colors ${micMuted ? 'bg-red-100/90' : 'bg-white/85 hover:bg-white'}`}
        >
          🎤
        </button>
        <button
          onClick={() => { setCameraOff((v) => { onCameraToggle(!v); return !v }) }}
          title={cameraOff ? '开启摄像头' : '关闭摄像头'}
          className={`w-7 h-7 rounded-md flex items-center justify-center text-sm shadow transition-colors ${cameraOff ? 'bg-red-100/90' : 'bg-white/85 hover:bg-white'}`}
        >
          📷
        </button>
        <button
          title={`音量 ${volume}%`}
          className="w-7 h-7 bg-white/85 rounded-md flex items-center justify-center text-sm shadow hover:bg-white transition-colors"
        >
          🔊
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/LessonPlayer/StudentPanel.tsx
git commit -m "feat: add StudentPanel (webcam preview, overlay buttons, quota notice)"
```

---

## Task 13: LiveControls Overlay

**Files:**
- Create: `components/LessonPlayer/LiveControls.tsx`

- [ ] **Step 1: Create `components/LessonPlayer/LiveControls.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'
import type { PlayerState } from '@/lib/types'

type Props = {
  playerState: PlayerState
  timeout?: number
  prompt?: string
  onEnd: (liveDurationSeconds: number) => void
}

export function LiveControls({ playerState, timeout, prompt, onEnd }: Props) {
  const [startedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (playerState !== 'LIVE_INSTRUCTOR' && playerState !== 'LIVE_STUDENT') return
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - startedAt) / 1000)
      setElapsed(secs)
      if (timeout && secs >= timeout) {
        onEnd(secs)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [playerState, timeout, startedAt, onEnd])

  if (playerState !== 'LIVE_INSTRUCTOR' && playerState !== 'LIVE_STUDENT') return null

  const isInstructor = playerState === 'LIVE_INSTRUCTOR'
  const buttonLabel = isInstructor ? '结束回答' : '结束提问'

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
      {prompt && isInstructor && (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md max-w-xs text-center">
          <p className="text-sm text-slate-700">{prompt}</p>
        </div>
      )}
      <div className="flex items-center gap-3">
        {timeout && (
          <span className="text-xs text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
            {timeout - elapsed}s
          </span>
        )}
        <button
          onClick={() => onEnd(elapsed)}
          className="bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-full shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/LessonPlayer/LiveControls.tsx
git commit -m "feat: add LiveControls overlay (结束回答/提问 + countdown)"
```

---

## Task 14: LessonPlayer Assembly

**Files:**
- Create: `components/LessonPlayer/index.tsx`

- [ ] **Step 1: Create `components/LessonPlayer/index.tsx`**

```tsx
'use client'
import type { Lesson } from '@/lib/types'
import { useTimeline } from '@/lib/use-timeline'
import { TopBar } from './TopBar'
import { SlidePanel } from './SlidePanel'
import { AvatarPanel } from './AvatarPanel'
import { StudentPanel } from './StudentPanel'
import { LiveControls } from './LiveControls'

type Props = {
  lesson: Lesson
  studentName?: string
  instructorName?: string
}

export function LessonPlayer({
  lesson,
  studentName = 'Student',
  instructorName = 'Ms. Emily Chen',
}: Props) {
  const {
    playerState,
    currentSegment,
    currentSlideIndex,
    activeLiveSeg,
    quotaRemainingSeconds,
    canRaiseHand,
    setElapsed,
    raiseHand,
    endLive,
  } = useTimeline(lesson)

  const currentSlide = lesson.slides.find((s) => s.index === currentSlideIndex)
  const currentSlideRef = currentSegment?.type === 'stream' ? currentSegment.slide : null

  if (!currentSlide) return null

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <TopBar title={lesson.title} isLive watcherCount={128} />

      <div className="flex flex-1 min-h-0">
        {/* Left 70%: lecture notes */}
        <div className="w-[70%] border-r border-gray-200 bg-white flex flex-col">
          <SlidePanel
            slide={currentSlide}
            slideCount={lesson.slides.length}
            highlights={currentSlideRef?.highlights ?? []}
          />
        </div>

        {/* Right 30%: instructor + student */}
        <div className="w-[30%] flex flex-col relative">
          {/* Top 50%: avatar */}
          <div className="h-1/2 border-b border-gray-200 flex flex-col">
            <AvatarPanel
              avatarVideoUrl={
                currentSegment?.type === 'stream' ? currentSegment.avatarVideoUrl : null
              }
              playerState={playerState}
              instructorName={instructorName}
              elapsed={0}
              onVideoTimeUpdate={setElapsed}
            />
          </div>

          {/* Bottom 50%: student */}
          <div className="h-1/2 flex flex-col">
            <StudentPanel
              playerState={playerState}
              studentName={studentName}
              canRaiseHand={canRaiseHand}
              quotaExhausted={quotaRemainingSeconds === 0}
              onRaiseHand={raiseHand}
              onMicToggle={() => {}}
              onCameraToggle={() => {}}
            />
          </div>

          {/* Live controls overlay */}
          <LiveControls
            playerState={playerState}
            timeout={activeLiveSeg?.timeout}
            prompt={activeLiveSeg?.prompt}
            onEnd={endLive}
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/LessonPlayer/index.tsx
git commit -m "feat: assemble LessonPlayer — wires timeline, slides, avatar, student, live controls"
```

---

## Task 15: Lesson Page Route

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/lesson/[id]/page.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Update `app/layout.tsx` to remove default styles that conflict**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Tutor — SAT Math',
  description: 'AI-powered SAT Math tutoring with digital human instructor',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-slate-900 antialiased">{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: Update `app/page.tsx` to redirect to demo lesson**

```tsx
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/lesson/sat-math-quadratic-01')
}
```

- [ ] **Step 3: Create `app/lesson/[id]/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { LessonPlayer } from '@/components/LessonPlayer'
import type { Lesson } from '@/lib/types'

async function getLesson(id: string): Promise<Lesson | null> {
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
    const res = await fetch(`${base}/api/lesson/${id}`, { cache: 'no-store' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export default async function LessonPage({ params }: { params: { id: string } }) {
  const lesson = await getLesson(params.id)
  if (!lesson) notFound()
  return <LessonPlayer lesson={lesson} />
}
```

- [ ] **Step 4: Run and verify the full page loads**

```bash
npm run dev
# Open http://localhost:3000 in browser
```

Expected: Three-panel layout with white background, LIVE badge in top bar, lecture notes on left (4:3 slide with content), instructor and student panels on right.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/page.tsx app/lesson/
git commit -m "feat: add lesson page route — full three-panel player renders demo lesson"
```

---

## Task 16: Content Generation Scripts

**Files:**
- Create: `scripts/generate-lesson.js`
- Create: `scripts/generate-avatar.js`

> **Note:** `generate-lesson.js` requires `ANTHROPIC_API_KEY` in `.env.local`. `generate-avatar.js` requires ZEGO Avatar API credentials (to be provided).

- [ ] **Step 1: Add `ANTHROPIC_API_KEY` to `.env.local.example`**

Append:
```
ANTHROPIC_API_KEY=your_anthropic_key_here
```

- [ ] **Step 2: Install Anthropic SDK**

```bash
npm install @anthropic-ai/sdk
```

- [ ] **Step 3: Create `scripts/generate-lesson.js`**

```javascript
#!/usr/bin/env node
/**
 * Generates a lesson JSON bundle (slides + avatar scripts) from a topic.
 * Usage: node scripts/generate-lesson.js --topic "Quadratic Functions" --output data/lessons/new-lesson.json
 */
import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync } from 'fs'
import { parseArgs } from 'util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    topic: { type: 'string' },
    output: { type: 'string' },
  },
})

if (!values.topic || !values.output) {
  console.error('Usage: node scripts/generate-lesson.js --topic "..." --output path/to/output.json')
  process.exit(1)
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are an expert SAT Math curriculum designer. You produce lesson JSON bundles.
Each bundle contains:
- 12 slides (each with title, formula (LaTeX or null), bullets, graph spec or null)
- 5 stream segments (each with startTime, duration, avatarVideoUrl placeholder, slide ref, and script)
- 2 instructor-initiated live segments (at ~24 min and ~38 min marks)
The digital human's spoken script and the slide content must be tightly coordinated.
Output ONLY valid JSON matching this schema, no markdown, no explanation.`

const USER_PROMPT = `Generate a complete 45-minute SAT Math lesson on the topic: "${values.topic}".
Use lessonId format: sat-math-${values.topic.toLowerCase().replace(/\s+/g, '-')}-01
Set maxLiveSeconds to 900.
Avatar video URLs should follow pattern: /content/seg-01.mp4, /content/seg-02.mp4 etc.`

async function main() {
  console.log(`Generating lesson: ${values.topic}...`)

  const message = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: USER_PROMPT }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('No JSON found in response')
    process.exit(1)
  }

  const lesson = JSON.parse(jsonMatch[0])
  writeFileSync(values.output, JSON.stringify(lesson, null, 2), 'utf-8')
  console.log(`Lesson saved to ${values.output}`)
  console.log(`Segments: ${lesson.segments.length}, Slides: ${lesson.slides.length}`)
}

main().catch(console.error)
```

- [ ] **Step 4: Create `scripts/generate-avatar.js`**

```javascript
#!/usr/bin/env node
/**
 * Generates avatar .mp4 files for each stream segment in a lesson JSON.
 * Usage: node scripts/generate-avatar.js --lesson data/lessons/lesson.json --output public/content/
 *
 * STUB: Replace the generateVideoForSegment function body with the real ZEGO Avatar API call
 * when ZEGO API credentials are available.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'
import { parseArgs } from 'util'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    lesson: { type: 'string' },
    output: { type: 'string' },
  },
})

if (!values.lesson || !values.output) {
  console.error('Usage: node scripts/generate-avatar.js --lesson path/to/lesson.json --output public/content/')
  process.exit(1)
}

const lesson = JSON.parse(readFileSync(values.lesson, 'utf-8'))
mkdirSync(values.output, { recursive: true })

/**
 * STUB — replace with real ZEGO Avatar API call.
 * Expected: calls ZEGO API with script text, returns mp4 buffer.
 */
async function generateVideoForSegment(script, outputPath) {
  // TODO: Replace with actual ZEGO Avatar API integration:
  // const response = await fetch('https://aieffects-api.zego.im/...', {
  //   method: 'POST',
  //   headers: { 'AppId': process.env.ZEGO_APP_ID, 'ServerSecret': process.env.ZEGO_APP_SECRET },
  //   body: JSON.stringify({ text: script, avatarId: '...' }),
  // })
  // const buffer = await response.arrayBuffer()
  // writeFileSync(outputPath, Buffer.from(buffer))
  console.log(`  [STUB] Would generate video for: "${script.slice(0, 60)}..."`)
  console.log(`  [STUB] Output path: ${outputPath}`)
  // Write a placeholder file so the lesson JSON references are not broken
  writeFileSync(outputPath, '', 'utf-8')
}

async function main() {
  const streamSegs = lesson.segments.filter((s) => s.type === 'stream')
  console.log(`Generating ${streamSegs.length} avatar videos...`)

  for (const seg of streamSegs) {
    const filename = seg.avatarVideoUrl.split('/').pop()
    const outputPath = join(values.output, filename)
    process.stdout.write(`  ${seg.id}... `)
    await generateVideoForSegment(seg.script, outputPath)
    console.log('done')
  }

  console.log('\nAll videos generated.')
}

main().catch(console.error)
```

- [ ] **Step 5: Make scripts executable**

```bash
chmod +x scripts/generate-lesson.js scripts/generate-avatar.js
```

- [ ] **Step 6: Add scripts section to `package.json`**

Add to `"scripts"` in `package.json`:
```json
"generate:lesson": "node --experimental-vm-modules scripts/generate-lesson.js",
"generate:avatar": "node --experimental-vm-modules scripts/generate-avatar.js"
```

- [ ] **Step 7: Commit**

```bash
git add scripts/ package.json .env.local.example
git commit -m "feat: add content generation scripts (Claude API → lesson JSON, ZEGO stub → mp4)"
```

---

## Task 17: Error Handling and Polish

**Files:**
- Create: `components/Toast.tsx`
- Modify: `components/LessonPlayer/index.tsx`
- Modify: `components/LessonPlayer/AvatarPanel.tsx`

- [ ] **Step 1: Create `components/Toast.tsx`**

```tsx
'use client'
import { useEffect, useState } from 'react'

type Props = {
  message: string
  onDismiss: () => void
  durationMs?: number
}

export function Toast({ message, onDismiss, durationMs = 3000 }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDismiss() }, durationMs)
    return () => clearTimeout(t)
  }, [durationMs, onDismiss])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-xl">
      {message}
    </div>
  )
}
```

- [ ] **Step 2: Add error state + toast to `components/LessonPlayer/index.tsx`**

Add these imports at the top:
```tsx
import { useState } from 'react'
import { Toast } from '@/components/Toast'
```

Add state:
```tsx
const [toast, setToast] = useState<string | null>(null)
```

Add after `</div>` closing the main layout div (before the final closing `</div>`):
```tsx
{toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
```

Add to `onMicToggle` and `onCameraToggle` props on `StudentPanel` to wire future error reporting:
```tsx
onMicToggle={(muted) => { if (muted) setToast('Microphone muted') }}
onCameraToggle={(off) => { if (off) setToast('Camera off') }}
```

- [ ] **Step 3: Add video error fallback to `AvatarPanel.tsx`**

Add `onError` to the `<video>` element:
```tsx
onError={() => console.warn('[AvatarPanel] Video failed to load:', avatarVideoUrl)}
```

- [ ] **Step 4: Run full test suite**

```bash
npm test
```

Expected: All tests pass. No type errors.

- [ ] **Step 5: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 6: Final commit**

```bash
git add components/Toast.tsx components/LessonPlayer/index.tsx components/LessonPlayer/AvatarPanel.tsx
git commit -m "feat: add Toast error component and error handling to lesson player"
```

---

## ZEGO API Integration Checklist

When ZEGO API credentials are provided, complete these steps:

- [ ] Add `ZEGO_APP_ID` and `ZEGO_APP_SECRET` to `.env.local`
- [ ] Install ZEGO token SDK: `npm install zego-token` (or whichever package ZEGO provides for server-side token generation)
- [ ] Replace stub body in `lib/zego-server.ts` `generateZegoToken` with real ZEGO token generation
- [ ] Install ZEGO RTC SDK: `npm install zego-express-engine-webrtc`
- [ ] Implement `RealZegoRTC` class in `lib/zego-rtc.ts` implementing the `ZegoRTC` interface
- [ ] Swap `MockZegoRTC` for `RealZegoRTC` in the `zegoRTC` export
- [ ] Test live mode end-to-end: instructor-initiated trigger → live mode → end live → resume stream
- [ ] Add `ZEGO_APP_ID` etc. to `scripts/generate-avatar.js` and implement `generateVideoForSegment`
- [ ] Run `npm run generate:avatar -- --lesson data/lessons/sat-math-quadratic-01.json --output public/content/` to generate real mp4 files
