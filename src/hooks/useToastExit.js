import { useState, useEffect } from 'react'

// Keeps a toast mounted for `exitMs` after it's cleared so a CSS exit
// animation (paired `--leaving` class) can play before unmount.
export function useToastExit(toast, exitMs = 200) {
  const [displayed, setDisplayed] = useState(toast ?? null)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (toast) {
      setDisplayed(toast)
      setLeaving(false)
      return
    }
    if (!displayed) return
    setLeaving(true)
    const t = setTimeout(() => setDisplayed(null), exitMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast])

  return { displayed, leaving }
}
