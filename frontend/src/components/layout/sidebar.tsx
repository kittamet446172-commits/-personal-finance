'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Download, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui.store'
import { Button } from '@/components/ui/button'
import { usePWAInstall } from '@/hooks/use-pwa-install'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '/icons/dashboard.svg', colored: false },
  { href: '/accounts', label: 'บัญชี', icon: '/icons/wallet.svg', colored: false },
  { href: '/income', label: 'รายรับ', icon: '/icons/income.svg', colored: true },
  { href: '/expense', label: 'รายจ่าย', icon: '/icons/expense.svg', colored: true },
  { href: '/transfers', label: 'โอนเงิน', icon: '/icons/transaction.svg', colored: false },
  { href: '/categories', label: 'หมวดหมู่', icon: '/icons/receipt.svg', colored: false },
  { href: '/investments', label: 'ลงทุน', icon: '/icons/investment.svg', colored: false },
  { href: '/dividends', label: 'เงินปันผล', icon: '/icons/portfolio.svg', colored: false },
  { href: '/budget', label: 'งบประมาณ', icon: '/icons/budget.svg', colored: false },
  { href: '/reports', label: 'รายงาน', icon: '/icons/report.svg', colored: false },
  { href: '/settings', label: 'ตั้งค่า', icon: '/icons/settings.svg', colored: false },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUiStore()
  const { canInstall, install } = usePWAInstall()

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
          {navItems.map(({ href, label, icon, colored }) => {
            const isActive = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#FFF3CD] dark:bg-amber-900/40 text-[#B45309] dark:text-amber-400 font-semibold'
                    : 'text-muted-foreground hover:bg-[#FFF3CD] dark:hover:bg-amber-900/40 hover:text-[#B45309] dark:hover:text-amber-400',
                )}
              >
                <img
                  src={icon}
                  alt={label}
                  className={cn('h-5 w-5 shrink-0', !colored && 'dark:brightness-0 dark:invert')}
                />
                {sidebarOpen && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {canInstall && (
          <div className="p-2 border-t">
            <button
              onClick={install}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium w-full transition-colors',
                'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20',
              )}
            >
              <Download className="h-5 w-5 shrink-0" />
              {sidebarOpen && <span>ติดตั้งแอป</span>}
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
