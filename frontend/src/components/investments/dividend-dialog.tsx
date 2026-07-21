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
import { useCreateDividend } from '@/hooks/use-dividends'
import { useHoldings } from '@/hooks/use-investments'

interface Props {
  open: boolean
  onClose: () => void
  holdingId?: string
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export function DividendDialog({ open, onClose, holdingId }: Props) {
  const { data: holdings = [] } = useHoldings()
  const createMutation = useCreateDividend()
  const [form, setForm] = useState({
    holdingId: holdingId ?? '',
    amount: '',
    perShare: '',
    date: todayStr(),
    note: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createMutation.mutateAsync({
      holdingId: form.holdingId,
      amount: Number(form.amount),
      perShare: form.perShare ? Number(form.perShare) : undefined,
      date: form.date,
      note: form.note || undefined,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>บันทึกเงินปันผล</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>หลักทรัพย์ *</Label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.holdingId}
              onChange={(e) => setForm({ ...form, holdingId: e.target.value })}
              required
            >
              <option value="">เลือกหลักทรัพย์</option>
              {holdings.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.symbol} — {h.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>จำนวนเงินรวม (฿) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                onFocus={(e) => e.target.select()}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>ต่อหน่วย (฿)</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={form.perShare}
                onChange={(e) => setForm({ ...form, perShare: e.target.value })}
                onFocus={(e) => e.target.select()}
                placeholder="ไม่บังคับ"
              />
            </div>
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
