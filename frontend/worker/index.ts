self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() ?? {}
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Finance Reminder', {
      body: data.body ?? '',
      icon: '/icon.png',
      badge: '/icon.png',
    })
  )
})

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  event.waitUntil(clients.openWindow('/'))
})
