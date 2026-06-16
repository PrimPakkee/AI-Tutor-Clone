import type { GraphSpec } from '@/lib/types'

type Props = { spec: GraphSpec; width?: number; height?: number; highlightH?: boolean; highlightK?: boolean }

export function ParabolaGraph({ spec, width = 260, height = 175, highlightH, highlightK }: Props) {
  const { vertex, direction } = spec
  const [h, k] = vertex
  const a = direction === 'up' ? 0.9 : -0.9

  const mg = { top: 18, right: 24, bottom: 28, left: 24 }
  const innerW = width - mg.left - mg.right
  const innerH = height - mg.top - mg.bottom

  const cvx = mg.left + innerW / 2
  const scale = Math.min(innerW, innerH) / 11

  // Vertex SVG y: start from the preferred fraction, then clamp so the x-axis
  // (which sits k*scale below vertex in SVG) stays inside the viewport.
  // Without this, large |k| compresses the y-scale relative to x-scale.
  const prefFrac = direction === 'up' ? 0.68 : 0.32
  const labelPad = 22   // px above/below vertex needed for label
  const axisPad = 6     // px clearance for x-axis from viewport edge
  let cvy = mg.top + innerH * prefFrac
  if (direction === 'up') {
    // x-axis is k*scale BELOW vertex in SVG (k>0 → below viewport edge risk)
    const cvyMax = height - mg.bottom - axisPad - k * scale
    cvy = Math.min(cvy, Math.max(mg.top + labelPad, cvyMax))
  } else {
    // x-axis is |k|*scale ABOVE vertex in SVG (k<0 → above viewport edge risk)
    const cvyMin = mg.top + axisPad - k * scale   // k<0, so -k*scale = |k|*scale
    cvy = Math.max(cvy, Math.min(height - mg.bottom - labelPad, cvyMin))
  }

  function toSVG(dx: number, dy: number): [number, number] {
    return [cvx + dx * scale, cvy - dy * scale]
  }

  // Parabola path — clip to inner bounds
  const pts: string[] = []
  for (let i = -5; i <= 5; i += 0.15) {
    const dy = a * i * i
    const [sx, sy] = toSVG(i, dy)
    if (sx >= mg.left - 4 && sx <= width - mg.right + 4 && sy >= mg.top - 4 && sy <= height - mg.bottom + 4) {
      pts.push(`${sx.toFixed(1)},${sy.toFixed(1)}`)
    }
  }
  const pathD = pts.length > 1 ? `M ${pts[0]} L ${pts.slice(1).join(' L ')}` : ''

  // Axis of symmetry: vertical dashed line through vertex
  const [vx, vy] = toSVG(0, 0)    // SVG coords of vertex
  const axisTop = mg.top + 4
  const axisBot = height - mg.bottom - 4

  // x-axis: y=0 in math coords.
  const xAxisY = Math.max(mg.top + 2, Math.min(height - mg.bottom - 2, vy + k * scale))

  // y-axis: x=0 in math coords (NOT at vertex x — vertex is at x=h).
  // dx from vertex to x=0 is (0-h) = -h
  const yAxisX = Math.max(mg.left + 2, Math.min(width - mg.right - 2, cvx - h * scale))
  const yAxisVisible = yAxisX > mg.left + 2 && yAxisX < width - mg.right - 2

  // Origin (0,0) in SVG — shown only when both axes are visible in viewport
  const originX = yAxisX
  const originY = xAxisY
  const originVisible = yAxisVisible &&
    originY > mg.top + 2 && originY < height - mg.bottom - 2

  // Tick marks: show integer x values within visible range, label every 2nd
  const xTicksRaw = Array.from({ length: 11 }, (_, i) => h - 5 + i)   // h±5
  const xTicks = xTicksRaw.filter(tx => {
    const [sx] = toSVG(tx - h, 0)
    return sx > mg.left + 6 && sx < width - mg.right - 6
  })
  // y-axis tick: show k (vertex y) label for scale
  const yTickVisible = vy > mg.top + 8 && vy < height - mg.bottom - 8

  // Vertex label
  const vertexLabel = `(${h}, ${k})`
  const labelOffsetY = direction === 'up' ? -14 : 16
  const labelX = vx + 7
  const labelY = vy + labelOffsetY
  const labelW = vertexLabel.length * 6.2 + 6

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* x-axis */}
      <line
        x1={mg.left} y1={xAxisY}
        x2={width - mg.right} y2={xAxisY}
        stroke="#cbd5e1" strokeWidth={1}
      />
      {/* x-axis arrow */}
      <polygon
        points={`${width - mg.right + 6},${xAxisY} ${width - mg.right},${xAxisY - 3} ${width - mg.right},${xAxisY + 3}`}
        fill="#cbd5e1"
      />
      {/* x label */}
      <text x={width - mg.right + 8} y={xAxisY + 3} fill="#94a3b8" fontSize={9} fontFamily="sans-serif">x</text>

      {/* y-axis — correctly at x=0, not at x=h */}
      {yAxisVisible && (
        <line
          x1={yAxisX} y1={height - mg.bottom}
          x2={yAxisX} y2={mg.top}
          stroke="#cbd5e1" strokeWidth={1}
        />
      )}
      {yAxisVisible && (
        <polygon
          points={`${yAxisX},${mg.top - 6} ${yAxisX - 3},${mg.top} ${yAxisX + 3},${mg.top}`}
          fill="#cbd5e1"
        />
      )}
      {/* y label */}
      {yAxisVisible && (
        <text x={yAxisX + 4} y={mg.top - 4} fill="#94a3b8" fontSize={9} fontFamily="sans-serif">y</text>
      )}

      {/* Origin "0" label */}
      {originVisible && (
        <text
          x={originX - 6} y={originY + 12}
          fill="#94a3b8" fontSize={8} fontFamily="sans-serif" textAnchor="middle"
        >0</text>
      )}

      {/* X-axis tick marks + labels */}
      {xTicks.filter(tx => tx !== 0 || !originVisible).map(tx => {
        const [sx] = toSVG(tx - h, 0)
        const isH = tx === h
        return (
          <g key={tx}>
            <line x1={sx} y1={xAxisY - 3} x2={sx} y2={xAxisY + 3} stroke="#cbd5e1" strokeWidth={1} />
            {!isH && (
              <text x={sx} y={xAxisY + 12} fill="#94a3b8" fontSize={8} fontFamily="sans-serif" textAnchor="middle">{tx}</text>
            )}
          </g>
        )
      })}

      {/* Vertex y-value tick on y-axis */}
      {yAxisVisible && yTickVisible && k !== 0 && (
        <g>
          <line x1={yAxisX - 3} y1={vy} x2={yAxisX + 3} y2={vy} stroke="#cbd5e1" strokeWidth={1} />
          <text x={yAxisX - 6} y={vy + 3} fill="#94a3b8" fontSize={8} fontFamily="sans-serif" textAnchor="end">{k}</text>
        </g>
      )}

      {/* k-level horizontal line (shown on highlightK) */}
      <line
        x1={mg.left + 4} y1={vy} x2={width - mg.right - 4} y2={vy}
        stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3"
        opacity={highlightK ? 0.85 : 0.15}
        style={{ transition: 'opacity 0.2s' }}
      />

      {/* Axis of symmetry — dashed amber/indigo */}
      <line
        x1={vx} y1={axisTop}
        x2={vx} y2={axisBot}
        stroke={highlightH ? '#6366f1' : '#f59e0b'}
        strokeWidth={highlightH ? 2 : 1.5} strokeDasharray="4 3"
        opacity={highlightK ? 0.25 : highlightH ? 1 : 0.65}
        style={{ transition: 'opacity 0.2s, stroke 0.2s' }}
      />

      {/* Parabola — animates drawing itself in */}
      {pathD && (
        <path
          d={pathD}
          stroke="#6366f1" strokeWidth={2.5}
          fill="none" strokeLinecap="round" strokeLinejoin="round"
          className="draw-path"
        />
      )}

      {/* Vertex dot */}
      <circle cx={vx} cy={vy} r={5} fill="#f59e0b" />
      <circle cx={vx} cy={vy} r={5} fill="none" stroke="white" strokeWidth={1.5} />

      {/* Vertex label pill */}
      <rect
        x={labelX - 2} y={labelY - 12}
        width={labelW} height={15}
        rx={3} fill="rgba(255,251,235,0.95)"
        stroke="#fde68a" strokeWidth={0.5}
      />
      <text
        x={labelX + 1} y={labelY - 1}
        fill="#92400e" fontSize={9} fontFamily="monospace" fontWeight="500"
      >
        {vertexLabel}
      </text>

      {/* x = h label below axis of symmetry */}
      <text
        x={vx} y={height - mg.bottom + 13}
        fill="#b45309" fontSize={8} fontFamily="monospace" textAnchor="middle"
      >
        x = {h}
      </text>

      {/* Opens direction label */}
      <text
        x={width - mg.right - 2} y={mg.top + 10}
        fill="#a5b4fc" fontSize={8} fontFamily="sans-serif" textAnchor="end"
      >
        {direction === 'up' ? 'opens ↑' : 'opens ↓'}
      </text>
    </svg>
  )
}
