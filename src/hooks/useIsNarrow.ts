import { useEffect, useState } from 'react'

// True below Tailwind's `sm` breakpoint. False during prerender and the first
// client render (charts only draw after mount, so layouts can switch safely).
export function useIsNarrow() {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)')
    const update = () => setNarrow(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return narrow
}
