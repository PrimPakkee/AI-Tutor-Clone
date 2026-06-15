'use client'
import { useEffect, useRef } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { Slide } from '@/lib/types'
import { ParabolaGraph } from './ParabolaGraph'

type Props = {
  slide: Slide
  slideCount: number
  highlights: string[]
}

function KaTeXSpan({ formula }: { formula: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    try {
      katex.render(formula, ref.current, { throwOnError: false, displayMode: true })
    } catch {
      if (ref.current) ref.current.textContent = formula
    }
  }, [formula])
  return <span ref={ref} />
}

export function SlidePanel({ slide, slideCount, highlights: _highlights }: Props) {
  const { title, content, index } = slide

  return (
    <div className="flex-1 flex flex-col min-h-0 p-3">
      <div
        className="w-full bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col overflow-hidden"
        style={{ aspectRatio: '4/3' }}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          <span className="text-xs text-slate-300">{index} / {slideCount}</span>
        </div>

        <div className="flex-1 flex flex-col gap-3 p-5 overflow-hidden">
          {content.formula && (
            <div className="formula-block bg-indigo-50 border-l-4 border-indigo-500 px-4 py-3 rounded-r-md">
              <KaTeXSpan formula={content.formula} />
            </div>
          )}

          {content.graph && (
            <div className="flex justify-center bg-gray-50 border border-gray-100 rounded-md py-2">
              <ParabolaGraph spec={content.graph} />
            </div>
          )}

          {content.bullets && content.bullets.length > 0 && (
            <ul className="space-y-2 flex-1">
              {content.bullets.map((b, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700 leading-snug">
                  <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
