'use client'
import { useRef, useEffect } from 'react'
import type { PlayerState } from '@/lib/types'

type Props = {
  avatarVideoUrl: string | null
  playerState: PlayerState
  instructorName: string
  elapsed: number
  onVideoTimeUpdate?: (currentTime: number) => void
}

export function AvatarPanel({
  avatarVideoUrl,
  playerState,
  instructorName,
  elapsed: _elapsed,
  onVideoTimeUpdate,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (playerState === 'STREAMING' && avatarVideoUrl) {
      if (video.paused) video.play().catch(() => {})
    } else {
      video.pause()
    }
  }, [playerState, avatarVideoUrl])

  const isSpeaking = playerState === 'STREAMING' || playerState === 'LIVE_INSTRUCTOR'

  return (
    <div className="flex-1 relative overflow-hidden bg-[#e8dfd4]">
      {avatarVideoUrl && (
        <video
          ref={videoRef}
          src={avatarVideoUrl}
          className="w-full h-full object-cover object-top"
          playsInline
          onTimeUpdate={() => onVideoTimeUpdate?.(videoRef.current?.currentTime ?? 0)}
          onError={() => console.warn('[AvatarPanel] Video failed to load:', avatarVideoUrl)}
        />
      )}

      {(playerState === 'LIVE_INSTRUCTOR' || playerState === 'LIVE_STUDENT') && (
        <div className="absolute inset-0 flex items-center justify-center">
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
