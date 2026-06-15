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
