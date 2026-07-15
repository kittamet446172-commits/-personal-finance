import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Account } from '@/types'

export const accountKeys = {
  all: ['accounts'] as const,
  lists: () => [...accountKeys.all, 'list'] as const,
  detail: (id: string) => [...accountKeys.all, 'detail', id] as const,
}

export function useAccounts() {
  return useQuery({
    queryKey: accountKeys.lists(),
    queryFn: () => api.get<Account[]>('/accounts'),
  })
}

interface CreateAccountDto {
  name: string
  type: Account['type']
  balance: number
  description?: string
}

interface UpdateAccountDto {
  name?: string
  type?: Account['type']
  description?: string
}

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateAccountDto) =>
      api.post<Account>('/accounts', data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  })
}

export function useUpdateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateAccountDto & { id: string }) =>
      api.patch<Account>(`/accounts/${id}`, data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete<Account>(`/accounts/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: accountKeys.all }),
  })
}
