import { render, screen } from '@testing-library/react'
import { StandardFormSlide } from '@/components/LessonPlayer/StandardFormSlide'
import type { Slide } from '@/lib/types'

const slide: Slide = {
  index: 2,
  title: 'Standard Form',
  content: { variant: 'standard-form', bullets: [] },
}

describe('StandardFormSlide', () => {
  it('renders the slide title', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByText('Standard Form')).toBeInTheDocument()
  })

  it('renders all three coefficient cards', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByTestId('card-a')).toBeInTheDocument()
    expect(screen.getByTestId('card-b')).toBeInTheDocument()
    expect(screen.getByTestId('card-c')).toBeInTheDocument()
  })

  it('renders the SAT tip', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByTestId('sat-tip')).toBeInTheDocument()
  })

  it('renders the annotated parabola', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByTestId('annotated-parabola')).toBeInTheDocument()
  })

  it('dims nothing when sceneState is empty', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByTestId('card-a').className).not.toMatch(/opacity-40/)
    expect(screen.getByTestId('card-b').className).not.toMatch(/opacity-40/)
    expect(screen.getByTestId('card-c').className).not.toMatch(/opacity-40/)
    expect(screen.getByTestId('sat-tip').className).not.toMatch(/opacity-40/)
  })

  it('lights a-card and dims b, c, SAT when focus is a', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{ focus: 'a' }} />)
    expect(screen.getByTestId('card-a').className).toMatch(/border-indigo-400/)
    expect(screen.getByTestId('card-b').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('card-c').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('sat-tip').className).toMatch(/opacity-40/)
  })

  it('lights b-card and dims a, c, SAT when focus is b', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{ focus: 'b' }} />)
    expect(screen.getByTestId('card-b').className).toMatch(/border-amber-400/)
    expect(screen.getByTestId('card-a').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('card-c').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('sat-tip').className).toMatch(/opacity-40/)
  })

  it('lights c-card and dims a, b, SAT when focus is c', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{ focus: 'c' }} />)
    expect(screen.getByTestId('card-c').className).toMatch(/border-emerald-400/)
    expect(screen.getByTestId('card-a').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('card-b').className).toMatch(/opacity-40/)
    expect(screen.getByTestId('sat-tip').className).toMatch(/opacity-40/)
  })

  it('lit card does not have opacity-40', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{ focus: 'a' }} />)
    expect(screen.getByTestId('card-a').className).not.toMatch(/opacity-40/)
  })

  it('SAT tip text mentions memorize', () => {
    render(<StandardFormSlide slide={slide} slideCount={12} sceneState={{}} />)
    expect(screen.getByText(/memorize this formula/i)).toBeInTheDocument()
  })
})
