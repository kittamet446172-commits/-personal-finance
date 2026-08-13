import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface NetWorthSnapshot {
  date: string
  totalAccounts: number
  totalInvestments: number
  netWorth: number
}

export function useNetWorthHistory(months = 6) {
  return useQuery({
    queryKey: ['net-worth-history', months],
    queryFn: () => api.get<NetWorthSnapshot[]>(`/net-worth/history?months=${months}`),
  })
}

export function useTakeSnapshot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>('/net-worth/snapshot', {}),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['net-worth-history'] }),
  })
}
