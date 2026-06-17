'use client'
import { useState, useEffect, useRef } from 'react'
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

  const [toast, setToast] = useState<string | null>(null)
  const [speakerMuted, setSpeakerMuted] = useState(false)

  const currentSlide = lesson.slides.find((s) => s.index === currentSlideIndex)
  const currentSlideRef = currentSegment?.type === 'stream' ? currentSegment.slide : null

  const [displayedSlide, setDisplayedSlide] = useState<Slide | undefined>(currentSlide)
  const [exitingSlide, setExitingSlide] = useState<Slide | null>(null)
  const [slideKey, setSlideKey] = useState(0)
  const displayedSlideRef = useRef(displayedSlide)

  useEffect(() => {
    if (!currentSlide || currentSlide.index === displayedSlideRef.current?.index) return
    setExitingSlide(displayedSlideRef.current ?? null)
    displayedSlideRef.current = currentSlide
    setDisplayedSlide(currentSlide)
    setSlideKey(k => k + 1)
    const t = setTimeout(() => setExitingSlide(null), 300)
    return () => clearTimeout(t)
  }, [currentSlide?.index]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!currentSlide) return null

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <TopBar title={lesson.title} isLive watcherCount={128} />

      <div className="flex flex-1 min-h-0">
        {/* Left 70%: lecture notes */}
        <div className="w-[70%] border-r border-gray-200 bg-white relative overflow-hidden">
          {exitingSlide && (
            <div className="slide-card-exit absolute inset-0 bg-white z-10">
              <SlidePanel slide={exitingSlide} slideCount={lesson.slides.length} highlights={[]} />
            </div>
          )}
          <div key={slideKey} className="slide-card-enter absolute inset-0 bg-white">
            <SlidePanel
              slide={displayedSlide ?? currentSlide}
              slideCount={lesson.slides.length}
              highlights={currentSlideRef?.highlights ?? []}
            />
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
