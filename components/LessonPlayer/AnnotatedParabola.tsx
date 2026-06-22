'use client'
import type { CSSProperties } from 'react'

export type IntroFocus = 'std' | 'vtx' | 'dir' | 'axis' | 'roots' | null

type CalloutConfig = {
  id: string
  label: string
  sub: string
  style: CSSProperties
  bg: string
  border: string
  text: string
  litOn: NonNullable<IntroFocus>[]
}

const CALLOUTS: CalloutConfig[] = [
  {
    id: 'vertex',
    label: 'vertex (h, k)',
    sub: 'min or max of f',
    style: { top: '18%', right: '7%' },
    bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-900',
    litOn: ['vtx', 'dir'],
  },
  {
    id: 'axis',
    label: 'axis of symmetry',
    sub: 'x = h',
    style: { top: '36%', right: '5%' },
    bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-900',
    litOn: ['vtx', 'axis'],
  },
  {
    id: 'yint',
    label: 'y-intercept = c',
    sub: 'f(0) = c',
    style: { bottom: '21%', right: '7%' },
    bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-900',
    litOn: ['std'],
  },
  {
    id: 'roots',
    label: 'roots / zeros',
    sub: 'where f(x) = 0',
    style: { bottom: '21%', left: '5%' },
    bg: 'bg-indigo-50', border: 'border-indigo-300', text: 'text-indigo-900',
    litOn: ['roots'],
  },
]

function calloutCls(c: CalloutConfig, focus: IntroFocus): string {
  const base = `absolute border rounded-lg px-2.5 py-1.5 pointer-events-none transition-all duration-200 ${c.bg} ${c.border} ${c.text}`
  if (focus === null) return base
  const lit = (c.litOn as string[]).includes(focus)
  return lit ? `${base} shadow-md scale-105` : `${base} opacity-25`
}

function dotOpacity(litOn: NonNullable<IntroFocus>[], focus: IntroFocus): number {
  if (focus === null) return 1
  return (litOn as string[]).includes(focus) ? 1 : 0.2
}

export function AnnotatedParabola({ focus }: { focus: IntroFocus }) {
  return (
    <div className="relative w-full h-full" data-testid="annotated-parabola">
      <svg className="w-full h-full" viewBox="0 0 420 310" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="ap-grid" width="35" height="35" patternUnits="userSpaceOnUse">
            <path d="M 35 0 L 0 0 0 35" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
          </pattern>
          <marker id="ap-ah" markerWidth="7" markerHeight="5" refX="7" refY="2.5" orient="auto">
            <polygon points="0 0, 7 2.5, 0 5" fill="#cbd5e1"/>
          </marker>
        </defs>
        <rect width="420" height="310" fill="url(#ap-grid)"/>

        {/* Axes */}
        <line x1="28" y1="220" x2="396" y2="220" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#ap-ah)"/>
        <line x1="210" y1="290" x2="210" y2="22"  stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#ap-ah)"/>
        <text x="400" y="224" fontSize="12" fill="#94a3b8" fontFamily="system-ui">x</text>
        <text x="214" y="20"  fontSize="12" fill="#94a3b8" fontFamily="system-ui">y</text>

        {/* Axis of symmetry */}
        <line
          x1="210" y1="28" x2="210" y2="282"
          stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="7 5"
          opacity={dotOpacity(['vtx', 'axis'], focus) === 1 ? 0.8 : 0.2}
          style={{ transition: 'opacity 0.2s' }}
        />

        {/* Parabola */}
        <path d="M 65,278 C 115,278 168,220 210,100 C 252,220 305,278 355,278" fill="#6366f1" fillOpacity="0.05"/>
        <path d="M 65,278 C 115,278 168,220 210,100 C 252,220 305,278 355,278"
          fill="none" stroke="#6366f1" strokeWidth="3" strokeLinecap="round"/>

        {/* Connector lines */}
        <line x1="210" y1="100" x2="258" y2="78"  stroke="#f59e0b" strokeWidth="1" opacity="0.4"/>
        <line x1="210" y1="100" x2="258" y2="122" stroke="#f59e0b" strokeWidth="1" opacity="0.3"/>
        <line x1="210" y1="220" x2="268" y2="244" stroke="#10b981" strokeWidth="1" opacity="0.4"/>
        <line x1="110" y1="220" x2="72"  y2="244" stroke="#6366f1" strokeWidth="1" opacity="0.4"/>

        {/* Direction label */}
        <text x="44" y="90"  fontSize="11" fontWeight="700" fill="#059669" fontFamily="system-ui">a &gt; 0</text>
        <text x="44" y="103" fontSize="10" fill="#059669" fillOpacity="0.8" fontFamily="system-ui">opens ↑</text>

        {/* y-intercept dot */}
        <circle cx="210" cy="220" r="7" fill="#10b981"
          opacity={dotOpacity(['std'], focus)}
          style={{ transition: 'opacity 0.2s' }}/>
        <circle cx="210" cy="220" r="7" fill="none" stroke="white" strokeWidth="2"/>

        {/* Root dots */}
        <circle cx="110" cy="220" r="7" fill="#6366f1"
          opacity={dotOpacity(['roots'], focus)}
          style={{ transition: 'opacity 0.2s' }}/>
        <circle cx="110" cy="220" r="7" fill="none" stroke="white" strokeWidth="1.5"/>
        <circle cx="310" cy="220" r="7" fill="#6366f1"
          opacity={dotOpacity(['roots'], focus)}
          style={{ transition: 'opacity 0.2s' }}/>
        <circle cx="310" cy="220" r="7" fill="none" stroke="white" strokeWidth="1.5"/>

        {/* Vertex dot */}
        <circle cx="210" cy="100" r="9" fill="#f59e0b"
          opacity={dotOpacity(['vtx', 'dir'], focus)}
          style={{ transition: 'opacity 0.2s' }}/>
        <circle cx="210" cy="100" r="9" fill="none" stroke="white" strokeWidth="2.5"/>
      </svg>

      {CALLOUTS.map((c) => (
        <div key={c.id} className={calloutCls(c, focus)} style={c.style} data-testid={`callout-${c.id}`}>
          <span className="text-xs font-bold block">{c.label}</span>
          <span className="text-[10px] font-medium opacity-70">{c.sub}</span>
        </div>
      ))}
    </div>
  )
}
