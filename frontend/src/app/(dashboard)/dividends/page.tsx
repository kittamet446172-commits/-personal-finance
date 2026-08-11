'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DividendDialog } from '@/components/investments/dividend-dialog'
import { useDividends, useDeleteDividend, useDividendSummary } from '@/hooks/use-dividends'
import { formatCurrency } from '@/lib/utils'
import type { InvestmentType } from '@/types'

const TYPE_LABELS: Record<InvestmentType, string> = {
  STOCK: 'หุ้น',
  ETF: 'ETF',
  MUTUAL_FUND: 'กองทุน',
  REIT: 'REIT',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function DividendsPage() {
  const { data: dividends = [], isLoading } = useDividends()
  const { data: summary } = useDividendSummary()
  const deleteMutation = useDeleteDividend()
  const [open, setOpen] = useState(false)

  async function handleDelete(id: string) {
    if (!confirm('ต้องการลบรายการปันผลนี้ใช่ไหม?')) return
    await deleteMutation.mutateAsync(id)
  }

  const years = summary?.byYear
    ? Object.entries(summary.byYear).sort((a, b) => Number(b[0]) - Number(a[0]))
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">เงินปันผล</h1>
          <p className="text-sm text-muted-foreground">
            รวมทั้งหมด{' '}
            <span className="font-semibold text-green-600">
              {formatCurrency(summary?.total ?? 0)}
            </span>
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          บันทึกปันผล
        </Button>
      </div>

      {years.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {years.map(([year, amount]) => (
            <Card key={year} className="flex-1 min-w-32">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">{year}</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(Number(amount))}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : dividends.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ยังไม่มีรายการปันผล
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">รายการทั้งหมด</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 p-0">
            {dividends.map((d, i) => (
              <div
                key={d.id}
                className={`flex items-center justify-between px-6 py-3 ${
                  i < dividends.length - 1 ? 'border-b' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{d.holding?.symbol}</span>
                      {d.holding?.type && (
                        <Badge variant="secondary" className="text-xs">
                          {TYPE_LABELS[d.holding.type as InvestmentType]}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(d.date)}
                      {d.perShare ? ` · ฿${Number(d.perShare).toFixed(4)}/หน่วย` : ''}
                      {d.note ? ` · ${d.note}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-green-600">
                    +{formatCurrency(Number(d.amount))}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(d.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <DividendDialog open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
