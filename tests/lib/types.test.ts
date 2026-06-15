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
