import React, { useEffect, useState } from 'react'
import '../styles/explore.css'

const TYPE_NOUN = { chart: 'chart', table: 'table', section: 'section' }

function labelFor(el) {
  return (
    el.getAttribute('data-nav-label') ||
    el.getAttribute('aria-label') ||
    el.querySelector('h1,h2,h3,h4,label')?.textContent?.trim() ||
    'this'
  )
}

// One-shot "click any chart/table/section to ask Navigator about it" mode.
// Listens on `document` instead of a full-screen blocking layer, so anything
// on the page that ISN'T tagged data-nav-explore keeps working normally.
export default function ClickExploreOverlay({ active, onPick, onExit }) {
  const [hover, setHover] = useState(null) // { rect, label, type }

  useEffect(() => {
    if (!active) { setHover(null); return }

    const findTarget = (el) => el?.closest?.('[data-nav-explore]') || null

    const handleMove = (e) => {
      const target = findTarget(e.target)
      if (!target) { setHover(null); return }
      setHover({
        rect: target.getBoundingClientRect(),
        label: labelFor(target),
        type: target.getAttribute('data-nav-explore') || 'section',
      })
    }

    const handleScroll = () => setHover(null)

    const handleClick = (e) => {
      const target = findTarget(e.target)
      if (!target) return
      e.preventDefault()
      e.stopPropagation()
      onPick?.(labelFor(target), target.getAttribute('data-nav-explore') || 'section')
      onExit?.()
    }

    const handleKey = (e) => { if (e.key === 'Escape') onExit?.() }

    document.addEventListener('mousemove', handleMove, true)
    document.addEventListener('scroll', handleScroll, true)
    document.addEventListener('click', handleClick, true)
    document.addEventListener('keydown', handleKey, true)
    return () => {
      document.removeEventListener('mousemove', handleMove, true)
      document.removeEventListener('scroll', handleScroll, true)
      document.removeEventListener('click', handleClick, true)
      document.removeEventListener('keydown', handleKey, true)
    }
  }, [active, onPick, onExit])

  if (!active) return null

  return (
    <>
      <div className="nex-banner" role="status">
        <span className="nex-banner-text">
          Click any chart, table, or section to ask Navigator about it
        </span>
        <button className="nex-banner-cancel" onClick={onExit}>Cancel</button>
      </div>
      {hover && (
        <div
          className="nex-highlight"
          style={{
            top: hover.rect.top, left: hover.rect.left,
            width: hover.rect.width, height: hover.rect.height,
          }}
        >
          <span className="nex-highlight-tag">
            Ask about “{hover.label}” {TYPE_NOUN[hover.type] || 'section'}
          </span>
        </div>
      )}
    </>
  )
}
