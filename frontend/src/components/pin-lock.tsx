'use client'

import { useState, useCallback } from 'react'
import { Delete } from 'lucide-react'
import { verifyPin, setSessionUnlocked } from '@/lib/pin'

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','del']

interface PinLockProps {
  onUnlock: () => void
}

export function PinLock({ onUnlock }: PinLockProps) {
  const [digits, setDigits] = useState<string[]>([])
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)

  const handleDigit = useCallback(async (d: string) => {
    setDigits((prev) => {
      if (prev.length >= 4) return prev
      const next = [...prev, d]

      if (next.length === 4) {
        const pin = next.join('')
        verifyPin(pin).then((ok) => {
          if (ok) {
            setSessionUnlocked()
            onUnlock()
          } else {
            setError(true)
            setShaking(true)
            setTimeout(() => {
              setDigits([])
              setError(false)
              setShaking(false)
            }, 600)
          }
        })
      }

      return next
    })
  }, [onUnlock])

  const handleDelete = useCallback(() => {
    setDigits((prev) => prev.slice(0, -1))
  }, [])

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <p className="text-2xl font-bold mb-2">Personal Finance</p>
      <p className="text-sm text-muted-foreground mb-10">กรอกรหัส PIN เพื่อเข้าใช้งาน</p>

      <div className={`flex gap-5 mb-12 ${shaking ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-colors duration-150 ${
              digits.length > i
                ? error
                  ? 'bg-destructive border-destructive'
                  : 'bg-primary border-primary'
                : 'border-muted-foreground'
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((k, i) => {
          if (k === '') return <div key={i} />
          if (k === 'del') return (
            <button
              key={i}
              onClick={handleDelete}
              className="flex items-center justify-center h-16 w-16 rounded-full text-muted-foreground hover:bg-muted transition-colors"
            >
              <Delete className="h-6 w-6" />
            </button>
          )
          return (
            <button
              key={i}
              onClick={() => handleDigit(k)}
              className="flex items-center justify-center h-16 w-16 rounded-full text-2xl font-medium border border-border hover:bg-muted transition-colors"
            >
              {k}
            </button>
          )
        })}
      </div>

      {error && (
        <p className="mt-8 text-sm text-destructive">รหัส PIN ไม่ถูกต้อง</p>
      )}
    </div>
  )
}
