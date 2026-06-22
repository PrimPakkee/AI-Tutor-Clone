import { render, screen } from '@testing-library/react'
import { QuadraticIntroSlide } from '@/components/LessonPlayer/QuadraticIntroSlide'
import type { Slide } from '@/lib/types'

const slide: Slide = {
  index: 1,
  title: 'What is a Quadratic Function?',
  content: {
    variant: 'quadratic-intro',
    bullets: ['A function of degree 2: f(x) = ax² + bx + c'],
  },
}

describe('QuadraticIntroSlide', () => {
  it('renders the slide title', () => {
    render(<QuadraticIntroSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByText('What is a Quadratic Function?')).toBeInTheDocument()
  })

  it('renders both form cards', () => {
    render(<QuadraticIntroSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByTestId('card-std')).toBeInTheDocument()
    expect(screen.getByTestId('card-vtx')).toBeInTheDocument()
  })

  it('renders all three fact rows', () => {
    render(<QuadraticIntroSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByTestId('fact-dir')).toBeInTheDocument()
    expect(screen.getByTestId('fact-axis')).toBeInTheDocument()
    expect(screen.getByTestId('fact-roots')).toBeInTheDocument()
  })

  it('renders the SAT tip', () => {
    render(<QuadraticIntroSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByText(/identify the form first/i)).toBeInTheDocument()
  })

  it('highlights std card and dims others when focus is std', () => {
    render(<QuadraticIntroSlide slide={slide} slideCount={12} sceneState={{ focus: 'std' }} />)
    expect(screen.getByTestId('card-std').className).toMatch(/border-indigo-400/)
    expect(screen.getByTestId('card-vtx').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('fact-dir').className).toMatch(/opacity-40/)
  })

  it('highlights vtx card and dims others when focus is vtx', () => {
    render(<QuadraticIntroSlide slide={slide} slideCount={12} sceneState={{ focus: 'vtx' }} />)
    expect(screen.getByTestId('card-vtx').className).toMatch(/border-amber-400/)
    expect(screen.getByTestId('card-std').className).toMatch(/opacity-40/)
  })

  it('highlights matching fact row and dims others when focus is axis', () => {
    render(<QuadraticIntroSlide slide={slide} slideCount={12} sceneState={{ focus: 'axis' }} />)
    expect(screen.getByTestId('fact-axis').className).not.toMatch(/opacity-40/)
    expect(screen.getByTestId('fact-dir').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('fact-roots').className).toMatch(/opacity-40/)
  })

  it('dims nothing when sceneState is empty', () => {
    render(<QuadraticIntroSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByTestId('card-std').className).not.toMatch(/opacity-40/)
    expect(screen.getByTestId('card-vtx').className).not.toMatch(/opacity-40/)
    expect(screen.getByTestId('fact-dir').className).not.toMatch(/opacity-40/)
  })
})
