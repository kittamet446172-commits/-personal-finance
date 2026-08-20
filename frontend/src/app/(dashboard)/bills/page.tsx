'use client'

import { useState } from 'react'
import { CheckCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { useBills, useCreateBill, useDeleteBill, usePayBill, useUpdateBill } from '@/hooks/use-bills'
import { useAccounts } from '@/hooks/use-accounts'
import { useCategories } from '@/hooks/use-categories'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/utils'
import type { Bill } from '@/types'

const MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']

function billDueLabel(bill: Bill) {
  if (bill.frequency === 'YEARLY' && bill.dueMonth) {
    return `ทุกวันที่ ${bill.dueDay} ${MONTHS[bill.dueMonth - 1]} (รายปี)`
  }
  return `ทุกวันที่ ${bill.dueDay} ของเดือน`
}

export default function BillsPage() {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Bill | null>(null)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [frequency, setFrequency] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [note, setNote] = useState('')

  const [payBill, setPayBill] = useState<Bill | null>(null)
  const [payAccountId, setPayAccountId] = useState('')
  const [payCategoryId, setPayCategoryId] = useState('')
  const [payAmount, setPayAmount] = useState('')
  const [payDate, setPayDate] = useState('')

  const { data: bills = [], isLoading } = useBills()
  const { data: accounts = [] } = useAccounts()
  const { data: expenseCategories = [] } = useCategories('EXPENSE')
  const createMutation = useCreateBill()
  const updateMutation = useUpdateBill()
  const deleteMutation = useDeleteBill()
  const payMutation = usePayBill()

  function openCreate() {
    setEditing(null)
    setName(''); setAmount(''); setDueDate(''); setNote('')
    setFrequency('MONTHLY')
    setOpen(true)
  }

  function openEdit(bill: Bill) {
    setEditing(bill)
    setName(bill.name)
    setAmount(String(bill.amount))
    const now = new Date()
    const m = bill.dueMonth ?? (now.getMonth() + 1)
    const y = now.getFullYear()
    setDueDate(`${y}-${String(m).padStart(2, '0')}-${String(bill.dueDay).padStart(2, '0')}`)
    setFrequency(bill.frequency ?? 'MONTHLY')
    setNote(bill.note ?? '')
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parsed = new Date(dueDate)
    const dueDay = parsed.getDate()
    const dueMonth = parsed.getMonth() + 1
    const data = {
      name,
      amount: Number(amount),
      dueDay,
      dueMonth: frequency === 'YEARLY' ? dueMonth : null,
      frequency,
      note: note || undefined,
      isActive: true,
    }
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

  function openPay(bill: Bill) {
    setPayBill(bill)
    setPayAmount(String(bill.amount))
    setPayDate(new Date().toISOString().slice(0, 10))
    setPayAccountId('')
    setPayCategoryId('')
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault()
    if (!payBill) return
    await payMutation.mutateAsync({
      id: payBill.id,
      accountId: payAccountId,
      categoryId: payCategoryId,
      amount: Number(payAmount),
      date: payDate,
    })
    setPayBill(null)
  }

  async function toggleActive(bill: Bill) {
    await updateMutation.mutateAsync({ id: bill.id, isActive: !bill.isActive })
  }

  const isPending = createMutation.isPending || updateMutation.isPending
  const monthlyTotal = bills.filter((b) => b.isActive && b.frequency !== 'YEARLY').reduce((s, b) => s + Number(b.amount), 0)
  const yearlyTotal = bills.filter((b) => b.isActive && b.frequency === 'YEARLY').reduce((s, b) => s + Number(b.amount), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">บิล / Subscription</h1>
          {bills.length > 0 && (
            <div className="text-sm text-muted-foreground mt-0.5 space-x-2">
              {monthlyTotal > 0 && <span>รายเดือน {formatCurrency(monthlyTotal)}</span>}
              {yearlyTotal > 0 && <span>· รายปี {formatCurrency(yearlyTotal)}</span>}
            </div>
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
                    <p className="text-xs text-muted-foreground">{billDueLabel(bill)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold">{formatCurrency(Number(bill.amount))}</p>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                      onClick={() => openPay(bill)}
                      title="บันทึกจ่ายแล้ว"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                    </Button>
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
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น Netflix, ประกันรถ" required />
            </div>
            <div className="space-y-2">
              <Label>จำนวน (บาท)</Label>
              <Input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>ความถี่</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as 'MONTHLY' | 'YEARLY')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">รายเดือน</SelectItem>
                  <SelectItem value="YEARLY">รายปี</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{frequency === 'YEARLY' ? 'วันและเดือนครบกำหนด' : 'วันที่ครบกำหนด'}</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
              {frequency === 'MONTHLY' && dueDate && (
                <p className="text-xs text-muted-foreground">
                  จะใช้เฉพาะวันที่ {new Date(dueDate).getDate()} ของทุกเดือน
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ไม่บังคับ" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
              <Button type="submit" disabled={isPending || !dueDate}>
                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!payBill} onOpenChange={(o) => { if (!o) setPayBill(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>บันทึกจ่าย — {payBill?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePay} className="space-y-4">
            <div className="space-y-2">
              <Label>จำนวนเงิน (บาท)</Label>
              <Input
                type="number" step="0.01" min="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>บัญชีที่จ่าย</Label>
              <Select value={payAccountId} onValueChange={setPayAccountId} required>
                <SelectTrigger><SelectValue placeholder="เลือกบัญชี" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>หมวดหมู่</Label>
              <Select value={payCategoryId} onValueChange={setPayCategoryId} required>
                <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>วันที่จ่าย</Label>
              <Input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPayBill(null)}>ยกเลิก</Button>
              <Button type="submit" disabled={payMutation.isPending || !payAccountId || !payCategoryId}>
                {payMutation.isPending ? 'กำลังบันทึก...' : 'บันทึกจ่ายแล้ว'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
