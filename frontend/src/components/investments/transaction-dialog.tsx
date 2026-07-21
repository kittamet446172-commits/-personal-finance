'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useCreateInvestmentTransaction,
  useUpdateInvestmentTransaction,
  useDeleteInvestmentTransaction,
  useInvestmentTransactions,
} from '@/hooks/use-investments'
import type { InvestmentHolding, InvestmentTransaction, LotType } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  holding: InvestmentHolding
}

interface FormState {
  type: LotType
  quantity: string
  pricePerUnit: string
  fee: string
  date: string
  note: string
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function toDateStr(date: string) {
  return new Date(date).toISOString().split('T')[0]
}

export function InvestmentTransactionDialog({ open, onClose, holding }: Props) {
  const { data: transactions = [] } = useInvestmentTransactions(holding.id)
  const createMutation = useCreateInvestmentTransaction()
  const updateMutation = useUpdateInvestmentTransaction()
  const deleteMutation = useDeleteInvestmentTransaction()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({
    type: 'BUY',
    quantity: '',
    pricePerUnit: String(holding.currentPrice || ''),
    fee: '0',
    date: todayStr(),
    note: '',
  })

  function resetForm() {
    setEditingId(null)
    setForm({
      type: 'BUY',
      quantity: '',
      pricePerUnit: String(holding.currentPrice || ''),
      fee: '0',
      date: todayStr(),
      note: '',
    })
  }

  function startEdit(tx: InvestmentTransaction) {
    setEditingId(tx.id)
    setForm({
      type: tx.type,
      quantity: String(tx.quantity),
      pricePerUnit: String(tx.pricePerUnit),
      fee: String(tx.fee ?? 0),
      date: toDateStr(tx.date),
      note: tx.note ?? '',
    })
  }

  const totalCost =
    (Number(form.quantity) || 0) * (Number(form.pricePerUnit) || 0) +
    (Number(form.fee) || 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      type: form.type,
      quantity: Number(form.quantity),
      pricePerUnit: Number(form.pricePerUnit),
      fee: Number(form.fee),
      date: form.date,
      note: form.note || undefined,
    }
    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, ...payload })
    } else {
      await createMutation.mutateAsync({ holdingId: holding.id, ...payload })
    }
    resetForm()
  }

  async function handleDelete(id: string) {
    if (!confirm('ลบรายการนี้?')) return
    await deleteMutation.mutateAsync(id)
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>รายการ — {holding.symbol}</DialogTitle>
        </DialogHeader>

        {transactions.length > 0 && (
          <div className="space-y-1 max-h-40 overflow-y-auto border rounded-md p-2">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-2 text-sm py-1">
                <span className={`w-8 font-medium ${tx.type === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'BUY' ? 'ซื้อ' : 'ขาย'}
                </span>
                <span className="flex-1">
                  {Number(tx.quantity).toLocaleString()} × ${Number(tx.pricePerUnit).toLocaleString()}
                </span>
                <span className="text-muted-foreground text-xs">{toDateStr(tx.date)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => startEdit(tx)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive hover:text-destructive"
                  onClick={() => handleDelete(tx.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{editingId ? 'แก้ไขรายการ' : 'รายการใหม่'}</p>
            {editingId && (
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                ยกเลิกแก้ไข
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <Label>ประเภท</Label>
            <div className="grid grid-cols-2 gap-2">
              {(['BUY', 'SELL'] as LotType[]).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={form.type === t ? 'default' : 'outline'}
                  onClick={() => setForm({ ...form, type: t })}
                >
                  {t === 'BUY' ? 'ซื้อ' : 'ขาย'}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>จำนวน (หน่วย/หุ้น) *</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder="เช่น 100"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                onFocus={(e) => e.target.select()}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>ราคาต่อหน่วย *</Label>
              <Input
                type="number"
                step="0.0001"
                min="0.000001"
                value={form.pricePerUnit}
                onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                onFocus={(e) => e.target.select()}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ค่าธรรมเนียม</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.fee}
                onChange={(e) => setForm({ ...form, fee: e.target.value })}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="space-y-2">
              <Label>วันที่ *</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>

          {totalCost > 0 && (
            <p className="text-sm text-muted-foreground">
              มูลค่ารวม:{' '}
              <span className="font-semibold text-foreground">
                {totalCost.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>
          )}

          <div className="space-y-2">
            <Label>หมายเหตุ</Label>
            <Input
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="ไม่บังคับ"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              ปิด
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
