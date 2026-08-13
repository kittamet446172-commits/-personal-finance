'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useBills, useCreateBill, useDeleteBill, useUpdateBill } from '@/hooks/use-bills'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'
import type { Bill } from '@/types'

export default function BillsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Bill | null>(null)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDay, setDueDay] = useState('')
  const [note, setNote] = useState('')

  const { data: bills = [], isLoading } = useBills()
  const createMutation = useCreateBill()
  const updateMutation = useUpdateBill()
  const deleteMutation = useDeleteBill()

  function openCreate() {
    setEditing(null)
    setName(''); setAmount(''); setDueDay(''); setNote('')
    setOpen(true)
  }

  function openEdit(bill: Bill) {
    setEditing(bill)
    setName(bill.name)
    setAmount(String(bill.amount))
    setDueDay(String(bill.dueDay))
    setNote(bill.note ?? '')
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const data = { name, amount: Number(amount), dueDay: Number(dueDay), note: note || undefined, isActive: true }
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, ...data })
    } else {
      await createMutation.mutateAsync(data)
    }
    setOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('ต้องการลบบิลนี้ใช่ไหม?')) return
    await deleteMutation.mutateAsync(id)
  }

  async function toggleActive(bill: Bill) {
    await updateMutation.mutateAsync({ id: bill.id, isActive: !bill.isActive })
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const totalMonthly = bills.filter((b) => b.isActive).reduce((s, b) => s + Number(b.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">บิล / Subscription</h1>
          {bills.length > 0 && (
            <p className="text-sm text-muted-foreground mt-0.5">
              รวม {formatCurrency(totalMonthly)} / เดือน
            </p>
          )}
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มบิล
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : bills.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ยังไม่มีบิล
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {bills.map((bill) => (
            <Card key={bill.id} className={!bill.isActive ? 'opacity-50' : ''}>
              <CardContent className="py-3 px-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleActive(bill)}
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${
                      bill.isActive ? 'bg-primary border-primary' : 'border-muted-foreground'
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{bill.name}</p>
                    <p className="text-xs text-muted-foreground">ทุกวันที่ {bill.dueDay}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold">{formatCurrency(Number(bill.amount))}</p>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(bill)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(bill.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'แก้ไขบิล' : 'เพิ่มบิล'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อ</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น Netflix, iCloud" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>จำนวน (บาท)</Label>
                <Input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>ครบกำหนดวันที่</Label>
                <Input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} placeholder="1-31" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ไม่บังคับ" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button type="submit" disabled={isPending}>{isPending ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
