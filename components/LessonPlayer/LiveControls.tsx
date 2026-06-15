'use client'
import { useEffect, useState } from 'react'
import type { PlayerState } from '@/lib/types'

type Props = {
  playerState: PlayerState
  timeout?: number
  prompt?: string
  onEnd: (liveDurationSeconds: number) => void
}

export function LiveControls({ playerState, timeout, prompt, onEnd }: Props) {
  const [startedAt] = useState(() => Date.now())
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (playerState !== 'LIVE_INSTRUCTOR' && playerState !== 'LIVE_STUDENT') return
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - startedAt) / 1000)
      setElapsed(secs)
      if (timeout && secs >= timeout) {
        onEnd(secs)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [playerState, timeout, startedAt, onEnd])

  if (playerState !== 'LIVE_INSTRUCTOR' && playerState !== 'LIVE_STUDENT') return null

  const isInstructor = playerState === 'LIVE_INSTRUCTOR'
  const buttonLabel = isInstructor ? '结束回答' : '结束提问'

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
      {prompt && isInstructor && (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md max-w-xs text-center">
          <p className="text-sm text-slate-700">{prompt}</p>
        </div>
      )}
      <div className="flex items-center gap-3">
        {timeout && (
          <span className="text-xs text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
            {timeout - elapsed}s
          </span>
        )}
        <button
          onClick={() => onEnd(elapsed)}
          className="bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-full shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  )
}
