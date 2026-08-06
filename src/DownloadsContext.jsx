import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Icons } from './ui.jsx'
import { initialDownloads } from './components/NotificationPanel.jsx'
import { useToast } from './context/ToastCtx.jsx'
import './styles/navigator.css'

const DownloadsContext = createContext(null);

let nextDownloadId = 1;
let nextFlightId = 1;
const FLIGHT_MS = 650;
const FAILURE_RATE = 0.2;

function FlyingDownloadIcon({ fromRect, toRect, onDone }) {
  const [moving, setMoving] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMoving(true));
    const t = setTimeout(onDone, FLIGHT_MS);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startX = fromRect.left + fromRect.width / 2;
  const startY = fromRect.top + fromRect.height / 2;
  const endX = toRect.left + toRect.width / 2;
  const endY = toRect.top + toRect.height / 2;

  const style = {
    left: startX - 12,
    top: startY - 12,
    transform: moving
      ? `translate(${endX - startX}px, ${endY - startY}px) scale(0.35)`
      : 'translate(0, 0) scale(1)',
    opacity: moving ? 0 : 1,
  };

  return createPortal(
    <div className="dl-fly-icon" style={style}>{Icons.download}</div>,
    document.body
  );
}

export function DownloadsProvider({ children }) {
  const [downloads, setDownloads] = useState(initialDownloads);
  const [flights, setFlights] = useState([]);
  const [bellPulse, setBellPulse] = useState(0);
  const { showToast } = useToast();
  const bellTargetRef = useRef(null);
  const namesRef = useRef(Object.fromEntries(initialDownloads.map(d => [d.id, d.name])));

  const setStatus = useCallback((id, patch) => {
    setDownloads(ds => ds.map(d => d.id === id ? { ...d, ...patch } : d));
  }, []);

  const runDownload = useCallback((id) => {
    setStatus(id, { status: 'processing', progress: 0 });
    setTimeout(() => {
      setStatus(id, { status: 'in-progress', progress: 30 });
      setTimeout(() => {
        setStatus(id, { progress: 70 });
        setTimeout(() => {
          const name = namesRef.current[id] || 'File';
          const succeeded = Math.random() >= FAILURE_RATE;
          setStatus(id, succeeded
            ? { status: 'completed', progress: 100 }
            : { status: 'failed', progress: 0 });
          showToast({ type: succeeded ? 'success' : 'error', msg: succeeded
            ? `${name} downloaded successfully`
            : `${name} failed to download` });
        }, 600);
      }, 600);
    }, 1000);
  }, [setStatus, showToast]);

  const addDownload = useCallback((name, originEl) => {
    const id = `d-${nextDownloadId++}`;
    namesRef.current[id] = name;
    setDownloads(ds => [
      { id, name, status: 'processing', progress: 0, size: '—', timestamp: 'Just now' },
      ...ds,
    ]);
    runDownload(id);

    if (originEl && bellTargetRef.current) {
      const fromRect = originEl.getBoundingClientRect();
      const toRect = bellTargetRef.current.getBoundingClientRect();
      const flightId = `f-${nextFlightId++}`;
      setFlights(fl => [...fl, { id: flightId, fromRect, toRect }]);
    }

    return id;
  }, [runDownload]);

  const removeFlight = useCallback((flightId) => {
    setFlights(fl => fl.filter(f => f.id !== flightId));
    setBellPulse(p => p + 1);
  }, []);

  const retryDownload = useCallback((id) => runDownload(id), [runDownload]);
  const dismissDownload = useCallback((id) => setDownloads(ds => ds.filter(d => d.id !== id)), []);

  return (
    <DownloadsContext.Provider value={{ downloads, addDownload, retryDownload, dismissDownload, bellTargetRef, bellPulse }}>
      {children}
      {flights.map(f => (
        <FlyingDownloadIcon
          key={f.id}
          fromRect={f.fromRect}
          toRect={f.toRect}
          onDone={() => removeFlight(f.id)}
        />
      ))}
    </DownloadsContext.Provider>
  );
}

export function useDownloads() {
  const ctx = useContext(DownloadsContext);
  if (!ctx) throw new Error('useDownloads must be used within a DownloadsProvider');
  return ctx;
}
