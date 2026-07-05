import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getMeta, setMeta } from '@/lib/db/database';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export type NotificationPrefKey = 'kisti' | 'lowStock' | 'dayClose';

const META_KEYS: Record<NotificationPrefKey, string> = {
  kisti: 'notify_kisti',
  lowStock: 'notify_low_stock',
  dayClose: 'notify_day_close',
};

export async function getNotificationPref(key: NotificationPrefKey): Promise<boolean> {
  try {
    const v = await getMeta(META_KEYS[key]);
    return v !== 'false';
  } catch {
    return true;
  }
}

export async function setNotificationPref(key: NotificationPrefKey, enabled: boolean) {
  try {
    await setMeta(META_KEYS[key], enabled ? 'true' : 'false');
  } catch {
    // web / no sqlite
  }
  if (enabled && key === 'dayClose' && Platform.OS !== 'web') {
    await scheduleDayCloseReminder().catch(() => {});
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}

export async function scheduleKistiReminder(title: string, body: string, triggerDate: Date) {
  if (Platform.OS === 'web') return;
  if (!(await getNotificationPref('kisti'))) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body, sound: true },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });
}

export async function scheduleDayCloseReminder(hour = 21) {
  if (Platform.OS === 'web') return;
  if (!(await getNotificationPref('dayClose'))) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'দিন শেষের হিসাব',
      body: 'আজকের ক্যাশ মিলিয়ে নিন',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute: 0,
    },
  });
}

export async function scheduleLowStockAlert(productName: string) {
  if (Platform.OS === 'web') return;
  if (!(await getNotificationPref('lowStock'))) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'স্টক কম',
      body: `${productName} — স্টক কম, অর্ডার দিন`,
    },
    trigger: null,
  });
}
