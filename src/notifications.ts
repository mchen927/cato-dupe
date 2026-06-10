import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

/**
 * Notification module — makes the phone actually buzz.
 *
 * expo-notifications handles all the OS-level stuff:
 *   - Requesting permission (iOS requires explicit user consent)
 *   - Scheduling a notification for a future time
 *   - Cancelling a scheduled notification
 *
 * On web, notifications are silently skipped (no crash, just no-ops).
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowInForeground: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  if (!Device.isDevice) {
    console.log('[notif] Simulator detected — notifications may not work');
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Schedule a notification for a task.
 * Returns the notification identifier (used to cancel later).
 *
 * - fixedTime tasks: notify at the exact due time
 * - deadline tasks: notify 30 minutes before the deadline
 *
 * If the due time is in the past, skip scheduling.
 */
export async function scheduleTaskNotification(
  title: string,
  dueAt: number,
  type: 'deadline' | 'fixedTime',
  lang: 'en' | 'zh' = 'en',
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const nudgeMs = type === 'deadline' ? 30 * 60 * 1000 : 0;
  const triggerTime = dueAt - nudgeMs;
  const now = Date.now();

  if (triggerTime <= now) {
    console.log('[notif] Due time is in the past, skipping');
    return null;
  }

  const secondsFromNow = Math.floor((triggerTime - now) / 1000);

  const body = lang === 'zh'
    ? `🐱 喵～该做这件事了！`
    : `🐱 Meow~ time for this!`;

  const subtitle = type === 'deadline' && nudgeMs > 0
    ? (lang === 'zh' ? '30分钟后截止' : 'Due in 30 minutes')
    : undefined;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🐾 ${title}`,
        body,
        subtitle,
        sound: 'default',
        data: { type: 'task-reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: secondsFromNow,
        repeats: false,
      },
    });

    console.log(`[notif] Scheduled "${title}" in ${secondsFromNow}s (id: ${id})`);
    return id;
  } catch (e) {
    console.warn('[notif] Failed to schedule:', e);
    return null;
  }
}

export async function cancelNotification(notifyId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notifyId);
    console.log(`[notif] Cancelled notification ${notifyId}`);
  } catch (e) {
    console.warn('[notif] Failed to cancel:', e);
  }
}
