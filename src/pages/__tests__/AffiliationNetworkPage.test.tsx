import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock vis-network before importing the component
vi.mock('vis-network/standalone', () => ({
  Network: vi.fn(),
  DataSet: vi.fn(),
}))

// Mock the affiliation service
vi.mock('../../services/affiliationService', () => ({
  fetchAllAffiliations: vi.fn(),
}))

// Mock useQuery to control loading/data states
const mockUseQuery = vi.fn()
vi.mock('@tanstack/react-query', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}))

import AffiliationNetworkPage from '../AffiliationNetworkPage'

function renderPage() {
  return render(
    <MemoryRouter>
      <AffiliationNetworkPage />
    </MemoryRouter>
  )
}

describe('AffiliationNetworkPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading spinner when data is loading', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: true })

    const { container } = renderPage()

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders page title and description', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false })

    renderPage()

    expect(
      screen.getByRole('heading', { name: 'Affiliation Network' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Groups connected by shared members. Thicker edges = more members in common.'
      )
    ).toBeInTheDocument()
  })

  it('renders breadcrumb navigation', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false })

    renderPage()

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })

  it('renders controls when not loading', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false })

    renderPage()

    expect(screen.getByPlaceholderText('Search group...')).toBeInTheDocument()
    expect(screen.getByText('Min group size:')).toBeInTheDocument()
    expect(screen.getByText('Min shared members:')).toBeInTheDocument()
    expect(screen.getByText('Hide isolated nodes')).toBeInTheDocument()
    expect(screen.getByText('Reset zoom')).toBeInTheDocument()
  })

  it('shows node/edge counts in controls', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false })

    renderPage()

    expect(screen.getByText('0 groups, 0 connections')).toBeInTheDocument()
  })

  it('shows instruction text when no node or edge is selected', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false })

    renderPage()

    expect(
      screen.getByText('Click a node or edge to see details.')
    ).toBeInTheDocument()
  })

  it('does not render spinner when loading is false', () => {
    mockUseQuery.mockReturnValue({ data: [], isLoading: false })

    const { container } = renderPage()

    expect(container.querySelector('.animate-spin')).not.toBeInTheDocument()
  })
})
