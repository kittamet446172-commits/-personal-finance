import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { UserSettings } from '@/types'

const KEY = ['user-settings'] as const

export function useUserSettings() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => api.get<UserSettings | null>('/user-settings'),
  })
}

interface UpsertDto {
  emergencyFundAccountId?: string | null
  monthlySalary?: number
}

export function useUpsertUserSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (dto: UpsertDto) => api.patch<UserSettings>('/user-settings', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  })
}
