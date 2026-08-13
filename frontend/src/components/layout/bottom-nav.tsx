'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Wallet, Plus, TrendingUp, LayoutGrid } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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

const moreTabs = [
  { href: '/expense', label: 'รายจ่าย', icon: '/icons/expense.svg', colored: true },
  { href: '/income', label: 'รายรับ', icon: '/icons/income.svg', colored: true },
  { href: '/transfers', label: 'โอนเงิน', icon: '/icons/transaction.svg', colored: false },
  { href: '/budget', label: 'งบประมาณ', icon: '/icons/budget.svg', colored: false },
  { href: '/investments', label: 'ลงทุน', icon: '/icons/investment.svg', colored: false },
  { href: '/dividends', label: 'เงินปันผล', icon: '/icons/portfolio.svg', colored: false },
  { href: '/bills', label: 'บิล', icon: '/icons/budget.svg', colored: false },
  { href: '/categories', label: 'หมวดหมู่', icon: '/icons/receipt.svg', colored: false },
  { href: '/reports', label: 'รายงาน', icon: '/icons/report.svg', colored: false },
  { href: '/settings', label: 'ตั้งค่า', icon: '/icons/settings.svg', colored: false },
]

export function BottomNav() {
  const pathname = usePathname()
  const [addOpen, setAddOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
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
    setAddOpen(true)
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
      { onSuccess: () => setAddOpen(false) },
    )
  }

  const isActive = (href: string) => pathname === href
  const activeClass = 'text-[#B45309] dark:text-amber-400'
  const inactiveClass = 'text-muted-foreground'

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-card border-t flex items-center h-16" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Link
          href="/dashboard"
          className={cn('flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium', isActive('/dashboard') ? activeClass : inactiveClass)}
        >
          <Home className="h-5 w-5" />
          <span>หน้าหลัก</span>
        </Link>

        <Link
          href="/investments"
          className={cn('flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium', isActive('/investments') ? activeClass : inactiveClass)}
        >
          <TrendingUp className="h-5 w-5" />
          <span>หุ้น</span>
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <button
            onClick={handleOpen}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-400 text-white shadow-lg -mt-5"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        <Link
          href="/accounts"
          className={cn('flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium', isActive('/accounts') ? activeClass : inactiveClass)}
        >
          <Wallet className="h-5 w-5" />
          <span>บัญชี</span>
        </Link>

        <button
          onClick={() => setMoreOpen(true)}
          className={cn('flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-medium', moreOpen ? activeClass : inactiveClass)}
        >
          <LayoutGrid className="h-5 w-5" />
          <span>เพิ่มเติม</span>
        </button>
      </nav>

      {/* Quick Add Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
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
                      ? t === 'EXPENSE' ? 'bg-red-500 text-white' : 'bg-green-600 text-white'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {t === 'EXPENSE' ? 'รายจ่าย' : 'รายรับ'}
                </button>
              ))}
            </div>
            <div className="space-y-1">
              <Label>จำนวนเงิน</Label>
              <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} min={0} autoFocus />
            </div>
            <div className="space-y-1">
              <Label>หมวดหมู่</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>บัญชี</Label>
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger><SelectValue placeholder="เลือกบัญชี" /></SelectTrigger>
                <SelectContent>
                  {accounts?.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>วันที่</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>หมายเหตุ (ไม่บังคับ)</Label>
              <Input placeholder="เพิ่มหมายเหตุ..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <Button className="w-full" onClick={handleSubmit} disabled={isPending || !amount || !categoryId || !accountId}>
              {isPending ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* More Menu Dialog */}
      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>เมนูทั้งหมด</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-2">
            {moreTabs.map(({ href, label, icon, colored }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  'flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-medium transition-colors',
                  pathname === href
                    ? 'bg-[#FFF3CD] dark:bg-amber-900/40 text-[#B45309] dark:text-amber-400'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted',
                )}
              >
                <img
                  src={icon}
                  alt={label}
                  className={cn('h-6 w-6', !colored && 'dark:brightness-0 dark:invert')}
                />
                <span className="text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
