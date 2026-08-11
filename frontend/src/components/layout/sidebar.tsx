'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui.store'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '/icons/dashboard.svg' },
  { href: '/accounts', label: 'บัญชี', icon: '/icons/wallet.svg' },
  { href: '/income', label: 'รายรับ', icon: '/icons/income.svg' },
  { href: '/expense', label: 'รายจ่าย', icon: '/icons/expense.svg' },
  { href: '/transfers', label: 'โอนเงิน', icon: '/icons/transaction.svg' },
  { href: '/categories', label: 'หมวดหมู่', icon: '/icons/receipt.svg' },
  { href: '/investments', label: 'ลงทุน', icon: '/icons/investment.svg' },
  { href: '/dividends', label: 'เงินปันผล', icon: '/icons/portfolio.svg' },
  { href: '/budget', label: 'งบประมาณ', icon: '/icons/budget.svg' },
  { href: '/reports', label: 'รายงาน', icon: '/icons/report.svg' },
  { href: '/settings', label: 'ตั้งค่า', icon: '/icons/settings.svg' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUiStore()

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [setSidebarOpen])

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [pathname, setSidebarOpen])

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'flex flex-col border-r bg-card transition-all duration-300',
          'fixed inset-y-0 left-0 z-50 w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:translate-x-0 md:shrink-0',
          sidebarOpen ? 'md:w-60' : 'md:w-16',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img src="/icons/cat.png" alt="logo" className="w-8 h-8 shrink-0 rounded-lg" />
              <span className="font-bold text-lg">Mone</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn(!sidebarOpen && 'mx-auto')}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 p-2">
          {navItems.map(({ href, label, icon }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#E8F5E9] dark:bg-emerald-900/40 text-[#2E7D32] dark:text-emerald-400 font-semibold'
                    : 'text-muted-foreground hover:bg-[#E8F5E9] dark:hover:bg-emerald-900/40 hover:text-[#2E7D32] dark:hover:text-emerald-400',
                )}
              >
                <img
                  src={icon}
                  alt={label}
                  className="h-5 w-5 shrink-0"
                />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
