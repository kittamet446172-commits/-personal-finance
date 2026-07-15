'use client'

import { useState } from 'react'
import { ArrowRight, Plus, Trash2 } from 'lucide-react'
import { useDeleteTransfer, useTransfers } from '@/hooks/use-transfers'
import { TransferDialog } from '@/components/transfers/transfer-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function TransfersPage() {
  const { data: transfers = [], isLoading } = useTransfers()
  const deleteMutation = useDeleteTransfer()
  const [dialogOpen, setDialogOpen] = useState(false)

  async function handleDelete(id: string) {
    if (!confirm('ต้องการลบรายการโอนเงินนี้ใช่ไหม?')) return
    await deleteMutation.mutateAsync(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">โอนเงิน</h1>
          <p className="text-sm text-muted-foreground">{transfers.length} รายการ</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          โอนเงิน
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : transfers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ยังไม่มีรายการโอนเงิน
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
        </div>
      )}

      <TransferDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
