# Volume 1: Product Overview & Vision
## Untold Ticket & Lineup Manager ("Untold Connect")

This document defines the high-level vision, brand positioning, and user personas for **Untold Connect**—a modern, high-fidelity ticket management and live schedule web application designed specifically for the **UNTOLD Festival**.

---

## 1. Executive Summary
The UNTOLD Festival (Cluj-Napoca, Romania) is one of the world's most renowned electronic music and multi-genre festivals, attracting over 400,000 attendees annually. Currently, festival-goers require a blend of physical tickets, wristbands, and static schedules. 

**Untold Connect** is a unified digital ecosystem featuring two core interfaces:
1. **Mobile Webapp (Android-Optimized)**: A highly-responsive, offline-first Progressive Web App (PWA) tailored for the **User/Client** navigating the crowded festival grounds with spotty internet.
2. **Desktop Webapp**: A feature-rich, dashboard-driven administration suite tailored for the **Organizer** to coordinate artists, stages, ticket types, and dispatch real-time alerts.

---

## 2. Branding & Design Philosophy
We draw direct inspiration from the official **"Beach, Please!"** festival digital experience and merge it with the magical, fantasy-infused identity of **UNTOLD**.

| Aspect | Beach, Please! Inspiration | UNTOLD Integration | "Untold Connect" Hybrid Style |
| :--- | :--- | :--- | :--- |
| **Theme** | Dark-mode, raw, street-art, extreme contrast | Cosmic magic, portals, enchanted forests, stars | **Cosmic Cyber-Magic:** Deep obsidian background, high-contrast neon purple and gold borders, glassmorphic card overlays, glow filters. |
| **Typography** | Bold, heavy, high-impact sans-serif (e.g., Impact, custom grotesque) | Elegant, clean, magical sans-serif (e.g., Outfit, Montserrat) | **Outfit & Space Grotesk:** Sleek, modern, and highly legible on mobile screens, with heavy futuristic titles. |
| **Micro-Interactions** | Snappy, bouncy, energetic card hovers | Smooth, magical, ambient fades and glow-pulses | Bouncy but smooth physics, interactive glowing hover states, and smooth drag-and-drop animations for the schedule. |

### Color Palette (Glow & Obsidian Theme)
*   **Primary Deep Background:** `#03000A` (Obsidian Night)
*   **Secondary Surface:** `#0B081A` (Midnight Dust - semi-transparent glassmorphic)
*   **Accent Magic Purple:** `#8D46FF` (Enchanted Glow - primary CTA)
*   **Accent Cosmic Cyan:** `#00E5FF` (Portal Blue - notification / category tag)
*   **Accent Festival Gold:** `#FFC837` (Luna Gold - VIP states, bought tickets, starred artists)
*   **Border Dark:** `#1F1A3A` (Deep Lavender Border)
*   **Border Glow:** Gradient of `#8D46FF` to `#00E5FF` (Active/Hover states)

---

## 3. Core Problem Statements & Solutions

### Problem 1: Spotty Festival Connectivity (Mobile Web)
*   **Symptom:** Inside Cluj Arena, cellular networks (5G/4G) regularly fail due to high user density. Attendees cannot load their digital tickets or view schedule changes.
*   **Solution:** An **offline-first PWA**. Once loaded, the entire lineup, user schedule, and bought tickets (with encrypted offline QR codes) are stored locally in the browser (`IndexedDB` / `localStorage`). Real-time notification updates are queued and synced using background sync and local push engines when brief windows of signal occur.

### Problem 2: Chaotic Schedule Updates
*   **Symptom:** Artists might be delayed, stages swap, or weather issues occur. Organizers have no direct, high-impact way to alert affected fans immediately.
*   **Solution:** A live organizer broadcast board that matches user timetables. If a user has starred *Alok*, and Alok is delayed by 30 mins, a high-priority local push notification is sent immediately, and their visual personal timeline automatically shifts and highlights the conflict.

### Problem 3: Cluttered Administrative Tools
*   **Symptom:** Festival management tools are often divided across spreadsheets and disjointed ticketing dashboards.
*   **Solution:** A unified Desktop Organizer Dashboard featuring a visual, chronological **Drag-and-Drop Lineup Grid** mapped to days and stages, directly linked to live artist cards and ticket tier releases.

---

## 4. Target Audience & User Personas

### Persona A: The Festival Attendee ("User/Client")
*   **Name:** Andrei, 21, Mobile-focused Android User
*   **Context:** Attending Untold with friends. He hates carrying paper tickets and gets stressed about missing his favorite DJs (Armin van Buuren, David Guetta) because of schedule overlaps.
*   **Key Needs:**
    *   Fast, responsive interface that loads instantly on his Android browser.
    *   One-tap "starring" of artists to generate a consolidated schedule ("My Schedule").
    *   Offline ticket access (QR code) to enter Cluj Arena.
    *   Immediate, battery-efficient alerts when set times change.

### Persona B: The Festival Planner ("Organizer")
*   **Name:** Elena, 34, Desktop-focused Operations Manager
*   **Context:** In the production container behind the Mainstage. She coordinates 150+ artists across 8 stages and manages ticket release windows.
*   **Key Needs:**
    *   A macro-view of the entire festival grid (Stages vs. Time) to spot clashes.
    *   Rapid artist database entry (genres, image, schedule slots).
    *   Ability to dynamically adjust set times and push alerts to all fans who starred that artist.
    *   A clean interface to configure ticket types, prices, and inventory limits.
