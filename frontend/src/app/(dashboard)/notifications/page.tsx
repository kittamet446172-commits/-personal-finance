'use client'

import Link from 'next/link'
import { Bell, ChevronRight } from 'lucide-react'
import { useUpcomingBills } from '@/hooks/use-bills'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'

export default function NotificationsPage() {
  const { data: bills = [], isLoading } = useUpcomingBills(30)

  const today = bills.filter((b) => b.daysLeft === 0)
  const urgent = bills.filter((b) => b.daysLeft > 0 && b.daysLeft <= 3)
  const upcoming = bills.filter((b) => b.daysLeft > 3)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">แจ้งเตือน</h1>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      ) : bills.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-3 text-center text-muted-foreground">
            <Bell className="h-10 w-10 opacity-30" />
            <p className="text-sm">ไม่มีบิลในอีก 30 วัน</p>
            <Link href="/bills" className="text-sm text-primary underline underline-offset-2">
              จัดการบิล
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {today.length > 0 && (
            <section className="space-y-2">
              <p className="text-sm font-semibold text-destructive">วันนี้</p>
              {today.map((bill) => (
                <BillCard key={bill.id} name={bill.name} amount={Number(bill.amount)} dueDay={bill.dueDay} daysLeft={bill.daysLeft} />
              ))}
            </section>
          )}

          {urgent.length > 0 && (
            <section className="space-y-2">
              <p className="text-sm font-semibold text-orange-500">ใน 3 วัน</p>
              {urgent.map((bill) => (
                <BillCard key={bill.id} name={bill.name} amount={Number(bill.amount)} dueDay={bill.dueDay} daysLeft={bill.daysLeft} />
              ))}
            </section>
          )}

          {upcoming.length > 0 && (
            <section className="space-y-2">
              <p className="text-sm font-semibold text-muted-foreground">ที่กำลังจะมาถึง</p>
              {upcoming.map((bill) => (
                <BillCard key={bill.id} name={bill.name} amount={Number(bill.amount)} dueDay={bill.dueDay} daysLeft={bill.daysLeft} />
              ))}
            </section>
          )}

          <Link href="/bills" className="flex items-center justify-between text-sm text-muted-foreground hover:text-foreground transition-colors pt-2">
            <span>จัดการบิลทั้งหมด</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </>
      )}
    </div>
  )
}

function BillCard({ name, amount, dueDay, daysLeft }: { name: string; amount: number; dueDay: number; daysLeft: number }) {
  const isToday = daysLeft === 0
  const isUrgent = daysLeft <= 3
  return (
    <Card className={isToday ? 'border-destructive' : isUrgent ? 'border-orange-400' : ''}>
      <CardContent className="py-3 px-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{name}</p>
          <p className={`text-xs ${isToday ? 'text-destructive font-medium' : isUrgent ? 'text-orange-500' : 'text-muted-foreground'}`}>
            {isToday ? 'ครบกำหนดวันนี้' : `อีก ${daysLeft} วัน`} · วันที่ {dueDay} ของทุกเดือน
          </p>
        </div>
        <p className={`text-sm font-semibold ${isToday ? 'text-destructive' : ''}`}>
          {formatCurrency(amount)}
        </p>
      </CardContent>
    </Card>
  )
}
