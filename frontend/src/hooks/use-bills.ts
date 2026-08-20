import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Bill, Transaction, UpcomingBill } from '@/types'

const billKeys = {
  all: ['bills'] as const,
  upcoming: (days: number) => ['bills', 'upcoming', days] as const,
}

export function useBills() {
  return useQuery({
    queryKey: billKeys.all,
    queryFn: () => api.get<Bill[]>('/bills'),
  })
}

export function useUpcomingBills(days = 7) {
  return useQuery({
    queryKey: billKeys.upcoming(days),
    queryFn: () => api.get<UpcomingBill[]>(`/bills/upcoming?days=${days}`),
  })
}

export function useCreateBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Bill, 'id' | 'createdAt'>) =>
      api.post<Bill>('/bills', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billKeys.all }),
  })
}

export function useUpdateBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Bill> & { id: string }) =>
      api.patch<Bill>(`/bills/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billKeys.all }),
  })
}

export function useDeleteBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<Bill>(`/bills/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: billKeys.all }),
  })
}

interface PayBillDto {
  accountId: string
  categoryId: string
  amount?: number
  date?: string
}

export function usePayBill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...dto }: PayBillDto & { id: string }) =>
      api.post<Transaction>(`/bills/${id}/pay`, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}
