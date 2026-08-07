import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000'
// Stable production URL — rewritten as origin so all Vercel preview deployments are trusted
const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000')

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const url = `${BACKEND_URL}/api/auth/${path.join('/')}`

  const headers = new Headers()
  req.headers.forEach((value, key) => {
    if (!['host', 'connection', 'transfer-encoding', 'origin'].includes(key.toLowerCase())) {
      headers.set(key, value)
    }
  })
  headers.set('origin', APP_ORIGIN)

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'

  let response: Response
  try {
    response = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
      // @ts-expect-error duplex required for streaming body
      duplex: hasBody ? 'half' : undefined,
    })
  } catch (err) {
    console.error(`[auth-proxy] fetch failed url=${url}`, err)
    return NextResponse.json({ message: String(err) }, { status: 502 })
  }

  const resHeaders = new Headers()
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      // Strip Domain attribute so the browser binds the cookie to the Vercel domain
      resHeaders.append('set-cookie', value.replace(/;\s*domain=[^;]*/gi, ''))
    } else {
      resHeaders.set(key, value)
    }
  })

  return new NextResponse(response.body, {
    status: response.status,
    headers: resHeaders,
  })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler
export const OPTIONS = handler
