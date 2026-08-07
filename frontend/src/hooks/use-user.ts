import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { User } from '@/types'

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    queryFn: () => api.get<User>('/users/me'),
  })
}

interface UpdateUserDto {
  name?: string
  emergencyFundGoal?: number | null
  emergencyFundAccountId?: string | null
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateUserDto) => api.patch<User>('/users/me', data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user-profile'] }),
  })
}
