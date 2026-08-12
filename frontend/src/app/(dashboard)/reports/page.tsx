'use client'

import { useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  useCategoryBreakdown,
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


export default function ReportsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [breakdownType, setBreakdownType] = useState<TransactionType>('EXPENSE')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [hoveredSlice, setHoveredSlice] = useState<{ name: string; value: number } | null>(null)
  const isTouchRef = useRef(false)
  const { data: summary } = useMonthlySummary(month, year)
  const { data: breakdown = [] } = useCategoryBreakdown(month, year, breakdownType)
  const { data: trend } = useYearlyTrend(year)

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

  const incomeChartData = trend?.months.map((m) => ({
    name: MONTH_SHORT[m.month - 1],
    รายรับ: m.income,
    รายจ่าย: m.expense,
  })) ?? []

  const breakdownData = breakdown.map((b) => ({
    name: `${b.category?.icon ?? ''} ${b.category?.name ?? ''}`.trim(),
    amount: b.amount,
    pct: Math.round(b.percentage),
    fill: b.category?.color ?? 'hsl(var(--primary))',
  }))

  const totalBreakdown = breakdownData.reduce((s, d) => s + d.amount, 0)
  let pieAngle = 0
  const breakdownSectors = breakdownData.map((d) => {
    const start = pieAngle
    pieAngle += (d.amount / (totalBreakdown || 1)) * 360
    return { ...d, start, end: pieAngle }
  })

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

      {/* Income/Expense Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📈 รายรับ-รายจ่าย {year}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={incomeChartData} margin={{ left: 0, right: 8 }}>
              <defs>
                <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
              />
              <Tooltip
                contentStyle={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--card-foreground))',
                }}
                formatter={(value: unknown) => formatCurrency(Number(value))}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area type="monotone" dataKey="รายรับ" stroke="#16a34a" strokeWidth={2} fill="url(#gradIncome)" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="รายจ่าย" stroke="#dc2626" strokeWidth={2} fill="url(#gradExpense)" dot={false} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
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
                onClick={() => { setBreakdownType(t); setHoveredIndex(null); setHoveredSlice(null) }}
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
              {/* Custom SVG donut — tap/click to highlight */}
              <div className="relative select-none w-full max-w-xs mx-auto aspect-square">
                <svg viewBox="0 0 200 200" className="w-full h-full" style={{ overflow: 'visible' }}>
                  {breakdownSectors.map((s, i) => {
                    const isActive = hoveredIndex === i
                    return (
                      <path
                        key={i}
                        d={sectorPath(100, 100, isActive ? 36 : 40, isActive ? 84 : 80, s.start, s.end)}
                        fill={s.fill}
                        stroke="white"
                        strokeWidth="1.5"
                        onMouseEnter={() => { if (!isTouchRef.current) { setHoveredIndex(i); setHoveredSlice({ name: s.name, value: s.amount }) } }}
                        onMouseLeave={() => { if (!isTouchRef.current) { setHoveredIndex(null); setHoveredSlice(null) } }}
                        onTouchEnd={(e) => {
                          e.preventDefault()
                          isTouchRef.current = true
                          setTimeout(() => { isTouchRef.current = false }, 500)
                          setHoveredIndex((prev) => {
                            const next = prev === i ? null : i
                            setHoveredSlice(next === null ? null : { name: s.name, value: s.amount })
                            return next
                          })
                        }}
                        onClick={() => {
                          setHoveredIndex((prev) => {
                            const next = prev === i ? null : i
                            setHoveredSlice(next === null ? null : { name: s.name, value: s.amount })
                            return next
                          })
                        }}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          opacity: hoveredIndex !== null && !isActive ? 0.55 : 1,
                        }}
                      />
                    )
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center px-6">
                    {hoveredSlice ? (
                      <>
                        <p className="text-xs text-muted-foreground truncate">{hoveredSlice.name}</p>
                        <p className="text-base font-bold">{formatCurrency(hoveredSlice.value)}</p>
                        <p className="text-xs text-muted-foreground font-medium">
                          {Math.round((hoveredSlice.value / totalBreakdown) * 100)}%
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">รวม</p>
                        <p className="text-base font-bold">{formatCurrency(totalBreakdown)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Legend — tap to highlight, synced with donut */}
              <div className="mt-3 divide-y">
                {breakdownData.map((entry, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 py-2.5 rounded cursor-pointer transition-colors ${
                      hoveredIndex === i ? 'bg-muted/60' : ''
                    }`}
                    onMouseEnter={() => { if (!isTouchRef.current) { setHoveredIndex(i); setHoveredSlice({ name: entry.name, value: entry.amount }) } }}
                    onMouseLeave={() => { if (!isTouchRef.current) { setHoveredIndex(null); setHoveredSlice(null) } }}
                    onTouchEnd={(e) => {
                      e.preventDefault()
                      isTouchRef.current = true
                      setTimeout(() => { isTouchRef.current = false }, 500)
                      setHoveredIndex((prev) => {
                        const next = prev === i ? null : i
                        setHoveredSlice(next === null ? null : { name: entry.name, value: entry.amount })
                        return next
                      })
                    }}
                    onClick={() => {
                      setHoveredIndex((prev) => {
                        const next = prev === i ? null : i
                        setHoveredSlice(next === null ? null : { name: entry.name, value: entry.amount })
                        return next
                      })
                    }}
                  >
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.fill }} />
                    <span className="text-sm flex-1 truncate">{entry.name}</span>
                    <span className="text-xs text-muted-foreground w-8 text-right">{entry.pct}%</span>
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
            <AreaChart data={trendData} margin={{ left: 0, right: 8 }}>
              <defs>
                <linearGradient id="gradTrendIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTrendExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradTrendNet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
              />
              <Tooltip
                contentStyle={{
                  padding: '8px 12px',
                  fontSize: '13px',
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--card-foreground))',
                }}
                formatter={(value: unknown) => formatCurrency(Number(value))}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Area type="monotone" dataKey="รายรับ" stroke="#16a34a" strokeWidth={2} fill="url(#gradTrendIncome)" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="รายจ่าย" stroke="#dc2626" strokeWidth={2} fill="url(#gradTrendExpense)" dot={false} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="เหลือ" stroke="#2563eb" strokeWidth={2} fill="url(#gradTrendNet)" dot={false} activeDot={{ r: 4 }} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
