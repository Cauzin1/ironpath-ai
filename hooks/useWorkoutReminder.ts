import { useState, useEffect, useRef } from 'react';

const STORAGE_KEY = 'ironpath_reminder';

export interface ReminderConfig {
  enabled: boolean;
  time: string; // "HH:MM"
}

function getLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useWorkoutReminder(completedDates: string[]) {
  const isSupported = typeof window !== 'undefined' && 'Notification' in window;

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (!isSupported) return 'denied';
    return Notification.permission;
  });

  const [config, setConfig] = useState<ReminderConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : { enabled: false, time: '18:00' };
    } catch {
      return { enabled: false, time: '18:00' };
    }
  });

  // Keep a ref so the scheduled timeout can access the latest completedDates
  const completedDatesRef = useRef(completedDates);
  useEffect(() => {
    completedDatesRef.current = completedDates;
  }, [completedDates]);

  // Schedule / fire notification
  useEffect(() => {
    if (!isSupported || !config.enabled || permission !== 'granted') return;

    const today = getLocalDate();
    const trainedToday = completedDates.includes(today);
    if (trainedToday) return;

    // Avoid showing duplicate notifications on the same day
    const shownKey = `ironpath_notif_${today}`;
    if (localStorage.getItem(shownKey)) return;

    const [h, m] = config.time.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return;

    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(h, m, 0, 0);

    const showNotification = () => {
      try {
        new Notification('IronPath AI 💪', {
          body: 'Você ainda não treinou hoje. Vamos lá!',
          icon: '/icons/icon-192.png',
          tag: 'workout-reminder',
        });
        localStorage.setItem(`ironpath_notif_${getLocalDate()}`, '1');
      } catch (err) {
        console.warn('Notificação não suportada:', err);
      }
    };

    if (now >= reminderTime) {
      showNotification();
    } else {
      const ms = reminderTime.getTime() - now.getTime();
      const id = setTimeout(() => {
        const todayNow = getLocalDate();
        if (!completedDatesRef.current.includes(todayNow)) {
          showNotification();
        }
      }, ms);
      return () => clearTimeout(id);
    }
  // completedDates is intentionally omitted: re-scheduling on every set-toggle
  // would cause duplicate notification attempts. The ref handles the latest state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, permission, isSupported]);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch {
      return 'denied';
    }
  };

  const saveConfig = (newConfig: ReminderConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
  };

  return { permission, config, requestPermission, saveConfig, isSupported };
}
