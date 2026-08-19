import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
import * as crypto from 'crypto'
import * as http2 from 'http2'
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
      iat: now,
      exp: now + 3600,
      sub: `mailto:${process.env.VAPID_EMAIL?.trim()}`,
    })).toString('base64url')

    const sigInput = `${header}.${claims}`

    const pubBytes = Buffer.from(process.env.VAPID_PUBLIC_KEY!.trim(), 'base64url')
    const privBytes = Buffer.from(process.env.VAPID_PRIVATE_KEY!.trim(), 'base64url')
    const key = crypto.createPrivateKey({
      key: {
        kty: 'EC',
        crv: 'P-256',
        x: pubBytes.slice(1, 33).toString('base64url'),
        y: pubBytes.slice(33, 65).toString('base64url'),
        d: privBytes.toString('base64url'),
      },
      format: 'jwk',
    })

    const sig = crypto.sign('SHA256', Buffer.from(sigInput), { key, dsaEncoding: 'ieee-p1363' })
    const jwt = `${sigInput}.${sig.toString('base64url')}`
    this.logger.log(`JWT claims: ${Buffer.from(claims, 'base64url').toString()}`)
    this.logger.log(`JWT sig len: ${sig.length}`)
    return jwt
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
      const client = http2.connect(`${url.protocol}//${url.host}`)
      client.on('error', reject)

      const req = client.request({
        ':method': 'POST',
        ':path': url.pathname,
        'content-type': 'application/octet-stream',
        'content-encoding': 'aes128gcm',
        'ttl': '3600',
        'content-length': String(encrypted.cipherText.length),
        'authorization': `vapid t=${jwt},k=${process.env.VAPID_PUBLIC_KEY}`,
      })

      req.write(encrypted.cipherText)
      req.end()

      req.on('response', (headers) => {
        const status = headers[':status'] as number
        let body = ''
        req.on('data', (d) => { body += d })
        req.on('end', () => {
          client.close()
          if (status < 300) resolve()
          else reject({ statusCode: status, body })
        })
      })

      req.on('error', (err) => { client.close(); reject(err) })
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
