import React, { createContext, useContext, useState, useCallback, useRef } from 'react'

const NavigatorActivityContext = createContext(null);

// How long a chat is treated as "generating" before it's assumed complete —
// independent of whether NavigatorPage/ChatView is still mounted to run its
// own step-by-step ReasoningEngine simulation. That simulation's timers live
// entirely inside ChatView and get torn down the instant it unmounts (e.g.
// the user switches to another dashboard mid-response), so it can't be the
// thing driving a status pill shown elsewhere in the app. This timer is the
// one source of truth for "still generating" that survives leaving the page.
const GENERATING_MS = 7000;

export function NavigatorActivityProvider({ children }) {
  // { id, label, status: 'generating' | 'done', startedAt } | null — once a
  // chat is started it stays here (as the most-recent-activity row wherever
  // it's surfaced, e.g. the LeftNav's Navigator hover preview) until a newer
  // one replaces it. Finishing only flips `status`, it never clears the
  // entry outright — a completed chat is still a real chat and belongs in
  // "Recent chats", not something that vanishes the moment it's done.
  const [activeChat, setActiveChat] = useState(null);
  const timerRef = useRef(null);

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  const startChat = useCallback((id, label) => {
    clearTimer();
    setActiveChat({ id, label, status: 'generating', startedAt: Date.now() });
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setActiveChat(cur => (cur && cur.id === id ? { ...cur, status: 'done' } : cur));
    }, GENERATING_MS);
  }, []);

  // Called when ChatView itself sees the exchange finish while still mounted
  // — flips to 'done' immediately instead of waiting out the fallback timer.
  const finishChat = useCallback((id) => {
    setActiveChat(cur => {
      if (!cur || cur.id !== id) return cur;
      clearTimer();
      return { ...cur, status: 'done' };
    });
  }, []);

  return (
    <NavigatorActivityContext.Provider value={{ activeChat, startChat, finishChat }}>
      {children}
    </NavigatorActivityContext.Provider>
  );
}

export function useNavigatorActivity() {
  const ctx = useContext(NavigatorActivityContext);
  if (!ctx) throw new Error('useNavigatorActivity must be used within a NavigatorActivityProvider');
  return ctx;
}
