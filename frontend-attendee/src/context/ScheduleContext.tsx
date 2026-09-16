import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { ScheduleSlot } from '../utils/schedule';
import { toAdjustedMinutes } from '../utils/schedule';

const API_BASE = 'http://localhost:8080/api/my-schedule';
const FESTIVAL_API = 'http://localhost:8080/api/festival/current-day';

export interface AddSlotInput {
  artistName: string;
  stageName: string;
  startTime: string;
  endTime: string;
  festivalDay: number;
}

interface ScheduleContextType {
  slots: ScheduleSlot[];
  loading: boolean;
  currentFestivalDay: number | null; // 1-4, or null outside the festival window
  isScheduled: (artistName: string, stageName: string) => boolean;
  toggleSlot: (entry: AddSlotInput) => Promise<void>;
  removeSlot: (id: number) => Promise<void>;
  updateAlarm: (id: number, offset: number) => Promise<void>;
  notificationPermission: NotificationPermission | 'unsupported';
  requestNotificationPermission: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

const CHECK_INTERVAL_MS = 15_000;

/** Two short ascending beeps synthesized via Web Audio — no external sound asset to 404 on. */
const playAlertSound = () => {
  try {
    const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    [0, 0.28].forEach((delay, i) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = i === 0 ? 880 : 1108.73;
      const startAt = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(0.35, startAt + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.25);
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.26);
    });
  } catch (err) {
    console.warn('Nu s-a putut reda sunetul de alertă', err);
  }
};

const getNowAdjustedMinutes = (): number => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return toAdjustedMinutes(`${hh}:${mm}`);
};

const authHeaders = (token: string | null): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const ScheduleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [slots, setSlots] = useState<ScheduleSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFestivalDay, setCurrentFestivalDay] = useState<number | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission
  );
  const notifiedIdsRef = useRef<Set<number>>(new Set());

  const fetchSchedule = useCallback(async () => {
    if (!token) {
      setSlots([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(API_BASE, { headers: authHeaders(token) });
      if (res.ok) {
        const body = await res.json();
        setSlots(body.data ?? []);
      }
    } catch (err) {
      console.error('Failed to load personal schedule', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // The backend owns festival.start-date, so it decides which day (1-4) "today" is.
  useEffect(() => {
    fetch(FESTIVAL_API)
      .then((res) => (res.ok ? res.json() : null))
      .then((body) => setCurrentFestivalDay(body?.data?.currentDay ?? null))
      .catch((err) => console.warn('Failed to load current festival day', err));
  }, []);

  const addSlot = useCallback(
    async (entry: AddSlotInput) => {
      if (!token) return;
      try {
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: authHeaders(token),
          body: JSON.stringify(entry),
        });
        if (res.ok) {
          const body = await res.json();
          setSlots((prev) => [...prev, body.data]);
        }
      } catch (err) {
        console.error('Failed to add schedule slot', err);
      }
    },
    [token]
  );

  const removeSlot = useCallback(
    async (id: number) => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: authHeaders(token) });
        if (res.ok) {
          setSlots((prev) => prev.filter((s) => s.id !== id));
          notifiedIdsRef.current.delete(id);
        }
      } catch (err) {
        console.error('Failed to remove schedule slot', err);
      }
    },
    [token]
  );

  const isScheduled = useCallback(
    (artistName: string, stageName: string) =>
      slots.some((s) => s.artistName === artistName && s.stageName === stageName),
    [slots]
  );

  const toggleSlot = useCallback(
    async (entry: AddSlotInput) => {
      const existing = slots.find((s) => s.artistName === entry.artistName && s.stageName === entry.stageName);
      if (existing) {
        await removeSlot(existing.id);
      } else {
        await addSlot(entry);
      }
    },
    [slots, addSlot, removeSlot]
  );

  const updateAlarm = useCallback(
    async (id: number, offset: number) => {
      if (!token) return;
      try {
        const res = await fetch(`${API_BASE}/${id}/alarm?offset=${offset}`, {
          method: 'PUT',
          headers: authHeaders(token),
        });
        if (res.ok) {
          setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, alarmOffset: offset } : s)));
        }
      } catch (err) {
        console.error('Failed to update alarm offset', err);
      }
    },
    [token]
  );

  // Only ever called from an explicit user click ("Activează notificările") — browsers suppress or
  // auto-block permission prompts fired without a user gesture, which permanently sticks as "denied".
  const requestNotificationPermission = useCallback(() => {
    if (typeof Notification === 'undefined') return;
    Notification.requestPermission().then(setNotificationPermission);
  }, []);

  // Polls every 15s and fires a sound + browser notification the moment a slot enters its own
  // alarm window, comparing against the current time-of-day. Each slot notifies at most once
  // (tracked in notifiedIdsRef) until it's removed and re-added.
  useEffect(() => {
    const checkUpcomingSlots = () => {
      const nowMinutes = getNowAdjustedMinutes();
      slots.forEach((slot) => {
        if (slot.alarmOffset <= 0) return;
        if (notifiedIdsRef.current.has(slot.id)) return;
        // Only performances happening on today's festival day should ring.
        if (currentFestivalDay !== null && slot.festivalDay !== currentFestivalDay) return;

        const startMinutes = toAdjustedMinutes(slot.startTime);
        const minutesUntilStart = startMinutes - nowMinutes;

        if (minutesUntilStart >= 0 && minutesUntilStart <= slot.alarmOffset) {
          notifiedIdsRef.current.add(slot.id);
          playAlertSound();
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('🎵 Pornește spre scenă!', {
              body: `${slot.artistName} urcă pe ${slot.stageName} în ${slot.alarmOffset} minute!`,
              tag: String(slot.id),
            });
          }
        }
      });
    };

    checkUpcomingSlots();
    const interval = setInterval(checkUpcomingSlots, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [slots, currentFestivalDay]);

  return (
    <ScheduleContext.Provider
      value={{ slots, loading, currentFestivalDay, isScheduled, toggleSlot, removeSlot, updateAlarm, notificationPermission, requestNotificationPermission }}
    >
      {children}
    </ScheduleContext.Provider>
  );
};

export const useSchedule = () => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used within a ScheduleProvider');
  }
  return context;
};
