# AI Tutor — SAT Math Demo Lesson Design Spec

**Date:** 2026-06-15  
**Scope:** Web-based AI tutor, SAT math, one demo lesson (Quadratic Functions, 45 min)  
**Stack:** Next.js (React), ZEGO AI Avatar + Streaming Avatar RTC

---

## 1. Product Overview

A web-based AI tutoring product targeting US SAT math students. The first deliverable is a single demo lesson on Quadratic Functions (45 min). The interface is a three-panel live-style layout featuring a digital human instructor, synchronized lecture notes, and a student webcam view.

---

## 2. System Architecture

### Two-layer structure

**Browser (Next.js)**
- Lesson Player — core state machine
  - Timeline Engine — reads lesson JSON, drives all panels
  - Avatar Panel — ZEGO video stream or live RTC
  - Slide Panel — responds to timeline events
  - Student Panel — webcam via ZEGO RTC
- Next.js API Routes (backend)
  - `GET /api/lesson/[id]` — returns lesson JSON
  - `GET /api/zego/token` — generates ZEGO RTC token (keeps AppSecret server-side)

**Offline content generation pipeline** (run at authoring time, not runtime)
- Lesson script text → ZEGO Avatar API → `.mp4` segments → CDN/local storage → written into lesson JSON

### Digital human modes

| Mode | Product | Usage |
|---|---|---|
| `stream` | ZEGO AI Avatar (pre-generated) | Pre-recorded lecture segments |
| `live` | ZEGO Streaming Avatar RTC | Real-time interactive segments |

---

## 3. UI Layout

Three-panel, live-style, white background, no progress timeline bar.

```
┌─────────────────────────────────────┬──────────────────┐
│                                     │   Instructor     │
│         Lecture Notes (70%)         │   (ZEGO Avatar)  │
│                                     │                  │
│   • Slide title                     ├──────────────────┤
│   • Formula / graph                 │   Student        │
│   • Key point cards                 │   (Webcam)  [✋] │
│                                     │            [🎤] │
│                  slide N / 12       │            [📷] │
│                                     │            [🔊] │
└─────────────────────────────────────┴──────────────────┘
```

- **Left (70% width):** Lecture notes rendered in a **4:3 content area** with KaTeX math, SVG graphs, key-point cards. Auto-advances with timeline.
- **Top-right (30% wide, top 50% height):** Instructor digital human. Bust-shot framing (chest and above), plain warm-beige background. Name strip + audio wave indicator at bottom.
- **Bottom-right (30% wide, bottom 50% height):** Student webcam. Vertical button strip overlaid on right edge (raise hand ✋, mic 🎤, camera 📷, volume 🔊).
- **Top bar:** Course title + LIVE red dot. No progress bar.
- **Interaction quota notice:** When lesson live quota is exhausted, display "本节课互动时间已用完" and disable ✋ button.

### Target viewport sizes

| Resolution | Lecture notes | Each avatar panel |
|---|---|---|
| 1920×1080 | 1344 × ~960px | ~576 × ~480px |
| 1440×900 | 1008 × ~780px | ~432 × ~390px |
| 1280×800 | 896 × ~680px | ~384 × ~340px |

Minimum supported width: **1280px**. No mobile support in v1.

---

## 4. Content Format — Lesson JSON Schema

Each lesson is a single JSON file produced by AI (Claude) in one generation pass. The same pass produces both the slide content and the avatar narration scripts, ensuring tight coordination between what the digital human says and what appears on the slides.

The timeline engine reads the JSON and drives all panels. Slides are always rendered at **4:3 aspect ratio** inside the lecture notes panel.

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
        "formula": "f(x) = ax² + bx + c",
        "bullets": ["Degree 2 polynomial", "Graph is a parabola"],
        "graph": null
      }
    },
    {
      "index": 3,
      "title": "Vertex Form",
      "content": {
        "formula": "f(x) = a(x − h)² + k",
        "bullets": ["(h, k) is the vertex", "Axis of symmetry: x = h"],
        "graph": { "type": "parabola", "vertex": [0, 0], "direction": "up" }
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
      "slide": { "index": 1, "highlights": [] }
    },
    {
      "id": "seg-interact-01",
      "type": "live",
      "mode": "instructor-initiated",
      "trigger": { "at": 1080 },
      "timeout": 60,
      "prompt": "Does vertex form make sense so far?",
      "slide": { "index": 3 }
    }
  ]
}
```

### Segment types

| `type` | `mode` | Description |
|---|---|---|
| `stream` | — | Play pre-generated ZEGO Avatar video; auto-advance slide |
| `live` | `instructor-initiated` | Triggered by timeline at `trigger.at`; auto-mic on; ends on student click or `timeout` |
| `live` | `student-initiated` | Triggered by student clicking ✋; pauses current stream; resumes from breakpoint on end |

### Live quota enforcement

- `maxLiveSeconds: 900` (15 min per lesson)
- Client tracks cumulative live seconds
- On quota exhaustion: ✋ disabled, pending `instructor-initiated` segments skipped, toast shows "本节课互动时间已用完"

---

## 5. Client State Machine

Four states:

```
IDLE
  └─ lesson loaded → STREAMING

