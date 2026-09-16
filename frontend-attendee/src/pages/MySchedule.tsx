import React from 'react';
import { Bell, BellOff, BellRing, AlertTriangle, Trash2, CalendarClock } from 'lucide-react';
import { useSchedule } from '../context/ScheduleContext';
import type { ScheduleSlot } from '../utils/schedule';
import { ALARM_OPTIONS, FESTIVAL_DAY_NAMES, getSlotRange, slotsOverlap } from '../utils/schedule';

const FESTIVAL_DAYS = [1, 2, 3, 4];

export const MySchedule: React.FC = () => {
  const { slots, loading, currentFestivalDay, removeSlot, updateAlarm, notificationPermission, requestNotificationPermission } =
    useSchedule();

  const clashingIds = new Set<number>();
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (slotsOverlap(slots[i], slots[j])) {
        clashingIds.add(slots[i].id);
        clashingIds.add(slots[j].id);
      }
    }
  }

  const getClashNames = (slot: ScheduleSlot): string[] =>
    slots.filter((other) => other.id !== slot.id && slotsOverlap(slot, other)).map((other) => other.artistName);

  const slotsForDay = (day: number): ScheduleSlot[] =>
    slots.filter((s) => s.festivalDay === day).sort((a, b) => getSlotRange(a)[0] - getSlotRange(b)[0]);

  return (
    <main className="flex-grow pt-[100px] md:pt-[120px] pb-xl px-margin-mobile md:px-margin-desktop animate-fade-in">
      {/* Hero */}
      <section className="mb-xl text-center md:text-left">
        <h1 className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl uppercase text-primary mb-md text-glow">
          My Schedule
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto md:mx-0">
          Concertele salvate din Lineup, organizate pe zilele festivalului. Vei primi o alertă cu
          sunet — și, dacă permiți, o notificare de browser — înainte ca fiecare concert din ziua
          curentă să înceapă.
        </p>

        <div className="mt-6 flex justify-center md:justify-start">
          {notificationPermission === 'granted' && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-tertiary/40 bg-tertiary/10 text-tertiary font-label-sm text-label-sm uppercase tracking-widest">
              <BellRing className="w-4 h-4" />
              Notificări active
            </span>
          )}
          {notificationPermission === 'denied' && (
            <div className="flex flex-col items-center md:items-start gap-2">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-error/40 bg-error/10 text-error font-label-sm text-label-sm uppercase tracking-widest">
                <BellOff className="w-4 h-4" />
                Notificări blocate din browser
              </span>
              <p className="font-body-md text-xs text-white/40 max-w-md">
                Pentru a le debloca: apasă pe iconița de lacăt de lângă adresa site-ului → Permisiuni →
                Notificări → Permite, apoi reîncarcă pagina. Alerta sonoră funcționează oricum, chiar și
                fără notificări.
              </p>
            </div>
          )}
          {notificationPermission === 'default' && (
            <button
              onClick={requestNotificationPermission}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/50 bg-primary/10 text-primary font-label-sm text-label-sm uppercase tracking-widest hover:bg-primary/20 transition-colors"
            >
              <Bell className="w-4 h-4" />
              Activează notificările
            </button>
          )}
        </div>
      </section>

      {/* Timeline pe zile */}
      {loading ? (
        <section className="glass-panel rounded-3xl border border-white/10 p-12 text-center">
          <div className="w-10 h-10 mx-auto border-4 border-t-tertiary border-primary/20 rounded-full animate-spin mb-4" />
          <p className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">Se încarcă programul...</p>
        </section>
      ) : slots.length === 0 ? (
        <section className="glass-panel rounded-3xl border border-white/10 p-12 md:p-16 text-center max-w-3xl shadow-[0_0_20px_rgba(255,255,255,0.1)]">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6 border border-primary/20 shadow-[0_0_20px_rgba(112,0,255,0.2)]">
            <CalendarClock className="w-9 h-9 text-primary" />
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white mb-3 uppercase tracking-tight">Niciun concert salvat</h2>
          <p className="font-body-md text-white/60 max-w-md mx-auto">
            Deschide pagina Lineup și apasă „Add to Schedule" la artiștii pe care nu vrei să-i ratezi.
          </p>
        </section>
      ) : (
        <section className="space-y-10 max-w-4xl">
          {FESTIVAL_DAYS.map((day) => {
            const daySlots = slotsForDay(day);
            const isToday = currentFestivalDay === day;

            return (
              <div key={day}>
                {/* Day header */}
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`flex items-center gap-3 px-5 py-2.5 rounded-full border-2 font-label-sm text-label-sm uppercase tracking-widest transition-all ${
                      isToday
                        ? 'border-tertiary text-tertiary bg-tertiary/10 shadow-[0_0_15px_rgba(0,219,233,0.3)]'
                        : 'border-outline-variant text-on-surface-variant glass-panel'
                    }`}
                  >
                    <CalendarClock className="w-4 h-4" />
                    Ziua {day} · {FESTIVAL_DAY_NAMES[day]}
                    {isToday && (
                      <span className="flex items-center gap-1.5 ml-1 pl-3 border-l border-tertiary/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
                        Astăzi
                      </span>
                    )}
                  </div>
                  <div className={`flex-grow h-px ${isToday ? 'bg-gradient-to-r from-tertiary/50 to-transparent' : 'bg-white/5'}`} />
                </div>

                {/* Slots */}
                {daySlots.length === 0 ? (
                  <p className="font-body-md text-sm text-white/30 pl-5">Niciun concert salvat pentru această zi.</p>
                ) : (
                  <div className="space-y-3">
                    {daySlots.map((slot) => {
                      const isClashing = clashingIds.has(slot.id);
                      const clashNames = isClashing ? getClashNames(slot) : [];

                      return (
                        <article
                          key={slot.id}
                          className={`glass-panel rounded-2xl border p-5 transition-all duration-300 ${
                            isClashing
                              ? 'border-red-500 animate-pulse'
                              : 'border-white/10 hover:border-primary/40 shadow-[0_0_20px_rgba(255,255,255,0.06)] hover:shadow-[0_0_25px_rgba(209,188,255,0.15)]'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4 min-w-0">
                              <div className="flex flex-col items-center justify-center px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                                <span className="font-mono text-sm font-bold text-white tracking-wider tabular-nums">{slot.startTime}</span>
                                <span className="font-mono text-[10px] text-white/40 tabular-nums">{slot.endTime}</span>
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-headline-lg-mobile text-lg md:text-xl uppercase text-white truncate group-hover:text-primary">
                                  {slot.artistName}
                                </h3>
                                <p className="font-label-sm text-[11px] uppercase tracking-widest text-tertiary">{slot.stageName}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                                <Bell className={`w-4 h-4 ${slot.alarmOffset > 0 ? 'text-tertiary' : 'text-white/30'}`} />
                                <select
                                  value={slot.alarmOffset}
                                  onChange={(e) => updateAlarm(slot.id, Number(e.target.value))}
                                  className="bg-transparent font-label-sm text-xs text-white/80 focus:outline-none cursor-pointer [&>option]:bg-surface-container-high"
                                >
                                  {ALARM_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <button
                                onClick={() => removeSlot(slot.id)}
                                className="p-2.5 rounded-xl border border-white/10 text-white/40 hover:text-error hover:border-error/50 hover:bg-error/10 transition-all active:scale-90"
                                aria-label={`Șterge ${slot.artistName}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {isClashing && (
                            <div className="mt-4 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-error/10 border border-error/40">
                              <AlertTriangle className="w-4 h-4 text-error shrink-0" />
                              <p className="font-label-sm text-xs uppercase tracking-wider text-error">
                                Suprapunere orară cu {clashNames.join(', ')}
                              </p>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
};
