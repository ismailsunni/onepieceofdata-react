import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ErrorBoundary from '../components/common/ErrorBoundary'

// Component that throws on demand
const Bomb = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) throw new Error('Test error')
  return <div>All good</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress console.error noise from intentional throws
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText('All good')).toBeInTheDocument()
  })

  it('renders error UI when a child throws', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    )
    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
  })

  it('resets error state when Try again is clicked', async () => {
    const user = userEvent.setup()

    // Use a mutable ref so we can change behaviour before the boundary re-renders
    let shouldThrow = true
    const ThrowController = () => <Bomb shouldThrow={shouldThrow} />

    render(
      <ErrorBoundary>
        <ThrowController />
      </ErrorBoundary>
    )
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()

    shouldThrow = false
    await user.click(screen.getByText('Try again'))

    expect(screen.getByText('All good')).toBeInTheDocument()
  })
})
