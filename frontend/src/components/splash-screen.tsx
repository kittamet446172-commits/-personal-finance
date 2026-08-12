'use client'

import { useEffect, useState } from 'react'

export function SplashScreen() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1500)
    const hideTimer = setTimeout(() => setVisible(false), 2000)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        transition: 'opacity 0.5s ease',
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: 96, height: 96, borderRadius: 24, overflow: 'hidden' }}>
          <img
            src="/icons/icon-192.png"
            alt="Mone"
            style={{ width: '135%', height: '135%', marginLeft: '-17%', marginTop: '-17%' }}
          />
        </div>
        <span style={{ color: '#111827', fontSize: 24, fontWeight: 600, letterSpacing: 1 }}>
          Mone
        </span>
      </div>
      <span
        style={{
          position: 'absolute',
          bottom: 48,
          color: '#9ca3af',
          fontSize: 14,
        }}
      >
        Personal Finance
      </span>
    </div>
  )
}
