'use client'
import { useState } from 'react'

const W = 290, H = 180
const mg = { top: 14, right: 14, bottom: 24, left: 28 }
const innerW = W - mg.left - mg.right
const innerH = H - mg.top - mg.bottom

const xMin = -0.6, xMax = 4.6
const yMin = -5, yMax = 8

const xScale = innerW / (xMax - xMin)
const yScale = innerH / (yMax - yMin)

function toSVG(mx: number, my: number): [number, number] {
  return [
    mg.left + (mx - xMin) * xScale,
    mg.top + (yMax - my) * yScale,
  ]
}

export function DiscriminantViz() {
  const [c, setC] = useState(2)

  const disc = 16 - 4 * c
  const vertexY = c - 4
  const [vx, vy] = toSVG(2, vertexY)
  const [, axisY] = toSVG(0, 0)
  const [axisX] = toSVG(0, 0)

  // Roots: x = 2 ± √(4-c) when disc ≥ 0
  const rootOffset = disc >= 0 ? Math.sqrt(4 - c) : 0
  const roots: number[] = disc > 0.001
    ? [2 - rootOffset, 2 + rootOffset]
    : disc >= 0 ? [2] : []

  // Parabola path: f(x) = x² - 4x + c
  const pts: string[] = []
  for (let mx = xMin - 0.1; mx <= xMax + 0.1; mx += 0.06) {
    const my = mx * mx - 4 * mx + c
    if (my < yMin - 0.5 || my > yMax + 0.5) continue
    const [sx, sy] = toSVG(mx, my)
    pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`)
  }
  const pathD = pts.length > 1 ? `M ${pts[0]} L ${pts.slice(1).join(' L ')}` : ''

  // Discriminant state
  const discState = disc > 0.001 ? 'two' : disc >= 0 ? 'one' : 'none'
  const discColor = discState === 'two' ? '#059669' : discState === 'one' ? '#d97706' : '#dc2626'
  const discBg = discState === 'two' ? 'bg-emerald-50 border-emerald-300' : discState === 'one' ? 'bg-amber-50 border-amber-300' : 'bg-red-50 border-red-300'
  const discLabel = discState === 'two' ? '两个不同实数根' : discState === 'one' ? '恰好一个实数根' : '无实数根'

  return (
    <div className="flex flex-col gap-1.5 select-none w-full">
      {/* Discriminant readout */}
      <div className={`flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono ${discBg}`}>
        <span className="text-slate-500">
          <span className="font-bold">Δ</span> = 16 − 4×{c.toFixed(1)} ={' '}
          <span className="font-bold text-base" style={{ color: discColor }}>{disc.toFixed(1)}</span>
        </span>
        <span className="font-semibold text-[11px]" style={{ color: discColor }}>{discLabel}</span>
      </div>

      {/* SVG */}
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: H }}>
        {/* Grid */}
        {[-1, 0, 1, 2, 3, 4, 5].map(gx => {
          const [sx] = toSVG(gx, 0)
          return <line key={`gx${gx}`} x1={sx} y1={mg.top} x2={sx} y2={H - mg.bottom} stroke="#e2e8f0" strokeWidth={0.5} />
        })}
        {[-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7].map(gy => {
          const [, sy] = toSVG(0, gy)
          return <line key={`gy${gy}`} x1={mg.left} y1={sy} x2={W - mg.right} y2={sy} stroke="#e2e8f0" strokeWidth={0.5} />
        })}

        {/* Axes */}
        <line x1={mg.left} y1={axisY} x2={W - mg.right} y2={axisY} stroke="#94a3b8" strokeWidth={1.5} />
        <polygon points={`${W - mg.right + 5},${axisY} ${W - mg.right},${axisY - 3} ${W - mg.right},${axisY + 3}`} fill="#94a3b8" />
        <line x1={axisX} y1={H - mg.bottom} x2={axisX} y2={mg.top} stroke="#94a3b8" strokeWidth={1.5} />
        <polygon points={`${axisX},${mg.top - 5} ${axisX - 3},${mg.top} ${axisX + 3},${mg.top}`} fill="#94a3b8" />
        <text x={W - mg.right + 6} y={axisY + 4} fill="#94a3b8" fontSize={8.5} fontFamily="sans-serif">x</text>
        <text x={axisX + 4} y={mg.top - 4} fill="#94a3b8" fontSize={8.5} fontFamily="sans-serif">y</text>

        {/* Tick labels */}
        {[1, 2, 3, 4].map(gx => {
          const [sx] = toSVG(gx, 0)
          return <text key={gx} x={sx} y={axisY + 13} fill="#94a3b8" fontSize={7.5} fontFamily="sans-serif" textAnchor="middle">{gx}</text>
        })}
        {[-4, -2, 2, 4, 6].map(gy => {
          const [, sy] = toSVG(0, gy)
          return <text key={gy} x={axisX - 4} y={sy + 3} fill="#94a3b8" fontSize={7.5} fontFamily="sans-serif" textAnchor="end">{gy}</text>
        })}

        {/* Axis of symmetry x=2 */}
        {(() => { const [sx] = toSVG(2, 0); return (
          <line x1={sx} y1={mg.top + 2} x2={sx} y2={H - mg.bottom - 2}
            stroke="#6366f1" strokeWidth={1} strokeDasharray="3 3" opacity={0.4} />
        )})()}

        {/* Parabola */}
        {pathD && (
          <path d={pathD} stroke="#6366f1" strokeWidth={2.5} fill="none"
            strokeLinecap="round" strokeLinejoin="round" />
        )}

        {/* Roots */}
        {roots.filter(r => r >= xMin && r <= xMax).map((r, i) => {
          const [rx] = toSVG(r, 0)
          return (
            <g key={i}>
              <circle cx={rx} cy={axisY} r={5} fill={discColor} />
              <text x={rx} y={axisY - 8} fill={discColor} fontSize={8} fontFamily="monospace" fontWeight="600" textAnchor="middle">
                {r % 1 === 0 ? r : r.toFixed(2)}
              </text>
            </g>
          )
        })}

        {/* "No roots" annotation */}
        {discState === 'none' && (
          <text x={vx + 10} y={vy - 8} fill="#dc2626" fontSize={8} fontFamily="sans-serif">no real roots</text>
        )}

        {/* Vertex */}
        <circle cx={vx} cy={vy} r={5} fill="#f59e0b" />
        <circle cx={vx} cy={vy} r={5} fill="none" stroke="white" strokeWidth={1.5} />
        <text
          x={vx + 8} y={vy + (vertexY < -3 ? 12 : -8)}
          fill="#92400e" fontSize={8} fontFamily="monospace" fontWeight="600"
        >(2, {vertexY.toFixed(1)})</text>
      </svg>

      {/* Slider */}
      <div className="flex items-center gap-2 px-1">
        <span className="w-[68px] text-[11px] font-mono text-violet-700 font-semibold text-right">c = {c.toFixed(1)}</span>
        <input
          type="range" min={0} max={6} step={0.5} value={c}
          onChange={e => setC(Number(e.target.value))}
          className="flex-1 accent-violet-500"
        />
        <span className="w-[52px] text-[10px] font-mono text-violet-300">0 → 6</span>
      </div>

      {/* Roots formula */}
      <div className="flex items-center justify-center gap-1 text-[11px] font-mono bg-white rounded-lg px-3 py-1 border border-slate-100">
        <span className="text-slate-500">f(x) = x² − 4x + {c.toFixed(1)}</span>
        <span className="text-slate-300 mx-1">|</span>
        {discState !== 'none' ? (
          <span style={{ color: discColor }}>
            x = 2 ± √({(4 - c).toFixed(1)}) {roots.length === 2 ? `= {${roots[0].toFixed(2)}, ${roots[1].toFixed(2)}}` : `= 2`}
          </span>
        ) : (
          <span className="text-red-400">Δ {'<'} 0 — no roots</span>
        )}
      </div>
    </div>
  )
}
