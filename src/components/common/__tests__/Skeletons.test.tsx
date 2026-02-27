import { render } from '@testing-library/react'
import SkeletonCard from '../SkeletonCard'
import SkeletonChart from '../SkeletonChart'
import SkeletonStat from '../SkeletonStat'
import SkeletonTable from '../SkeletonTable'

describe('Skeleton components', () => {
  it('SkeletonCard renders with animate-pulse', () => {
    const { container } = render(<SkeletonCard />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('SkeletonChart renders with animate-pulse', () => {
    const { container } = render(<SkeletonChart />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('SkeletonStat renders with animate-pulse', () => {
    const { container } = render(<SkeletonStat />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('SkeletonTable renders default rows and cols', () => {
    const { container } = render(<SkeletonTable />)
    // Default 8 rows + 1 header row = 9 grid rows
    const gridRows = container.querySelectorAll(
      '[style*="grid-template-columns"]'
    )
    expect(gridRows.length).toBe(9) // 1 header + 8 rows
  })

  it('SkeletonTable respects custom rows and cols props', () => {
    const { container } = render(<SkeletonTable rows={3} cols={4} />)
    const gridRows = container.querySelectorAll(
      '[style*="grid-template-columns"]'
    )
    expect(gridRows.length).toBe(4) // 1 header + 3 rows
  })
})
