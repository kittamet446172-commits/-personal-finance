import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:4000'

async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const url = `${BACKEND_URL}/${path.join('/')}`

  const headers = new Headers()
  req.headers.forEach((value, key) => {
    if (!['host', 'connection', 'transfer-encoding'].includes(key.toLowerCase())) {
      headers.set(key, value)
    }
  })

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'

  const response = await fetch(url, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    // @ts-expect-error duplex required for streaming body
    duplex: hasBody ? 'half' : undefined,
  })

  const resHeaders = new Headers()
  response.headers.forEach((value, key) => {
    resHeaders.set(key, value)
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
