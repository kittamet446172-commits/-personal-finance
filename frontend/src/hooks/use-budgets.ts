import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Budget } from '@/types'

export const budgetKeys = {
  all: ['budgets'] as const,
  list: (month: number, year: number) =>
    [...budgetKeys.all, 'list', month, year] as const,
}

export function useBudgets(month: number, year: number) {
  return useQuery({
    queryKey: budgetKeys.list(month, year),
    queryFn: () =>
      api.get<Budget[]>(`/budgets?month=${month}&year=${year}`),
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Budget, 'id' | 'category' | 'spent' | 'remaining'>) =>
      api.post<Budget>('/budgets', data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.patch<Budget>(`/budgets/${id}`, { amount }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<Budget>(`/budgets/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: budgetKeys.all }),
  })
}
