'use client'
import type { ReactNode } from 'react'
import type { Slide } from '@/lib/types'
import { AnnotatedParabola, type IntroFocus } from './AnnotatedParabola'

type Props = {
  slide: Slide
  slideCount: number
  sceneState: Record<string, unknown>
}

type FactDef = {
  key: NonNullable<IntroFocus>
  testId: string
  content: ReactNode
}

const FACTS: FactDef[] = [
  {
    key: 'dir',
    testId: 'fact-dir',
    content: <><strong>a &gt; 0</strong> opens ↑ (min at vertex) &nbsp;·&nbsp; <strong>a &lt; 0</strong> opens ↓ (max at vertex)</>,
  },
  {
    key: 'axis',
    testId: 'fact-axis',
    content: <>Axis of symmetry: <strong>x = h</strong> or <strong>x = −b/2a</strong></>,
  },
  {
    key: 'roots',
    testId: 'fact-roots',
    content: <>Roots = f(x) = 0 — can be <strong>2, 1, or 0</strong> real solutions</>,
  },
]

export function QuadraticIntroSlide({ slide, slideCount, sceneState }: Props) {
  const focus = (sceneState.focus as IntroFocus) ?? null

  function cardCls(match: NonNullable<IntroFocus>, activeExtra: string, baseExtra: string): string {
    if (focus === null) return baseExtra
    if (focus === match) return `${baseExtra} ${activeExtra}`
    return `${baseExtra} opacity-40`
  }

  function factCls(match: NonNullable<IntroFocus>): string {
    const base = 'flex gap-2 items-start px-3 py-2 rounded-lg border border-l-4 transition-all duration-200'
    if (focus === null) return `${base} bg-white border-slate-100 border-l-indigo-200`
    if (focus === match) return `${base} bg-amber-50 border-amber-300 border-l-amber-400`
    return `${base} bg-white border-slate-100 border-l-indigo-200 opacity-40`
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-white/60 text-[11px] font-extrabold tracking-widest uppercase shrink-0">CONCEPT</span>
          <h2 className="text-base font-bold text-white truncate">{slide.title}</h2>
        </div>
        <span className="text-white/50 text-xs shrink-0 ml-3">{slide.index} / {slideCount}</span>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left panel */}
        <div className="w-[40%] flex flex-col gap-2 p-3 border-r border-slate-100 bg-white overflow-y-auto">

          {/* Standard Form card */}
          <div
            data-testid="card-std"
            className={cardCls(
              'std',
              'border-indigo-400 ring-2 ring-indigo-200',
              'rounded-xl p-3 border-2 transition-all duration-200 bg-indigo-50 border-indigo-200'
            )}
          >
            <div className="text-[9px] font-extrabold text-indigo-600 tracking-widest uppercase mb-1.5">Standard Form</div>
            <div className="font-serif text-[15px] font-bold text-indigo-900 mb-2">f(x) = ax² + bx + c</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded">y-intercept = c</span>
              <span className="text-[11px] text-slate-500">plug in x = 0</span>
            </div>
          </div>

          {/* Vertex Form card */}
          <div
            data-testid="card-vtx"
            className={cardCls(
              'vtx',
              'border-amber-400 ring-2 ring-amber-200',
              'rounded-xl p-3 border-2 transition-all duration-200 bg-amber-50 border-amber-200'
            )}
          >
            <div className="text-[9px] font-extrabold text-amber-700 tracking-widest uppercase mb-1.5">Vertex Form</div>
            <div className="font-serif text-[15px] font-bold text-amber-900 mb-2">f(x) = a(x − h)² + k</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded">vertex = (h, k)</span>
              <span className="text-[11px] text-slate-500">no calculation</span>
            </div>
          </div>

          <div className="h-px bg-slate-100 -mx-3" />

          {/* Fact rows */}
          {FACTS.map(({ key, testId, content }) => (
            <div key={key} data-testid={testId} className={factCls(key)}>
              <span className={`text-sm mt-0.5 shrink-0 ${focus === key ? 'text-amber-500' : 'text-indigo-400'}`}>◆</span>
              <span className="text-[11.5px] text-slate-700 leading-snug">{content}</span>
            </div>
          ))}

          {/* SAT tip */}
          <div className="mt-auto bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 rounded-xl p-3">
            <div className="text-[9px] font-extrabold text-amber-800 tracking-widest uppercase mb-1">⭐ SAT Strategy</div>
            <p className="text-[11.5px] text-amber-900 leading-snug">
              SAT gives you one form, asks about the other — identify the form first.
            </p>
          </div>
        </div>

        {/* Right panel: annotated graph */}
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-50/40">
          <AnnotatedParabola focus={focus} />
        </div>
      </div>
    </>
  )
}
