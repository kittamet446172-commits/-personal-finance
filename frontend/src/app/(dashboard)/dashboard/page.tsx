'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAccounts } from '@/hooks/use-accounts'
import { useMonthlyStats, useRecentTransactions } from '@/hooks/use-transactions'
import { useCategoryBreakdown, useDailyBreakdown } from '@/hooks/use-reports'
import { usePortfolio } from '@/hooks/use-investments'
import { useUserSettings } from '@/hooks/use-user-settings'
import { useNetWorthHistory, useTakeSnapshot } from '@/hooks/use-net-worth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
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

const PIE_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6',
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

function DotBar({ x = 0, y = 0, width = 0, height = 0, fill, isSelected }: BarShapeProps & { isSelected?: boolean }) {
  if (!width) return null
  const cx = x + width / 2
  const color = isSelected ? (fill ?? 'hsl(var(--primary))') : 'hsl(var(--primary) / 0.3)'
  return (
    <g>
      {height > 0 && <rect x={x + width * 0.2} y={y} width={width * 0.6} height={height} fill={color} rx={3} />}
      {isSelected && <circle cx={cx} cy={y - 7} r={4} fill={fill ?? 'hsl(var(--primary))'} />}
    </g>
  )
}

export default function DashboardPage() {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const [dailyType, setDailyType] = useState<TransactionType>('EXPENSE')
  const [weekPage, setWeekPage] = useState(0)
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const { data: accounts = [] } = useAccounts()
  const { data: stats } = useMonthlyStats(month, year)
  const { data: recent = [] } = useRecentTransactions()
  const { data: dailyData = [] } = useDailyBreakdown(month, year, dailyType)
  const { data: expenseBreakdown = [] } = useCategoryBreakdown(month, year, 'EXPENSE')
  const { data: portfolio } = usePortfolio()

  const accountsTotal = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
  const portfolioTotal = portfolio?.summary.totalCurrentValue ?? 0
  const netWorth = accountsTotal + portfolioTotal


  const dailyChartData = dailyData.map((d) => ({ day: d.day, จำนวน: d.total }))
  const avgDaily = dailyChartData.length > 0
    ? dailyChartData.reduce((s, d) => s + d.จำนวน, 0) / dailyChartData.length
    : 0
  const totalWeekPages = Math.ceil(dailyChartData.length / 7)
  const pagedDailyData = dailyChartData.slice(weekPage * 7, weekPage * 7 + 7)
  const selectedDayCats = selectedDay !== null
    ? (dailyData.find((d) => d.day === selectedDay)?.categories ?? [])
    : []
  const selectedDayCatsData = selectedDayCats.map((b) => ({
    name: `${b.category?.icon ?? ''} ${b.category?.name ?? ''}`.trim(),
    amount: b.amount,
  }))

  const expensePieData = expenseBreakdown.map((b, i) => ({
    name: `${b.category?.icon ?? ''} ${b.category?.name ?? ''}`.trim(),
    value: b.amount,
    color: b.category?.color ?? PIE_COLORS[i % PIE_COLORS.length],
  }))

  const { data: settings } = useUserSettings()
  const { data: netWorthHistory = [] } = useNetWorthHistory(6)
  const takeSnapshot = useTakeSnapshot()

  useEffect(() => {
    takeSnapshot.mutate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const emergencyAccount = accounts.find((a) => a.id === settings?.emergencyFundAccountId)
  const savingsTotal = Number(emergencyAccount?.balance ?? 0)
  const salary = Number(settings?.monthlySalary ?? 0)
  const target = salary * 6
  const monthsCovered = salary > 0 ? savingsTotal / salary : 0
  const progressPct = target > 0 ? Math.min((savingsTotal / target) * 100, 100) : 0
  const emergencyStatus = monthsCovered >= 6 ? 'safe' : monthsCovered >= 3 ? 'ok' : 'low'

  const [hoveredSlice, setHoveredSlice] = useState<{ name: string; value: number } | null>(null)
  const totalExpense = expensePieData.reduce((sum, d) => sum + d.value, 0)

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const touchActiveRef = useRef(false)

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
        <CardContent className="py-8 px-6">
          <p className="text-sm text-muted-foreground mb-2">Net Worth</p>
          <p className="text-4xl font-bold tracking-tight">{formatCurrency(netWorth)}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {accounts.length} บัญชี {portfolioTotal > 0 && `· ลงทุน ${formatCurrency(portfolioTotal)}`}
          </p>
        </CardContent>
      </Card>

      {/* Net Worth History */}
      {netWorthHistory.length >= 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Net Worth ย้อนหลัง</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart
                data={netWorthHistory.map((s) => ({
                  date: new Date(s.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
                  netWorth: Number(s.netWorth),
                }))}
                margin={{ left: 8, right: 16, top: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    padding: '8px 12px',
                    fontSize: '13px',
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: unknown) => [formatCurrency(Number(value)), 'Net Worth']}
                />
                <Line
                  type="monotone"
                  dataKey="netWorth"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Emergency Fund */}
      <Card>
        <CardContent className="py-6 px-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-primary" />เงินสำรองฉุกเฉิน</p>
            {settings?.emergencyFundAccountId && (
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  emergencyStatus === 'safe'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300'
                    : emergencyStatus === 'ok'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}
              >
                {emergencyStatus === 'safe' ? 'ปลอดภัย' : emergencyStatus === 'ok' ? 'พอใช้' : 'ยังไม่พอ'}
              </span>
            )}
          </div>
          {!settings?.emergencyFundAccountId ? (
            <p className="text-sm text-muted-foreground">
              ไปที่ ตั้งค่า เพื่อเลือกบัญชีและกรอกเงินเดือน
            </p>
          ) : (
            <>
              <p className="text-2xl font-bold">{formatCurrency(savingsTotal)}</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                {emergencyAccount?.name} · ครอบคลุม {monthsCovered.toFixed(1)} เดือน · เป้าหมาย {formatCurrency(target)}
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    emergencyStatus === 'safe' ? 'bg-amber-500' : emergencyStatus === 'ok' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-muted-foreground">0%</span>
                <span className="text-xs text-muted-foreground">{progressPct.toFixed(1)}%</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>


      {/* Income / Expense */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="py-5 px-4">
            <p className="text-sm text-muted-foreground mb-2">รายรับ</p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(stats?.income ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 px-4">
            <p className="text-sm text-muted-foreground mb-2">รายจ่าย</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(stats?.expense ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Chart */}
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
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted-foreground">แตะวันเพื่อดูรายละเอียด</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWeekPage(p => Math.max(0, p - 1))}
                    disabled={weekPage === 0}
                    className="h-6 w-6 rounded-full border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
                  >
                    <ChevronLeft className="h-3 w-3" />
                  </button>
                  <span className="text-xs text-muted-foreground">{weekPage + 1}/{totalWeekPages}</span>
                  <button
                    onClick={() => setWeekPage(p => Math.min(totalWeekPages - 1, p + 1))}
                    disabled={weekPage >= totalWeekPages - 1}
                    className="h-6 w-6 rounded-full border flex items-center justify-center disabled:opacity-30 hover:bg-muted transition-colors"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={pagedDailyData} margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: unknown) => [formatCurrency(Number(value)), 'จำนวน']}
                  />
                  <ReferenceLine y={avgDaily} stroke="#2563eb" strokeDasharray="4 2" strokeWidth={1.5} />
                  <Bar
                    dataKey="จำนวน"
                    shape={(props: BarShapeProps & { day?: number }) => (
                      <DotBar {...props} isSelected={props.day === selectedDay} fill="hsl(var(--primary))" />
                    )}
                    onClick={(data: unknown) =>
                      setSelectedDay((prev) => {
                        const d = data as { day: number }
                        return prev === d.day ? null : d.day
                      })
                    }
                    style={{ cursor: 'pointer' }}
                  />
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
              {/* Responsive donut — tap/click to highlight on mobile */}
              <div className="relative select-none w-full max-w-xs mx-auto aspect-square">
                <svg viewBox="0 0 200 200" className="w-full h-full" style={{ overflow: 'visible' }}>
                  {pieSectors.map((s, i) => {
                    const isActive = hoveredIndex === i
                    return (
                      <path
                        key={i}
                        d={sectorPath(100, 100, isActive ? 36 : 40, isActive ? 84 : 80, s.start, s.end)}
                        fill={s.color}
                        stroke="white"
                        strokeWidth="1.5"
                        onTouchStart={() => { touchActiveRef.current = true }}
                        onMouseEnter={() => { if (touchActiveRef.current) return; setHoveredIndex(i); setHoveredSlice({ name: s.name, value: s.value }) }}
                        onMouseLeave={() => { if (touchActiveRef.current) return; setHoveredIndex(null); setHoveredSlice(null) }}
                        onClick={() => {
                          const next = hoveredIndex === i ? null : i
                          setHoveredIndex(next)
                          setHoveredSlice(next === null ? null : { name: s.name, value: s.value })
                          requestAnimationFrame(() => { touchActiveRef.current = false })
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
                          {Math.round((hoveredSlice.value / totalExpense) * 100)}%
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-xs text-muted-foreground">รวม</p>
                        <p className="text-base font-bold">{formatCurrency(totalExpense)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Legend — tap to highlight, shows % */}
              <div className="mt-3 divide-y">
                {expensePieData.map((d, i) => {
                  const pct = Math.round((d.value / totalExpense) * 100)
                  return (
                    <div
                      key={i}
                      className={`flex items-center gap-3 py-2.5 rounded cursor-pointer transition-colors ${
                        hoveredIndex === i ? 'bg-muted/60' : ''
                      }`}
                      onTouchStart={() => { touchActiveRef.current = true }}
                      onMouseEnter={() => { if (touchActiveRef.current) return; setHoveredIndex(i); setHoveredSlice({ name: d.name, value: d.value }) }}
                      onMouseLeave={() => { if (touchActiveRef.current) return; setHoveredIndex(null); setHoveredSlice(null) }}
                      onClick={() => {
                        const next = hoveredIndex === i ? null : i
                        setHoveredIndex(next)
                        setHoveredSlice(next === null ? null : { name: d.name, value: d.value })
                        requestAnimationFrame(() => { touchActiveRef.current = false })
                      }}
                    >
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-sm flex-1 truncate">{d.name}</span>
                      <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                      <span className="text-sm font-medium w-24 text-right">{formatCurrency(d.value)}</span>
                    </div>
                  )
                })}
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
