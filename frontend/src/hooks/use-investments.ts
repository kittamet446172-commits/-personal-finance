import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type {
  InvestmentHolding,
  InvestmentTransaction,
  InvestmentType,
  LotType,
  Portfolio,
} from '@/types'

export const investmentKeys = {
  all: ['investments'] as const,
  portfolio: () => [...investmentKeys.all, 'portfolio'] as const,
  holdings: () => [...investmentKeys.all, 'holdings'] as const,
  holding: (id: string) => [...investmentKeys.all, 'holdings', id] as const,
  transactions: (holdingId: string) =>
    [...investmentKeys.all, 'transactions', holdingId] as const,
}

export function usePortfolio() {
  return useQuery({
    queryKey: investmentKeys.portfolio(),
    queryFn: () => api.get<Portfolio>('/investments/portfolio'),
  })
}

export function useHoldings() {
  return useQuery({
    queryKey: investmentKeys.holdings(),
    queryFn: () => api.get<InvestmentHolding[]>('/investments/holdings'),
  })
}

export function useHolding(id: string) {
  return useQuery({
    queryKey: investmentKeys.holding(id),
    queryFn: () => api.get<InvestmentHolding>(`/investments/holdings/${id}`),
    enabled: !!id,
  })
}

export function useInvestmentTransactions(holdingId: string) {
  return useQuery({
    queryKey: investmentKeys.transactions(holdingId),
    queryFn: () =>
      api.get<InvestmentTransaction[]>(
        `/investments/holdings/${holdingId}/transactions`,
      ),
    enabled: !!holdingId,
  })
}

interface CreateHoldingDto {
  symbol: string
  name: string
  type: InvestmentType
  exchange?: string
  sector?: string
  currency?: string
  currentPrice?: number
  note?: string
}

interface UpdateHoldingDto extends Partial<CreateHoldingDto> {}

interface CreateInvestmentTransactionDto {
  type: LotType
  quantity: number
  pricePerUnit: number
  fee?: number
  date: string
  note?: string
}

export function useRefreshPrice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post<InvestmentHolding>(`/investments/holdings/${id}/refresh-price`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.all })
    },
  })
}

export function useRefreshAllPrices() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api.post<{ updated: number; total: number }>('/investments/holdings/refresh-all', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.all })
    },
  })
}

export function useCreateHolding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateHoldingDto) =>
      api.post<InvestmentHolding>('/investments/holdings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.all })
    },
  })
}

export function useUpdateHolding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateHoldingDto & { id: string }) =>
      api.patch<InvestmentHolding>(`/investments/holdings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.all })
    },
  })
}

export function useDeleteHolding() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<InvestmentHolding>(`/investments/holdings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.all })
      queryClient.invalidateQueries({ queryKey: ['dividends'] })
    },
  })
}

export function useCreateInvestmentTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      holdingId,
      ...data
    }: CreateInvestmentTransactionDto & { holdingId: string }) =>
      api.post<InvestmentTransaction>(
        `/investments/holdings/${holdingId}/transactions`,
        data,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.all })
    },
  })
}

export function useDeleteInvestmentTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.delete<InvestmentTransaction>(`/investments/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: investmentKeys.all })
    },
  })
}
