import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Transfer } from '@/types'

export const transferKeys = {
  all: ['transfers'] as const,
  lists: () => [...transferKeys.all, 'list'] as const,
}

interface CreateTransferDto {
  fromAccountId: string
  toAccountId: string
  amount: number
  date: string
  description?: string
}

export function useTransfers() {
  return useQuery({
    queryKey: transferKeys.lists(),
    queryFn: () => api.get<Transfer[]>('/transfers'),
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
