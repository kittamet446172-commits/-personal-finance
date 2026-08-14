'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { isPinSet, isSessionUnlocked } from '@/lib/pin'
import { Sidebar } from '@/components/layout/sidebar'
import { Navbar } from '@/components/layout/navbar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { QuickAddButton } from '@/components/quick-add-button'
import { PinLock } from '@/components/pin-lock'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [pinLocked, setPinLocked] = useState(false)

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login')
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (session && isPinSet() && !isSessionUnlocked()) {
      setPinLocked(true)
    }
  }, [session])

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
      {pinLocked && <PinLock onUnlock={() => setPinLocked(false)} />}
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 pb-28 md:pb-6 bg-[#FFFBF0] dark:bg-muted/20">
          {children}
          <QuickAddButton />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
