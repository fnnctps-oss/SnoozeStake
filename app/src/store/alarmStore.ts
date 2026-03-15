import { create } from 'zustand';
import { Alarm } from '../types';

interface AlarmState {
  alarms: Alarm[];
  setAlarms: (alarms: Alarm[]) => void;
  addAlarm: (alarm: Alarm) => void;
  updateAlarm: (id: string, updates: Partial<Alarm>) => void;
  removeAlarm: (id: string) => void;
  toggleAlarm: (id: string) => void;
}

export const useAlarmStore = create<AlarmState>((set) => ({
  alarms: [],
  setAlarms: (alarms) => set({ alarms }),
  addAlarm: (alarm) => set((state) => ({ alarms: [...state.alarms, alarm] })),
  updateAlarm: (id, updates) =>
    set((state) => ({
      alarms: state.alarms.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    })),
  removeAlarm: (id) =>
    set((state) => ({ alarms: state.alarms.filter((a) => a.id !== id) })),
  toggleAlarm: (id) =>
    set((state) => ({
      alarms: state.alarms.map((a) =>
        a.id === id ? { ...a, isEnabled: !a.isEnabled } : a
      ),
    })),
}));
