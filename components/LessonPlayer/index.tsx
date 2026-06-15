'use client'
import { useState } from 'react'
import type { Lesson } from '@/lib/types'
import { useTimeline } from '@/lib/use-timeline'
import { TopBar } from './TopBar'
import { SlidePanel } from './SlidePanel'
import { AvatarPanel } from './AvatarPanel'
import { StudentPanel } from './StudentPanel'
import { LiveControls } from './LiveControls'
import { Toast } from '@/components/Toast'

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

  const [toast, setToast] = useState<string | null>(null)

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
              onMicToggle={(muted) => { if (muted) setToast('Microphone muted') }}
              onCameraToggle={(off) => { if (off) setToast('Camera off') }}
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

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}
