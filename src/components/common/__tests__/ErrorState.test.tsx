import { render, screen, fireEvent } from '@testing-library/react'
import ErrorState from '../ErrorState'

describe('ErrorState', () => {
  it('renders default title and message', () => {
    render(<ErrorState />)
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(
      screen.getByText('Failed to load data. Please try again.')
    ).toBeInTheDocument()
  })

  it('renders custom title and message', () => {
    render(<ErrorState title="Oops" message="Network failed" />)
    expect(screen.getByText('Oops')).toBeInTheDocument()
    expect(screen.getByText('Network failed')).toBeInTheDocument()
  })

  it('does not render retry button when onRetry is not provided', () => {
    render(<ErrorState />)
    expect(
      screen.queryByRole('button', { name: /try again/i })
    ).not.toBeInTheDocument()
  })

  it('renders retry button and calls onRetry when clicked', () => {
    const onRetry = vi.fn()
    render(<ErrorState onRetry={onRetry} />)
    const button = screen.getByRole('button', { name: /try again/i })
    fireEvent.click(button)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
