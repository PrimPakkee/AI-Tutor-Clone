'use client'
import { useState, useEffect, useRef } from 'react'

type HoverParam = 'a' | 'h' | 'k' | null

const W = 290, H = 195
const mg = { top: 16, right: 16, bottom: 26, left: 26 }
const innerW = W - mg.left - mg.right
const innerH = H - mg.top - mg.bottom
const xMin = -5.3, xMax = 5.3
const yMin = -4.5, yMax = 8.5

const xScale = innerW / (xMax - xMin)
const yScale = innerH / (yMax - yMin)

function toSVG(mx: number, my: number): [number, number] {
  return [
    mg.left + (mx - xMin) * xScale,
    mg.top + (yMax - my) * yScale,
  ]
}

function Chip({ color, label, param, hover, setHover }: {
  color: 'indigo' | 'amber' | 'emerald'
  label: string
  param: HoverParam
  hover: HoverParam
  setHover: (v: HoverParam) => void
}) {
  const cls = {
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300 ring-indigo-400',
    amber:  'bg-amber-100 text-amber-800 border-amber-300 ring-amber-400',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-emerald-400',
  }[color]
  const active = hover === param
  return (
    <span
      className={`px-1.5 py-0.5 rounded border text-[11px] font-bold font-mono cursor-default transition-all duration-150 ${cls} ${active ? 'ring-2 scale-110' : ''}`}
      onMouseEnter={() => setHover(param)}
      onMouseLeave={() => setHover(null)}
    >
      {label}
    </span>
  )
}

