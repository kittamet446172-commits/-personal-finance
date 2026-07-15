'use client'

import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  useCategoryBreakdown,
  useMonthlySummary,
  useYearlyTrend,
} from '@/hooks/use-reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import type { TransactionType } from '@/types'

const MONTH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

const MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

export default function ReportsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [breakdownType, setBreakdownType] = useState<TransactionType>('EXPENSE')

  const { data: summary } = useMonthlySummary(month, year)
  const { data: breakdown = [] } = useCategoryBreakdown(month, year, breakdownType)
  const { data: trend } = useYearlyTrend(year)

  const trendData = trend?.months.map((m) => ({
    name: MONTH_SHORT[m.month - 1],
    รายรับ: m.income,
    รายจ่าย: m.expense,
    ออม: m.savings,
  })) ?? []

  const breakdownData = breakdown.map((b) => ({
    name: `${b.category?.icon ?? ''} ${b.category?.name ?? ''}`.trim(),
    amount: b.amount,
    pct: Math.round(b.percentage),
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">รายงาน</h1>

      {/* Month/Year selector */}
      <div className="flex gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {MONTHS_FULL.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Monthly summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'รายรับ', value: summary?.income ?? 0, color: 'text-green-600' },
          { label: 'รายจ่าย', value: summary?.expense ?? 0, color: 'text-red-600' },
          { label: 'เงินออม', value: summary?.savings ?? 0, color: (summary?.savings ?? 0) >= 0 ? 'text-blue-600' : 'text-red-600' },
          { label: 'อัตราออม', value: null, savings: summary?.savingsRate ?? 0 },
        ].map(({ label, value, color, savings }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-xl font-bold ${color ?? 'text-foreground'}`}>
                {savings !== undefined
                  ? `${savings.toFixed(1)}%`
                  : formatCurrency(value ?? 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>สัดส่วนตามหมวดหมู่</CardTitle>
          <div className="flex gap-2">
            {(['EXPENSE', 'INCOME'] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() => setBreakdownType(t)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  breakdownType === t
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-input text-muted-foreground hover:bg-accent'
                }`}
              >
                {t === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {breakdownData.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-8">
              ไม่มีข้อมูล
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(120, breakdownData.length * 48)}>
              <BarChart
                data={breakdownData}
                layout="vertical"
                margin={{ left: 16, right: 32 }}
                barSize={24}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                  }
                />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value: unknown) => [formatCurrency(Number(value)), 'จำนวน']}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Yearly trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>แนวโน้มรายปี {year}</CardTitle>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip formatter={(value: unknown) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="รายรับ" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="รายจ่าย" stroke="#dc2626" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ออม" stroke="#2563eb" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
