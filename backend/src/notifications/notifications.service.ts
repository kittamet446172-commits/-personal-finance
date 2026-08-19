import { Injectable, Logger } from '@nestjs/common'
import { Cron } from '@nestjs/schedule'
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

  // 09:00 Thailand (UTC+7) = 02:00 UTC
  @Cron('0 2 * * *')
  async sendMorningReminder() {
    await this.sendDailyReminder('อย่าลืมบันทึกรายรับ-รายจ่ายวันนี้นะ')
  }

  // 20:00 Thailand (UTC+7) = 13:00 UTC
  @Cron('0 13 * * *')
  async sendEveningReminder() {
    await this.sendDailyReminder('วันนี้ยังไม่ได้บันทึกรายรับ-รายจ่ายเลยนะ')
  }

  async sendDailyReminder(body = 'วันนี้ยังไม่ได้บันทึกรายรับ-รายจ่ายเลยนะ') {
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
          body,
        })
      }
    }
  }

  private async sendApplePush(
    endpoint: string,
    p256dh: string,
    auth: string,
    payload: { title: string; body: string },
  ): Promise<void> {
    const details = await webPush.generateRequestDetails(
      { endpoint, keys: { p256dh, auth } },
      JSON.stringify(payload),
      {
        vapidDetails: {
          subject: `mailto:${process.env.VAPID_EMAIL?.trim()}`,
          publicKey: process.env.VAPID_PUBLIC_KEY!,
          privateKey: process.env.VAPID_PRIVATE_KEY!,
        },
        TTL: 3600,
      },
    )

    const url = new URL(endpoint)
    const body = details.body as Buffer

    return new Promise((resolve, reject) => {
      const client = http2.connect(`${url.protocol}//${url.host}`)
      client.on('error', reject)

      const h2Headers: Record<string, string | number> = {
        ':method': 'POST',
        ':path': url.pathname,
        'content-length': body.length,
      }
      for (const [key, value] of Object.entries(details.headers)) {
        h2Headers[key.toLowerCase()] = value
      }

      const req = client.request(h2Headers)
      req.write(body)
      req.end()

      req.on('response', (respHeaders) => {
        const status = respHeaders[':status'] as number
        let respBody = ''
        req.on('data', (d) => { respBody += d })
        req.on('end', () => {
          client.close()
          if (status < 300) resolve()
          else reject({ statusCode: status, body: respBody })
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
      await webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload),
        {
          vapidDetails: {
            subject: `mailto:${process.env.VAPID_EMAIL?.trim()}`,
            publicKey: process.env.VAPID_PUBLIC_KEY!,
            privateKey: process.env.VAPID_PRIVATE_KEY!,
          },
          TTL: 3600,
        },
      )
      if (isApple) { /* noop, just for reference */ }
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
