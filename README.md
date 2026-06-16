# AI Tutor — SAT Math Demo

A web-based AI tutor featuring a digital human instructor, pre-recorded lecture content, and live RTC interaction. Built with Next.js.

## What It Does

Three-panel layout:
- **Left 70%** — slide panel with KaTeX formulas, interactive visualizations, and animated diagrams
- **Top-right 15%** — digital human avatar (pre-recorded video + live AIGC stream)
- **Bottom-right 15%** — student webcam with mic/camera/volume controls and live quota timer

The lesson is driven by a JSON timeline. Pre-recorded segments play automatically; at configured trigger points the instructor avatar switches to a live AI conversation (OmniRTC + AIGC `avatarchat`).

---

## Quick Start

```bash
npm install
cp .env.local.example .env.local   # fill in OMNIRTC_TOKEN
npm run dev
```

Open [http://localhost:3000/lesson/sat-math-quadratic-01](http://localhost:3000/lesson/sat-math-quadratic-01).

**DEV shortcuts** (bottom-left corner in development):
- `DEV: Jump to Live` — skip to the first live interaction trigger
- `DEV: End Live` — exit live mode immediately

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OMNIRTC_TOKEN` | Yes (live mode) | Pre-issued OmniRTC core token (type 7). Get from OmniRTC dashboard. |
| `ANTHROPIC_API_KEY` | Content gen only | Used by `generate-lesson.mjs` to draft lesson JSON via Claude API. |

---

## Routes

| Route | Description |
|-------|-------------|
| `/lesson/[lessonId]` | Full lesson player |
| `/slides` | Standalone slide viewer with auto-narration |
| `/api/rtc/token` | GET — returns `{ token }` from `OMNIRTC_TOKEN` env var |

---

## Project Structure

```
app/
  lesson/[lessonId]/        lesson player page
  slides/                   standalone slide viewer
  api/rtc/token/            RTC token endpoint

components/LessonPlayer/
  index.tsx                 root component, wires all panels
  SlidePanel.tsx            renders slides (concept / question / solution / cover)
  AvatarPanel.tsx           instructor video (pre-recorded + live OmniRTC stream)
  StudentPanel.tsx          student webcam, controls, live quota countdown
  LiveControls.tsx          live session overlay (countdown, end button, text input)
  TopBar.tsx
  ParabolaGraph.tsx         SVG parabola with vertex/axis highlights
  InteractiveParabola.tsx   slider-based vertex form explorer
  DiscriminantViz.tsx       discriminant slider visualization
  CompletingSquare.tsx      animated completing-the-square walkthrough

lib/
  use-timeline.ts           timeline state machine (STREAMING / LIVE_INSTRUCTOR / LIVE_STUDENT)
  use-live-session.ts       OmniRTC lifecycle: join, publish, AIGC, cleanup
  quota.ts                  live session quota tracking
  types.ts                  shared TypeScript types

data/lessons/
  sat-math-quadratic-01.json    lesson content, segments, scripts

public/content/
  seg-xx.txt                narration scripts (one per stream segment)
  seg-xx.mp4                avatar videos (generate via pipeline below)
  timeline.md               full lesson timeline with interaction design notes

scripts/
  generate-lesson.mjs       draft lesson JSON from a topic via Claude API
  generate-avatar.mjs       stub for batch avatar video generation
```

---

## Lesson JSON Format

```jsonc
{
  "lessonId": "sat-math-quadratic-01",
  "title": "...",
  "totalDuration": 2700,
  "maxLiveSeconds": 900,        // total live quota across all interactions
  "slides": [ ... ],
  "segments": [
    {
      "id": "seg-01",
      "type": "stream",
      "startTime": 0,
      "duration": 300,
      "avatarVideoUrl": "/content/seg-01.mp4",
      "slide": { "index": 1, "highlights": [] },
      "script": "..."
    },
    {
      "id": "live-01",
      "type": "live",
      "mode": "instructor-initiated",
      "trigger": { "at": 780 },  // seconds elapsed when this fires
      "timeout": 120,            // max live duration in seconds
      "prompt": "...",           // opening question the avatar asks
      "slide": { "index": 3 }
    }
  ]
}
```

### Interaction Schedule (current demo lesson)

4 live checkpoints, ~10–11 min apart, totalling 15 min quota:

| Trigger | Task | Quota |
|---------|------|-------|
| 13:00 | Axis of symmetry quick drill (concrete answer) | 2 min |
| 24:00 | Vertex reading speed round | 3 min |
| 35:00 | Student attempts Q2 independently before solution plays | 4 min |
| 45:00 | Open Q&A + reflection | 6 min |

---

## Content Production Pipeline

```
scripts → TTS audio → vendor avatar workbench → .mp4 → public/content/
```

1. **Scripts** — `public/content/seg-xx.txt` (English, SAT math, written for 16–18 year olds)
2. **TTS** — generate `seg-xx.mp3` from each `.txt` using your TTS service
3. **Avatar video** — upload audio to digital human vendor → download `seg-xx.mp4`
4. **Place files** — drop `.mp4` files in `public/content/`
5. **Verify** — `npm run dev` → `/lesson/sat-math-quadratic-01`

See `public/content/timeline.md` for word counts, estimated audio durations, and the full segment schedule.

---

## Live Interaction (OmniRTC)

Live sessions use the OmniRTC Web SDK with AIGC `avatarchat`.

**Session flow:**
1. Player enters `LIVE_INSTRUCTOR` state at a configured trigger point
2. `use-live-session.ts` fetches a token from `/api/rtc/token`
3. Student publishes mic + camera via OmniRTC
4. AIGC service streams a live AI avatar video back
5. Avatar speaks the segment's `prompt`, student responds by voice
6. Session ends on "结束回答" click or when `timeout` expires

**Token:** The current setup uses a single pre-issued `OMNIRTC_TOKEN`. For production, replace `app/api/rtc/token/route.ts` with server-side token generation per session.

---

## Student Controls

| Control | In STREAMING | In LIVE |
|---------|-------------|---------|
| ✋ Raise hand | ✓ (if quota available) | — |
| 🎤 Mic | UI toggle only | Mutes OmniRTC audio track |
| 📷 Camera | Disables getUserMedia track + dark overlay | Mutes OmniRTC video track |
| 🔊 Speaker | Mutes instructor video audio | Mutes instructor video audio |

Remaining quota is shown in the student panel, color-coded green → amber → red → "互动已用完".

---

## Slide Variants

| `content.variant` | Component | Description |
|-------------------|-----------|-------------|
| `cover` | `CoverSlide` | Dark gradient, animated SVG parabola, lesson objectives |
| `vertex-explorer` | `InteractiveParabola` | h / k / a sliders with live graph |
| `formula-highlight` | KaTeX + `ParabolaGraph` | Click formula terms to highlight graph elements |
| `discriminant` | `DiscriminantViz` | c-slider shows roots appear and disappear |
| `completing-square` | `CompletingSquare` | 4-step auto-advancing walkthrough |
| *(none)* | Concept / Question / Solution / Summary | Standard layouts detected from slide title |

---

## Development

```bash
npm test            # Jest — 23 tests
npm run test:watch  # watch mode
npx tsc --noEmit    # type check
npm run lint        # ESLint
npm run build       # production build
```
