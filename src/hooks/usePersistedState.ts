import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react'

// State mirrored to localStorage. The stored value is read after mount, so the
// first render matches the prerendered HTML.
export function usePersistedState<T>(
  key: string,
  initial: T
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initial)
  const loaded = useRef(false)

  // Declared before the read effect so it skips the initial value.
  useEffect(() => {
    if (!loaded.current) return
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // ignore quota errors
    }
  }, [key, state])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration only
      if (stored !== null) setState(JSON.parse(stored) as T)
    } catch {
      // ignore malformed storage
    }
    loaded.current = true
  }, [key])

  return [state, setState]
}
