'use client'

import { useState } from 'react'
import { ArrowRight, Download, Plus, Search, Trash2 } from 'lucide-react'
import { useDeleteTransfer, useTransfers } from '@/hooks/use-transfers'
import { TransferDialog } from '@/components/transfers/transfer-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { downloadCsv, formatCurrency, formatDate } from '@/lib/utils'

const MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

export default function TransfersPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading } = useTransfers({ month, year, search: search || undefined, page, limit: 20 })
  const deleteMutation = useDeleteTransfer()

  const transfers = data?.data ?? []
  const totalPages = data?.totalPages ?? 1

  async function handleDelete(id: string) {
    if (!confirm('ต้องการลบรายการโอนเงินนี้ใช่ไหม?')) return
    await deleteMutation.mutateAsync(id)
  }

  function handleExport() {
    downloadCsv('transfers.csv', [
      ['วันที่', 'จากบัญชี', 'ไปบัญชี', 'จำนวน', 'หมายเหตุ'],
      ...transfers.map((t) => [
        formatDate(t.date),
        t.fromAccount?.name ?? '',
        t.toAccount?.name ?? '',
        String(Number(t.amount)),
        t.description ?? '',
      ]),
    ])
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold whitespace-nowrap">โอนเงิน</h1>
          <p className="text-sm text-muted-foreground">{data?.total ?? 0} รายการ</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleExport} disabled={transfers.length === 0}>
            <Download className="h-4 w-4" />
          </Button>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            โอนเงิน
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={month}
          onChange={(e) => { setMonth(Number(e.target.value)); setPage(1) }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => { setYear(Number(e.target.value)); setPage(1) }}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="ค้นหาหมายเหตุ..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : transfers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ไม่พบรายการโอนเงิน
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {transfers.map((transfer) => (
            <Card key={transfer.id}>
              <CardContent className="flex items-center justify-between py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>{transfer.fromAccount?.name ?? '—'}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{transfer.toAccount?.name ?? '—'}</span>
                  </div>
                  {transfer.description && (
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {transfer.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">
                      {formatCurrency(Number(transfer.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(transfer.date)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(transfer.id)}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                ก่อนหน้า
              </Button>
              <span className="flex items-center text-sm text-muted-foreground px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                ถัดไป
              </Button>
            </div>
          )}
        </div>
      )}

      <TransferDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
