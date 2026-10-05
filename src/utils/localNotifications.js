import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

export const ATTENDANCE_NOTIFICATION_ID = 900; // ID corresponding to 09:00 AM
const LEGACY_NOTIFICATION_ID = 630; // Previous 06:30 AM ID to clean up

/**
 * Initialize daily attendance reminder (Requirement 44)
 * 1. Request notification permissions (crucial for Android 13+)
 * 2. Clear any existing scheduled reminders to avoid duplicates
 * 3. Schedule a daily repeating local notification exactly at 09:00 AM
 * 4. Notification Title: "Waktunya Absen! ⏰"
 * 5. Notification Body: "Jangan lupa isi kehadiran dan cek jadwal mengajar Anda hari ini."
 */
export const initDailyAttendanceReminder = async () => {
  try {
    const isPluginAvailable = Capacitor.isPluginAvailable('LocalNotifications');

    // Web Fallback if running on regular browser without Capacitor runtime
    if (!isPluginAvailable) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission().catch(() => {});
        }
      }
      return { success: false, reason: 'LocalNotifications plugin not available on this platform' };
    }

    // 1. Request notification permissions (Android 13+ & iOS)
    let permStatus = await LocalNotifications.checkPermissions();
    if (permStatus.display !== 'granted') {
      permStatus = await LocalNotifications.requestPermissions();
    }

    if (permStatus.display !== 'granted') {
      console.warn('Izin notifikasi tidak diberikan oleh pengguna.');
      return { success: false, reason: 'Permission not granted' };
    }

    // 2. Clear any existing scheduled reminders to avoid duplicates
    try {
      const pending = await LocalNotifications.getPending();
      const existingReminders = pending.notifications.filter(
        (n) => n.id === ATTENDANCE_NOTIFICATION_ID || n.id === LEGACY_NOTIFICATION_ID
      );

      if (existingReminders.length > 0) {
        await LocalNotifications.cancel({
          notifications: existingReminders.map((n) => ({ id: n.id })),
        });
      }
    } catch (cancelErr) {
      console.warn('Catatan: Tidak dapat membatalkan notifikasi pending sebelumnya:', cancelErr);
    }

    // Create Notification Channel for Android 8+
    try {
      if (Capacitor.getPlatform() === 'android') {
        await LocalNotifications.createChannel({
          id: 'attendance_reminder_channel',
          name: 'Pengingat Presensi Guru',
          description: 'Notifikasi harian pengingat absen masuk pagi',
          importance: 4, // High priority
          visibility: 1, // Public
          vibration: true,
        });
      }
    } catch (channelErr) {
      console.warn('Catatan: Channel notifikasi Android:', channelErr);
    }

    // 3. Schedule daily repeating local notification exactly at 09:00 AM
    await LocalNotifications.schedule({
      notifications: [
        {
          id: ATTENDANCE_NOTIFICATION_ID,
          title: 'Waktunya Absen! ⏰',
          body: 'Jangan lupa isi kehadiran dan cek jadwal mengajar Anda hari ini.',
          schedule: {
            on: {
              hour: 9,
              minute: 0,
            },
            allowWhileIdle: true,
          },
          channelId: 'attendance_reminder_channel',
          autoCancel: true,
        },
      ],
    });

    console.log('✅ Pengingat absen harian berhasil dijadwalkan setiap 09:00 AM.');
    return { success: true };
  } catch (error) {
    console.error('Gagal menginisialisasi pengingat absen harian:', error);
    return { success: false, error };
  }
};

/**
 * Send an immediate test notification to verify device notifications are working
 */
export const sendTestAttendanceReminder = async () => {
  try {
    const isPluginAvailable = Capacitor.isPluginAvailable('LocalNotifications');

    if (!isPluginAvailable) {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Waktunya Absen! ⏰', {
            body: 'Jangan lupa isi kehadiran dan cek jadwal mengajar Anda hari ini.',
          });
          return { success: true, platform: 'web' };
        }
      }
      return { success: false, reason: 'Plugin not available' };
    }

    // Ensure permissions
    let perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      perm = await LocalNotifications.requestPermissions();
    }

    if (perm.display !== 'granted') {
      return { success: false, reason: 'Permission denied' };
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: 999, // Test ID
          title: 'Waktunya Absen! ⏰',
          body: 'Jangan lupa isi kehadiran dan cek jadwal mengajar Anda hari ini.',
          schedule: {
            at: new Date(Date.now() + 1500), // Fire in 1.5 seconds
          },
          channelId: 'attendance_reminder_channel',
          autoCancel: true,
        },
      ],
    });

    return { success: true, platform: 'capacitor' };
  } catch (err) {
    console.error('Error sending test notification:', err);
    return { success: false, error: err };
  }
};
