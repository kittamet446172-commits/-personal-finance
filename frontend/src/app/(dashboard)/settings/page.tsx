'use client'

import { useRef, useState, useEffect } from 'react'
import { Bell, Camera, KeyRound, Lock, ShieldCheck } from 'lucide-react'
import { usePushNotification } from '@/hooks/use-push-notification'
import { useSession } from '@/lib/auth-client'
import { authClient } from '@/lib/auth-client'
import { isPinSet, setPin, removePin, setSessionUnlocked } from '@/lib/pin'
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
  const { isSupported, isSubscribed, loading: pushLoading, error: pushError, subscribe, unsubscribe } = usePushNotification()
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

  const [pinExists, setPinExists] = useState(false)
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinLoading, setPinLoading] = useState(false)
  const [pinSuccess, setPinSuccess] = useState('')
  const [pinError, setPinError] = useState('')

  useEffect(() => {
    setPinExists(isPinSet())
  }, [])

  async function handleSetPin(e: React.FormEvent) {
    e.preventDefault()
    setPinError('')
    setPinSuccess('')
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      setPinError('PIN ต้องเป็นตัวเลข 6 หลัก')
      return
    }
    if (newPin !== confirmPin) {
      setPinError('PIN ไม่ตรงกัน')
      return
    }
    setPinLoading(true)
    await setPin(newPin)
    setSessionUnlocked()
    setPinExists(true)
    setNewPin('')
    setConfirmPin('')
    setPinSuccess(pinExists ? 'เปลี่ยน PIN เรียบร้อยแล้ว' : 'ตั้ง PIN เรียบร้อยแล้ว')
    setPinLoading(false)
  }

  function handleRemovePin() {
    removePin()
    setPinExists(false)
    setPinSuccess('ลบ PIN เรียบร้อยแล้ว')
    setNewPin('')
    setConfirmPin('')
  }

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwSuccess(false)
    setPwError('')
    if (newPassword !== confirmPassword) {
      setPwError('รหัสผ่านใหม่ไม่ตรงกัน')
      return
    }
    if (newPassword.length < 8) {
      setPwError('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }
    setPwLoading(true)
    try {
      const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: false })
      if (result.error) {
        setPwError('รหัสผ่านเดิมไม่ถูกต้อง')
      } else {
        setPwSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setPwError('เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setPwLoading(false)
    }
  }

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
              <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
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
            <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5"><Lock className="h-5 w-5 text-primary" />รหัส PIN</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pinSuccess && (
            <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-md">{pinSuccess}</p>
          )}
          {pinError && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{pinError}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {pinExists ? 'ตั้ง PIN ไว้แล้ว — เปิดแอปครั้งใหม่จะต้องกรอก PIN' : 'ตั้ง PIN เพื่อล็อกแอปทุกครั้งที่เปิด'}
          </p>
          <form onSubmit={handleSetPin} className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="newPin">{pinExists ? 'PIN ใหม่' : 'PIN'} (6 หลัก)</Label>
              <Input
                id="newPin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPin">ยืนยัน PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={pinLoading}>
                {pinLoading ? 'กำลังบันทึก...' : pinExists ? 'เปลี่ยน PIN' : 'ตั้ง PIN'}
              </Button>
              {pinExists && (
                <Button type="button" variant="outline" onClick={handleRemovePin}>
                  ลบ PIN
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {isSupported && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5"><Bell className="h-5 w-5 text-primary" />แจ้งเตือนรายวัน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isSubscribed
                ? 'เปิดแจ้งเตือนอยู่ — ระบบจะส่ง notification เวลา 09:00 และ 20:00 ถ้าวันนั้นยังไม่ได้บันทึกรายการ'
                : 'เปิดเพื่อรับแจ้งเตือนทุกวัน 09:00 และ 20:00 ถ้ายังไม่ได้บันทึกรายรับ-รายจ่าย'}
            </p>
            {pushError && (
              <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-md">{pushError}</p>
            )}
            <div className="flex gap-2">
              <Button
                onClick={isSubscribed ? unsubscribe : subscribe}
                disabled={pushLoading}
                variant={isSubscribed ? 'outline' : 'default'}
              >
                {pushLoading ? 'กำลังดำเนินการ...' : isSubscribed ? 'ปิดแจ้งเตือน' : 'เปิดแจ้งเตือน'}
              </Button>
              {isSubscribed && (
                <Button variant="outline" onClick={() => api.post('/notifications/test-send', {})}>
                  ทดสอบ
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5"><KeyRound className="h-5 w-5 text-primary" />เปลี่ยนรหัสผ่าน</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {pwSuccess && (
              <p className="text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-md">
                เปลี่ยนรหัสผ่านเรียบร้อยแล้ว
              </p>
            )}
            {pwError && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
                {pwError}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">รหัสผ่านเดิม</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="อย่างน้อย 8 ตัวอักษร"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={pwLoading || !currentPassword || !newPassword || !confirmPassword}>
              {pwLoading ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
