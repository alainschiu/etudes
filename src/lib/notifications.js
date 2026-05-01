const LS_LAST_REMINDER = 'etudes-lastReminderDate';

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return Notification.requestPermission();
}

export function checkAndSendReminder(settings, totalToday) {
  if (!settings?.reminderEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  const [h, m] = (settings.reminderTime || '18:00').split(':').map(Number);
  const reminderMs = (h || 18) * 3_600_000 + (m || 0) * 60_000;
  const nowMs = now.getHours() * 3_600_000 + now.getMinutes() * 60_000;

  if (nowMs < reminderMs) return;

  const todayStr = now.toISOString().slice(0, 10);
  const lastSent = localStorage.getItem(LS_LAST_REMINDER);
  if (lastSent === todayStr) return;

  localStorage.setItem(LS_LAST_REMINDER, todayStr);
  if (totalToday > 0) return;

  try {
    new Notification('Études', {
      body: 'Your practice journal is waiting.',
      icon: '/web-app-manifest-192x192.png',
      silent: false,
    });
  } catch {}
}
