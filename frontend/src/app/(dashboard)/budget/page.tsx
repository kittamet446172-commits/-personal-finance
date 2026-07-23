'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  useBudgets,
  useCreateBudget,
  useDeleteBudget,
  useUpdateBudget,
} from '@/hooks/use-budgets'
import { useCategories } from '@/hooks/use-categories'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
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
import { formatCurrency } from '@/lib/utils'
import type { Budget } from '@/types'

const MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน',
  'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม',
  'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

export default function BudgetPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Budget | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')

  const { data: budgets = [], isLoading } = useBudgets(month, year)
  const { data: categories = [] } = useCategories('EXPENSE')
  const createMutation = useCreateBudget()
  const updateMutation = useUpdateBudget()
  const deleteMutation = useDeleteBudget()

  function openCreate() {
    setEditing(null)
    setCategoryId('')
    setAmount('')
    setOpen(true)
  }

  function openEdit(budget: Budget) {
    setEditing(budget)
    setCategoryId(budget.categoryId)
    setAmount(String(budget.amount))
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.id, amount: Number(amount) })
    } else {
      await createMutation.mutateAsync({
        categoryId,
        amount: Number(amount),
        month,
        year,
      })
    }
    setOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('ต้องการลบงบประมาณนี้ใช่ไหม?')) return
    await deleteMutation.mutateAsync(id)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">งบประมาณ</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มงบ
        </Button>
      </div>

      <div className="flex gap-3">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {MONTHS.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ยังไม่มีงบประมาณในเดือนนี้
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {budgets.map((budget) => {
            const pct = Math.min(
              (budget.spent / Number(budget.amount)) * 100,
              100,
            )
            const isOver = budget.spent > Number(budget.amount)

            return (
              <Card key={budget.id}>
                <CardContent className="py-4 px-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">
                        {budget.category?.icon ?? '📦'}
                      </span>
                      <span className="text-sm font-medium">
                        {budget.category?.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatCurrency(budget.spent)}{' '}
                          <span className="text-muted-foreground font-normal">
                            / {formatCurrency(Number(budget.amount))}
                          </span>
                        </p>
                        <p
                          className={`text-xs ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}
                        >
                          {isOver
                            ? `เกิน ${formatCurrency(Math.abs(budget.remaining))}`
                            : `เหลือ ${formatCurrency(budget.remaining)}`}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(budget)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(budget.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${isOver ? 'bg-destructive' : 'bg-primary'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'แก้ไขงบประมาณ' : `เพิ่มงบประมาณ — ${MONTHS[month - 1]} ${year}`}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editing && (
              <div className="space-y-2">
                <Label>หมวดหมู่</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>งบประมาณ (บาท)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
