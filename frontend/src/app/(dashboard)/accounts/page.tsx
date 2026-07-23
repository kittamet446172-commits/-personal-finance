'use client'

import { useState } from 'react'
import { ArrowLeftRight, Pencil, Plus, Trash2, Wallet } from 'lucide-react'
import { TransferDialog } from '@/components/transfers/transfer-dialog'
import {
  useAccounts,
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from '@/hooks/use-accounts'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Account, AccountType } from '@/types'

const TYPE_LABELS: Record<AccountType, string> = {
  CASH: 'เงินสด',
  BANK_ACCOUNT: 'บัญชีธนาคาร',
  WALLET: 'กระเป๋าเงิน',
  INVESTMENT: 'ลงทุน',
}

interface FormState {
  name: string
  type: AccountType
  balance: string
  description: string
}

const defaultForm: FormState = {
  name: '',
  type: 'CASH',
  balance: '0',
  description: '',
}

export default function AccountsPage() {
  const { data: accounts = [], isLoading } = useAccounts()
  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()
  const deleteMutation = useDeleteAccount()

  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [form, setForm] = useState<FormState>(defaultForm)

  function openCreate() {
    setEditing(null)
    setForm(defaultForm)
    setOpen(true)
  }

  function openEdit(account: Account) {
    setEditing(account)
    setForm({
      name: account.name,
      type: account.type,
      balance: String(account.balance),
      description: account.description ?? '',
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
        description: form.description || undefined,
      })
    } else {
      await createMutation.mutateAsync({
        name: form.name,
        type: form.type,
        balance: Number(form.balance),
        description: form.description || undefined,
      })
    }
    setOpen(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('ต้องการลบบัญชีนี้ใช่ไหม?')) return
    await deleteMutation.mutateAsync(id)
  }

  const [transferOpen, setTransferOpen] = useState(false)
  const totalBalance = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
  const isPending = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">บัญชี</h1>
          <p className="text-sm text-muted-foreground">
            ยอดรวม {formatCurrency(totalBalance)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setTransferOpen(true)}>
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            โอนเงิน
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มบัญชี
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            ยังไม่มีบัญชี กด &quot;เพิ่มบัญชี&quot; เพื่อเริ่มต้น
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">{account.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(account)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(account.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-bold">
                  {formatCurrency(Number(account.balance))}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{TYPE_LABELS[account.type]}</Badge>
                  {account.description && (
                    <p className="text-xs text-muted-foreground">
                      {account.description}
                    </p>
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
            <DialogTitle>{editing ? 'แก้ไขบัญชี' : 'เพิ่มบัญชี'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อบัญชี</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="เช่น กระเป๋าสตางค์"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>ประเภท</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(TYPE_LABELS) as AccountType[]).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    variant={form.type === t ? 'default' : 'outline'}
                    onClick={() => setForm({ ...form, type: t })}
                  >
                    {TYPE_LABELS[t]}
                  </Button>
                ))}
              </div>
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label>ยอดเงินเริ่มต้น</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.balance}
                  onChange={(e) => setForm({ ...form, balance: e.target.value })}
                  onFocus={(e) => e.target.select()}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="ไม่บังคับ"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <TransferDialog open={transferOpen} onClose={() => setTransferOpen(false)} />
    </div>
  )
}
