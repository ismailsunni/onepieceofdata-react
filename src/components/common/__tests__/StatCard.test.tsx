import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import StatCard from '../StatCard'

function renderCard(props: Parameters<typeof StatCard>[0]) {
  return render(
    <MemoryRouter>
      <StatCard {...props} />
    </MemoryRouter>
  )
}

describe('StatCard – simple variant', () => {
  it('renders label and value', () => {
    renderCard({ variant: 'simple', label: 'Characters', value: 1234 })
    expect(screen.getByText('1234')).toBeInTheDocument()
    expect(screen.getByText('Characters')).toBeInTheDocument()
  })

  it('shows loading placeholder when loading=true', () => {
    renderCard({
      variant: 'simple',
      label: 'Characters',
      value: 1234,
      loading: true,
    })
    expect(screen.getByText('...')).toBeInTheDocument()
    expect(screen.queryByText('1234')).not.toBeInTheDocument()
  })

  it('renders as a link when link prop is provided', () => {
    renderCard({
      variant: 'simple',
      label: 'Characters',
      value: 1234,
      link: '/characters',
    })
    expect(screen.getByRole('link')).toHaveAttribute('href', '/characters')
  })

  it('renders icon when provided', () => {
    renderCard({
      variant: 'simple',
      label: 'Characters',
      value: 1234,
      icon: <span data-testid="icon">★</span>,
    })
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})

describe('StatCard – enhanced variant', () => {
  it('renders label and value', () => {
    renderCard({ label: 'Total Chapters', value: '1122' })
    expect(screen.getByText('1122')).toBeInTheDocument()
    expect(screen.getByText('Total Chapters')).toBeInTheDocument()
  })

  it('shows loading skeleton when loading=true', () => {
    const { container } = renderCard({
      label: 'Total Chapters',
      value: 0,
      loading: true,
    })
    // The enhanced loading state renders animate-pulse elements instead of the value
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('displays trend indicator', () => {
    renderCard({
      label: 'Chapters',
      value: 100,
      trend: 'up',
      trendValue: '+5%',
    })
    expect(screen.getByText('+5%')).toBeInTheDocument()
  })

  it('shows tooltip on hover over the card', () => {
    const { container } = renderCard({
      label: 'Chapters',
      value: 100,
      tooltip: 'Helpful info',
    })
    const card = container.firstChild as HTMLElement
    fireEvent.mouseEnter(card)
    expect(screen.getByText('Helpful info')).toBeInTheDocument()
  })

  it('expands details when expand button clicked', () => {
    renderCard({
      label: 'Chapters',
      value: 100,
      details: ['Detail one', 'Detail two'],
    })
    const expandButton = screen.getByRole('button', { name: /show details/i })
    fireEvent.click(expandButton)
    expect(screen.getByText('Detail one')).toBeInTheDocument()
    expect(screen.getByText('Detail two')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    renderCard({ label: 'Chapters', value: 100, subtitle: 'across all sagas' })
    expect(screen.getByText('across all sagas')).toBeInTheDocument()
  })
})
