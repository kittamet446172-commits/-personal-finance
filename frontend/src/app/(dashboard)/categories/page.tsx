'use client'

import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '@/hooks/use-categories'
import { Badge } from '@/components/ui/badge'
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
import type { Category, TransactionType } from '@/types'

interface FormState {
  name: string
  type: TransactionType
  icon: string
  color: string
}

const defaultForm: FormState = {
  name: '',
  type: 'EXPENSE',
  icon: '',
  color: '#6b7280',
}

export default function CategoriesPage() {
  const [activeType, setActiveType] = useState<TransactionType>('EXPENSE')
  const { data: categories = [], isLoading } = useCategories(activeType)
  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)

  function openCreate() {
    setEditing(null)
    setForm({ ...defaultForm, type: activeType })
    setOpen(true)
  }

  function openEdit(category: Category) {
    setEditing(category)
    setForm({
      name: category.name,
      type: category.type,
      icon: category.icon ?? '',
      color: category.color ?? '#6b7280',
    })
    setOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (editing) {
      await updateMutation.mutateAsync({
        id: editing.id,
        name: form.name,
        type: form.type,
        icon: form.icon || undefined,
        color: form.color || undefined,
      })
    } else {
      await createMutation.mutateAsync({
        name: form.name,
        type: form.type,
        icon: form.icon || undefined,
        color: form.color || undefined,
      })
    }
    setOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('ต้องการลบหมวดหมู่นี้ใช่ไหม?')) return
    await deleteMutation.mutateAsync(id)
  }

  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">หมวดหมู่</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มหมวดหมู่
        </Button>
      </div>

      <div className="flex gap-2">
        {(['EXPENSE', 'INCOME'] as TransactionType[]).map((t) => (
          <Button
            key={t}
            variant={activeType === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveType(t)}
          >
            {t === 'INCOME' ? 'รายรับ' : 'รายจ่าย'}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center justify-between py-4 px-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-base"
                    style={{ backgroundColor: cat.color ?? '#e5e7eb' }}
                  >
                    {cat.icon ?? '📦'}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{cat.name}</p>
                    {cat.isDefault && (
                      <Badge variant="secondary" className="text-xs">
                        ค่าเริ่มต้น
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(cat)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {!cat.isDefault && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อหมวดหมู่</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                disabled={!!editing?.isDefault}
                autoComplete="off"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Emoji</Label>
                <Input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  placeholder="เช่น 🍔"
                  maxLength={4}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label>สี</Label>
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-10 w-full rounded-md border border-input cursor-pointer"
                />
              </div>
            </div>
            {!editing?.isDefault && (
              <div className="space-y-2">
                <Label>ประเภท</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={form.type === 'INCOME' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setForm({ ...form, type: 'INCOME' })}
                  >
                    รายรับ
                  </Button>
                  <Button
                    type="button"
                    variant={form.type === 'EXPENSE' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setForm({ ...form, type: 'EXPENSE' })}
                  >
                    รายจ่าย
                  </Button>
                </div>
              </div>
            )}
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
