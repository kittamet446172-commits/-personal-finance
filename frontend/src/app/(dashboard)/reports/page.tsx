'use client'

import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
  useDailyBreakdown,
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

interface BarShapeProps {
  x?: number
  y?: number
  width?: number
  height?: number
  fill?: string
}

function LiftBar({ x = 0, y = 0, width = 0, height = 0, fill }: BarShapeProps) {
  if (!width || !height) return null
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      rx={4}
      className="transition-transform duration-200 hover:scale-110"
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    />
  )
}

export default function ReportsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [breakdownType, setBreakdownType] = useState<TransactionType>('EXPENSE')
  const [dailyType, setDailyType] = useState<TransactionType>('EXPENSE')
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const { data: summary } = useMonthlySummary(month, year)
  const { data: breakdown = [] } = useCategoryBreakdown(month, year, breakdownType)
  const { data: trend } = useYearlyTrend(year)
  const { data: dailyData = [] } = useDailyBreakdown(month, year, dailyType)

  useEffect(() => {
    setSelectedDay(null)
  }, [month, year])

  const trendData = trend?.months.map((m) => ({
    name: MONTH_SHORT[m.month - 1],
    รายรับ: m.income,
    รายจ่าย: m.expense,
    ออม: m.savings,
  })) ?? []

  const dailyChartData = dailyData.map((d) => ({ day: d.day, จำนวน: d.total }))

  const selectedDayCats = selectedDay !== null
    ? (dailyData.find((d) => d.day === selectedDay)?.categories ?? [])
    : []

  const selectedDayCatsData = selectedDayCats.map((b) => ({
    name: `${b.category?.icon ?? ''} ${b.category?.name ?? ''}`.trim(),
    amount: b.amount,
    pct: Math.round(b.percentage),
  }))

  const breakdownData = breakdown.map((b) => ({
    name: `${b.category?.icon ?? ''} ${b.category?.name ?? ''}`.trim(),
    amount: b.amount,
    pct: Math.round(b.percentage),
    fill: b.category?.color ?? 'hsl(var(--primary))',
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">รายงาน</h1>

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
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'รายรับ', value: summary?.income ?? 0, color: 'text-green-600' },
          { label: 'รายจ่าย', value: summary?.expense ?? 0, color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-base font-bold ${color}`}>
                {formatCurrency(value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">สัดส่วนตามหมวดหมู่</CardTitle>
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
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip
                  cursor={false}
                  formatter={(value: unknown) => [formatCurrency(Number(value)), 'จำนวน']}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {breakdownData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Daily category breakdown */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">สัดส่วนตามหมวดหมู่ รายวัน</CardTitle>
          <div className="flex gap-2">
            {(['EXPENSE', 'INCOME'] as TransactionType[]).map((t) => (
              <button
                key={t}
                onClick={() => setDailyType(t)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  dailyType === t
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
          {dailyChartData.length === 0 ? (
            <p className="text-sm text-center text-muted-foreground py-8">ไม่มีข้อมูล</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-2">คลิกวันเพื่อดูรายละเอียด</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={dailyChartData} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                    }
                    tick={{ fontSize: 11 }}
                    width={40}
                  />
                  <Tooltip cursor={false} formatter={(value: unknown) => [formatCurrency(Number(value)), 'จำนวน']} />
                  <Bar
                    dataKey="จำนวน"
                    shape={<LiftBar />}
                    onClick={(data: unknown) =>
                      setSelectedDay((prev) => {
                        const d = data as { day: number }
                        return prev === d.day ? null : d.day
                      })
                    }
                    style={{ cursor: 'pointer' }}
                  >
                    {dailyChartData.map((entry) => (
                      <Cell
                        key={entry.day}
                        fill={
                          selectedDay === entry.day
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--primary) / 0.4)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {selectedDay !== null && (
                <div className="mt-4 border-t pt-4">
                  <p className="text-sm font-medium mb-3">
                    วันที่ {selectedDay} {MONTHS_FULL[month - 1]} {year}
                  </p>
                  {selectedDayCatsData.length === 0 ? (
                    <p className="text-sm text-center text-muted-foreground py-4">ไม่มีข้อมูล</p>
                  ) : (
                    <ResponsiveContainer
                      width="100%"
                      height={Math.max(80, selectedDayCatsData.length * 48)}
                    >
                      <BarChart
                        data={selectedDayCatsData}
                        layout="vertical"
                        margin={{ left: 16, right: 32 }}
                        barSize={20}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis
                          type="number"
                          tickFormatter={(v: number) =>
                            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                          }
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={90}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                          formatter={(value: unknown) => [formatCurrency(Number(value)), 'จำนวน']}
                        />
                        <Bar
                          dataKey="amount"
                          fill="hsl(var(--primary))"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Yearly trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">แนวโน้มรายปี {year}</CardTitle>
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
