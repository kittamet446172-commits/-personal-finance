'use client'

import { useState } from 'react'
import {
  Pencil,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Receipt,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HoldingDialog } from '@/components/investments/holding-dialog'
import { InvestmentTransactionDialog } from '@/components/investments/transaction-dialog'
import { DividendDialog } from '@/components/investments/dividend-dialog'
import {
  usePortfolio,
  useDeleteHolding,
  useRefreshAllPrices,
} from '@/hooks/use-investments'
import { formatCurrency } from '@/lib/utils'
import type { InvestmentHolding, InvestmentType, PortfolioItem } from '@/types'

const TYPE_LABELS: Record<InvestmentType, string> = {
  STOCK: 'หุ้น',
  ETF: 'ETF',
  MUTUAL_FUND: 'กองทุน',
  REIT: 'REIT',
}

const TYPE_COLORS: Record<InvestmentType, string> = {
  STOCK: 'bg-blue-100 text-blue-800',
  ETF: 'bg-purple-100 text-purple-800',
  MUTUAL_FUND: 'bg-green-100 text-green-800',
  REIT: 'bg-orange-100 text-orange-800',
}

function GainBadge({ value, pct, currency = 'THB' }: { value: number; pct: number; currency?: string }) {
  const isPos = value >= 0
  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${isPos ? 'text-green-600' : 'text-red-600'}`}>
      {isPos ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {isPos ? '+' : ''}{formatCurrency(value, currency)} ({isPos ? '+' : ''}{pct.toFixed(2)}%)
    </span>
  )
}

function HoldingCard({
  item,
  onEdit,
  onTransaction,
  onDividend,
  onDelete,
}: {
  item: PortfolioItem
  onEdit: () => void
  onTransaction: () => void
  onDividend: () => void
  onDelete: () => void
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{item.symbol}</CardTitle>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[item.type as InvestmentType]}`}>
              {TYPE_LABELS[item.type as InvestmentType]}
            </span>
            {item.exchange && (
              <span className="text-xs text-muted-foreground">{item.exchange}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{item.name}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onTransaction} title="บันทึกรายการ">
            <Receipt className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit} title="แก้ไข / อัปเดตราคา">
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            title="ลบ"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold">{formatCurrency(item.currentValue, item.currency)}</p>
            <GainBadge value={item.unrealizedGain} pct={item.unrealizedGainPct} currency={item.currency} />
          </div>
          <Button variant="outline" size="sm" onClick={onDividend} className="gap-1.5">
            <Plus className="h-3 w-3" />
            ปันผล
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
          <div className="rounded-md bg-muted px-2 py-1.5">
            <p className="text-muted-foreground">จำนวน</p>
            <p className="font-semibold">{item.totalQty.toLocaleString('th-TH')}</p>
          </div>
          <div className="rounded-md bg-muted px-2 py-1.5">
            <p className="text-muted-foreground">ต้นทุนเฉลี่ย</p>
            <p className="font-semibold">{formatCurrency(item.avgCost, item.currency)}</p>
          </div>
          <div className="rounded-md bg-muted px-2 py-1.5">
            <p className="text-muted-foreground">ราคาล่าสุด</p>
            <p className="font-semibold">{formatCurrency(item.currentPrice, item.currency)}</p>
          </div>
        </div>
        {item.totalDividends > 0 && (
          <p className="text-xs text-muted-foreground">
            ปันผลสะสม: <span className="font-medium text-green-600">{formatCurrency(item.totalDividends, item.currency)}</span>
          </p>
        )}
      </CardContent>
    </Card>
  )
}

type DialogState =
  | { type: 'none' }
  | { type: 'holding'; editing: InvestmentHolding | null }
  | { type: 'transaction'; holding: InvestmentHolding }
  | { type: 'dividend'; holdingId?: string }