STREAMING
  ├─ reach live segment → LIVE_INSTRUCTOR
  └─ student clicks ✋ → LIVE_STUDENT

LIVE_INSTRUCTOR
  ├─ student clicks "结束回答" → STREAMING
  └─ timeout → STREAMING

LIVE_STUDENT
  └─ student clicks "结束提问" → STREAMING (resumes from pause point)
```

On any `STREAMING → LIVE_*` transition:
1. Pause avatar video
2. Fetch ZEGO token from `/api/zego/token`
3. Init ZEGO RTC, join room
4. Digital human goes live

On any `LIVE_* → STREAMING` transition:
1. Destroy ZEGO RTC connection
2. Resume avatar video from pause point
3. Decrement live quota

---

## 6. Demo Lesson — Quadratic Functions (45 min)

### Lesson outline

| Segment | Time | Type | Mode | Content | Slides |
|---|---|---|---|---|---|
| 1 | 0:00–5:00 | stream | — | Intro: what is a quadratic, standard form `ax²+bx+c` | 1–2 |
| 2 | 5:00–18:00 | stream | — | Vertex form `a(x-h)²+k`, parabola graph, axis of symmetry | 3–6 |
| 3 | ~18:00 | live | instructor-initiated | "Does vertex form make sense so far?" (up to 4 min) | 3 (hold) |
| 4 | ~22:00 | stream | — | 3 SAT real-exam questions with walkthrough | 7–12 |
| 5 | ~38:00 | live | instructor-initiated | Lesson wrap-up Q&A, summary, assign practice (up to 7 min) | 12 (hold) |

Total live budget used (max): ~11 min. Remaining 4 min available for student-initiated ✋.

### Lecture notes (12 slides)

1. What is a quadratic function?
2. Standard form: `f(x) = ax² + bx + c`
3. Vertex form: `f(x) = a(x − h)² + k`
4. Graph anatomy: vertex, axis of symmetry, direction
5. Reading vertex directly from equation (SAT shortcut)
6. Discriminant & roots overview
7. SAT Q1: identify vertex from equation
8. SAT Q1: solution walkthrough
9. SAT Q2: find axis of symmetry
10. SAT Q2: solution walkthrough
11. SAT Q3: word problem → quadratic model
12. Summary + practice problems

---

## 7. ZEGO Integration

### Offline generation pipeline

Run once per lesson during content authoring. **Both lecture notes and avatar scripts are AI-generated together** to ensure the digital human narration and slide content are fully synchronized — the same Claude prompt produces the lesson JSON (slides + highlights) and the segment scripts (what the avatar says) in one pass.

```bash
# Step 1: AI generates lesson bundle (slides + avatar scripts)
node scripts/generate-lesson.js \
  --topic "Quadratic Functions" \
  --output lesson-sat-quadratic-01.json

# Step 2: Generate avatar video for each stream segment
node scripts/generate-avatar.js \
  --lesson lesson-sat-quadratic-01.json \
  --output public/content/
```

Output `.mp4` files are stored in `public/content/` and referenced in lesson JSON.

### RTC token endpoint

```typescript
// app/api/zego/token/route.ts
GET /api/zego/token?roomId=lesson-xxx&userId=student-yyy
Response: { token: string, appId: number }
```

AppSecret stays server-side only. Token TTL: 3600s.

### Student webcam

- `stream` mode: local preview only (no upload)
- `live` mode: pushed to ZEGO RTC room (instructor endpoint receives it)

---

## 8. Error Handling

| Scenario | Behavior |
|---|---|
| ZEGO RTC connection fails | Toast error; ✋ disabled for session; stream continues uninterrupted |
| Avatar video fails to load | Show slide only; audio continues if available |
| Student denies camera | Student panel shows avatar placeholder; lesson continues |
| Live timeout reached | Auto-return to stream with no user action needed |

---

## 9. Out of Scope (v1 Demo)

- User authentication / accounts
- Multiple lessons or curriculum management
- Mobile / tablet layout
- Lesson recording or playback history
- Payment / subscription
- Analytics / progress tracking
