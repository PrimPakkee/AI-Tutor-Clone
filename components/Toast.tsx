'use client'
import { useEffect, useState } from 'react'

type Props = {
  message: string
  onDismiss: () => void
  durationMs?: number
}

export function Toast({ message, onDismiss, durationMs = 3000 }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); onDismiss() }, durationMs)
    return () => clearTimeout(t)
  }, [durationMs, onDismiss])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-4 py-2.5 rounded-lg shadow-xl">
      {message}
    </div>
  )
}