export default function InvestmentsPage() {
  const { data: portfolio, isLoading, refetch } = usePortfolio()
  const deleteMutation = useDeleteHolding()
  const refreshAllMutation = useRefreshAllPrices()
  const [dialog, setDialog] = useState<DialogState>({ type: 'none' })
  const [activeTab, setActiveTab] = useState('all')

  const items = portfolio?.items ?? []

  const byCurrency = items.reduce<Record<string, PortfolioItem[]>>((acc, item) => {
    const cur = item.currency ?? 'THB'
    if (!acc[cur]) acc[cur] = []
    acc[cur].push(item)
    return acc
  }, {})

  const currencySummaries = Object.entries(byCurrency).map(([currency, cItems]) => {
    const totalCurrentValue = cItems.reduce((s, i) => s + i.currentValue, 0)
    const totalCostBasis = cItems.reduce((s, i) => s + i.costBasis, 0)
    const unrealizedGain = totalCurrentValue - totalCostBasis
    const unrealizedGainPct = totalCostBasis > 0 ? (unrealizedGain / totalCostBasis) * 100 : 0
    const totalDividends = cItems.reduce((s, i) => s + i.totalDividends, 0)
    return { currency, totalCurrentValue, totalCostBasis, unrealizedGain, unrealizedGainPct, totalDividends }
  })

  const filtered =
    activeTab === 'all'
      ? items
      : items.filter((i) => i.type === activeTab)

  async function handleDelete(item: PortfolioItem) {
    if (!confirm(`ต้องการลบ ${item.symbol} และรายการทั้งหมดใช่ไหม?`)) return
    await deleteMutation.mutateAsync(item.id)
  }

  function holdingFromItem(item: PortfolioItem): InvestmentHolding {
    return {
      id: item.id,
      symbol: item.symbol,
      name: item.name,
      type: item.type as InvestmentType,
      exchange: item.exchange,
      sector: item.sector,
      currency: item.currency,
      currentPrice: item.currentPrice,
      note: item.note,
      createdAt: '',
      updatedAt: '',
      transactions: [],
      dividends: [],
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refreshAllMutation.mutate()}
            disabled={refreshAllMutation.isPending}
            title="อัปเดตราคาทุกตัว"
            className="flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${refreshAllMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => setDialog({ type: 'dividend' })}>
            <Plus className="h-4 w-4 mr-1" />
            ปันผล
          </Button>
          <Button className="flex-1" onClick={() => setDialog({ type: 'holding', editing: null })}>
            <Plus className="h-4 w-4 mr-1" />
            เพิ่มหลักทรัพย์
          </Button>
        </div>
      </div>

      {/* Summary Cards — แยกตามสกุลเงิน */}
      {currencySummaries.map((s) => (
        <div key={s.currency} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">{s.currency === 'THB' ? '฿ THB' : '$ USD'}</p>
          <div className="grid grid-cols-2 gap-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">มูลค่าปัจจุบัน</p>
                <p className="text-xl font-bold">{formatCurrency(s.totalCurrentValue, s.currency)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">ต้นทุนรวม</p>
                <p className="text-xl font-bold">{formatCurrency(s.totalCostBasis, s.currency)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">กำไร/ขาดทุนที่ยังไม่รับรู้</p>
                <GainBadge value={s.unrealizedGain} pct={s.unrealizedGainPct} currency={s.currency} />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">ปันผลสะสม</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(s.totalDividends, s.currency)}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ))}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">ทั้งหมด ({items.length})</TabsTrigger>
          <TabsTrigger value="STOCK">หุ้น</TabsTrigger>
          <TabsTrigger value="ETF">ETF</TabsTrigger>
          <TabsTrigger value="MUTUAL_FUND">กองทุน</TabsTrigger>
          <TabsTrigger value="REIT">REIT</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">กำลังโหลด...</p>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                ยังไม่มีหลักทรัพย์ กด &quot;เพิ่มหลักทรัพย์&quot; เพื่อเริ่มต้น
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
              {filtered.map((item) => (
                <HoldingCard
                  key={item.id}
                  item={item}
                  onEdit={() => setDialog({ type: 'holding', editing: holdingFromItem(item) })}
                  onTransaction={() => setDialog({ type: 'transaction', holding: holdingFromItem(item) })}
                  onDividend={() => setDialog({ type: 'dividend', holdingId: item.id })}
                  onDelete={() => handleDelete(item)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <HoldingDialog
        open={dialog.type === 'holding'}
        onClose={() => setDialog({ type: 'none' })}
        editing={dialog.type === 'holding' ? dialog.editing : null}
      />

      {dialog.type === 'transaction' && (
        <InvestmentTransactionDialog
          open
          onClose={() => setDialog({ type: 'none' })}
          holding={dialog.holding}
        />
      )}

      <DividendDialog
        open={dialog.type === 'dividend'}
        onClose={() => setDialog({ type: 'none' })}
        holdingId={dialog.type === 'dividend' ? dialog.holdingId : undefined}
      />
    </div>
  )
}
