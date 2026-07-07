import { useEffect } from 'react'

interface ToastProps {
  text: string
  kind: 'ok' | 'error'
  onDone: () => void
}

export function Toast({ text, kind, onDone }: ToastProps) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, 3600)
    return () => window.clearTimeout(timer)
  }, [text, onDone])

  return (
    <div className={`toast toast-${kind}`} role="status" aria-live="polite">
      {text}
    </div>
  )
}
