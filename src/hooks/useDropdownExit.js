import { useState, useEffect } from 'react'

// Keeps a dropdown menu mounted for `exitMs` after `open` goes false so the
// CSS slide-up exit animation (paired `--closing` class) can play before
// unmount — mirrors useToastExit's displayed/leaving pattern.
export function useDropdownExit(open, exitMs = 150) {
  const [visible, setVisible] = useState(open)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true)
      setClosing(false)
      return
    }
    if (!visible) return
    setClosing(true)
    const t = setTimeout(() => { setVisible(false); setClosing(false) }, exitMs)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return { visible, closing }
}
