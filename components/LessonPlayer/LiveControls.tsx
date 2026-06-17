'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PlayerState } from '@/lib/types'

type Props = {
  playerState: PlayerState
  timeout?: number
  prompt?: string
  onEnd: (liveDurationSeconds: number) => void
  onSendText?: (text: string) => void
}

export function LiveControls({ playerState, timeout, prompt, onEnd, onSendText }: Props) {
  const startedAtRef = useRef(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isWaiting, setIsWaiting] = useState(false)

  const recognitionRef = useRef<any>(null)
  const finalRef = useRef('')      // accumulates final segments across onresult calls
  const transcriptRef = useRef('') // latest combined text for stopAndSubmit

  const isInstructor = playerState === 'LIVE_INSTRUCTOR'
  const isStudent = playerState === 'LIVE_STUDENT'
  const isLive = isInstructor || isStudent

  // Countdown timer + auto-end on timeout
  useEffect(() => {
    if (!isLive) return
    startedAtRef.current = Date.now()
    setElapsed(0)
    const interval = setInterval(() => {
      const secs = Math.floor((Date.now() - startedAtRef.current) / 1000)
      setElapsed(secs)
      if (timeout && secs >= timeout) onEnd(secs)
    }, 1000)
    return () => clearInterval(interval)
  }, [isLive, timeout, onEnd])

  const startRecording = useCallback(() => {
    if (recognitionRef.current) return  // already running
    const SR = (typeof window !== 'undefined') &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    if (!SR) return

    finalRef.current = ''
    transcriptRef.current = ''
    setTranscript('')

    const recognition = new SR()
    recognition.lang = 'zh-CN'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event: any) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript
        if (event.results[i].isFinal) finalRef.current += t
        else interim = t
      }
      transcriptRef.current = finalRef.current + interim
      setTranscript(transcriptRef.current)
    }

    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)

    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
  }, [])

  const stopAndSubmit = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsRecording(false)
    const text = transcriptRef.current.trim()
    finalRef.current = ''
    transcriptRef.current = ''
    setTranscript('')
    if (text && onSendText) {
      onSendText(text)
      setIsWaiting(true)
    }
  }, [onSendText])

  // LIVE_INSTRUCTOR: auto-start recording (short delay for welcome to finish)
  useEffect(() => {
    if (!isInstructor || !onSendText) return
    const timer = setTimeout(startRecording, 1000)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstructor, onSendText])

  // LIVE_INSTRUCTOR: if recording stops without sending (e.g. user clicked 说完了 with no speech),
  // restart after a short pause so the button stays useful
  useEffect(() => {
    if (!isInstructor || !onSendText || isRecording || isWaiting) return
    const timer = setTimeout(startRecording, 800)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInstructor, onSendText, isRecording, isWaiting])

  // Stop recognition on unmount / state change
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      recognitionRef.current = null
    }
  }, [playerState])

  if (!isLive) return null

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 w-72">
      {/* Question prompt */}
      {prompt && isInstructor && (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-md w-full text-center">
          <p className="text-sm text-slate-700">{prompt}</p>
        </div>
      )}

      {/* Transcript preview */}
      {transcript ? (
        <div className="bg-white/85 backdrop-blur-sm rounded-lg px-3 py-1.5 w-full text-center">
          <p className="text-xs text-slate-600 line-clamp-2">{transcript}</p>
        </div>
      ) : null}

      {/* Voice controls / waiting indicator */}
      {isWaiting ? (
        <div className="flex items-center gap-2 text-white/80 text-xs">
          <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse inline-block" />
          数字人回答中…
        </div>
      ) : onSendText && (
        <div className="flex items-center gap-2">
          {isRecording && (
            <span className="text-white/80 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse inline-block" />
              收音中
            </span>
          )}
          {isStudent && !isRecording && (
            <button
              onClick={startRecording}
              className="bg-white/90 text-slate-700 text-xs font-medium px-4 py-1.5 rounded-full shadow hover:bg-white transition-colors"
            >
              🎤 开始说话
            </button>
          )}
          {(isInstructor || (isStudent && isRecording)) && (
            <button
              onClick={stopAndSubmit}
              className="bg-white/90 text-slate-700 text-xs font-medium px-4 py-1.5 rounded-full shadow hover:bg-white transition-colors"
            >
              说完了
            </button>
          )}
        </div>
      )}

      {/* Countdown timer (timeout-only display, no manual end button) */}
      {timeout && !isWaiting && (
        <span className="text-xs text-white/70 bg-black/40 px-2 py-0.5 rounded-full">
          {timeout - elapsed}s
        </span>
      )}
    </div>
  )
}
