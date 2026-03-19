import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

interface NotificationSettings {
  enabled: boolean;
  reminderTime: string;
  permissionGranted: boolean;
}

interface NotificationState {
  settings: NotificationSettings;
  loading: boolean;
  checkPermissions: () => Promise<boolean>;
  requestPermissions: () => Promise<boolean>;
  setEnabled: (enabled: boolean) => Promise<void>;
  setReminderTime: (time: string) => Promise<void>;
  scheduleReminder: () => Promise<void>;
  cancelReminder: () => Promise<void>;
  loadSettings: () => Promise<void>;
}

const SETTINGS_KEY = '@notification_settings';

export const useNotificationStore = create<NotificationState>((set, get) => ({
  settings: {
    enabled: false,
    reminderTime: '20:00',
    permissionGranted: false,
  },
  loading: true,

  checkPermissions: async () => {
    if (!Device.isDevice) {
      set(state => ({ settings: { ...state.settings, permissionGranted: false } }));
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    const granted = existingStatus === 'granted';
    set(state => ({ settings: { ...state.settings, permissionGranted: granted } }));
    return granted;
  },

  requestPermissions: async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    const granted = status === 'granted';
    set(state => ({ settings: { ...state.settings, permissionGranted: granted } }));
    return granted;
  },

  setEnabled: async (enabled) => {
    const { settings, scheduleReminder, cancelReminder } = get();
    
    if (enabled && !settings.permissionGranted) {
      const granted = await get().requestPermissions();
      if (!granted) return;
    }

    if (enabled) {
      await scheduleReminder();
    } else {
      await cancelReminder();
    }

    const newSettings = { ...settings, enabled };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    set({ settings: newSettings });
  },

  setReminderTime: async (time) => {
    const { settings, scheduleReminder } = get();
    const newSettings = { ...settings, reminderTime: time };
    
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    set({ settings: newSettings });

    if (settings.enabled) {
      await scheduleReminder();
    }
  },

  scheduleReminder: async () => {
    const { settings } = get();
    
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!settings.enabled) return;

    const [hours, minutes] = settings.reminderTime.split(':').map(Number);
    
    const now = new Date();
    const scheduledDate = new Date();
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Time for your 1%!",
        body: "What did you get better at today?",
        data: { type: 'daily_reminder' },
      },
      trigger: {
        hour: hours,
        minute: minutes,
        repeats: true,
      } as Notifications.DailyTriggerInput,
    });
  },

  cancelReminder: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  loadSettings: async () => {
    set({ loading: true });
    
    const { checkPermissions } = get();
    await checkPermissions();

    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        set({ settings: { ...parsed, permissionGranted: get().settings.permissionGranted }, loading: false });
        
        if (parsed.enabled && parsed.reminderTime) {
          await get().scheduleReminder();
        }
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },
}));
