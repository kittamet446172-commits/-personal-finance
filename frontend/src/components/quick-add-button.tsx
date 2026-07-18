'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
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
      {
        type,
        amount: amt,
        date,
        categoryId,
        accountId,
        description: description || undefined,
      },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 active:scale-95"
        title="บันทึกรายการด่วน"
      >
        <Plus className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>บันทึกรายการด่วน</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type toggle */}
            <div className="flex rounded-lg border p-1 gap-1">
              {(['EXPENSE', 'INCOME'] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => handleTypeChange(t)}
                  className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                    type === t
                      ? t === 'EXPENSE'
                        ? 'bg-red-500 text-white'
                        : 'bg-green-500 text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t === 'EXPENSE' ? 'รายจ่าย' : 'รายรับ'}
                </button>
              ))}
            </div>

            {/* Amount */}
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

            {/* Category */}
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

            {/* Account */}
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

            {/* Date */}
            <div className="space-y-1">
              <Label>วันที่</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Description */}
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
