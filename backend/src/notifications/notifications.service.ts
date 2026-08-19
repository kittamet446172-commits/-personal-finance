import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import * as crypto from 'crypto'
import * as https from 'https'
import * as webPush from 'web-push'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)

  constructor(private readonly prisma: PrismaService) {
    const pub = process.env.VAPID_PUBLIC_KEY ?? ''
    const priv = process.env.VAPID_PRIVATE_KEY ?? ''
    this.logger.log(`VAPID pub len=${pub.length} priv len=${priv.length}`)
  }

  getVapidPublicKey() {
    return { publicKey: process.env.VAPID_PUBLIC_KEY }
  }

  async subscribe(
    userId: string,
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  ) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    })
    return { ok: true }
  }

  async unsubscribe(userId: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { userId } })
    return { ok: true }
  }

  // 20:00 Thailand (UTC+7) = 13:00 UTC
  @Cron('0 13 * * *')
  async sendDailyReminder() {
    const subscriptions = await this.prisma.pushSubscription.findMany({
      include: { user: true },
    })
    this.logger.log(`Daily reminder: ${subscriptions.length} subscription(s)`)
    if (subscriptions.length === 0) return

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)

    for (const sub of subscriptions) {
      const count = await this.prisma.transaction.count({
        where: {
          userId: sub.userId,
          date: { gte: startOfDay, lt: endOfDay },
        },
      })
      this.logger.log(`User ${sub.userId}: ${count} transaction(s) today`)

      if (count === 0) {
        await this.sendPush(sub, {
          title: 'Finance Reminder',
          body: 'วันนี้ยังไม่ได้บันทึกรายรับ-รายจ่ายเลยนะ',
        })
      }
    }
  }

  private createVapidJwt(audience: string): string {
    const header = Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })).toString('base64url')
    const now = Math.floor(Date.now() / 1000)
    const claims = Buffer.from(JSON.stringify({
      aud: audience,
      exp: now + 3600,
      sub: `mailto:${process.env.VAPID_EMAIL}`,
    })).toString('base64url')

    const sigInput = `${header}.${claims}`
    const privBytes = Buffer.from(process.env.VAPID_PRIVATE_KEY!.trim(), 'base64url')

    // Wrap raw P-256 private key into PKCS8 DER
    const pkcs8 = Buffer.concat([
      Buffer.from('308141020100301306072a8648ce3d020106082a8648ce3d030107042730250201010420', 'hex'),
      privBytes,
    ])

    const key = crypto.createPrivateKey({ key: pkcs8, format: 'der', type: 'pkcs8' })
    const sign = crypto.createSign('SHA256')
    sign.update(sigInput)
    const der = sign.sign(key)

    // Convert DER signature → raw R||S (IEEE P1363 / ES256 format)
    let pos = 0
    pos++ // skip 0x30 (SEQUENCE)
    if (der[pos] & 0x80) pos += (der[pos] & 0x7f) + 1; else pos++
    pos++ // skip 0x02 (INTEGER tag)
    const rLen = der[pos++]
    const rRaw = der.slice(pos, pos + rLen); pos += rLen
    pos++ // skip 0x02 (INTEGER tag)
    const sLen = der[pos++]
    const sRaw = der.slice(pos, pos + sLen)

    const r = Buffer.alloc(32, 0)
    const s = Buffer.alloc(32, 0)
    const rStripped = rRaw[0] === 0x00 ? rRaw.slice(1) : rRaw
    const sStripped = sRaw[0] === 0x00 ? sRaw.slice(1) : sRaw
    rStripped.copy(r, 32 - rStripped.length)
    sStripped.copy(s, 32 - sStripped.length)

    return `${sigInput}.${Buffer.concat([r, s]).toString('base64url')}`
  }

  private async sendApplePush(
    endpoint: string,
    p256dh: string,
    auth: string,
    payload: { title: string; body: string },
  ): Promise<void> {
    const url = new URL(endpoint)
    const audience = `${url.protocol}//${url.host}`
    const jwt = this.createVapidJwt(audience)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const encrypted = (webPush as any).encrypt(p256dh, auth, JSON.stringify(payload), 'aes128gcm') as {
      cipherText: Buffer
    }

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: url.hostname,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'aes128gcm',
            'Content-Length': encrypted.cipherText.length,
            TTL: '3600',
            Authorization: `vapid t=${jwt},k=${process.env.VAPID_PUBLIC_KEY}`,
          },
        },
        (res) => {
          let body = ''
          res.on('data', (d) => { body += d })
          res.on('end', () => {
            if (res.statusCode && res.statusCode < 300) resolve()
            else reject({ statusCode: res.statusCode, body })
          })
        },
      )
      req.on('error', reject)
      req.write(encrypted.cipherText)
      req.end()
    })
  }

  private async sendPush(
    sub: { endpoint: string; p256dh: string; auth: string },
    payload: { title: string; body: string },
  ) {
    const isApple = sub.endpoint.includes('web.push.apple.com')
    try {
      if (isApple) {
        await this.sendApplePush(sub.endpoint, sub.p256dh, sub.auth, payload)
      } else {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
          {
            vapidDetails: {
              subject: `mailto:${process.env.VAPID_EMAIL}`,
              publicKey: process.env.VAPID_PUBLIC_KEY!,
              privateKey: process.env.VAPID_PRIVATE_KEY!,
            },
            TTL: 3600,
          },
        )
      }
      this.logger.log(`Push sent [${isApple ? 'apple' : 'fcm'}] to ${sub.endpoint.slice(0, 40)}...`)
    } catch (err) {
      const e = err as { statusCode?: number; body?: string }
      this.logger.error(`Push failed [${e.statusCode}] body=${e.body} for ${sub.endpoint.slice(0, 40)}...`)
      if (e.statusCode === 410 || e.statusCode === 404) {
        await this.prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } })
      }
    }
  }
}
