const PIN_KEY = 'app_pin_hash'
export const PIN_SESSION_KEY = 'pin_session_unlocked'

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin + 'pf-salt')
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function isPinSet(): boolean {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem(PIN_KEY)
}

export async function setPin(pin: string): Promise<void> {
  localStorage.setItem(PIN_KEY, await hashPin(pin))
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = localStorage.getItem(PIN_KEY)
  if (!stored) return true
  return stored === await hashPin(pin)
}

export function removePin(): void {
  localStorage.removeItem(PIN_KEY)
}

export function isSessionUnlocked(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(PIN_SESSION_KEY) === 'true'
}

export function setSessionUnlocked(): void {
  sessionStorage.setItem(PIN_SESSION_KEY, 'true')
}
