'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { QuickAddButton } from '@/components/quick-add-button'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login')
    }
  }, [session, isPending, router])

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">กำลังโหลด...</div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6 bg-[#FFFBF0] dark:bg-muted/20">
          {children}
          <QuickAddButton />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
