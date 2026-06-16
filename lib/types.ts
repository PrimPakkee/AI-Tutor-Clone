export type GraphSpec = {
  type: 'parabola'
  vertex: [number, number]
  direction: 'up' | 'down'
}

export type SolutionData = {
  steps: string[]
  answer: string
}

export type SlideContent = {
  formula?: string | null
  bullets?: string[]
  graph?: GraphSpec | null
  correctChoice?: string | null
  variant?: string | null
  solution?: SolutionData | null
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
  systemPrompt?: string
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
