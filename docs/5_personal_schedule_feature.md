# Volume 5: Personal Schedule Feature
## Persistent per-user festival schedule, clash detection, day organization & alarm notifications

This document describes how the **"My Schedule"** feature is implemented end-to-end: a persistent,
per-user, per-account list of saved performances, organized by festival day, with time-overlap
("clash") detection and a local alarm (sound + browser notification) before each set starts.

---

## 1. Feature Summary

An attendee can, from the **Lineup** page, save any performance to their personal schedule with one
click. The **My Schedule** page (`/my-schedule`) then shows everything they've saved, grouped by
festival day (Day 1–4), with the current festival day visually highlighted. If two saved
performances overlap in time on the same day, both are flagged. Each saved slot has its own
configurable alarm offset (0/5/10/15/30 minutes before start); when a slot's start time is
within its offset **and** it's happening on today's festival day, the browser plays an alert sound
and (if permission was granted) shows a system notification.

The schedule is **persisted server-side**, tied to the logged-in user's account (not local
browser storage), so it survives across devices and sessions as long as the user is logged in.

---

## 2. Backend (Spring Boot)

### 2.1 Database

`V8__create_personal_schedule_table.sql` creates the table; `V9__add_schedule_festival_day.sql`
later adds the day column.

```sql
CREATE TABLE personal_schedule (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    stage_name VARCHAR(255) NOT NULL,
    start_time VARCHAR(5) NOT NULL,   -- "HH:MM", no date component
    end_time VARCHAR(5) NOT NULL,
    alarm_offset INT NOT NULL DEFAULT 10,
    CONSTRAINT fk_personal_schedule_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX idx_personal_schedule_user_id ON personal_schedule (user_id);

-- V9
ALTER TABLE personal_schedule ADD COLUMN festival_day INT NOT NULL DEFAULT 1;
```

`start_time`/`end_time` are stored as plain `"HH:MM"` strings rather than timestamps: a saved
performance isn't tied to a specific calendar date, only to a time-of-day within one of the
festival's 4 days (`festival_day`, 1–4).

### 2.2 Entity & Repository

- `model/PersonalSchedule.java` — JPA entity, `@ManyToOne` to `User` (lazy fetch, `ON DELETE CASCADE`
  at the DB level so deleting a user cleans up their schedule automatically).
- `repository/PersonalScheduleRepository.java` — `findAllByUserId(Long userId)`.

### 2.3 REST API

All endpoints live under `/api/my-schedule` in `controller/PersonalScheduleController.java`:

| Method | Path | Body / Params | Behavior |
|---|---|---|---|
| `GET` | `/api/my-schedule` | — | Returns only the logged-in user's slots |
| `POST` | `/api/my-schedule` | `{ artistName, stageName, startTime, endTime, festivalDay }` | Creates a slot, `alarmOffset` defaults to 10 |
| `PUT` | `/api/my-schedule/{id}/alarm` | `?offset=<int>` | Updates the alarm offset |
| `DELETE` | `/api/my-schedule/{id}` | — | Removes the slot |

A separate, unauthenticated endpoint exposes festival metadata:

| Method | Path | Returns |
|---|---|---|
| `GET` | `/api/festival/current-day` | `{ currentDay: 1-4 or null }` — computed from `festival.start-date` in `application.properties` |

### 2.4 Authentication & Ownership

The whole `/api/**` path is `permitAll` at the Spring Security URL level (a pre-existing project
convention — see `SecurityConfig.java`), so this controller enforces its own auth check rather than
relying on the URL filter chain:

```java
private User resolveUser(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()
            || "anonymousUser".equals(authentication.getName())) {
        return null; // -> caller returns 401
    }
    return userRepository.findByEmail(authentication.getName()).orElse(null);
}
```

`authentication.getName()` is the user's email (set by `JwtAuthenticationFilter` /
`CustomUserDetailsService` from the Bearer token). Every `PUT`/`DELETE` additionally verifies the
target slot's `user.id` matches the caller before mutating it, returning `404` (not `403`, to avoid
confirming that a given slot id exists at all) if it belongs to someone else.

### 2.5 Festival Day Calculation

`TicketService.getCurrentFestivalDay()` (already built for the admin ticket-scanning /
anti-passback feature) is reused here as the single source of truth:

```java
public Integer getCurrentFestivalDay() {
    LocalDate startDate = LocalDate.parse(festivalStartDate); // festival.start-date, e.g. 2026-07-16
    LocalDate today = LocalDate.now(FESTIVAL_ZONE);            // Europe/Bucharest, not container TZ
    long dayOffset = ChronoUnit.DAYS.between(startDate, today) + 1;
    return (dayOffset < 1 || dayOffset > 4) ? null : (int) dayOffset;
}
```

Using one shared method means the admin app's entrance scanning and the attendee's personal
schedule always agree on "what day is it," without duplicating date math.

---

## 3. Frontend (React + TypeScript, `frontend-attendee`)

### 3.1 File Map

| File | Responsibility |
|---|---|
| `src/utils/schedule.ts` | Pure types + logic: `ScheduleSlot`, alarm options, festival day names, midnight-rollover time math, overlap detection |
| `src/context/ScheduleContext.tsx` | Backend sync (fetch + JWT bearer token), CRUD, alarm-polling loop, notification permission |
| `src/pages/Lineup.tsx` | "Add to Schedule" toggle button per artist |
| `src/pages/MySchedule.tsx` | Day-grouped timeline, clash warnings, alarm dropdown, delete |

