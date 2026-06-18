import { useReducer, useCallback } from 'react'
import type { Lesson, Segment, StreamSegment, InstructorLiveSegment, PlayerState, Annotation } from '@/lib/types'
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
  const coverSeg = lesson?.segments.find((s): s is StreamSegment => s.type === 'stream' && s.id === 'seg-cover')
  const initialState: State = {
    playerState: lesson ? 'STREAMING' : 'IDLE',
    elapsed: coverSeg ? coverSeg.startTime : 0,
    quota: createQuota(lesson?.maxLiveSeconds ?? 0),
    skippedLiveIds: new Set(),
    streamPausePoint: 0,
    activeLiveSegId: null,
  }

  const [state, dispatch] = useReducer(reducer, initialState)

  const setElapsed = useCallback((elapsed: number) => {
    if (!lesson) return
    dispatch({ type: 'SET_ELAPSED', elapsed })
    if (state.playerState === 'STREAMING' && !isQuotaExhausted(state.quota)) {
      const liveSeg = getLiveTriggerAt(lesson.segments, elapsed, state.skippedLiveIds)
      if (liveSeg) dispatch({ type: 'TRIGGER_INSTRUCTOR_LIVE', segId: liveSeg.id })
    }
  }, [lesson, state.playerState, state.quota, state.skippedLiveIds])

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
    activeLiveSeg?.slide.index ?? currentSegment?.slide.index ?? 0

  const activeHighlights: string[] =
    currentSegment?.slide.highlights
      ?.filter(h => state.elapsed >= h.at)
      .map(h => h.text) ?? []

  const activeScene: Record<string, unknown> =
    currentSegment?.slide.scene
      ?.filter(e => state.elapsed >= e.at)
      .at(-1)?.state ?? {}

  const activeAnnotations: Annotation[] =
    currentSegment?.slide.annotations
      ?.filter(a => state.elapsed >= a.at) ?? []

  return {
    playerState: state.playerState,
    currentSegment,
    currentSlideIndex,
    activeLiveSeg,
    activeHighlights,
    activeScene,
    activeAnnotations,
    elapsed: state.elapsed,
    quotaRemainingSeconds: getRemainingSeconds(state.quota),
    canRaiseHand: !isQuotaExhausted(state.quota) && state.playerState === 'STREAMING',
    setElapsed,
    raiseHand,
    endLive,
  }
}
