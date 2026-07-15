'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useAccounts } from '@/hooks/use-accounts'
import { useCreateTransfer } from '@/hooks/use-transfers'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  open: boolean
  onClose: () => void
}

export function TransferDialog({ open, onClose }: Props) {
  const { data: accounts = [] } = useAccounts()
  const createMutation = useCreateTransfer()

  const [fromAccountId, setFromAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setFromAccountId('')
    setToAccountId('')
    setAmount('')
    setDate(new Date().toISOString().slice(0, 10))
    setDescription('')
    setError('')
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (fromAccountId === toAccountId) {
      setError('บัญชีต้นทางและปลายทางต้องไม่เหมือนกัน')
      return
    }
    setError('')
    try {
      await createMutation.mutateAsync({
        fromAccountId,
        toAccountId,
        amount: Number(amount),
        date,
        description: description || undefined,
      })
      onClose()
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
    }
  }

  const toAccounts = accounts.filter((a) => a.id !== fromAccountId)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>โอนเงินระหว่างบัญชี</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-2">
              <Label>จาก</Label>
              <Select value={fromAccountId} onValueChange={setFromAccountId} required>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกบัญชี" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ArrowRight className="mt-6 h-5 w-5 shrink-0 text-muted-foreground" />

            <div className="flex-1 space-y-2">
              <Label>ไปยัง</Label>
              <Select value={toAccountId} onValueChange={setToAccountId} required>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกบัญชี" />
                </SelectTrigger>
                <SelectContent position="popper">
                  {toAccounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>จำนวนเงิน</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onFocus={(e) => e.target.select()}
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
            <Label>หมายเหตุ</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ไม่บังคับ"
              autoComplete="off"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>ยกเลิก</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'กำลังโอน...' : 'โอนเงิน'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
