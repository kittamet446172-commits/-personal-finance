import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Dividend } from '@/types'

export const dividendKeys = {
  all: ['dividends'] as const,
  lists: () => [...dividendKeys.all, 'list'] as const,
  summary: () => [...dividendKeys.all, 'summary'] as const,
}

export function useDividends() {
  return useQuery({
    queryKey: dividendKeys.lists(),
    queryFn: () => api.get<Dividend[]>('/dividends'),
  })
}

export function useDividendSummary() {
  return useQuery({
    queryKey: dividendKeys.summary(),
    queryFn: () =>
      api.get<{ total: number; byYear: Record<string, number> }>(
        '/dividends/summary',
      ),
  })
}

interface CreateDividendDto {
  holdingId: string
  amount: number
  perShare?: number
  date: string
  note?: string
}

export function useCreateDividend() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDividendDto) =>
      api.post<Dividend>('/dividends', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dividendKeys.all })
      queryClient.invalidateQueries({ queryKey: ['investments'] })
    },
  })
}

export function useDeleteDividend() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<Dividend>(`/dividends/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dividendKeys.all })
      queryClient.invalidateQueries({ queryKey: ['investments'] })
    },
  })
}