### 3.2 Data Flow

```
Lineup.tsx (ScheduleToggleButton)
   │  toggleSlot({ artistName, stageName, startTime, endTime, festivalDay })
   ▼
ScheduleContext (useSchedule)
   │  POST/DELETE /api/my-schedule  (Authorization: Bearer <token from AuthContext>)
   ▼
PersonalScheduleController → PersonalScheduleService → PersonalScheduleRepository → Postgres
```

`ScheduleContext` fetches the user's full schedule once on mount (and whenever the auth token
changes) and keeps it in React state; every mutation (add/remove/update alarm) is optimistic-free —
it waits for the API response and then updates local state from the returned/confirmed data, so the
UI never drifts from what's actually persisted.

### 3.3 Midnight-Rollover Time Math

Because sets are stored as bare `"HH:MM"` with no date, a set from `23:00` to `00:30` needs special
handling so it doesn't sort before an `08:00` set or fail to detect an overlap with something
starting at `00:15`. `toAdjustedMinutes()` treats any hour before `06:00` as "belonging to the
previous evening" by adding 24h worth of minutes:

```ts
export const toAdjustedMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  const total = hours * 60 + minutes;
  return hours < ROLLOVER_HOUR ? total + 24 * 60 : total; // ROLLOVER_HOUR = 6
};
```

This same helper is reused for sorting, overlap detection, and the "is it alarm time yet" check
against the current wall-clock time.

### 3.4 Clash Detection

Two slots only clash if they're on the **same festival day** and their adjusted time ranges
intersect:

```ts
export const slotsOverlap = (a: ScheduleSlot, b: ScheduleSlot): boolean => {
  if (a.festivalDay !== b.festivalDay) return false;
  const [aStart, aEnd] = getSlotRange(a);
  const [bStart, bEnd] = getSlotRange(b);
  return aStart < bEnd && bStart < aEnd;
};
```

`MySchedule.tsx` computes the set of clashing slot ids once per render (O(n²) over the user's own
schedule, which is small) and renders a pulsating red border + warning banner naming the conflicting
artist(s) — it never blocks saving an overlapping slot, only warns.

### 3.5 Day-Grouped Timeline & "Today" Highlight

`MySchedule.tsx` renders one section per festival day (1–4), each slot sorted chronologically
within its day. `currentFestivalDay` (fetched once from `GET /api/festival/current-day`) drives the
highlighted "Astăzi" (Today) badge and a glowing border on that day's header — this is the same
number the backend's anti-passback/entrance-scanning logic uses, so "today" always means the same
thing across the whole app.

### 3.6 Alarm: Sound + Notification

A `setInterval` polling loop (every 15s) in `ScheduleContext` checks every slot:

```ts
if (slot.alarmOffset <= 0) return;
if (notifiedIdsRef.current.has(slot.id)) return;
if (currentFestivalDay !== null && slot.festivalDay !== currentFestivalDay) return; // only today's sets ring

const minutesUntilStart = toAdjustedMinutes(slot.startTime) - nowAdjustedMinutes;
if (minutesUntilStart >= 0 && minutesUntilStart <= slot.alarmOffset) {
  notifiedIdsRef.current.add(slot.id); // fire at most once per slot
  playAlertSound();
  if (Notification.permission === 'granted') new Notification(...);
}
```

Two implementation notes worth calling out:

- **A window check, not exact equality.** The alarm fires the first time `minutesUntilStart` falls
  into `[0, alarmOffset]`, rather than only at the exact minute `alarmOffset`. An exact-equality
  check risks silently missing the trigger if a poll tick lands a few seconds off.
- **Sound via Web Audio, not `new Audio(file)`.** There's no bundled notification sound asset in the
  repo; pointing an `Audio` element at a nonexistent file would fail silently (404, no sound). Two
  short sine-wave beeps are synthesized directly via `AudioContext`/`OscillatorNode` instead — this
  guarantees the sound plays with zero external assets to go missing.
- **Notification permission is only ever requested from an explicit user click** (the "Activează
  notificările" button on the My Schedule page), never automatically on page load. Browsers
  penalize permission prompts fired without a user gesture — Chrome/Firefox are prone to silently
  suppressing or auto-blocking them, which then sticks as a permanent `"denied"` state. If the user
  has already blocked notifications at the browser level, the page shows a status badge with plain-
  language unblock instructions; the sound alarm still works regardless, since it doesn't depend on
  notification permission at all.

---

## 4. Known Limitations / Deliberate Trade-offs

- **No exit/attendance link.** The personal schedule is purely a planning tool for the attendee; it
  has no relationship to the admin app's entrance/exit scanning (`EntranceLog`) — a saved slot isn't
  "checked off" by actually attending.
- **Overlap warnings, never blocks.** By design (per product requirement) — festival-goers often
  deliberately plan to catch the start of one set and the end of another.
- **Alarm loop runs while the tab is open.** Like any client-side `setInterval`, it stops if the tab
  is closed or the device sleeps; there's no server-side push notification.
