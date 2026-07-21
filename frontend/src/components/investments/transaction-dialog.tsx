'use client'

import { useState } from 'react'
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
import { useCreateInvestmentTransaction } from '@/hooks/use-investments'
import type { InvestmentHolding, LotType } from '@/types'

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

export function InvestmentTransactionDialog({ open, onClose, holding }: Props) {
  const createMutation = useCreateInvestmentTransaction()
  const [form, setForm] = useState<FormState>({
    type: 'BUY',
    quantity: '',
    pricePerUnit: String(holding.currentPrice || ''),
    fee: '0',
    date: todayStr(),
    note: '',
  })

  const totalCost =
    (Number(form.quantity) || 0) * (Number(form.pricePerUnit) || 0) +
    (Number(form.fee) || 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createMutation.mutateAsync({
      holdingId: holding.id,
      type: form.type,
      quantity: Number(form.quantity),
      pricePerUnit: Number(form.pricePerUnit),
      fee: Number(form.fee),
      date: form.date,
      note: form.note || undefined,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            บันทึกรายการ — {holding.symbol}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <Label>ราคาต่อหน่วย (฿) *</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={form.pricePerUnit}
                onChange={(e) => setForm({ ...form, pricePerUnit: e.target.value })}
                onFocus={(e) => e.target.select()}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ค่าธรรมเนียม (฿)</Label>
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
                ฿{totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
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
            <Button type="button" variant="outline" onClick={onClose}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
