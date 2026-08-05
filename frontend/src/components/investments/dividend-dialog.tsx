'use client'

import { useState, useEffect } from 'react'
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
  const [usdMode, setUsdMode] = useState(false)
  const [usdAmount, setUsdAmount] = useState('')
  const [usdPerShare, setUsdPerShare] = useState('')
  const [rate, setRate] = useState('33.5')
  const [rateFetching, setRateFetching] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ holdingId: holdingId ?? '', amount: '', perShare: '', date: todayStr(), note: '' })
    setUsdMode(false)
    setUsdAmount('')
    setUsdPerShare('')
  }, [open])

  useEffect(() => {
    if (!usdMode) return
    setRateFetching(true)
    fetch('https://api.frankfurter.app/latest?from=USD&to=THB')
      .then((r) => r.json())
      .then((data) => setRate(String(data.rates.THB)))
      .catch(() => {})
      .finally(() => setRateFetching(false))
  }, [usdMode])

  function applyRate() {
    const r = Number(rate)
    if (!r) return
    if (usdAmount) setForm((f) => ({ ...f, amount: (Number(usdAmount) * r).toFixed(2) }))
    if (usdPerShare) setForm((f) => ({ ...f, perShare: (Number(usdPerShare) * r).toFixed(4) }))
  }

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

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="usdMode"
              checked={usdMode}
              onChange={(e) => setUsdMode(e.target.checked)}
            />
            <Label htmlFor="usdMode" className="cursor-pointer">กรอกเป็น USD</Label>
          </div>

          {usdMode && (
            <div className="rounded-md border border-dashed p-3 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>จำนวนรวม (USD) *</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={usdAmount}
                    onChange={(e) => setUsdAmount(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>ต่อหน่วย (USD)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={usdPerShare}
                    onChange={(e) => setUsdPerShare(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    placeholder="ไม่บังคับ"
                  />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <div className="space-y-2 flex-1">
                  <Label>อัตราแลกเปลี่ยน (1 USD = ? ฿) {rateFetching && <span className="text-muted-foreground text-xs">กำลังโหลด...</span>}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    disabled={rateFetching}
                  />
                </div>
                <Button type="button" variant="outline" onClick={applyRate}>
                  แปลง
                </Button>
              </div>
            </div>
          )}

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
              onClick={(e) => (e.currentTarget as HTMLInputElement).showPicker?.()}
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
