'use client'
import { useEffect, useRef, useState, memo, type CSSProperties } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { Slide, Annotation } from '@/lib/types'
import { ParabolaGraph } from './ParabolaGraph'
import { InteractiveParabola } from './InteractiveParabola'
import { DiscriminantViz } from './DiscriminantViz'
import { CompletingSquare } from './CompletingSquare'
import { QuadraticIntroSlide } from './QuadraticIntroSlide'

type Props = {
  slide: Slide
  slideCount: number
  highlights: string[]
  sceneState?: Record<string, unknown>
  annotations?: Annotation[]
}

type SlideType = 'concept' | 'question' | 'solution' | 'summary'

function detectSlideType(title: string): SlideType {
  const t = title.toLowerCase()
  if (t.includes('solution')) return 'solution'
  if (t.includes('question')) return 'question'
  if (t.includes('summary')) return 'summary'
  return 'concept'
}

function parseChoices(text: string): Array<{ label: string; value: string }> | null {
  const m = text.match(/A\)\s*(.+?)\s{2,}B\)\s*(.+?)\s{2,}C\)\s*(.+?)\s{2,}D\)\s*(.+)/)
  if (!m) return null
  return [
    { label: 'A', value: m[1].trim() },
    { label: 'B', value: m[2].trim() },
    { label: 'C', value: m[3].trim() },
    { label: 'D', value: m[4].trim() },
  ]
}

function isFinalAnswer(text: string) { return text.includes('Answer:') && text.includes('✓') }

// ---------- KaTeX ----------

const KaTeX = memo(function KaTeX({ formula, block = false }: { formula: string; block?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!ref.current) return
    try { katex.render(formula, ref.current, { throwOnError: false, displayMode: block, trust: true }) }
    catch { if (ref.current) ref.current.textContent = formula }
  }, [formula, block])
  return <span ref={ref} />
})

// ---------- Handwritten annotation overlay ----------

function AnnotationLayer({ annotations }: { annotations: Annotation[] }) {
  if (!annotations.length) return null
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {annotations.map((a, i) => {
        const duration = Math.max(0.4, a.text.length * 0.065)
        const fontSize = a.size === 'lg' ? '1.7rem' : a.size === 'sm' ? '1rem' : '1.35rem'
        const color = a.color ?? '#d97706'
        const rotate = a.rotate ?? -2
        return (
          <div
            key={`${a.at}-${i}`}
            style={{
              position: 'absolute',
              left: `${a.x}%`,
              top: `${a.y}%`,
              fontFamily: 'var(--font-caveat), cursive',
              fontSize,
              fontWeight: 700,
              color,
              transform: `rotate(${rotate}deg)`,
              whiteSpace: 'nowrap',
              lineHeight: 1.1,
              textShadow: '0 1px 3px rgba(0,0,0,0.15)',
              animation: `write-in ${duration}s linear forwards`,
            }}
          >
            {a.text}
          </div>
        )
      })}
    </div>
  )
}

// ---------- Colored header (by slide type) ----------

const THEMES = {
  concept:  { grad: 'from-indigo-500 to-violet-600',  badge: 'CONCEPT'  },
  question: { grad: 'from-amber-400 to-orange-500',   badge: 'SAT QUIZ' },
  solution: { grad: 'from-emerald-500 to-teal-600',   badge: 'SOLUTION' },
  summary:  { grad: 'from-violet-500 to-purple-700',  badge: 'SUMMARY'  },
} as const

