'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeftRight,
  BarChart3,
  DollarSign,
  LayoutDashboard,
  LineChart,
  Menu,
  Settings,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui.store'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'บัญชี', icon: Wallet },
  { href: '/income', label: 'รายรับ', icon: TrendingUp },
  { href: '/expense', label: 'รายจ่าย', icon: TrendingDown },
  { href: '/transfers', label: 'โอนเงิน', icon: ArrowLeftRight },
  { href: '/categories', label: 'หมวดหมู่', icon: Tag },
  { href: '/budget', label: 'งบประมาณ', icon: Target },
  { href: '/reports', label: 'รายงาน', icon: BarChart3 },
  { href: '/investments', label: 'Portfolio', icon: LineChart },
  { href: '/dividends', label: 'ปันผล', icon: DollarSign },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUiStore()

  // ปิด sidebar บนมือถือตอน mount
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [setSidebarOpen])

  // ปิด sidebar เมื่อเปลี่ยนหน้าบนมือถือ
  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false)
  }, [pathname, setSidebarOpen])

  return (
    <>
      {/* Backdrop มือถือ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'flex flex-col border-r bg-card transition-all duration-300',
          // มือถือ: fixed overlay
          'fixed inset-y-0 left-0 z-50 w-64',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // desktop: static
          'md:relative md:translate-x-0 md:shrink-0',
          sidebarOpen ? 'md:w-60' : 'md:w-16',
        )}
      >
        <div className="flex h-14 items-center justify-between border-b px-4">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-6 w-6 shrink-0 text-primary" />
              <span className="font-bold text-lg">Finance</span>
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
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                pathname === href
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
