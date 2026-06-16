'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { SlidePanel } from '@/components/LessonPlayer/SlidePanel'
import lessonData from '@/data/lessons/sat-math-quadratic-01.json'
import type { Lesson } from '@/lib/types'

const lesson = lessonData as Lesson

// Map slide-index → segment id so we can fetch the .txt narration file
function buildSegmentIdMap(l: Lesson): Record<number, string> {
  const map: Record<number, string> = {}
  for (const seg of l.segments) {
    if (seg.type === 'stream') {
      map[seg.slide.index] = seg.id
    }
  }
  return map
}

export default function SlidesTestPage() {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [autoPlay, setAutoPlay] = useState(true)
  const [showScript, setShowScript] = useState(false)
  const [script, setScript] = useState<string | null>(null)
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null)

  const slides = lesson.slides
  const slide = slides[index]
  const segmentIdMap = useMemo(() => buildSegmentIdMap(lesson), [])

  // Fetch narration from public/content/<id>.txt (录播脚本)
  useEffect(() => {
    const segId = segmentIdMap[slide.index]
    if (!segId) { setScript(null); return }
    fetch(`/content/${segId}.txt`)
      .then((r) => (r.ok ? r.text() : null))
      .then((text) => setScript(text ?? null))
      .catch(() => setScript(null))
  }, [slide.index, segmentIdMap])

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.92
    utt.pitch = 1.05
    utt.lang = 'en-US'
    // prefer a clear English voice
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v =>
      /Samantha|Google US English|Karen|Moira|en[-_]US/i.test(v.name)
    )
    if (preferred) utt.voice = preferred
    utt.onstart = () => setIsPlaying(true)
    utt.onend = () => setIsPlaying(false)
    utt.onerror = () => setIsPlaying(false)
    synthRef.current = utt
    window.speechSynthesis.speak(utt)
  }, [])

  const stopSpeech = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    setIsPlaying(false)
  }, [])

  // Auto-play narration once script is fetched
  useEffect(() => {
    if (!autoPlay || !script) { stopSpeech(); return }
    const t = setTimeout(() => speak(script), 400)
    return () => { clearTimeout(t); stopSpeech() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [script, autoPlay])

  function goTo(i: number) {
    stopSpeech()
    setIndex(i)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-indigo-50 flex flex-col">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold tracking-widest text-indigo-500 uppercase">Slide Preview</span>
          <span className="text-slate-300">|</span>
          <h1 className="text-sm font-semibold text-slate-700">{lesson.title}</h1>
        </div>

        {/* Audio controls */}
        <div className="flex items-center gap-3">
          {/* Auto-play toggle */}
          <button
            onClick={() => { setAutoPlay(a => { if (a) stopSpeech(); return !a }) }}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              autoPlay ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-slate-500'
            }`}
          >
            {autoPlay ? '🔊 Auto' : '🔇 Muted'}
          </button>

          {/* Play/Pause current */}
          {script && (
            <button
              onClick={() => isPlaying ? stopSpeech() : speak(script)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {isPlaying ? (
                <>
                  <span className="flex gap-0.5">
                    <span className="w-0.5 h-3 bg-white rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                    <span className="w-0.5 h-3 bg-white rounded-full animate-[pulse_0.6s_ease-in-out_0.2s_infinite]" />
                    <span className="w-0.5 h-3 bg-white rounded-full animate-[pulse_0.6s_ease-in-out_0.4s_infinite]" />
                  </span>
                  Pause
                </>
              ) : '▶ Play'}
            </button>
          )}
          {!script && <span className="text-xs text-slate-400 italic">No narration</span>}

          {/* Script toggle */}
          {script && (
            <button
              onClick={() => setShowScript(s => !s)}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showScript ? 'Hide script' : 'Show script'}
            </button>
          )}
        </div>
      </div>

      {/* Script panel */}
      {showScript && script && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
          <p className="text-xs text-amber-800 leading-relaxed max-w-4xl mx-auto">{script}</p>
        </div>
      )}

      {/* Slide */}
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className="w-full max-w-3xl">
          <SlidePanel slide={slide} slideCount={slides.length} highlights={[]} />
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white/80 backdrop-blur border-t border-gray-200 px-6 py-4 flex items-center justify-between max-w-3xl mx-auto w-full">
        <button
          onClick={() => goTo(Math.max(0, index - 1))}
          disabled={index === 0}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold disabled:opacity-30 hover:bg-slate-200 transition-all active:scale-95"
        >
          ← Prev
        </button>

        <div className="flex gap-1.5 items-center">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              title={slides[i].title}
              className={`rounded-full transition-all duration-200 ${
                i === index
                  ? 'w-5 h-2 bg-indigo-500'
                  : 'w-2 h-2 bg-gray-300 hover:bg-indigo-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => goTo(Math.min(slides.length - 1, index + 1))}
          disabled={index === slides.length - 1}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-30 hover:bg-indigo-700 transition-all active:scale-95"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
