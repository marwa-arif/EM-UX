import { useState, useEffect, useRef, useCallback } from 'react';

// Client-side mock gate only — not real auth, just a screen lock for now.
export const MOCK_PASSWORD = 'PAIUI@26';
export const AUTH_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour of inactivity re-locks the app

export function useAuthGate() {
  const [locked, setLocked] = useState(true);
  const lastActiveRef = useRef(Date.now());

  useEffect(() => {
    const bump = () => { lastActiveRef.current = Date.now(); };
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, bump, { passive: true }));

    const interval = setInterval(() => {
      setLocked(prevLocked => {
        if (!prevLocked && Date.now() - lastActiveRef.current > AUTH_TIMEOUT_MS) return true;
        return prevLocked;
      });
    }, 15000);

    return () => {
      events.forEach(e => window.removeEventListener(e, bump));
      clearInterval(interval);
    };
  }, []);

  const unlock = useCallback((password) => {
    if (password !== MOCK_PASSWORD) return false;
    lastActiveRef.current = Date.now();
    setLocked(false);
    return true;
  }, []);

  return { locked, unlock };
}
