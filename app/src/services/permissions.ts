import { Pedometer } from 'expo-sensors';
import { requestNotificationPermissions } from './notifications';

export interface PermissionResults {
  notifications: boolean;
  motion: boolean;
}

/**
 * Request all permissions the app needs on first launch.
 * Each permission is requested independently — one failing won't block others.
 */
export async function requestAllPermissions(): Promise<PermissionResults> {
  // 1. Push Notifications
  let notifications = false;
  try {
    notifications = await requestNotificationPermissions();
  } catch (err) {
    console.warn('Failed to request notification permissions:', err);
  }

  // 2. Motion & Activity (Pedometer / Accelerometer)
  let motion = false;
  try {
    const { status } = await Pedometer.requestPermissionsAsync();
    motion = status === 'granted';
  } catch (err) {
    console.warn('Failed to request motion permissions:', err);
  }

  return { notifications, motion };
}
