import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastCtx = createContext(null)

const AUTO_DISMISS_MS = { success: 3500, info: 3500 }
const EXIT_MS = 280
let nextToastId = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef({})

  const dismissToast = useCallback((id) => {
    setToasts(ts => ts.map(t => t.id === id ? { ...t, leaving: true } : t))
    clearTimeout(timersRef.current[id])
    timersRef.current[id] = setTimeout(() => {
      setToasts(ts => ts.filter(t => t.id !== id))
      delete timersRef.current[id]
    }, EXIT_MS)
  }, [])

  const showToast = useCallback(({ type = 'success', msg, duration }) => {
    const id = `t-${nextToastId++}`
    setToasts(ts => [{ id, type, msg, leaving: false }, ...ts])
    if (type === 'success' || type === 'info') {
      const ms = duration ?? AUTO_DISMISS_MS[type]
      timersRef.current[id] = setTimeout(() => dismissToast(id), ms)
    }
    return id
  }, [dismissToast])

  return (
    <ToastCtx.Provider value={{ showToast, dismissToast }}>
      {children}
      <div className="ds-toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`ds-toast ${t.type}${t.leaving ? ' ds-toast--leaving' : ''}`}>
            <span>{t.msg}</span>
            <button className="ds-toast-dismiss" onClick={() => dismissToast(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
