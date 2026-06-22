// tests/components/AnnotatedParabola.test.tsx
import { render, screen } from '@testing-library/react'
import { AnnotatedParabola } from '@/components/LessonPlayer/AnnotatedParabola'

describe('AnnotatedParabola', () => {
  it('renders all four callout labels', () => {
    render(<AnnotatedParabola focus={null} />)
    expect(screen.getByTestId('callout-vertex')).toBeInTheDocument()
    expect(screen.getByTestId('callout-axis')).toBeInTheDocument()
    expect(screen.getByTestId('callout-yint')).toBeInTheDocument()
    expect(screen.getByTestId('callout-roots')).toBeInTheDocument()
  })

  it('renders callout text', () => {
    render(<AnnotatedParabola focus={null} />)
    expect(screen.getByText('vertex (h, k)')).toBeInTheDocument()
    expect(screen.getByText('y-intercept = c')).toBeInTheDocument()
    expect(screen.getByText('roots / zeros')).toBeInTheDocument()
    expect(screen.getByText('axis of symmetry')).toBeInTheDocument()
  })

  it('dims non-matching callouts when focus is set', () => {
    render(<AnnotatedParabola focus="std" />)
    // yint is lit when focus='std' — must NOT be dimmed
    expect(screen.getByTestId('callout-yint').className).not.toMatch(/opacity-25/)
    expect(screen.getByTestId('callout-yint').className).toMatch(/shadow-md/)
    expect(screen.getByTestId('callout-yint').className).toMatch(/scale-105/)
    // vertex is NOT lit when focus='std' — must be dimmed
    expect(screen.getByTestId('callout-vertex').className).toMatch(/opacity-25/)
    expect(screen.getByTestId('callout-axis').className).toMatch(/opacity-25/)
    expect(screen.getByTestId('callout-roots').className).toMatch(/opacity-25/)
  })

  it('dims nothing when focus is null', () => {
    render(<AnnotatedParabola focus={null} />)
    ;['callout-vertex','callout-axis','callout-yint','callout-roots'].forEach(id => {
      expect(screen.getByTestId(id).className).not.toMatch(/opacity-25/)
    })
  })

  it('lights vertex and axis when focus is vtx', () => {
    render(<AnnotatedParabola focus="vtx" />)
    expect(screen.getByTestId('callout-vertex').className).not.toMatch(/opacity-25/)
    expect(screen.getByTestId('callout-axis').className).not.toMatch(/opacity-25/)
    expect(screen.getByTestId('callout-vertex').className).toMatch(/shadow-md/)
    expect(screen.getByTestId('callout-axis').className).toMatch(/shadow-md/)
    expect(screen.getByTestId('callout-yint').className).toMatch(/opacity-25/)
    expect(screen.getByTestId('callout-roots').className).toMatch(/opacity-25/)
  })

  it('lights only vertex when focus is dir', () => {
    render(<AnnotatedParabola focus="dir" />)
    expect(screen.getByTestId('callout-vertex').className).not.toMatch(/opacity-25/)
    expect(screen.getByTestId('callout-vertex').className).toMatch(/shadow-md/)
    expect(screen.getByTestId('callout-axis').className).toMatch(/opacity-25/)
    expect(screen.getByTestId('callout-yint').className).toMatch(/opacity-25/)
    expect(screen.getByTestId('callout-roots').className).toMatch(/opacity-25/)
  })
})
