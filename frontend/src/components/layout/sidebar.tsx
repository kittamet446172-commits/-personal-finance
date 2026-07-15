'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ArrowLeftRight,
  BarChart3,
  DollarSign,
  LayoutDashboard,
  Settings,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/ui.store'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/accounts', label: 'บัญชี', icon: Wallet },
  { href: '/income', label: 'รายรับ', icon: TrendingUp },
  { href: '/expense', label: 'รายจ่าย', icon: TrendingDown },
  { href: '/transfers', label: 'โอนเงิน', icon: ArrowLeftRight },
  { href: '/categories', label: 'หมวดหมู่', icon: Tag },
  { href: '/budget', label: 'งบประมาณ', icon: Target },
  { href: '/reports', label: 'รายงาน', icon: BarChart3 },
  { href: '/settings', label: 'ตั้งค่า', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen } = useUiStore()

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300 shrink-0',
        sidebarOpen ? 'w-60' : 'w-16',
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <DollarSign className="h-6 w-6 shrink-0 text-primary" />
        {sidebarOpen && <span className="font-bold text-lg">Finance</span>}
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
  )
}
