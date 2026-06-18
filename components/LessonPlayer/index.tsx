'use client'
import { useState, useRef, useLayoutEffect } from 'react'
import type { Lesson, Slide } from '@/lib/types'
import { useTimeline } from '@/lib/use-timeline'
import { useLiveSession } from '@/lib/use-live-session'
import { TopBar } from './TopBar'
import { SlidePanel } from './SlidePanel'
import { AvatarPanel } from './AvatarPanel'
import { StudentPanel } from './StudentPanel'
import { LiveControls } from './LiveControls'
import { Toast } from '@/components/Toast'

const AVATAR_LIVE_EL_ID = 'omnirtc-avatar-live'
const STUDENT_LOCAL_EL_ID = 'omnirtc-student-local'

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
    activeHighlights,
    activeScene,
    activeAnnotations,
    quotaRemainingSeconds,
    canRaiseHand,
    setElapsed,
    raiseHand,
    endLive,
  } = useTimeline(lesson)

  const liveSession = useLiveSession({
    playerState,
    activeLiveSeg: activeLiveSeg ?? null,
    avatarVideoElId: AVATAR_LIVE_EL_ID,
    studentVideoElId: STUDENT_LOCAL_EL_ID,
    onError: (msg) => setToast(msg),
    onAvatarDone: () => endLive(activeLiveSeg?.timeout ?? 30),
  })

  const [started, setStarted] = useState(false)
  const avatarVideoRef = useRef<HTMLVideoElement | null>(null)

  const slideContainerRef = useRef<HTMLDivElement>(null)
  const [slideSize, setSlideSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const el = slideContainerRef.current
    if (!el) return
    const compute = () => {
      const { width, height } = el.getBoundingClientRect()
      if (!width || !height) return
      const pad = 32
      const aw = width - pad
      const ah = height - pad
      const w = ah * 4 / 3 <= aw ? ah * 4 / 3 : aw
      setSlideSize({ w, h: w * 3 / 4 })
    }
    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const [toast, setToast] = useState<string | null>(null)
  const [speakerMuted, setSpeakerMuted] = useState(false)

  const currentSlide = lesson.slides.find((s) => s.index === currentSlideIndex)
  if (!currentSlide) return null

  function handleStart() {
    setStarted(true)
    avatarVideoRef.current?.play().catch(() => {})
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 relative">
      <TopBar title={lesson.title} isLive watcherCount={128} />

      <div className="flex flex-1 min-h-0">
        {/* Left 70%: lecture notes */}
        <div className="w-[70%] border-r border-gray-200 bg-white overflow-hidden flex flex-col">
          <div ref={slideContainerRef} className="flex-1 min-h-0 flex items-center justify-center">
            <div style={{ width: slideSize.w, height: slideSize.h, position: 'relative', flexShrink: 0 }}>
              <SlidePanel
                slide={currentSlide}
                slideCount={lesson.slides.length}
                highlights={activeHighlights}
                sceneState={activeScene}
                annotations={activeAnnotations}
              />
            </div>
          </div>
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
              segmentStartTime={currentSegment?.startTime ?? 0}
              liveVideoElId={AVATAR_LIVE_EL_ID}
              speakerMuted={speakerMuted}
              onVideoTimeUpdate={setElapsed}
              onVideoMount={(el) => { avatarVideoRef.current = el }}
            />
          </div>

          {/* Bottom 50%: student */}
          <div className="h-1/2 flex flex-col">
            <StudentPanel
              playerState={playerState}
              studentName={studentName}
              canRaiseHand={canRaiseHand}
              quotaExhausted={quotaRemainingSeconds === 0}
              quotaRemainingSeconds={quotaRemainingSeconds}
              localVideoElId={STUDENT_LOCAL_EL_ID}
              onRaiseHand={raiseHand}
              onMicToggle={(muted) => {
                liveSession.muteAudio(muted)
                if (muted) setToast('Microphone muted')
              }}
              onCameraToggle={(off) => {
                liveSession.muteVideo(off)
                if (off) setToast('Camera off')
              }}
              onVolumeToggle={(muted) => setSpeakerMuted(muted)}
            />
          </div>

          {/* Live controls overlay */}
          <LiveControls
            playerState={playerState}
            timeout={activeLiveSeg?.timeout}
            prompt={activeLiveSeg?.prompt}
            onEnd={endLive}
            onSendText={liveSession.sendText}
          />
        </div>
      </div>

      {!started && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-900/96 to-violet-950/96 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-5 text-center px-10">
            <p className="text-indigo-300 text-xs font-extrabold tracking-[0.2em] uppercase">SAT Math Prep</p>
            <h1 className="text-white text-4xl font-black leading-tight">{lesson.title}</h1>
            <p className="text-indigo-200/60 text-sm">Taught by {instructorName}</p>
            <button
              onClick={handleStart}
              className="mt-3 bg-white text-indigo-900 font-bold text-base px-10 py-3.5 rounded-2xl shadow-2xl hover:bg-indigo-50 active:scale-95 transition-all"
            >
              Start Lesson →
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-3 left-3 flex gap-2 z-50">
          <button
            onClick={() => setElapsed(88)}
            className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black"
          >
            DEV: Jump to Live
          </button>
          <button
            onClick={() => endLive(0)}
            className="bg-black/70 text-white text-xs px-3 py-1.5 rounded-full hover:bg-black"
          >
            DEV: End Live
          </button>
        </div>
      )}
    </div>
  )
}
