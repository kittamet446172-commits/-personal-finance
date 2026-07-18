import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Paginated, Transaction, TransactionType } from '@/types'

export interface TransactionQuery {
  page?: number
  limit?: number
  type?: TransactionType
  categoryId?: string
  accountId?: string
  month?: number
  year?: number
  search?: string
}

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  list: (q?: TransactionQuery) =>
    [...transactionKeys.all, 'list', q] as const,
  recent: () => [...transactionKeys.all, 'recent'] as const,
  stats: (month: number, year: number) =>
    [...transactionKeys.all, 'stats', month, year] as const,
}

export function useTransactions(query?: TransactionQuery) {
  return useQuery({
    queryKey: transactionKeys.list(query),
    queryFn: () => {
      const params = new URLSearchParams()
      if (query?.page) params.set('page', String(query.page))
      if (query?.limit) params.set('limit', String(query.limit))
      if (query?.type) params.set('type', query.type)
      if (query?.categoryId) params.set('categoryId', query.categoryId)
      if (query?.accountId) params.set('accountId', query.accountId)
      if (query?.month) params.set('month', String(query.month))
      if (query?.year) params.set('year', String(query.year))
      if (query?.search) params.set('search', query.search)
      const qs = params.toString()
      return api.get<Paginated<Transaction>>(`/transactions${qs ? `?${qs}` : ''}`)
    },
  })
}

export function useRecentTransactions() {
  return useQuery({
    queryKey: transactionKeys.recent(),
    queryFn: () => api.get<Transaction[]>('/transactions/recent'),
  })
}

export function useMonthlyStats(month: number, year: number) {
  return useQuery({
    queryKey: transactionKeys.stats(month, year),
    queryFn: () =>
      api.get<{
        income: number
        expense: number
        savings: number
        savingsRate: number
      }>(`/transactions/stats?month=${month}&year=${year}`),
  })
}

interface CreateTransactionDto {
  type: TransactionType
  amount: number
  date: string
  categoryId: string
  accountId: string
  merchant?: string
  description?: string
}

interface UpdateTransactionDto {
  amount?: number
  date?: string
  categoryId?: string
  accountId?: string
  merchant?: string
  description?: string
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: transactionKeys.all })
  queryClient.invalidateQueries({ queryKey: ['reports'] })
  queryClient.invalidateQueries({ queryKey: ['accounts'] })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTransactionDto) =>
      api.post<Transaction>('/transactions', data),
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateTransactionDto & { id: string }) =>
      api.patch<Transaction>(`/transactions/${id}`, data),
    onSuccess: () => invalidateAll(queryClient),
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<Transaction>(`/transactions/${id}`),
    onSuccess: () => invalidateAll(queryClient),
  })
}
