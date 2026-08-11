'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { useCreateTransaction } from '@/hooks/use-transactions'
import type { TransactionType } from '@/types'

export function QuickAddButton() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<TransactionType>('EXPENSE')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')

  const { data: accounts } = useAccounts()
  const { data: categories } = useCategories(type)
  const { mutate: createTransaction, isPending } = useCreateTransaction()

  // Drag state: null = use CSS default position (bottom-right)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const drag = useRef({ active: false, ox: 0, oy: 0, px: 0, py: 0, moved: false })

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    drag.current = {
      active: true,
      ox: e.clientX - rect.left,
      oy: e.clientY - rect.top,
      px: rect.left,
      py: rect.top,
      moved: false,
    }
    setPos({ x: rect.left, y: rect.top })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!drag.current.active) return
    const x = e.clientX - drag.current.ox
    const y = e.clientY - drag.current.oy
    if (Math.abs(x - drag.current.px) > 5 || Math.abs(y - drag.current.py) > 5) {
      drag.current.moved = true
    }
    setPos({ x, y })
  }

  function onPointerUp() {
    drag.current.active = false
    if (!drag.current.moved) handleOpen()
  }

  function handleOpen() {
    setType('EXPENSE')
    setAmount('')
    setCategoryId('')
    setAccountId('')
    setDate(new Date().toISOString().split('T')[0])
    setDescription('')
    setOpen(true)
  }

  function handleTypeChange(t: TransactionType) {
    setType(t)
    setCategoryId('')
  }

  function handleSubmit() {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0 || !categoryId || !accountId) return
    createTransaction(
      { type, amount: amt, date, categoryId, accountId, description: description || undefined },
      { onSuccess: () => setOpen(false) },
    )
  }

  const wrapperStyle: React.CSSProperties = pos
    ? { position: 'fixed', left: pos.x, top: pos.y, zIndex: 50 }
    : { position: 'fixed', right: 24, bottom: 24, zIndex: 50 }

  const earStyle: React.CSSProperties = {
    position: 'absolute',
    top: -10,
    width: 0,
    height: 0,
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    borderBottom: '14px solid hsl(var(--primary))',
    pointerEvents: 'none',
  }

  return (
    <>
      <div style={wrapperStyle} className="touch-none select-none">
        {/* Cat ears */}
        <div style={{ ...earStyle, left: 4 }} />
        <div style={{ ...earStyle, right: 4 }} />

        <button
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95"
          title="บันทึกรายการด่วน"
        >
          <span style={{ fontSize: 28, lineHeight: 1 }}>🐱</span>
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>บันทึกรายการด่วน</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex rounded-lg border p-1 gap-1">
              {(['EXPENSE', 'INCOME'] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                    type === t
                      ? t === 'EXPENSE'
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-500 text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t === 'EXPENSE' ? 'รายจ่าย' : 'รายรับ'}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <Label>จำนวนเงิน</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={0}
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <Label>หมวดหมู่</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>บัญชี</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกบัญชี" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>วันที่</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label>หมายเหตุ (ไม่บังคับ)</Label>
              <Input
                placeholder="เพิ่มหมายเหตุ..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleSubmit}
              disabled={isPending || !amount || !categoryId || !accountId}
            >
              {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
