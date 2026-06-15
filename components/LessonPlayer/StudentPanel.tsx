'use client'
import { useRef, useEffect, useState } from 'react'
import type { PlayerState } from '@/lib/types'

type Props = {
  playerState: PlayerState
  studentName: string
  canRaiseHand: boolean
  quotaExhausted: boolean
  onRaiseHand: () => void
  onMicToggle: (muted: boolean) => void
  onCameraToggle: (off: boolean) => void
}

export function StudentPanel({
  playerState,
  studentName,
  canRaiseHand,
  quotaExhausted,
  onRaiseHand,
  onMicToggle,
  onCameraToggle,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [micMuted, setMicMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const [volume] = useState(80)

  useEffect(() => {
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
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((t) => t.stop())
      }
    }
  }, [])

  const isLive = playerState === 'LIVE_INSTRUCTOR' || playerState === 'LIVE_STUDENT'

  return (
    <div className="flex-1 relative overflow-hidden bg-slate-700">
      <video
        ref={videoRef}
        className="w-full h-full object-cover object-top"
        playsInline
        muted
      />

      {quotaExhausted && (
        <div className="absolute top-2 left-0 right-0 flex justify-center">
          <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
            本节课互动时间已用完
          </span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm px-2 py-0.5">
        <span className="text-white text-xs font-medium">{studentName}</span>
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
          className={`w-7 h-7 rounded-md flex items-center justify-center text-sm shadow transition-colors ${micMuted ? 'bg-red-100/90' : 'bg-white/85 hover:bg-white'}`}
        >
          🎤
        </button>
        <button
          onClick={() => { setCameraOff((v) => { onCameraToggle(!v); return !v }) }}
          title={cameraOff ? '开启摄像头' : '关闭摄像头'}
          className={`w-7 h-7 rounded-md flex items-center justify-center text-sm shadow transition-colors ${cameraOff ? 'bg-red-100/90' : 'bg-white/85 hover:bg-white'}`}
        >
          📷
        </button>
        <button
          title={`音量 ${volume}%`}
          className="w-7 h-7 bg-white/85 rounded-md flex items-center justify-center text-sm shadow hover:bg-white transition-colors"
        >
          🔊
        </button>
      </div>
    </div>
  )
}
