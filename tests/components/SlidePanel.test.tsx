import { render, screen } from '@testing-library/react'
import { SlidePanel } from '@/components/LessonPlayer/SlidePanel'
import type { Slide } from '@/lib/types'

const slideWithFormula: Slide = {
  index: 3,
  title: 'Vertex Form',
  content: {
    formula: 'f(x) = a(x - h)^2 + k',
    bullets: ['(h, k) is the vertex', 'Axis of symmetry: x = h'],
    graph: null,
  },
}

const slideWithBulletsOnly: Slide = {
  index: 1,
  title: 'What is a Quadratic?',
  content: {
    formula: null,
    bullets: ['Degree 2 polynomial', 'Graph is a parabola'],
    graph: null,
  },
}

describe('SlidePanel', () => {
  it('renders slide title', () => {
    render(<SlidePanel slide={slideWithBulletsOnly} slideCount={12} highlights={[]} />)
    expect(screen.getByText('What is a Quadratic?')).toBeInTheDocument()
  })

  it('renders bullet points', () => {
    render(<SlidePanel slide={slideWithBulletsOnly} slideCount={12} highlights={[]} />)
    expect(screen.getByText('Degree 2 polynomial')).toBeInTheDocument()
    expect(screen.getByText('Graph is a parabola')).toBeInTheDocument()
  })

  it('renders slide counter', () => {
    render(<SlidePanel slide={slideWithFormula} slideCount={12} highlights={[]} />)
    expect(screen.getByText('3 / 12')).toBeInTheDocument()
  })

  it('renders formula container when formula is provided', () => {
    render(<SlidePanel slide={slideWithFormula} slideCount={12} highlights={[]} />)
    expect(document.querySelector('[data-testid="formula-block"]')).toBeInTheDocument()
  })

  it('does not render formula block when formula is null', () => {
    render(<SlidePanel slide={slideWithBulletsOnly} slideCount={12} highlights={[]} />)
    expect(document.querySelector('[data-testid="formula-block"]')).not.toBeInTheDocument()
  })
})