export function InteractiveParabola({ sceneState = {} }: { sceneState?: Record<string, unknown> }) {
  const [h, setH] = useState(2)
  const [k, setK] = useState(-1)
  const [aUp, setAUp] = useState(true)
  const [hover, setHover] = useState<HoverParam>(null)
  const prevScene = useRef<Record<string, unknown>>({})

  useEffect(() => {
    if (!sceneState || sceneState === prevScene.current) return
    if ('h' in sceneState && sceneState.h !== prevScene.current.h) setH(sceneState.h as number)
    if ('k' in sceneState && sceneState.k !== prevScene.current.k) setK(sceneState.k as number)
    if ('aUp' in sceneState) setAUp(sceneState.aUp as boolean)
    if ('hover' in sceneState) setHover(sceneState.hover as HoverParam)
    prevScene.current = sceneState
  }, [sceneState])

  const a = aUp ? 0.55 : -0.55

  // Parabola path
  const pts: string[] = []
  for (let t = -7; t <= 7; t += 0.07) {
    const mx = h + t
    if (mx < xMin || mx > xMax) continue
    const my = a * t * t + k
    if (my < yMin - 0.5 || my > yMax + 0.5) continue
    const [sx, sy] = toSVG(mx, my)
    pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`)
  }
  const pathD = pts.length > 1 ? `M ${pts[0]} L ${pts.slice(1).join(' L ')}` : ''

  // Key coords
  const [vx, vy] = toSVG(h, k)
  const [, axisY] = toSVG(0, 0)   // x-axis SVG y
  const [axisX] = toSVG(0, 0)     // y-axis SVG x

  // Roots: x = h ± √(-k/a) when -k/a ≥ 0
  const rootDisc = -k / a
  const roots: number[] = rootDisc > 0.001
    ? [h - Math.sqrt(rootDisc), h + Math.sqrt(rootDisc)]
    : rootDisc >= 0 ? [h] : []

  // Y-intercept
  const yInt = a * h * h + k
  const [yIntSx, yIntSy] = toSVG(0, yInt)
  const yIntVisible = yInt >= yMin && yInt <= yMax && Math.abs(h) > 0.4

  // Formula sign helpers
  const hSign = h >= 0 ? '−' : '+'
  const kSign = k >= 0 ? '+' : '−'

  return (
    <div className="flex flex-col gap-1.5 select-none w-full">
      {/* Formula with hover chips */}
      <div className="flex items-center justify-center flex-wrap gap-x-1 gap-y-0.5 bg-white rounded-xl px-3 py-2 border border-indigo-100 shadow-sm text-[13px] font-mono">
        <span className="text-slate-500">f(x) =</span>
        <Chip color="emerald" label={aUp ? '0.55' : '−0.55'} param="a" hover={hover} setHover={setHover} />
        <span className="text-slate-600">(x {hSign}</span>
        <Chip color="indigo" label={`${Math.abs(h)}`} param="h" hover={hover} setHover={setHover} />
        <span className="text-slate-600">)² {kSign}</span>
        <Chip color="amber" label={`${Math.abs(k)}`} param="k" hover={hover} setHover={setHover} />
      </div>

      {/* SVG graph */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
        {/* Grid */}
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4].map(gx => {
          const [sx] = toSVG(gx, 0)
          return <line key={`gx${gx}`} x1={sx} y1={mg.top} x2={sx} y2={H - mg.bottom} stroke="#e2e8f0" strokeWidth={0.5} />
        })}
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7].map(gy => {
          const [, sy] = toSVG(0, gy)
          return <line key={`gy${gy}`} x1={mg.left} y1={sy} x2={W - mg.right} y2={sy} stroke="#e2e8f0" strokeWidth={0.5} />
        })}

        {/* Axes */}
        <line x1={mg.left} y1={axisY} x2={W - mg.right} y2={axisY} stroke="#94a3b8" strokeWidth={1.5} />
        <polygon points={`${W - mg.right + 6},${axisY} ${W - mg.right},${axisY - 3} ${W - mg.right},${axisY + 3}`} fill="#94a3b8" />
        <line x1={axisX} y1={H - mg.bottom} x2={axisX} y2={mg.top} stroke="#94a3b8" strokeWidth={1.5} />
        <polygon points={`${axisX},${mg.top - 6} ${axisX - 3},${mg.top} ${axisX + 3},${mg.top}`} fill="#94a3b8" />
        <text x={W - mg.right + 8} y={axisY + 4} fill="#94a3b8" fontSize={9} fontFamily="sans-serif">x</text>
        <text x={axisX + 4} y={mg.top - 6} fill="#94a3b8" fontSize={9} fontFamily="sans-serif">y</text>

        {/* Tick labels */}
        {[-4, -2, 2, 4].map(gx => {
          const [sx] = toSVG(gx, 0)
          return <text key={gx} x={sx} y={axisY + 14} fill="#94a3b8" fontSize={7.5} fontFamily="sans-serif" textAnchor="middle">{gx}</text>
        })}
        {[-3, -1, 1, 3, 5].map(gy => {
          const [, sy] = toSVG(0, gy)
          return <text key={gy} x={axisX - 5} y={sy + 3} fill="#94a3b8" fontSize={7.5} fontFamily="sans-serif" textAnchor="end">{gy}</text>
        })}

        {/* k-level line (amber, shown on k hover) */}
        <line
          x1={mg.left + 4} y1={vy} x2={W - mg.right - 4} y2={vy}
          stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3"
          opacity={hover === 'k' ? 0.9 : 0.2}
          style={{ transition: 'opacity 0.2s' }}
        />

        {/* Axis of symmetry (indigo, shown on h hover) */}
        <line
          x1={vx} y1={mg.top + 4} x2={vx} y2={H - mg.bottom - 4}
          stroke="#6366f1" strokeWidth={1.5} strokeDasharray="4 3"
          opacity={hover === 'h' ? 0.9 : 0.25}
          style={{ transition: 'opacity 0.2s' }}
        />

        {/* Parabola */}
        {pathD && (
          <path
            d={pathD}
            stroke="#6366f1" strokeWidth={2.5}
            fill="none" strokeLinecap="round" strokeLinejoin="round"
            opacity={hover === 'a' ? 0.45 : 1}
            style={{ transition: 'opacity 0.2s' }}
          />
        )}

        {/* Roots (green dots on x-axis) */}
        {roots.filter(r => r >= xMin && r <= xMax).map((r, i) => {
          const [rx] = toSVG(r, 0)
          return (
            <g key={i}>
              <circle cx={rx} cy={axisY} r={4.5} fill="#10b981" />
              <text x={rx} y={axisY - 8} fill="#059669" fontSize={7.5} fontFamily="monospace" textAnchor="middle">{r % 1 === 0 ? r : r.toFixed(1)}</text>
            </g>
          )
        })}

        {/* Y-intercept (orange dot on y-axis) */}
        {yIntVisible && (
          <circle cx={yIntSx} cy={yIntSy} r={3.5} fill="#f97316" opacity={0.85} />
        )}

        {/* Vertex dot */}
        <circle cx={vx} cy={vy} r={5.5} fill="#f59e0b" />
        <circle cx={vx} cy={vy} r={5.5} fill="none" stroke="white" strokeWidth={1.5} />
        <text
          x={vx + (h > 3 ? -8 : 8)} y={vy + (aUp ? -10 : 14)}
          fill="#92400e" fontSize={8} fontFamily="monospace" fontWeight="600"
          textAnchor={h > 3 ? 'end' : 'start'}
        >({h}, {k})</text>
      </svg>

      {/* Sliders */}
      <div className="flex flex-col gap-1 px-1">
        <SliderRow
          label="h" value={h} min={-3} max={3} step={0.5}
          color="indigo" hint="shifts ↔"
          onChange={setH}
          onHover={() => setHover('h')}
          onLeave={() => setHover(null)}
        />
        <SliderRow
          label="k" value={k} min={-3} max={3} step={0.5}
          color="amber" hint="shifts ↕"
          onChange={setK}
          onHover={() => setHover('k')}
          onLeave={() => setHover(null)}
        />
        <div className="flex items-center gap-2">
          <span className="w-[72px] text-[11px] font-mono text-emerald-700 font-semibold text-right">a = {aUp ? '+' : '−'}0.55</span>
          <button
            onClick={() => setAUp(v => !v)}
            onMouseEnter={() => setHover('a')}
            onMouseLeave={() => setHover(null)}
            className="flex-1 text-[11px] font-semibold rounded-lg border-2 border-emerald-300 bg-emerald-50 text-emerald-700 py-1 hover:bg-emerald-100 active:bg-emerald-200 transition-colors"
          >
            {aUp ? 'opens ↑ — tap to flip ↓' : 'opens ↓ — tap to flip ↑'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SliderRow({ label, value, min, max, step, color, hint, onChange, onHover, onLeave }: {
  label: string; value: number; min: number; max: number; step: number
  color: 'indigo' | 'amber'; hint: string
  onChange: (v: number) => void
  onHover: () => void; onLeave: () => void
}) {
  const accent = color === 'indigo' ? 'accent-indigo-500' : 'accent-amber-500'
  const textColor = color === 'indigo' ? 'text-indigo-700' : 'text-amber-700'
  const hintColor = color === 'indigo' ? 'text-indigo-300' : 'text-amber-300'
  return (
    <div className="flex items-center gap-2">
      <span className={`w-[72px] text-[11px] font-mono font-semibold text-right ${textColor}`}>{label} = {value}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        onMouseEnter={onHover} onMouseLeave={onLeave}
        onTouchStart={onHover} onTouchEnd={onLeave}
        className={`flex-1 ${accent}`}
      />
      <span className={`w-[52px] text-[10px] font-mono ${hintColor}`}>{hint}</span>
    </div>
  )
}
