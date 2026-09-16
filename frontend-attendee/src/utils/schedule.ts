export interface ScheduleSlot {
  id: number;
  artistName: string;
  stageName: string;
  startTime: string; // "HH:MM", 24h
  endTime: string; // "HH:MM", 24h
  festivalDay: number; // 1-4
  alarmOffset: number; // minutes before start; 0 = no alarm
}

export const FESTIVAL_DAY_NAMES: Record<number, string> = {
  1: 'Joi',
  2: 'Vineri',
  3: 'Sâmbătă',
  4: 'Duminică',
};

export const ALARM_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Fără alarmă' },
  { value: 5, label: '5 min înainte' },
  { value: 10, label: '10 min înainte' },
  { value: 15, label: '15 min înainte' },
  { value: 30, label: '30 min înainte' },
];

// Festival days run past midnight into the early morning; any time before this hour is treated as
// belonging to the previous evening so chronological sorting and overlap/countdown checks stay
// correct across the midnight boundary (e.g. a set from 23:00-00:30, or another starting at 01:00).
export const ROLLOVER_HOUR = 6;

export const toAdjustedMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  const total = hours * 60 + minutes;
  return hours < ROLLOVER_HOUR ? total + 24 * 60 : total;
};

export const getSlotRange = (slot: Pick<ScheduleSlot, 'startTime' | 'endTime'>): [number, number] => {
  const start = toAdjustedMinutes(slot.startTime);
  let end = toAdjustedMinutes(slot.endTime);
  if (end <= start) end += 24 * 60; // performance itself crosses midnight
  return [start, end];
};

export const slotsOverlap = (a: ScheduleSlot, b: ScheduleSlot): boolean => {
  if (a.festivalDay !== b.festivalDay) return false; // only same-day performances can clash
  const [aStart, aEnd] = getSlotRange(a);
  const [bStart, bEnd] = getSlotRange(b);
  return aStart < bEnd && bStart < aEnd;
};
