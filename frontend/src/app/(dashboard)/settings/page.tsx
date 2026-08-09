'use client'

import { useRef, useState, useEffect } from 'react'
import { Camera, ShieldCheck } from 'lucide-react'
import { useSession } from '@/lib/auth-client'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAccounts } from '@/hooks/use-accounts'
import { useUserSettings, useUpsertUserSettings } from '@/hooks/use-user-settings'
import { formatCurrency } from '@/lib/utils'

export default function SettingsPage() {
  const { data: session, refetch } = useSession()
  const [name, setName] = useState(session?.user.name ?? '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: accounts = [] } = useAccounts()
  const { data: settings } = useUserSettings()
  const upsertSettings = useUpsertUserSettings()
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [salaryInput, setSalaryInput] = useState('')
  const [efSuccess, setEfSuccess] = useState(false)

  useEffect(() => {
    if (settings) {
      setSelectedAccountId(settings.emergencyFundAccountId ?? '')
      setSalaryInput(settings.monthlySalary?.toString() ?? '')
    }
  }, [settings])

  function saveEfSettings() {
    setEfSuccess(false)
    upsertSettings.mutate(
      {
        emergencyFundAccountId: selectedAccountId || null,
        monthlySalary: salaryInput ? Number(salaryInput) : undefined,
      },
      { onSuccess: () => setEfSuccess(true) },
    )
  }

  const userImage = (session?.user as { image?: string | null })?.image

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarLoading(true)
    setAvatarError('')
    try {
      const formData = new FormData()
      formData.append('avatar', file)
      await api.upload('/users/me/avatar', formData)
      await refetch()
    } catch {
      setAvatarError('อัปโหลดไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setAvatarLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)
    setError('')
    try {
      await api.patch('/users/me', { name })
      await refetch()
      setSuccess(true)
    } catch {
      setError('บันทึกไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">ตั้งค่า</h1>

      <Card>
        <CardHeader>
          <CardTitle>รูปโปรไฟล์</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer"
              disabled={avatarLoading}
            >
              {userImage ? (
                <img
                  src={userImage}
                  alt="avatar"
                  className="h-20 w-20 rounded-full object-cover border"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-2xl font-medium text-primary-foreground">
                  {session?.user.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </button>

            <div>
              <p className="text-sm font-medium">คลิกที่รูปเพื่อเปลี่ยน</p>
              <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP · สูงสุด 5MB</p>
              {avatarLoading && (
                <p className="text-xs text-muted-foreground mt-1">กำลังอัปโหลด...</p>
              )}
              {avatarError && (
                <p className="text-xs text-destructive mt-1">{avatarError}</p>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ข้อมูลส่วนตัว</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
                บันทึกเรียบร้อยแล้ว
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {error}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label>อีเมล</Label>
              <Input value={session?.user.email ?? ''} disabled />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5"><ShieldCheck className="h-5 w-5 text-primary" />เงินสำรองฉุกเฉิน</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {efSuccess && (
            <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-md">
              บันทึกเรียบร้อยแล้ว
            </p>
          )}
          <div className="space-y-2">
            <Label>บัญชีเงินสำรอง</Label>
            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="เลือกบัญชี" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({formatCurrency(Number(a.balance))})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>เงินเดือน (บาท)</Label>
            <Input
              type="number"
              placeholder="16500"
              value={salaryInput}
              onChange={(e) => setSalaryInput(e.target.value)}
            />
          </div>
          <Button onClick={saveEfSettings} disabled={upsertSettings.isPending}>
            {upsertSettings.isPending ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
