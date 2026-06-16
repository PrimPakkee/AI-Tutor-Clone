'use client'
import { useRef, useEffect } from 'react'
import type { PlayerState } from '@/lib/types'

type Props = {
  avatarVideoUrl: string | null
  playerState: PlayerState
  instructorName: string
  elapsed: number
  segmentStartTime?: number
  liveVideoElId?: string
  speakerMuted?: boolean
  onVideoTimeUpdate?: (absoluteTime: number) => void
}

export function AvatarPanel({
  avatarVideoUrl,
  playerState,
  instructorName,
  elapsed: _elapsed,
  segmentStartTime = 0,
  liveVideoElId,
  speakerMuted = false,
  onVideoTimeUpdate,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  const isLive = playerState === 'LIVE_INSTRUCTOR' || playerState === 'LIVE_STUDENT'

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (playerState === 'STREAMING' && avatarVideoUrl) {
      if (video.paused) video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [playerState, avatarVideoUrl])

  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = speakerMuted
  }, [speakerMuted])

  const isSpeaking = playerState === 'STREAMING' || playerState === 'LIVE_INSTRUCTOR'

  return (
    <div className="flex-1 relative overflow-hidden bg-[#e8dfd4]">
      {/* Static instructor image — always visible as base layer */}
      <img
        src="/instructor.png"
        alt={instructorName}
        className="absolute inset-0 w-full h-full object-cover object-top"
      />

      {/* Pre-recorded avatar video — overlays static image when playing */}
      {avatarVideoUrl && (
        <video
          ref={videoRef}
          src={avatarVideoUrl}
          className={`absolute inset-0 w-full h-full object-cover object-top ${isLive ? 'hidden' : ''}`}
          playsInline
          onTimeUpdate={() => {
            const t = videoRef.current?.currentTime ?? 0
            onVideoTimeUpdate?.(segmentStartTime + t)
          }}
          onEnded={() => {
            const dur = videoRef.current?.duration ?? 0
            onVideoTimeUpdate?.(segmentStartTime + dur)
          }}
          onError={() => console.warn('[AvatarPanel] Video failed to load:', avatarVideoUrl)}
        />
      )}

      {/* OmniRTC live avatar stream — overlays static image while AIGC connects */}
      {isLive && liveVideoElId && (
        <div id={liveVideoElId} className="absolute inset-0 w-full h-full" />
      )}

      {isLive && (
        <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none">
          <div className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow">
            LIVE
          </div>
        </div>
      )}

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
