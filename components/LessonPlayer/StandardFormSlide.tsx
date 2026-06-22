'use client'
import type { Slide } from '@/lib/types'
import { AnnotatedParabola, type IntroFocus } from './AnnotatedParabola'

export type StdFocus = 'a' | 'b' | 'c' | null

const FOCUS_MAP: Record<NonNullable<StdFocus>, IntroFocus> = { a: 'dir', b: 'axis', c: 'std' }

type Props = {
  slide: Slide
  slideCount: number
  sceneState: Record<string, unknown>
}

export function StandardFormSlide({ slide, slideCount, sceneState }: Props) {
  const focus = (sceneState.focus as StdFocus) ?? null
  const introFocus: IntroFocus = focus ? FOCUS_MAP[focus] : null

  function cardCls(match: NonNullable<StdFocus>, activeExtra: string, baseExtra: string): string {
    if (focus === null) return baseExtra
    if (focus === match) return `${baseExtra} ${activeExtra}`
    return `${baseExtra} opacity-40`
  }

  const satCls = `mt-auto bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-300 rounded-xl p-3 transition-all duration-200${focus !== null ? ' opacity-40' : ''}`

  return (
    <>
      {/* Header */}
      <div data-testid="standard-form-slide" className="bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-3.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-white/60 text-[11px] font-extrabold tracking-widest uppercase shrink-0">CONCEPT</span>
          <h2 className="text-base font-bold text-white truncate">{slide.title}</h2>
        </div>
        <span className="text-white/50 text-xs shrink-0 ml-3">{slide.index} / {slideCount}</span>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Left panel */}
        <div className="w-[42%] flex flex-col gap-2 p-3 border-r border-slate-100 bg-white overflow-y-auto">

          {/* Formula row */}
          <div className="font-serif text-[15px] font-bold text-center py-2 border-b border-slate-100 text-slate-800">
            f(x) = <span className="text-indigo-500">a</span>x²{' '}
            + <span className="text-amber-500">b</span>x{' '}
            + <span className="text-emerald-500">c</span>
          </div>

          {/* a card */}
          <div
            data-testid="card-a"
            className={cardCls(
              'a',
              'border-indigo-400 ring-2 ring-indigo-300',
              'rounded-xl p-3 border-2 transition-all duration-200 bg-indigo-50'
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-extrabold text-indigo-600 tracking-widest uppercase">Leading Coefficient  a</span>
              <span className="text-[9.5px] font-bold bg-indigo-200 text-indigo-900 px-2 py-0.5 rounded-full">direction &amp; shape</span>
            </div>
            <div className="font-serif text-[13px] font-bold text-indigo-800 mb-2">sign of a → min or max</div>
            <div className="flex flex-col gap-1">
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                <span><strong>a &gt; 0</strong> — opens ↑, vertex is minimum</span>
              </div>
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                <span><strong>a &lt; 0</strong> — opens ↓, vertex is maximum</span>
              </div>
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1 shrink-0" />
                <span>|a| larger → narrower; |a| smaller → wider</span>
              </div>
            </div>
          </div>

          {/* b card */}
          <div
            data-testid="card-b"
            className={cardCls(
              'b',
              'border-amber-400 ring-2 ring-amber-300',
              'rounded-xl p-3 border-2 transition-all duration-200 bg-amber-50'
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-extrabold text-amber-700 tracking-widest uppercase">Middle Coefficient  b</span>
              <span className="text-[9.5px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">axis of symmetry</span>
            </div>
            <div className="font-serif text-[13px] font-bold text-amber-800 mb-2">x = −b / 2a</div>
            <div className="flex flex-col gap-1">
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                <span>axis of symmetry: <strong>x = −b/2a</strong></span>
              </div>
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                <span>vertex x-coord = −b/2a, then plug in for y</span>
              </div>
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                <span>no direct value you can read off</span>
              </div>
            </div>
          </div>

          {/* c card */}
          <div
            data-testid="card-c"
            className={cardCls(
              'c',
              'border-emerald-400 ring-2 ring-emerald-300',
              'rounded-xl p-3 border-2 transition-all duration-200 bg-emerald-50'
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-extrabold text-emerald-700 tracking-widest uppercase">Constant  c</span>
              <span className="text-[9.5px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">y-intercept = c</span>
            </div>
            <div className="font-serif text-[13px] font-bold text-emerald-800 mb-2">f(0) = c</div>
            <div className="flex flex-col gap-1">
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span><strong>c</strong> is the y-intercept — free to read</span>
              </div>
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>set x = 0, all other terms vanish</span>
              </div>
              <div className="flex gap-1.5 items-start text-[10.5px] text-slate-700 leading-snug">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                <span>parabola crosses y-axis at (0, c)</span>
              </div>
            </div>
          </div>

          {/* SAT tip */}
          <div data-testid="sat-tip" className={satCls}>
            <div className="text-[9px] font-extrabold text-amber-800 tracking-widest uppercase mb-1">⭐ SAT Strategy</div>
            <p className="text-[11.5px] text-amber-900 leading-snug">
              Standard form reveals c instantly. For the vertex or axis, compute x = −b/2a — memorize this formula.
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-50/40">
          <AnnotatedParabola focus={introFocus} />
        </div>
      </div>
    </>
  )
}
