import { useState, useEffect } from 'react'

const KEY = 'usd_to_thb_rate'
const DEFAULT_RATE = 33.0

export function useExchangeRate() {
  const [rate, setRateState] = useState<number>(DEFAULT_RATE)

  useEffect(() => {
    const stored = localStorage.getItem(KEY)
    if (stored) setRateState(Number(stored))
  }, [])

  function setRate(value: number) {
    localStorage.setItem(KEY, String(value))
    setRateState(value)
  }

  return { rate, setRate }
}
