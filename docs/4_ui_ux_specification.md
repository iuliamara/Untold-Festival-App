# Volume 4: UI/UX Specification & Design System
## Design Tokens, Responsive Layouts & Premium Interactions

This document establishes the UI/UX specifications, detailing the design system, typography, specific layout blocks, responsive behaviors, and micro-animations that deliver a premium, high-impact user experience.

---

## 1. Visual Brand Language: "Cosmic Cyber-Magic"

The UI strategy is a hybrid: it adopts the dark, highly-structured, grid-based aesthetic of **Beach, Please!**, but replaces its raw street-graffiti styling with the elegant, space-fantasy aesthetic of **UNTOLD** (celestial purples, portal cyans, magical golds, and glassmorphism).

```
+-----------------------------------------------------------------+
|                       DESIGN TOKENS (CSS Variables)             |
|                                                                 |
|   --bg-deep:       #03000A (95% Obsidian Night)                 |
|   --bg-surface:    rgba(11, 8, 26, 0.65) (Midnight Dust Glass)  |
|   --accent-purple: #8D46FF (Enchanted Glow)                     |
|   --accent-cyan:   #00E5FF (Portal Blue)                        |
|   --accent-gold:   #FFC837 (Luna Gold)                          |
|   --border-dark:   #1F1A3A (Deep Lavender Border)              |
|   --text-bright:   #FFFFFF (True White)                         |
|   --text-muted:    #827FA1 (Ethereal Grey)                      |
|                                                                 |
|   --blur-glass:    backdrop-filter: blur(16px);                 |
|   --glow-shadow:   box-shadow: 0 0 20px rgba(141, 70, 255, 0.45);|
+-----------------------------------------------------------------+
```

---

## 2. Layout Specifications

### 2.1. Mobile Android Webapp (User/Client)
The interface is optimized for single-hand, thumb-driven usage.
*   **Bottom Navigation Bar:** Floating, fixed bottom menu containing 5 critical triggers:
    1.  **Lineup:** Chronological, filterable grid.
    2.  **My Schedule:** User's personalized starred list.
    3.  **Tickets:** Direct access to QR wallet.
    4.  **Map:** Dynamic, interactive festival map.
    5.  **Info:** FAQ, emergency news, wristband top-up.
*   **Action Safe Zones:** Interactive buttons are sized at a minimum of **$48\text{px} \times 48\text{px}$** with significant spacing to avoid mis-clicks in high-movement environments (e.g., dancing/walking).
*   **Pull-to-Refresh:** Smooth gesture to fetch fresh schedule diffs from the backend, triggering a spinning celestial portal animation at the top.

### 2.2. Desktop Webapp (Organizer)
Designed as a full-viewport, multi-column workspace.
*   **Left Navigation Sidebar:** Slim, collapsing sidebar with icons for Dashboard, Artist CRUD, Lineup Matrix, Ticket Config, and Alerts.
*   **Split-Screen Lineup Matrix:**
    *   *Left 75% View:* Large multi-lane grid where each column represents a major stage (Mainstage, Galaxy, Alchemy, Daydreaming, Fortune) and rows represent time blocks.
    *   *Right 25% Sidebar:* Collapsible repository of unassigned artists (the "Artist Pool") that can be dragged into empty timeline slots.

---

## 3. High-Impact UI Components

### 3.1. Glassmorphic Artist Card (Client View)
An energetic container designed to make the festival lineup look prestigious and interactive.
*   **Visual Structure:** A large card with a subtle gradient-tinted background, showcasing a high-resolution, cropped image of the artist with a dark overlay.
*   **Interactive State:**
    *   *Normal:* Border matches `--border-dark`.
    *   *Hover/Tap:* Card scales up by 2% (`transform: scale(1.02)`), the border transitions into a gradient border (`--accent-purple` to `--accent-cyan`), and a subtle back-glow lights up behind the card.
*   **Star Action:** A prominent floating round star icon in the upper-right corner. Tapping it triggers an energetic burst particle effect and toggles the star's color to `--accent-gold`.

### 3.2. Responsive Schedule Matrix
*   **Mobile Grid Layout:** Renders horizontal-scrolling columns for stages. Users can swipe left/right to browse stages and scroll vertically to move through hours.
*   **Timeline Tracker:** A glowing `--accent-cyan` horizontal bar represents the current active time. Artists currently performing have a subtle breathing glow on their card border, with a blinking **"LIVE"** badge.

### 3.3. Offline Ticket Card (QR Wallet)
*   Designed to resemble an exclusive physical VIP card or badge.
*   **Front View:** Features a gold-foil metallic border for VIP users, the official Untold Connect logo, and cardholder's encrypted credentials.
*   **Centerpiece QR:** High-contrast, custom-themed QR code centered within a white background block to ensure immediate scanners can read it, regardless of screen reflection or high ambient light.
*   **Offline Mode Badge:** A green glowing banner at the top reads **"Offline Wallet Active - Validated Securely"**, reassuring the user.

---

## 4. Micro-Interactions & Transitions (Premium Feel)

To ensure the web application feels alive, premium, and responsive:

### 4.1. Bouncy Star Bookmark (Feedback Loop)
*   **Trigger:** Star icon click.
*   **Animation:** A snappy keyframe rotation and scale sequence:
    ```css
    @keyframes star-pop {
        0% { transform: scale(1); }
        50% { transform: scale(1.4) rotate(15deg); }
        75% { transform: scale(0.9) rotate(-10deg); }
        100% { transform: scale(1) rotate(0); }
    }
    ```
*   Provides immediate tactile satisfaction that their artist was added.

### 4.2. Timeline Collapsing Panels
*   **Trigger:** Selecting a filter option (e.g., filtering by "Mainstage" only).
*   **Animation:** Unselected stage columns do not disappear instantly; instead, they transition their width to `0px` and scale to `0.85` with an `opacity` fade, while the selected column expands smoothly to fill the screen space with a standard cubic-bezier timing curve (`cubic-bezier(0.16, 1, 0.3, 1)`).

### 4.3. Navigation Page Swipes
*   On mobile, changing views (e.g., from *Lineup* to *My Schedule*) triggers a smooth horizontal hardware-accelerated slide (`translate3d`), mimicking a native Android app experience and hiding the fact that it is a webapp.
