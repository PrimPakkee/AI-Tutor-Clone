'use client'
import { useRef, useEffect, useState } from 'react'
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
  onVideoMount?: (el: HTMLVideoElement | null) => void
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
  onVideoMount,
}: Props) {
  // Ping-pong pattern: two always-mounted videos; inactive one pre-loads while
  // active one keeps playing, then we crossfade — no static-image flash at transitions.
  const videoRefA = useRef<HTMLVideoElement>(null)
  const videoRefB = useRef<HTMLVideoElement>(null)
  const [activeIdx, _setActiveIdx] = useState<0 | 1>(0)
  const activeIdxRef = useRef<0 | 1>(0)
  const pendingUrlRef = useRef<string | null>(null)

  function setActiveIdx(idx: 0 | 1) {
    activeIdxRef.current = idx
    _setActiveIdx(idx)
  }

  const isLive = playerState === 'LIVE_INSTRUCTOR' || playerState === 'LIVE_STUDENT'

  // When URL changes, load into the idle slot and crossfade once it's ready
  useEffect(() => {
    if (!avatarVideoUrl) return
    const nextIdx: 0 | 1 = activeIdxRef.current === 0 ? 1 : 0
    const nextVideo = (nextIdx === 0 ? videoRefA : videoRefB).current
    if (!nextVideo) return

    pendingUrlRef.current = avatarVideoUrl
    nextVideo.src = avatarVideoUrl
    nextVideo.load()

    const onCanPlay = () => {
      if (pendingUrlRef.current !== avatarVideoUrl) return
      const prevVideo = (activeIdxRef.current === 0 ? videoRefA : videoRefB).current
      prevVideo?.pause()
      setActiveIdx(nextIdx)
      onVideoMount?.(nextVideo)
      if (playerState === 'STREAMING') nextVideo.play().catch(() => {})
    }
    nextVideo.addEventListener('canplay', onCanPlay, { once: true })
    return () => nextVideo.removeEventListener('canplay', onCanPlay)
  // playerState intentionally omitted — canPlay handler captures it at load time
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarVideoUrl])

  // Play / pause the active video whenever playerState or active slot changes
  useEffect(() => {
    const active = (activeIdx === 0 ? videoRefA : videoRefB).current
    if (!active) return
    if (playerState === 'STREAMING' && avatarVideoUrl) {
      if (active.paused) active.play().catch(() => {})
    } else {
      active.pause()
    }
  }, [playerState, avatarVideoUrl, activeIdx])

  useEffect(() => {
    if (videoRefA.current) videoRefA.current.muted = speakerMuted
    if (videoRefB.current) videoRefB.current.muted = speakerMuted
  }, [speakerMuted])

  const isSpeaking = playerState === 'STREAMING' || playerState === 'LIVE_INSTRUCTOR'

  function timeUpdateHandler(idx: 0 | 1) {
    return () => {
      if (idx !== activeIdxRef.current) return
      const t = (idx === 0 ? videoRefA : videoRefB).current?.currentTime ?? 0
      onVideoTimeUpdate?.(segmentStartTime + t)
    }
  }

  function endedHandler(idx: 0 | 1) {
    return () => {
      if (idx !== activeIdxRef.current) return
      const dur = (idx === 0 ? videoRefA : videoRefB).current?.duration ?? 0
      onVideoTimeUpdate?.(segmentStartTime + dur)
    }
  }

  return (
    <div className="flex-1 relative overflow-hidden bg-[#e8dfd4]">
      {/* Static instructor image — visible only before first video loads */}
      <img
        src="/instructor.png"
        alt={instructorName}
        className="absolute inset-0 w-full h-full object-cover object-top"
      />

      {/* Slot A */}
      <video
        ref={videoRefA}
        className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ${
          isLive || activeIdx !== 0 ? 'opacity-0' : 'opacity-100'
        }`}
        playsInline
        onTimeUpdate={timeUpdateHandler(0)}
        onEnded={endedHandler(0)}
        onError={() => console.warn('[AvatarPanel] Slot A failed:', videoRefA.current?.src)}
      />

      {/* Slot B */}
      <video
        ref={videoRefB}
        className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 ${
          isLive || activeIdx !== 1 ? 'opacity-0' : 'opacity-100'
        }`}
        playsInline
        onTimeUpdate={timeUpdateHandler(1)}
        onEnded={endedHandler(1)}
        onError={() => console.warn('[AvatarPanel] Slot B failed:', videoRefB.current?.src)}
      />

      {/* OmniRTC live avatar stream */}
      {isLive && liveVideoElId && (
        <div
          id={liveVideoElId}
          className="absolute inset-0 w-full h-full z-10"
          style={{ background: 'transparent' }}
        />
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
