import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Transfer } from '@/types'

export const transferKeys = {
  all: ['transfers'] as const,
  lists: (params?: TransferQuery) => [...transferKeys.all, 'list', params] as const,
}

interface TransferQuery {
  month?: number
  year?: number
  search?: string
  page?: number
  limit?: number
}

interface PaginatedTransfers {
  data: Transfer[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface CreateTransferDto {
  fromAccountId: string
  toAccountId: string
  amount: number
  date: string
  description?: string
}

export function useTransfers(params?: TransferQuery) {
  const searchParams = new URLSearchParams()
  if (params?.month) searchParams.set('month', String(params.month))
  if (params?.year) searchParams.set('year', String(params.year))
  if (params?.search) searchParams.set('search', params.search)
  if (params?.page) searchParams.set('page', String(params.page))
  if (params?.limit) searchParams.set('limit', String(params.limit))

  const qs = searchParams.toString()

  return useQuery({
    queryKey: transferKeys.lists(params),
    queryFn: () => api.get<PaginatedTransfers>(`/transfers${qs ? `?${qs}` : ''}`),
  })
}

export function useCreateTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTransferDto) =>
      api.post<Transfer>('/transfers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferKeys.all })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<Transfer>(`/transfers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transferKeys.all })
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
    },
  })
}
