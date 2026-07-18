import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { CategoryBreakdown, DayBreakdown, MonthlySummary, TransactionType, YearlyTrend } from '@/types'

export function useMonthlySummary(month: number, year: number) {
  return useQuery({
    queryKey: ['reports', 'monthly-summary', month, year],
    queryFn: () =>
      api.get<MonthlySummary>(
        `/reports/monthly-summary?month=${month}&year=${year}`,
      ),
  })
}

export function useCategoryBreakdown(
  month: number,
  year: number,
  type: TransactionType = 'EXPENSE',
) {
  return useQuery({
    queryKey: ['reports', 'category-breakdown', month, year, type],
    queryFn: () =>
      api.get<CategoryBreakdown[]>(
        `/reports/category-breakdown?month=${month}&year=${year}&type=${type}`,
      ),
  })
}

export function useDailyBreakdown(
  month: number,
  year: number,
  type: TransactionType = 'EXPENSE',
) {
  return useQuery({
    queryKey: ['reports', 'daily-breakdown', month, year, type],
    queryFn: () =>
      api.get<DayBreakdown[]>(
        `/reports/daily-breakdown?month=${month}&year=${year}&type=${type}`,
      ),
  })
}

export function useYearlyTrend(year: number) {
  return useQuery({
    queryKey: ['reports', 'trend', year],
    queryFn: () => api.get<YearlyTrend>(`/reports/trend?year=${year}`),
  })
}
