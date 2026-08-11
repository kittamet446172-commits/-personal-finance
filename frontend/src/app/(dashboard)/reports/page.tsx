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
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useCategoryBreakdown,
  useDailyBreakdown,
  useMonthlySummary,
  useYearlyTrend,
} from '@/hooks/use-reports'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
      x={x} y={y} width={width} height={height} fill={fill} rx={4}
      className="transition-transform duration-200 hover:scale-110"
      style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
    />
  )
}

interface DonutLabelProps {
  cx?: number
  cy?: number
  midAngle?: number
  outerRadius?: number
  name?: string
  percent?: number
}

function DonutLabel({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, name = '', percent = 0 }: DonutLabelProps) {
  const pct = Math.round(percent * 100)
  if (pct < 5) return null
  const RADIAN = Math.PI / 180
  const radius = outerRadius + 30
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text
      x={x} y={y} fill="#888"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      fontSize={10}
    >
      {name}
      <tspan x={x} dy="1.3em" fontWeight="600" fill="#555">{pct}%</tspan>
    </text>
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

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  function nextMonth() {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1
    if (isCurrentMonth) return
    if (month === 12) { setMonth(1); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  const trendData = trend?.months.map((m) => ({
    name: MONTH_SHORT[m.month - 1],
    รายรับ: m.income,
    รายจ่าย: m.expense,
    เหลือ: Math.max(0, m.savings),
  })) ?? []

  const dailyChartData = dailyData.map((d) => ({ day: d.day, จำนวน: d.total }))
  const avgDaily = dailyChartData.length > 0
    ? dailyChartData.reduce((s, d) => s + d.จำนวน, 0) / dailyChartData.length
    : 0

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

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-base font-semibold">
          {MONTHS_FULL[month - 1]} {year}
        </span>
        <Button variant="outline" size="icon" onClick={nextMonth} disabled={isCurrentMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Monthly summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'รายรับ', value: summary?.income ?? 0, color: 'text-green-600' },
          { label: 'รายจ่าย', value: summary?.expense ?? 0, color: 'text-red-600' },
          { label: 'เงินเหลือ', value: Math.max(0, summary?.savings ?? 0), color: 'text-blue-600' },
          { label: 'อัตราเหลือ', value: null, savings: Math.max(0, summary?.savingsRate ?? 0) },
        ].map(({ label, value, color, savings }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-base font-bold ${color ?? 'text-foreground'}`}>
                {savings !== undefined ? `${savings.toFixed(1)}%` : formatCurrency(value ?? 0)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Daily bar chart with average line */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">รายวัน</CardTitle>
            {avgDaily > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                เฉลี่ย {formatCurrency(avgDaily)} / วัน
              </p>
            )}
          </div>
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
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    tick={{ fontSize: 11 }}
                    width={40}
                  />
                  <Tooltip
                    cursor={false}
                    formatter={(value: unknown) => [formatCurrency(Number(value)), 'จำนวน']}
                  />
                  <ReferenceLine
                    y={avgDaily}
                    stroke="#2563eb"
                    strokeDasharray="4 2"
                    strokeWidth={1.5}
                  />
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
                            : 'hsl(var(--primary) / 0.45)'
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
                    <ResponsiveContainer width="100%" height={Math.max(80, selectedDayCatsData.length * 48)}>
                      <BarChart
                        data={selectedDayCatsData}
                        layout="vertical"
                        margin={{ left: 16, right: 32 }}
                        barSize={20}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis
                          type="number"
                          tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                        />
                        <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(value: unknown) => [formatCurrency(Number(value)), 'จำนวน']} />
                        <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Category donut chart */}
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
            <p className="text-sm text-center text-muted-foreground py-8">ไม่มีข้อมูล</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={2}
                    dataKey="amount"
                    label={DonutLabel}
                    labelLine={{ stroke: '#ccc', strokeWidth: 1 }}
                  >
                    {breakdownData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [formatCurrency(Number(value)), 'จำนวน']} />
                </PieChart>
              </ResponsiveContainer>

              {/* Ranked list */}
              <div className="mt-1 divide-y">
                {[...breakdownData]
                  .sort((a, b) => b.amount - a.amount)
                  .map((entry, i) => (
                    <div key={i} className="flex items-center gap-3 py-2">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.fill }} />
                      <span className="text-sm flex-1 truncate">{entry.name}</span>
                      <span className="text-xs text-muted-foreground w-10 text-right">{entry.pct}%</span>
                      <span className="text-sm font-medium w-24 text-right">{formatCurrency(entry.amount)}</span>
                    </div>
                  ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Yearly trend */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">แนวโน้มรายปี</CardTitle>
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
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
              />
              <Tooltip formatter={(value: unknown) => formatCurrency(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="รายรับ" stroke="#16a34a" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="รายจ่าย" stroke="#dc2626" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="เหลือ" stroke="#2563eb" strokeWidth={2} dot={false} strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