function SlideHeader({ type, title, index, total }: { type: SlideType; title: string; index: number; total: number }) {
  const { grad, badge } = THEMES[type]
  return (
    <div className={`bg-gradient-to-r ${grad} px-5 py-3.5 flex items-center justify-between shrink-0`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-white/60 text-[11px] font-extrabold tracking-widest uppercase shrink-0">{badge}</span>
        <h2 className="text-base font-bold text-white truncate">{title}</h2>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-3">
        <span className="text-white/50 text-xs">{index} / {total}</span>
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`rounded-full transition-all duration-300 ${
              i + 1 === index ? 'w-3 h-1.5 bg-white' : i + 1 < index ? 'w-1.5 h-1.5 bg-white/40' : 'w-1.5 h-1.5 bg-white/20'
            }`} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ---------- Concept slide ----------

function BulletList({ bullets, satTipIdx, highlights }: { bullets: string[]; satTipIdx: number; highlights: string[] }) {
  return (
    <div className="flex flex-col gap-2">
      {bullets.map((b, i) => {
        const isSAT = i === satTipIdx
        const isHL = highlights.includes(b)
        const isEmphasis = isHL || isSAT
        return (
          <div
            key={isHL ? `hl-${i}` : i}
            className={`bullet-enter flex gap-3 items-start rounded-xl px-3.5 py-2.5 border-l-4 ${
              isHL      ? 'bg-amber-50 border-amber-400 border border-amber-200 highlight-mark'
              : isSAT   ? 'bg-amber-50 border-amber-400 border border-amber-200'
                        : 'bg-white border-indigo-300 border border-slate-100 shadow-sm'
            }`}
            style={{ animationDelay: `${0.1 + i * 0.12}s` }}
          >
            <span className={`text-lg leading-none shrink-0 mt-0.5 ${isEmphasis ? 'text-amber-500' : 'text-indigo-400'}`}>
              {isEmphasis ? '★' : '◆'}
            </span>
            <span className={`text-base leading-snug ${isEmphasis ? 'text-amber-800 font-semibold' : 'text-slate-700'}`}>{b}</span>
          </div>
        )
      })}
    </div>
  )
}

function ConceptSlide({ slide, slideCount, highlights, sceneState }: { slide: Slide; slideCount: number; highlights: string[]; sceneState: Record<string, unknown> }) {
  const { title, content, index } = slide
  const { variant } = content
  const hasGraph = !!content.graph
  const bullets = content.bullets ?? []
  const satTipIdx = bullets.findIndex(b => b.toLowerCase().includes('sat'))
  const [highlightParam, setHighlightParam] = useState<'h' | 'k' | null>(null)

  // Drive formula-highlight param from scene events
  useEffect(() => {
    if ('highlight' in sceneState) setHighlightParam(sceneState.highlight as 'h' | 'k' | null)
  }, [sceneState])

  // Vertex-explorer: interactive parabola replaces static graph + formula
  if (variant === 'vertex-explorer') {
    return (
      <>
        <SlideHeader type="concept" title={title} index={index} total={slideCount} />
        <div className="flex-1 flex gap-3 px-5 pt-3 pb-4 min-h-0 overflow-hidden bg-indigo-50/20">
          <div className="w-[58%] flex items-start justify-center bg-white border border-slate-100 rounded-2xl p-3 shadow-sm overflow-auto">
            <InteractiveParabola sceneState={sceneState} />
          </div>
          {bullets.length > 0 && (
            <div className="flex-1 flex flex-col gap-2 justify-center">
              <BulletList bullets={bullets} satTipIdx={satTipIdx} highlights={highlights} />
            </div>
          )}
        </div>
      </>
    )
  }

  // Discriminant: DiscriminantViz replaces static graph, formula stays above
  if (variant === 'discriminant') {
    return (
      <>
        <SlideHeader type="concept" title={title} index={index} total={slideCount} />
        <div className="flex-1 flex flex-col px-5 pt-3 pb-4 gap-2 min-h-0 overflow-hidden bg-indigo-50/20">
          {content.formula && (
            <div
              data-testid="formula-block"
              className="formula-enter shrink-0 bg-white border-2 border-indigo-200 rounded-2xl px-6 py-3 flex items-center justify-center shadow-md"
              style={{ animationDelay: '0.05s' }}
            >
              <KaTeX formula={content.formula} block />
            </div>
          )}
          <div className="flex-1 flex gap-3 min-h-0">
            <div className="w-[58%] flex items-start justify-center bg-white border border-slate-100 rounded-2xl p-3 shadow-sm overflow-auto">
              <DiscriminantViz sceneState={sceneState} />
            </div>
            {bullets.length > 0 && (
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <BulletList bullets={bullets} satTipIdx={satTipIdx} highlights={highlights} />
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // Formula-highlight: interactive formula chips control graph element highlighting
  if (variant === 'formula-highlight' && content.graph) {
    const [h, k] = content.graph.vertex
    return (
      <>
        <SlideHeader type="concept" title={title} index={index} total={slideCount} />
        <div className="flex-1 flex flex-col px-5 pt-3 pb-4 gap-2 min-h-0 overflow-hidden bg-indigo-50/20">
          {/* Interactive formula */}
          <div
            data-testid="formula-block"
            className="formula-enter shrink-0 bg-white border-2 border-indigo-200 rounded-2xl px-5 py-3 flex items-center justify-center gap-1 shadow-md text-base font-mono"
            style={{ animationDelay: '0.05s' }}
          >
            <span className="text-slate-500">f(x) = 3(x −</span>
            <span
              className={`px-1.5 py-0.5 rounded border-2 font-bold cursor-default transition-all duration-150 ${
                highlightParam === 'h'
                  ? 'bg-indigo-200 border-indigo-500 text-indigo-900 scale-110'
                  : 'bg-indigo-100 border-indigo-300 text-indigo-800'
              }`}
              onMouseEnter={() => setHighlightParam('h')}
              onMouseLeave={() => setHighlightParam(null)}
            >{h}</span>
            <span className="text-slate-500">)² +</span>
            <span
              className={`px-1.5 py-0.5 rounded border-2 font-bold cursor-default transition-all duration-150 ${
                highlightParam === 'k'
                  ? 'bg-amber-200 border-amber-500 text-amber-900 scale-110'
                  : 'bg-amber-100 border-amber-300 text-amber-800'
              }`}
              onMouseEnter={() => setHighlightParam('k')}
              onMouseLeave={() => setHighlightParam(null)}
            >{k}</span>
            <span className="text-xs text-slate-400 ml-2 font-sans">← hover to highlight</span>
          </div>
          <div className="flex-1 flex gap-3 min-h-0">
            <div className="shrink-0 bg-white border border-slate-100 rounded-2xl flex items-center justify-center p-3 shadow-sm" style={{ width: '46%' }}>
              <ParabolaGraph spec={content.graph} highlightH={highlightParam === 'h'} highlightK={highlightParam === 'k'} />
            </div>
            {bullets.length > 0 && (
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <BulletList bullets={bullets} satTipIdx={satTipIdx} highlights={highlights} />
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  // Default concept slide
  return (
    <>
      <SlideHeader type="concept" title={title} index={index} total={slideCount} />
      <div className="flex-1 flex flex-col px-5 pt-4 pb-4 gap-3 min-h-0 overflow-hidden bg-indigo-50/20">
        {content.formula && (
          <div
            data-testid="formula-block"
            className="formula-enter shrink-0 bg-white border-2 border-indigo-200 rounded-2xl px-6 py-4 flex items-center justify-center shadow-md"
            style={{ animationDelay: '0.05s' }}
          >
            <KaTeX formula={content.formula} block />
          </div>
        )}

        <div className={`flex-1 flex gap-3 min-h-0 ${hasGraph ? 'flex-row' : 'flex-col justify-center'}`}>
          {content.graph && (
            <div className="shrink-0 bg-white border border-slate-100 rounded-2xl flex items-center justify-center p-3 shadow-sm" style={{ width: '46%' }}>
              <ParabolaGraph spec={content.graph} />
            </div>
          )}

          {bullets.length > 0 && (
            <div className={`flex flex-col gap-2 ${hasGraph ? 'flex-1 justify-center' : ''}`}>
              <BulletList bullets={bullets} satTipIdx={satTipIdx} highlights={highlights} />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ---------- SAT question slide ----------

function QuestionSlide({ slide, slideCount }: { slide: Slide; slideCount: number }) {
  const { title, content, index } = slide
  const bullets = content.bullets ?? []
  const correctChoice = content.correctChoice ?? null
  const [selected, setSelected] = useState<string | null>(null)
  const [shakeKey, setShakeKey] = useState(0)
  const [showSolution, setShowSolution] = useState(false)

  const questionLines: string[] = []
  let choices: Array<{ label: string; value: string }> | null = null
  for (const b of bullets) {
    const parsed = parseChoices(b)
    if (parsed) choices = parsed
    else questionLines.push(b)
  }
  const hintIdx = questionLines.findIndex(b => b.toLowerCase().startsWith('hint'))

  function handleSelect(label: string) {
    if (selected) return
    setSelected(label)
    if (label !== correctChoice) setShakeKey(k => k + 1)
  }

  return (
    <>
      <SlideHeader type="question" title={title} index={index} total={slideCount} />
      <div className="flex-1 flex flex-col px-5 pt-3 pb-4 gap-3 min-h-0 overflow-hidden bg-amber-50/30">
        {content.formula && (
          <div
            className="formula-enter shrink-0 bg-white border-2 border-amber-200 rounded-2xl px-6 py-3.5 flex items-center justify-center shadow-md"
            style={{ animationDelay: '0.05s' }}
          >
            <KaTeX formula={content.formula} block />
          </div>
        )}
        {content.graph && (
          <div className="shrink-0 bg-white border border-slate-100 rounded-2xl flex items-center justify-center p-2 shadow-sm" style={{ height: '26%' }}>
            <ParabolaGraph spec={content.graph} />
          </div>
        )}

        <div className="flex flex-col gap-1">
          {questionLines.map((b, i) => {
            const isHint = i === hintIdx
            return (
              <p key={i} className={`bullet-enter text-sm leading-snug ${
                isHint
                  ? 'text-amber-700 bg-amber-100 border border-amber-300 rounded-lg px-3 py-1.5 font-medium'
                  : 'text-slate-800 font-semibold text-base'
              }`} style={{ animationDelay: `${0.08 + i * 0.1}s` }}>
                {b}
              </p>
            )
          })}
        </div>

        {choices ? (
          <>
            <div key={shakeKey} className={`grid grid-cols-2 gap-2.5 flex-1 content-center ${shakeKey > 0 && selected && selected !== correctChoice ? 'shake' : ''}`}>
              {choices.map(({ label, value }, i) => {
                const isSelected = selected === label
                const isCorrect = label === correctChoice
                const revealCorrect = !!selected && selected !== correctChoice && isCorrect

                let cardCls = 'choice-enter relative flex items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all duration-200 select-none cursor-pointer'
                if (!selected) cardCls += ' bg-white border-gray-200 hover:border-amber-300 hover:bg-amber-50 hover:shadow-md hover:-translate-y-0.5'
                else if (isSelected && isCorrect) cardCls += ' bg-emerald-50 border-emerald-400 shadow-sm'
                else if (isSelected && !isCorrect) cardCls += ' bg-red-50 border-red-400 shadow-sm'
                else if (revealCorrect) cardCls += ' bg-emerald-50 border-emerald-300'
                else cardCls += ' bg-white border-gray-100 opacity-40'

                let circleCls = 'w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-extrabold shrink-0 transition-all duration-200'
                if (!selected) circleCls += ' border-gray-300 text-slate-500'
                else if (isSelected && isCorrect) circleCls += ' bg-emerald-500 border-emerald-500 text-white'
                else if (isSelected && !isCorrect) circleCls += ' bg-red-400 border-red-400 text-white'
                else if (revealCorrect) circleCls += ' bg-emerald-400 border-emerald-400 text-white'
                else circleCls += ' border-gray-200 text-slate-300'

                return (
                  <div
                    key={label}
                    className={cardCls}
                    style={{ animationDelay: `${0.18 + i * 0.08}s` }}
                    onClick={() => handleSelect(label)}
                  >
                    <span className={circleCls}>{label}</span>
                    <span className="text-[15px] font-semibold text-slate-700 leading-snug">{value}</span>
                    {isSelected && isCorrect && <span className="bounce-in ml-auto text-emerald-500 text-xl shrink-0">✓</span>}
                    {isSelected && !isCorrect && <span className="bounce-in ml-auto text-red-400 text-xl shrink-0">✗</span>}
                    {revealCorrect && <span className="bounce-in ml-auto text-emerald-500 text-sm font-bold shrink-0">✓</span>}
                  </div>
                )
              })}
            </div>
            {selected && (
              <p className="answer-pop text-center text-sm font-bold">
                {selected === correctChoice
                  ? <span className="text-emerald-600">🎉 Correct! Well done.</span>
                  : <span className="text-red-500">Not quite — the answer is <strong>{correctChoice}</strong>. Try to understand why!</span>
                }
              </p>
            )}
          </>
        ) : (
          /* Word problem — no MCQ, show a "Show Solution" toggle */
          <div className="flex-1 flex flex-col gap-2 justify-end">
            <button
              onClick={() => setShowSolution(s => !s)}
              className="self-start bullet-enter bg-amber-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow hover:bg-amber-600 active:scale-95 transition-all"
              style={{ animationDelay: '0.4s' }}
            >
              {showSolution ? 'Hide Solution ▲' : 'Show Solution ▼'}
            </button>
            {showSolution && content.solution && (
              <div className="step-enter bg-white border-2 border-emerald-300 rounded-2xl px-4 py-3 text-[15px] text-slate-700 leading-relaxed space-y-1.5">
                {content.solution.steps.map((step, i) => {
                  const colonIdx = step.indexOf(':')
                  const hasLabel = colonIdx > 0 && colonIdx < 30
                  return (
                    <p key={i}>
                      {hasLabel ? (
                        <>
                          <span className="font-bold text-emerald-600">Step {i + 1}:</span>{' '}
                          <span className="font-mono text-xs bg-slate-50 rounded px-1">{step.slice(colonIdx + 1).trim()}</span>
                        </>
                      ) : (
                        <><span className="font-bold text-emerald-600">Step {i + 1}:</span> {step}</>
                      )}
                    </p>
                  )
                })}
                <p className="font-bold text-emerald-700 text-base">✓ {content.solution.answer}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ---------- Solution slide ----------

function SolutionSlide({ slide, slideCount, highlights }: { slide: Slide; slideCount: number; highlights: string[] }) {
  const { title, content, index } = slide
  const { variant } = content
  const bullets = content.bullets ?? []
  const steps = bullets.filter(b => !isFinalAnswer(b))
  const finalAnswer = bullets.find(b => isFinalAnswer(b))
  const [visibleCount, setVisibleCount] = useState(1)

  useEffect(() => {
    const timers = steps.slice(1).map((_, i) =>
      setTimeout(() => setVisibleCount(i + 2), (i + 1) * 500)
    )
    return () => timers.forEach(clearTimeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (visibleCount === steps.length && finalAnswer) {
      const t = setTimeout(() => setVisibleCount(steps.length + 1), 500)
      return () => clearTimeout(t)
    }
  }, [visibleCount, steps.length, finalAnswer])

  const showAnswer = finalAnswer && visibleCount > steps.length

  return (
    <>
      <SlideHeader type="solution" title={title} index={index} total={slideCount} />
      <div className="flex-1 flex flex-col px-5 pt-4 pb-4 gap-3 min-h-0 overflow-hidden bg-emerald-50/20">
        {content.formula && (
          <div
            data-testid="formula-block"
            className="formula-enter shrink-0 bg-white border-2 border-emerald-200 rounded-2xl px-6 py-3.5 flex items-center justify-center shadow-md"
            style={{ animationDelay: '0.05s' }}
          >
            <KaTeX formula={content.formula} block />
          </div>
        )}

        {/* Timeline steps */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="relative flex flex-col">
            {steps.slice(0, visibleCount).map((step, i) => {
              const isHL = highlights.includes(step)
              return (
              <div key={isHL ? `hl-${i}` : i} className="step-enter flex gap-3 relative pb-3">
                {i < Math.min(visibleCount, steps.length) - 1 && (
                  <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-emerald-200" />
                )}
                <div className="w-7 h-7 rounded-full bg-emerald-100 border-2 border-emerald-300 text-emerald-700 text-xs font-extrabold flex items-center justify-center shrink-0 relative z-10 shadow-sm">
                  {i + 1}
                </div>
                <div className={`flex-1 bg-white rounded-xl px-3.5 py-2.5 text-[15px] text-slate-700 leading-snug shadow-sm ${isHL ? 'border border-amber-300 highlight-mark' : 'border border-emerald-100'}`}>
                  {step}
                </div>
              </div>
              )
            })}
          </div>
        </div>

        {showAnswer && (
          <div className="answer-pop shrink-0 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl px-5 py-3.5 flex items-center gap-3 shadow-lg">
            <span className="text-3xl shrink-0">✓</span>
            <span className="text-base font-bold text-white">
              {finalAnswer.replace(/^.*?Answer:\s*/, 'Answer: ')}
            </span>
          </div>
        )}
        {showAnswer && variant === 'completing-square' && (
          <div className="shrink-0">
            <CompletingSquare />
          </div>
        )}
      </div>
    </>
  )
}

// ---------- Summary slide ----------

function SummarySlide({ slide, slideCount, highlights }: { slide: Slide; slideCount: number; highlights: string[] }) {
  const { title, content, index } = slide
  const bullets = content.bullets ?? []
  const practiceIdx = bullets.findIndex(b => /^practice:/i.test(b))
  const summaryItems = practiceIdx >= 0 ? bullets.slice(0, practiceIdx) : bullets
  const practice = practiceIdx >= 0 ? bullets[practiceIdx] : null
  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <>
      <SlideHeader type="summary" title={title} index={index} total={slideCount} />
      <div className="flex-1 flex flex-col px-5 pt-4 pb-4 gap-2.5 min-h-0 overflow-hidden bg-violet-50/20">
        <div className="flex-1 flex flex-col justify-center gap-2">
          {summaryItems.map((item, i) => {
            const clean = item.replace(/^✓\s*/, '')
            const isHL = highlights.includes(item) || highlights.includes(clean)
            return (
            <div
              key={isHL ? `hl-${i}` : i}
              className={`bullet-enter flex gap-3 items-center bg-white border-l-4 border-violet-400 border border-violet-100 rounded-xl px-4 py-2.5 shadow-sm ${isHL ? 'highlight-mark' : ''}`}
              style={{ animationDelay: `${0.08 + i * 0.1}s` }}
            >
              <span className="text-violet-500 font-bold text-lg leading-none shrink-0">✓</span>
              <span className={`text-[15px] ${isHL ? 'text-amber-800 font-semibold' : 'text-slate-700'}`}>{clean}</span>
            </div>
            )
          })}
        </div>

        {practice && (
          <div
            className="bullet-enter shrink-0 bg-white border-2 border-violet-300 rounded-2xl px-4 py-3 shadow-md"
            style={{ animationDelay: `${0.08 + summaryItems.length * 0.1}s` }}
          >
            <p className="text-[11px] font-extrabold text-violet-400 uppercase tracking-widest mb-1.5">
              Practice Problem
            </p>
            <p className="text-[15px] font-semibold text-slate-800 mb-2.5">
              {practice.replace(/^practice:\s*/i, '')}
            </p>
            <button
              onClick={() => setShowAnswer(s => !s)}
              className="text-xs font-bold text-violet-600 hover:text-violet-800 underline underline-offset-2 transition-colors"
            >
              {showAnswer ? 'Hide answer ▲' : 'Reveal answer ▼'}
            </button>
            {showAnswer && (
              <div className="step-enter mt-2 bg-violet-50 border border-violet-200 rounded-xl px-3 py-2 text-[15px] font-mono text-violet-900">
                y = x² − 4x + 7 = (x² − 4x + 4) + 3 = <strong>(x − 2)² + 3</strong>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ---------- Cover slide ----------

function CoverSlide({ slide, slideCount, highlights }: { slide: Slide; slideCount: number; highlights: string[] }) {
  const bullets = slide.content.bullets ?? []

  // Decorative parabola for the right panel
  const DW = 180, DH = 220
  const vcx = DW / 2, vcy = 158          // vertex SVG position
  const parabolaPts: string[] = []
  for (let dx = -DW; dx <= DW; dx += 2) {
    const svgX = vcx + dx
    const svgY = vcy - 0.011 * dx * dx   // opens upward in SVG
    if (svgX >= 0 && svgX <= DW && svgY >= 0 && svgY <= DH) {
      parabolaPts.push(`${svgX.toFixed(0)},${svgY.toFixed(1)}`)
    }
  }
  const parabolaD = parabolaPts.length > 1
    ? `M ${parabolaPts[0]} L ${parabolaPts.slice(1).join(' L ')}`
    : ''

  return (
    <div className="flex-1 flex flex-row overflow-hidden bg-gradient-to-br from-indigo-800 via-indigo-900 to-violet-950 relative">
      {/* Subtle dot-grid texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      {/* Left: text content */}
      <div className="flex-1 flex flex-col justify-between px-7 py-5 relative z-10 min-w-0">
        {/* Top badge */}
        <div className="flex items-center gap-2">
          <span className="text-indigo-300 text-[11px] font-extrabold tracking-[0.2em] uppercase">SAT Math Prep</span>
          <span className="flex-1 h-px bg-indigo-700/60" />
          <span className="text-indigo-400 text-[11px] font-mono">{slideCount - 1} slides</span>
        </div>

        {/* Title block */}
        <div className="flex flex-col gap-1">
          <p className="text-indigo-300/80 text-sm font-semibold tracking-wide">Unit 3</p>
          <h1 className="text-white font-black leading-tight" style={{ fontSize: '2.5rem' }}>
            Quadratic<br />Functions
          </h1>
          <h2 className="text-indigo-200/70 font-medium text-[19px] leading-snug">
            Parabolas, Vertex Form &amp; the Discriminant
          </h2>
        </div>

        {/* Objectives */}
        <div className="flex flex-col gap-1.5">
          <p className="text-indigo-400 text-[11px] font-extrabold tracking-widest uppercase mb-0.5">
            What you&apos;ll master
          </p>
          {bullets.map((b, i) => {
            const isHL = highlights.includes(b)
            return (
            <div key={isHL ? `hl-${i}` : i} className={`flex items-start gap-2 rounded-lg px-1.5 py-0.5 ${isHL ? 'highlight-mark' : ''}`}>
              <span className="mt-0.5 w-4 h-4 rounded-full bg-indigo-500/40 border border-indigo-400/40 flex items-center justify-center text-[10px] font-bold text-indigo-200 shrink-0">
                {i + 1}
              </span>
              <span className={`text-sm leading-snug ${isHL ? 'text-white font-semibold' : 'text-indigo-100/75'}`}>{b}</span>
            </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3">
          <span className="text-indigo-500 text-[11px] font-mono">~15 min</span>
          <span className="flex-1 h-px bg-indigo-800" />
          <span className="text-indigo-400 text-[11px] font-extrabold tracking-widest uppercase">Start →</span>
        </div>
      </div>

      {/* Right: decorative parabola illustration */}
      <div className="shrink-0 flex items-end justify-center relative overflow-hidden" style={{ width: '38%' }}>
        {/* Glow behind vertex */}
        <div className="absolute rounded-full bg-amber-500/20 blur-2xl"
          style={{ width: 100, height: 100, left: '50%', top: '65%', transform: 'translate(-50%, -50%)' }} />

        <svg width={DW} height={DH} viewBox={`0 0 ${DW} ${DH}`} className="relative z-10">
          {/* X-axis */}
          <line x1={8} y1={vcy} x2={DW - 8} y2={vcy}
            stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          {/* Y-axis */}
          <line x1={vcx} y1={DH - 8} x2={vcx} y2={8}
            stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          {/* Axis arrows */}
          <polygon points={`${DW - 8},${vcy} ${DW - 14},${vcy - 3} ${DW - 14},${vcy + 3}`}
            fill="rgba(255,255,255,0.15)" />
          <polygon points={`${vcx},8 ${vcx - 3},14 ${vcx + 3},14`}
            fill="rgba(255,255,255,0.15)" />

          {/* Axis-of-symmetry dashes */}
          <line x1={vcx} y1={vcy - 8} x2={vcx} y2={8}
            stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 3" opacity={0.5} />

          {/* Parabola curve */}
          {parabolaD && (
            <path d={parabolaD} stroke="white" strokeWidth={2.5}
              fill="none" strokeLinecap="round" strokeLinejoin="round"
              opacity={0.85} className="draw-path" />
          )}

          {/* Vertex dot */}
          <circle cx={vcx} cy={vcy} r={5} fill="#f59e0b" />
          <circle cx={vcx} cy={vcy} r={5} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={1.5} />

          {/* Vertex label */}
          <text x={vcx + 8} y={vcy - 8}
            fill="#fde68a" fontSize={11} fontFamily="monospace" fontWeight="600"
            opacity={0.9}>vertex</text>
        </svg>
      </div>
    </div>
  )
}

// ---------- Slide card renderer (shared between enter and exit) ----------

function SlideCard({ slide, slideCount, highlights, sceneState, annotations, className, style }: {
  slide: Slide; slideCount: number; highlights: string[]; sceneState: Record<string, unknown>; annotations: Annotation[]; className: string; style?: CSSProperties
}) {
  const isCover = slide.content.variant === 'cover'
  const isQuadraticIntro = slide.content.variant === 'quadratic-intro'
  const type = (isCover || isQuadraticIntro) ? null : detectSlideType(slide.title)
  return (
    <div className={className} style={style}>
      {isCover           && <CoverSlide          slide={slide} slideCount={slideCount} highlights={highlights} />}
      {isQuadraticIntro  && <QuadraticIntroSlide  slide={slide} slideCount={slideCount} sceneState={sceneState} />}
      {type === 'concept'         && <ConceptSlide  slide={slide} slideCount={slideCount} highlights={highlights} sceneState={sceneState} />}
      {type === 'question'        && <QuestionSlide slide={slide} slideCount={slideCount} />}
      {type === 'solution'        && <SolutionSlide slide={slide} slideCount={slideCount} highlights={highlights} />}
      {type === 'summary'         && <SummarySlide  slide={slide} slideCount={slideCount} highlights={highlights} />}
      <AnnotationLayer annotations={annotations} />
    </div>
  )
}

// ---------- Main export ----------

export function SlidePanel({ slide, slideCount, highlights, sceneState = {}, annotations = [] }: Props) {
  const [exitingSlide, setExitingSlide] = useState<Slide | null>(null)
  const prevSlideRef = useRef(slide)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (prevSlideRef.current.index !== slide.index) {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
      setExitingSlide(prevSlideRef.current)
      exitTimerRef.current = setTimeout(() => setExitingSlide(null), 340)
    }
    prevSlideRef.current = slide
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide.index])

  const cardBase = 'absolute inset-0 bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden border border-gray-100'

  return (
    <div className="w-full h-full">
      <SlideCard
        key={slide.index}
        slide={slide}
        slideCount={slideCount}
        highlights={highlights}
        sceneState={sceneState}
        annotations={annotations}
        className={`${cardBase} slide-card-enter`}
      />
      {exitingSlide && (
        <SlideCard
          slide={exitingSlide}
          slideCount={slideCount}
          highlights={[]}
          sceneState={{}}
          annotations={[]}
          className={`${cardBase} slide-card-exit`}
          style={{ zIndex: 10 }}
        />
      )}
    </div>
  )
}
