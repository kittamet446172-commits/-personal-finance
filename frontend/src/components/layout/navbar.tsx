'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Menu, Moon, Sun } from 'lucide-react'
import { signOut, useSession } from '@/lib/auth-client'
import { useUiStore } from '@/store/ui.store'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isDark, setIsDark] = useState(false)
  const { toggleSidebar } = useUiStore()

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggleTheme() {
    const dark = document.documentElement.classList.toggle('dark')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
    setIsDark(dark)
  }

  async function handleSignOut() {
    await signOut()
    router.push('/login')
  }

  const userImage = (session?.user as { image?: string | null })?.image

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      {/* Mobile hamburger */}
      <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
        <Menu className="h-5 w-5" />
      </Button>
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          title="เปลี่ยน theme"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {userImage ? (
          <img
            src={userImage}
            alt="avatar"
            className="h-7 w-7 rounded-full object-cover"
          />
        ) : (
          <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-xs font-medium text-primary-foreground">
            {session?.user.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
        )}

        <span className="text-sm text-muted-foreground">
          {session?.user.name}
        </span>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          title="ออกจากระบบ"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
