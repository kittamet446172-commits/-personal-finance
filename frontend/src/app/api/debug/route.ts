import { NextResponse } from 'next/server'

export async function GET() {
  const backendUrl = process.env.BACKEND_URL ?? 'NOT SET'
  let reachable = false
  let error = ''

  if (process.env.BACKEND_URL) {
    try {
      const res = await fetch(`${process.env.BACKEND_URL}/api/auth/get-session`, {
        signal: AbortSignal.timeout(5000),
      })
      reachable = true
      error = `status: ${res.status}`
    } catch (e) {
      error = String(e)
    }
  }

  return NextResponse.json({ BACKEND_URL: backendUrl, reachable, error })
}
