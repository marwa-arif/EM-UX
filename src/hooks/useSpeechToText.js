import { useState, useRef, useCallback, useEffect } from 'react'

const SpeechRecognitionCtor = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition)
  : null

// Wraps the Web Speech API so any composer can dictate into its textarea.
// toggle() re-sends the running session transcript (base text + spoken
// words so far) through the same onChange setter the composer already
// uses for typing, so no separate state wiring is needed per composer.
export function useSpeechToText(onError) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const baseTextRef = useRef('')
  const setValueRef = useRef(null)

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
  }, [])

  const start = useCallback((currentText, setValue) => {
    if (!SpeechRecognitionCtor || listening) return
    baseTextRef.current = currentText
    setValueRef.current = setValue

    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = true

    recognition.onresult = (e) => {
      let transcript = ''
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript
      const base = baseTextRef.current.trim()
      setValueRef.current(base ? `${base} ${transcript}` : transcript)
    }
    recognition.onerror = (e) => {
      setListening(false)
      onError?.(e.error)
    }
    recognition.onend = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [listening, onError])

  const toggle = useCallback((currentText, setValue) => {
    if (listening) stop()
    else start(currentText, setValue)
  }, [listening, start, stop])

  useEffect(() => () => recognitionRef.current?.stop(), [])

  return { listening, toggle, supported: !!SpeechRecognitionCtor }
}
