const BASE_URL = typeof window !== 'undefined'
  ? '/backend'
  : (process.env.BACKEND_URL ?? 'http://localhost:4000')

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  const json = await res.json()

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (json as { message?: string }).message ?? 'Request failed',
    )
  }

  return (json as { data: T }).data
}

async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  const json = await res.json()
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (json as { message?: string }).message ?? 'Request failed',
    )
  }
  return (json as { data: T }).data
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  upload: <T>(path: string, body: FormData) => uploadFile<T>(path, body),
}
