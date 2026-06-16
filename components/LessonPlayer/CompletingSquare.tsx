'use client'
import { useEffect, useState } from 'react'

// Shows x² - 6x + 5  →  (x-3)² - 4  step by step
// Designed to be embedded inside a SolutionSlide as a bonus visualization.

const STEPS = [
  {
    label: 'Standard form',
    body: (
      <span className="font-mono text-slate-700">
        x² − 6x + 5
      </span>
    ),
    note: 'Identify: a=1, b=−6, c=5',
  },
  {
    label: 'Add & subtract (b/2)² = 9',
    body: (
      <span className="font-mono">
        {'('}x² − 6x +{' '}
        <span className="bg-amber-100 text-amber-800 font-bold px-1 rounded">9</span>
        {') − '}
        <span className="bg-amber-100 text-amber-800 font-bold px-1 rounded">9</span>
        {' + 5'}
      </span>
    ),
    note: '(b/2)² = (−6/2)² = (−3)² = 9',
  },
  {
    label: 'Factor the trinomial',
    body: (
      <span className="font-mono">
        {'(x − '}
        <span className="bg-indigo-100 text-indigo-800 font-bold px-1 rounded">3</span>
        {')² + (5 − 9)'}
      </span>
    ),
    note: 'x² − 6x + 9 = (x − 3)²',
  },
  {
    label: 'Simplify → vertex form',
    body: (
      <span className="font-mono">
        {'(x − '}
        <span className="bg-indigo-100 text-indigo-800 font-bold px-1 rounded">3</span>
        {')² '}
        <span className="bg-red-50 text-red-700 font-bold px-1 rounded">− 4</span>
      </span>
    ),
    note: '✓  Vertex = (3, −4)',
  },
]

export function CompletingSquare() {
  const [visible, setVisible] = useState(1)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (visible >= STEPS.length) { setDone(true); return }
    const t = setTimeout(() => setVisible(v => v + 1), 1600)
    return () => clearTimeout(t)
  }, [visible])

  function restart() { setVisible(1); setDone(false) }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-extrabold text-violet-400 uppercase tracking-widest">Completing the Square</p>
        {done && (
          <button
            onClick={restart}
            className="text-[10px] text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
          >replay ↺</button>
        )}
      </div>

      <div className="flex flex-col gap-1">
        {STEPS.slice(0, visible).map((s, i) => {
          const isLatest = i === visible - 1
          return (
            <div
              key={i}
              className={`step-enter flex items-start gap-2.5 rounded-xl px-3 py-2 transition-all duration-300 ${
                isLatest
                  ? 'bg-emerald-50 border border-emerald-200 shadow-sm'
                  : 'bg-white border border-slate-100 opacity-60'
              }`}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                i < visible - 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500 text-white'
              }`}>
                {i + 1}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-medium">{s.label}</span>
                <div className="text-sm leading-snug">{s.body}</div>
                {isLatest && (
                  <span className="text-[10px] text-slate-500 italic">{s.note}</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {done && (
        <div className="answer-pop flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl px-4 py-2.5 shadow">
          <span className="text-xl shrink-0">✓</span>
          <span className="text-sm font-bold text-white">
            Vertex form: <span className="font-mono">(x − 3)² − 4</span> → vertex at (3, −4)
          </span>
        </div>
      )}
    </div>
  )
}
