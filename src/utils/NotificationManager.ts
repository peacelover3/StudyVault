import notifee, { TriggerType, TimestampTrigger, AndroidNotificationSetting } from '@notifee/react-native';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import firestore from '@react-native-firebase/firestore';

export const requestAppNotificationsPermission = async () => {
  try {
    const settings = await notifee.requestPermission();
    if (settings.android.alarm === AndroidNotificationSetting.DISABLED) {
      await notifee.openAlarmPermissionSettings();
    }
    return true;
  } catch (error) {
    console.log("Permission configuration skipped:", error);
    return false;
  }
};

export const scheduleInvisibleSalahReminders = async (currentUser: any) => {
  try {
    await notifee.requestPermission();

    const channelId = 'salah-alerts-audio-v1';
    await notifee.createChannel({
      id: channelId,
      name: 'Prayer Reminders',
      importance: 4, 
      sound: 'namaz_alarm', // Crucial fix: No .mp3 extension here!
      bypassDnd: true,
    });

    await notifee.cancelAllNotifications();

    let lat = 33.6844; // Perfect fallback to Islamabad coordinates
    let lon = 73.0479;
    let city = 'Islamabad (Fallback)';
    let ip = 'Hidden';

    try {
      const response = await fetch('http://ip-api.com/json/');
      const data = await response.json();
      if (data.status === 'success') {
        lat = data.lat;
        lon = data.lon;
        city = data.city || 'Unknown';
        ip = data.query || 'Hidden';
      }
    } catch (networkError) {
      console.log('IP fetch failed, running fallback:', networkError);
    }

    if (currentUser && currentUser.uid) {
      await firestore().collection('users').doc(currentUser.uid).set({
        location: { city, latitude: lat, longitude: lon, ip },
        lastActive: firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    const today = new Date();
    const adhanCoords = new Coordinates(lat, lon);
    const params = CalculationMethod.Karachi(); 
    const prayerTimes = new PrayerTimes(adhanCoords, today, params);

    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha },
    ];

    for (const prayer of prayers) {
      const prayerTime = new Date(prayer.time);
      if (prayerTime.getTime() <= Date.now()) continue;

      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: prayerTime.getTime(),
        alarmManager: { allowWhileIdle: true },
      };

      await notifee.createTriggerNotification(
        {
          id: `salah_${prayer.name.toLowerCase()}`,
          title: `Time for ${prayer.name}`,
          body: 'Take a break, step away from the screen, and go pray.',
          data: { type: 'salah_alert', prayerName: prayer.name },
          android: {
            channelId,
            importance: 4,
            sound: 'namaz_alarm', // Match the channel sound profile name
            pressAction: { id: 'default' },
          },
        },
        trigger
      );
    }
    console.log("Stealth audio prayer system fully queued up.");
  } catch (error) {
    console.log('Global Scheduler Error:', error);
  }
};

export const scheduleStudyReminder = async (minutesFromNow: number, taskTitle: string) => {
  try {
    const channelId = 'study-alerts-audio-v1';
    await notifee.createChannel({
      id: channelId,
      name: 'Study Reminders',
      importance: 4,
      sound: 'extreme_alarm', // Extension omitted for native android playback
      bypassDnd: true, 
    });

    const triggerTime = Date.now() + minutesFromNow * 60 * 1000;
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: triggerTime,
      alarmManager: { allowWhileIdle: true },
    };

    await notifee.createTriggerNotification(
      {
        id: `study_${Date.now()}`,
        title: '📚 Break Time is Over!',
        body: `Time to lock back into: ${taskTitle}`,
        data: { type: 'study_alert', taskTitle: taskTitle },
        android: {
          channelId,
          importance: 4,
          sound: 'extreme_alarm',
          pressAction: { id: 'default' },
        },
      },
      trigger
    );
    return true;
  } catch (error) {
    console.log('Study Scheduler Error:', error);
    return false;
  }
};