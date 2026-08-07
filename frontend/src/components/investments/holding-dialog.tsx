'use client'

import { useEffect, useState } from 'react'
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
import { useCreateHolding, useUpdateHolding } from '@/hooks/use-investments'
import type { InvestmentHolding, InvestmentType } from '@/types'

const TYPE_LABELS: Record<InvestmentType, string> = {
  STOCK: 'หุ้น',
  ETF: 'ETF',
  MUTUAL_FUND: 'กองทุน',
  REIT: 'REIT',
}

interface Props {
  open: boolean
  onClose: () => void
  editing?: InvestmentHolding | null
}

interface FormState {
  symbol: string
  name: string
  type: InvestmentType
  exchange: string
  sector: string
  currentPrice: string
  note: string
}

const defaultForm: FormState = {
  symbol: '',
  name: '',
  type: 'STOCK',
  exchange: '',
  sector: '',
  currentPrice: '0',
  note: '',
}

export function HoldingDialog({ open, onClose, editing }: Props) {
  const createMutation = useCreateHolding()
  const updateMutation = useUpdateHolding()
  const [form, setForm] = useState<FormState>(defaultForm)

  useEffect(() => {
    if (editing) {
      setForm({
        symbol: editing.symbol,
        name: editing.name,
        type: editing.type,
        exchange: editing.exchange ?? '',
        sector: editing.sector ?? '',
        currentPrice: String(editing.currentPrice),
        note: editing.note ?? '',
      })
    } else {
      setForm(defaultForm)
    }
  }, [editing, open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = {
      symbol: form.symbol,
      name: form.name,
      type: form.type,
      exchange: form.exchange || undefined,
      sector: form.sector || undefined,
      currentPrice: Number(form.currentPrice),
      note: form.note || undefined,
    }
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...data })
    } else {
      await createMutation.mutateAsync(data)
    }
    onClose()
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? 'แก้ไข' : 'เพิ่ม'} หลักทรัพย์</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>ประเภท</Label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(TYPE_LABELS) as InvestmentType[]).map((t) => (
                <Button
                  key={t}
                  type="button"
                  variant={form.type === t ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setForm({ ...form, type: t })}
                >
                  {TYPE_LABELS[t]}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ticker / Symbol *</Label>
              <Input
                value={form.symbol}
                onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })}
                placeholder="เช่น PTT, CPALL"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>ตลาด</Label>
              <Input
                value={form.exchange}
                onChange={(e) => setForm({ ...form, exchange: e.target.value })}
                placeholder="เช่น SET, mai"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ชื่อเต็ม *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="เช่น บริษัท ปตท. จำกัด"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>กลุ่มอุตสาหกรรม</Label>
              <Input
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                placeholder="เช่น Energy"
              />
            </div>
            <div className="space-y-2">
              <Label>ราคาปัจจุบัน (฿)</Label>
              <Input
                type="number"
                step="0.0001"
                min="0"
                value={form.currentPrice}
                onChange={(e) => setForm({ ...form, currentPrice: e.target.value })}
                onFocus={(e) => e.target.select()}
              />
            </div>
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
            <Button type="submit" disabled={isPending}>
              {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
