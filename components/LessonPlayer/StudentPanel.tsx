'use client'
import { useRef, useEffect, useState } from 'react'
import type { PlayerState } from '@/lib/types'

type Props = {
  playerState: PlayerState
  studentName: string
  canRaiseHand: boolean
  quotaExhausted: boolean
  quotaRemainingSeconds: number
  localVideoElId?: string
  onRaiseHand: () => void
  onMicToggle: (muted: boolean) => void
  onCameraToggle: (off: boolean) => void
  onVolumeToggle: (muted: boolean) => void
}

export function StudentPanel({
  playerState,
  studentName,
  canRaiseHand,
  quotaExhausted,
  quotaRemainingSeconds,
  localVideoElId,
  onRaiseHand,
  onMicToggle,
  onCameraToggle,
  onVolumeToggle,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [micMuted, setMicMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [speakerMuted, setSpeakerMuted] = useState(false)
  const [liveElapsed, setLiveElapsed] = useState(0)

  const isLive = playerState === 'LIVE_INSTRUCTOR' || playerState === 'LIVE_STUDENT'

  // getUserMedia runs in STREAMING; stops when OmniRTC takes over in LIVE
  useEffect(() => {
    if (isLive) {
      if (videoRef.current?.srcObject) {
        ;(videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
        videoRef.current.srcObject = null
      }
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: false })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
      .catch(() => {})
    return () => {
      if (videoRef.current?.srcObject) {
        ;(videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop())
      }
    }
  }, [isLive])

  // Enable/disable local video track when cameraOff changes (STREAMING mode only)
  useEffect(() => {
    if (isLive || !videoRef.current?.srcObject) return
    const stream = videoRef.current.srcObject as MediaStream
    stream.getVideoTracks().forEach((t) => { t.enabled = !cameraOff })
  }, [cameraOff, isLive])

  // Real-time countdown while in a live session
  useEffect(() => {
    if (!isLive) { setLiveElapsed(0); return }
    const interval = setInterval(() => setLiveElapsed((s) => s + 1), 1000)
    return () => clearInterval(interval)
  }, [isLive])

  const displayRemaining = Math.max(0, quotaRemainingSeconds - liveElapsed)
  const mm = Math.floor(displayRemaining / 60).toString().padStart(2, '0')
  const ss = (displayRemaining % 60).toString().padStart(2, '0')
  const quotaColor =
    quotaExhausted ? 'text-slate-400' :
    displayRemaining < 60 ? 'text-red-400' :
    displayRemaining < 300 ? 'text-amber-400' :
    'text-emerald-400'

  return (
    <div className="flex-1 relative overflow-hidden bg-slate-700">
      {/* OmniRTC container — always in DOM so track.play() can find it */}
      {localVideoElId && (
        <div
          id={localVideoElId}
          className={`absolute inset-0 w-full h-full ${!isLive ? 'hidden' : ''}`}
        />
      )}
      {/* Local getUserMedia preview — visible in STREAMING, hidden in LIVE */}
      <video
        ref={videoRef}
        className={`w-full h-full object-cover object-top ${isLive ? 'hidden' : ''}`}
        playsInline
        muted
      />

      {/* Camera-off overlay */}
      {!isLive && cameraOff && (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-1 opacity-50">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7 16 12 23 17V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            <span className="text-white text-[10px]">摄像头已关闭</span>
          </div>
        </div>
      )}

      {quotaExhausted && (
        <div className="absolute top-2 left-0 right-0 flex justify-center">
          <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
            本节课互动时间已用完
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-2 py-0.5 flex items-center justify-between">
        <span className="text-white text-xs font-medium">{studentName}</span>
        <span className={`text-[10px] font-mono font-semibold tabular-nums ${quotaColor}`}>
          {quotaExhausted ? '互动已用完' : `互动 ${mm}:${ss}`}
        </span>
      </div>

      <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-1.5">
        <button
          onClick={onRaiseHand}
          disabled={!canRaiseHand || isLive}
          title="提问"
          className="w-7 h-7 bg-white/90 rounded-md flex items-center justify-center text-sm shadow disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
        >
          ✋
        </button>
        <button
          onClick={() => { setMicMuted((v) => { onMicToggle(!v); return !v }) }}
          title={micMuted ? '取消静音' : '静音'}
          className={`w-7 h-7 rounded-md flex items-center justify-center shadow transition-colors ${micMuted ? 'bg-red-500 text-white' : 'bg-white/85 hover:bg-white text-slate-700'}`}
        >
          {micMuted ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="1" y1="1" x2="23" y2="23" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
              <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )}
        </button>
        <button
          onClick={() => { setCameraOff((v) => { onCameraToggle(!v); return !v }) }}
          title={cameraOff ? '开启摄像头' : '关闭摄像头'}
          className={`w-7 h-7 rounded-md flex items-center justify-center shadow transition-colors ${cameraOff ? 'bg-red-500 text-white' : 'bg-white/85 hover:bg-white text-slate-700'}`}
        >
          {cameraOff ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7 16 12 23 17V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 7 16 12 23 17V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          )}
        </button>
        <button
          onClick={() => { setSpeakerMuted((v) => { onVolumeToggle(!v); return !v }) }}
          title={speakerMuted ? '取消静音' : '静音讲师'}
          className={`w-7 h-7 rounded-md flex items-center justify-center shadow transition-colors ${speakerMuted ? 'bg-red-500 text-white' : 'bg-white/85 hover:bg-white text-slate-700'}`}
        >
          {speakerMuted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}
