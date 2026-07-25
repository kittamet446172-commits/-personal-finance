'use client'

import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAccounts } from '@/hooks/use-accounts'
import { useMonthlyStats, useRecentTransactions } from '@/hooks/use-transactions'
import { useCategoryBreakdown, useYearlyTrend } from '@/hooks/use-reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'

const MONTH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

const PIE_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
]

function polarXY(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function sectorPath(cx: number, cy: number, r1: number, r2: number, a1: number, a2: number): string {
  const end = a2 - a1 >= 360 ? a1 + 359.999 : a2
  const [ox1, oy1] = polarXY(cx, cy, r2, a1)
  const [ox2, oy2] = polarXY(cx, cy, r2, end)
  const [ix2, iy2] = polarXY(cx, cy, r1, end)
  const [ix1, iy1] = polarXY(cx, cy, r1, a1)
  const lg = end - a1 > 180 ? 1 : 0
  return `M${ox1} ${oy1} A${r2} ${r2} 0 ${lg} 1 ${ox2} ${oy2} L${ix2} ${iy2} A${r1} ${r1} 0 ${lg} 0 ${ix1} ${iy1}Z`
}

export default function DashboardPage() {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const { data: accounts = [] } = useAccounts()
  const { data: stats } = useMonthlyStats(month, year)
  const { data: recent = [] } = useRecentTransactions()
  const { data: trend } = useYearlyTrend(year)
  const { data: expenseBreakdown = [] } = useCategoryBreakdown(month, year, 'EXPENSE')

  const netWorth = accounts.reduce((sum, a) => sum + Number(a.balance), 0)

  const incomeChartData = trend?.months.map((m) => ({
    name: MONTH_SHORT[m.month - 1],
    รายรับ: m.income,
    รายจ่าย: m.expense,
  })) ?? []

  const expensePieData = expenseBreakdown.map((b, i) => ({
    name: `${b.category?.icon ?? ''} ${b.category?.name ?? ''}`.trim(),
    value: b.amount,
    color: PIE_COLORS[i % PIE_COLORS.length],
  }))

  const [hoveredSlice, setHoveredSlice] = useState<{ name: string; value: number } | null>(null)
  const totalExpense = expensePieData.reduce((sum, d) => sum + d.value, 0)

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  let pieAngle = 0
  const pieSectors = expensePieData.map((d) => {
    const start = pieAngle
    pieAngle += (d.value / totalExpense) * 360
    return { ...d, start, end: pieAngle }
  })

  return (
    <div className="space-y-6">

      {/* Net Worth */}
      <Card>
        <CardContent className="py-6 px-6">
          <p className="text-sm text-muted-foreground mb-1">Net Worth</p>
          <p className="text-2xl font-bold">{formatCurrency(netWorth)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {accounts.length} บัญชี
          </p>
        </CardContent>
      </Card>

      {/* Income / Expense / Savings */}
      <div className="grid grid-cols-3 gap-2">
        <Card>
          <CardContent className="py-3 px-3">
            <p className="text-xs text-muted-foreground mb-1">รายรับ</p>
            <p className="text-sm font-bold text-green-600">
              {formatCurrency(stats?.income ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-3">
            <p className="text-xs text-muted-foreground mb-1">รายจ่าย</p>
            <p className="text-sm font-bold text-red-600">
              {formatCurrency(stats?.expense ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-3 px-3">
            <p className="text-xs text-muted-foreground mb-1">ออม</p>
            <p className={`text-sm font-bold ${(stats?.savings ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(stats?.savings ?? 0)}
            </p>
            {stats && stats.income > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {stats.savingsRate.toFixed(1)}%
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Income Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📈 รายรับ-รายจ่าย {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={incomeChartData} margin={{ left: 0, right: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip contentStyle={{ padding: '4px 10px', fontSize: '12px', backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--card-foreground))' }} formatter={(value: unknown) => formatCurrency(Number(value))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="รายรับ" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="รายจ่าย" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Expense Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            🥧 รายจ่ายตามหมวดหมู่เดือนนี้
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expensePieData.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-8">
              ไม่มีข้อมูลรายจ่าย
            </p>
          ) : (
            <>
              {/* Custom SVG donut — no Recharts, no tabIndex, no focus box */}
              <div className="relative select-none mx-auto" style={{ width: 200, height: 200 }}>
                <svg
                  width="200"
                  height="200"
                  viewBox="0 0 200 200"
                  style={{ display: 'block', overflow: 'visible' }}
                >
                  {pieSectors.map((s, i) => {
                    const isHovered = hoveredIndex === i
                    return (
                      <path
                        key={i}
                        d={sectorPath(100, 100, isHovered ? 36 : 40, isHovered ? 84 : 80, s.start, s.end)}
                        fill={s.color}
                        stroke={isHovered ? 'white' : 'none'}
                        strokeWidth={isHovered ? 2 : 0}
                        onMouseEnter={() => { setHoveredIndex(i); setHoveredSlice({ name: s.name, value: s.value }) }}
                        onMouseLeave={() => { setHoveredIndex(null); setHoveredSlice(null) }}
                        style={{ cursor: 'default', transition: 'all 0.15s ease' }}
                      />
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    {hoveredSlice ? (
                      <>
                        <p className="text-xs text-muted-foreground leading-tight max-w-[64px] truncate">{hoveredSlice.name}</p>
                        <p className="text-sm font-bold leading-tight">{formatCurrency(hoveredSlice.value)}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground leading-tight">รวม</p>
                        <p className="text-sm font-bold leading-tight">{formatCurrency(totalExpense)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Legend */}
              <div className="mt-4 space-y-1.5">
                {expensePieData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-xs text-muted-foreground truncate">{d.name}</span>
                    </div>
                    <span className="text-xs font-medium ml-2 flex-shrink-0">{formatCurrency(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">รายการล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-8">
              ยังไม่มีรายการ
            </p>
          ) : (
            <div className="space-y-4">
              {recent.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl w-8 text-center">
                      {tx.category?.icon ?? '💰'}
                    </span>
                    <div>
                      <p className="text-sm font-medium">
                        {tx.merchant ?? tx.description ?? tx.category?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(tx.date)} · {tx.account?.name}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-sm font-semibold ${tx.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatCurrency(Number(tx.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
