'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { useCreateTransaction, useUpdateTransaction } from '@/hooks/use-transactions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { Transaction, TransactionType } from '@/types'

interface ComboboxOption {
  value: string
  label: string
}

function Combobox({
  value,
  onValueChange,
  options,
  placeholder,
}: {
  value: string
  onValueChange: (v: string) => void
  options: ComboboxOption[]
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = options.find((o) => o.value === value)
  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase()),
  )

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} className="relative">
      <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <input
          ref={inputRef}
          value={open ? search : (selected?.label ?? '')}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => { setOpen(true); setSearch('') }}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </div>
      {open && (filtered.length > 0 || search) && (
        <div className="absolute z-[200] mt-1 w-full rounded-md border bg-white text-popover-foreground shadow-lg dark:bg-zinc-900">
          {filtered.length === 0 && search ? (
            <p className="py-2 text-center text-sm text-muted-foreground">ไม่พบรายการ</p>
          ) : (
            <div className="max-h-48 overflow-y-auto p-1">
              {filtered.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { onValueChange(o.value); setOpen(false); setSearch('') }}
                  className={cn(
                    'relative flex w-full items-center rounded-sm py-1.5 pl-8 pr-2 text-sm hover:bg-accent hover:text-accent-foreground',
                    value === o.value && 'bg-accent/50',
                  )}
                >
                  {value === o.value && (
                    <span className="absolute left-2">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  type: TransactionType
  transaction?: Transaction
}

export function TransactionDialog({ open, onClose, type, transaction }: Props) {
  const { data: accounts = [] } = useAccounts()
  const { data: categories = [] } = useCategories(type)
  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [merchant, setMerchant] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    if (transaction) {
      setAmount(String(transaction.amount))
      setDate(transaction.date.slice(0, 10))
      setCategoryId(transaction.categoryId)
      setAccountId(transaction.accountId)
      setMerchant(transaction.merchant ?? '')
      setDescription(transaction.description ?? '')
    } else {
      setAmount('')
      setDate(new Date().toISOString().slice(0, 10))
      setCategoryId('')
      setAccountId('')
      setMerchant('')
      setDescription('')
    }
    setError('')
  }, [open, transaction])

  const isPending = createMutation.isPending || updateMutation.isPending

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!categoryId || !accountId) {
      setError('กรุณาเลือกหมวดหมู่และบัญชี')
      return
    }
    setError('')

    try {
      if (transaction) {
        await updateMutation.mutateAsync({
          id: transaction.id,
          amount: Number(amount),
          date,
          categoryId,
          accountId,
          merchant: merchant || undefined,
          description: description || undefined,
        })
      } else {
        await createMutation.mutateAsync({
          type,
          amount: Number(amount),
          date,
          categoryId,
          accountId,
          merchant: merchant || undefined,
          description: description || undefined,
        })
      }
      onClose()
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  const title = `${transaction ? 'แก้ไข' : 'เพิ่ม'}${type === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}`

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>จำนวนเงิน</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>วันที่</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>หมวดหมู่</Label>
            <Combobox
              value={categoryId}
              onValueChange={setCategoryId}
              placeholder="เลือกหมวดหมู่"
              options={categories.map((c) => ({ value: c.id, label: `${c.icon ?? ''} ${c.name}`.trim() }))}
            />
          </div>

          <div className="space-y-2">
            <Label>บัญชี</Label>
            <Combobox
              value={accountId}
              onValueChange={setAccountId}
              placeholder="เลือกบัญชี"
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
            />
          </div>

          <div className="space-y-2">
            <Label>ร้านค้า / แหล่งที่มา</Label>
            <Input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="ไม่บังคับ"
            />
          </div>

          <div className="space-y-2">
            <Label>หมายเหตุ</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
