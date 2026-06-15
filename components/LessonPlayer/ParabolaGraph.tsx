import type { GraphSpec } from '@/lib/types'

type Props = { spec: GraphSpec; width?: number; height?: number }

export function ParabolaGraph({ spec, width = 280, height = 160 }: Props) {
  const { vertex, direction } = spec
  const [h, k] = vertex
  const a = direction === 'up' ? 1 : -1

  const cx = width / 2
  const cy = height / 2
  const scale = Math.min(width, height) / 8

  function toSVG(x: number, y: number): [number, number] {
    return [cx + (x - h) * scale, cy - (y - k) * scale]
  }

  const points: string[] = []
  for (let i = -5; i <= 5; i += 0.2) {
    const x = h + i
    const y = k + a * i * i
    const [sx, sy] = toSVG(x, y)
    points.push(`${sx},${sy}`)
  }
  const pathD = `M ${points[0]} L ${points.slice(1).join(' L ')}`

  const [vx, vy] = toSVG(h, k)
  const [axisTop] = [toSVG(h, k + 5)]
  const [axisBot] = [toSVG(h, k - 5)]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <line x1={0} y1={cy} x2={width} y2={cy} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={cx} y1={0} x2={cx} y2={height} stroke="#e2e8f0" strokeWidth={1} />
      <line
        x1={vx} y1={axisTop[1]} x2={axisBot[0]} y2={axisBot[1]}
        stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 3" opacity={0.7}
      />
      <path d={pathD} stroke="#6366f1" strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <circle cx={vx} cy={vy} r={4} fill="#f59e0b" />
      <text x={vx + 6} y={vy - 4} fill="#b45309" fontSize={9} fontFamily="monospace">
        vertex
      </text>
    </svg>
  )
}
