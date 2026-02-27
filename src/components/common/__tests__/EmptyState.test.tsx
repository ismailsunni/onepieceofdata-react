import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import EmptyState from '../EmptyState'

describe('EmptyState', () => {
  it('renders default title and message', () => {
    render(<EmptyState />)
    expect(screen.getByText('No results found')).toBeInTheDocument()
    expect(
      screen.getByText('Try adjusting your filters or search query.')
    ).toBeInTheDocument()
  })

  it('renders custom title and message', () => {
    render(<EmptyState title="Nothing here" message="Add some data first." />)
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.getByText('Add some data first.')).toBeInTheDocument()
  })

  it('renders action slot when provided', () => {
    render(<EmptyState action={<button>Add item</button>} />)
    expect(
      screen.getByRole('button', { name: /add item/i })
    ).toBeInTheDocument()
  })

  it('renders no action slot when not provided', () => {
    render(<EmptyState />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
